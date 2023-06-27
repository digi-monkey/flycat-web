import { connectWebSocket } from './util';
import { RelayPoolDatabase } from '../pool/db';

export class ConnPool {
  maxConnection: number;
  urls: string[] = [];

  constructor(maxConnection = 21) {
    this.maxConnection = maxConnection;
  }

  // Add a new WebSocket connection URL to the pool
  addConnections(urls: string[]) {
    // note: since the executeConcurrently will modify the urls(splice), 
    // the original urls must be copied instead of passing. 
    this.urls = [...this.urls, ...urls];
  }

  public async executeConcurrently<T>(
    fn: (connection: WebSocket) => Promise<T>,
    timeoutMs?: number,
    progressCb?: (restCount: number) => any
  ): Promise<T[]> {
    const results: T[] = [];
    const urls = this.urls;

    const fnWithTimeout = async (ws: WebSocket) => {
      const timeoutPromise = getTimeoutPromise(
        timeoutMs || 5000,
        `Data stream timed out! ${ws.url}`,
      );
      const dataPromise = new Promise((resolve) => {
        fn(ws).then(data => {
          results.push(data);
          resolve(data);
        });
      });

      try {
        await Promise.race([dataPromise, timeoutPromise]);
      } finally {
        ws.close();
      }
    };

    let currentConcurrency = 0;
    const db = new RelayPoolDatabase();
    while (urls.length > 0) {
      if(progressCb)progressCb(urls.length);

      const requests = urls.splice(0, this.maxConnection - currentConcurrency);
      currentConcurrency += requests.length;

      const requestPromises = requests.map(async url => {
        try {
          const ws = await connectWebSocket(url);
          await fnWithTimeout(ws);
          db.incrementSuccessCount(url);
        } catch (error) {
          console.debug('ws error: ', error);
          db.incrementFailureCount(url);
        } finally {
          currentConcurrency--;
        }
      });

      await Promise.all(requestPromises);
    }
    return results.filter(r => r != null);
  }
}

function getTimeoutPromise(timeoutMs: number, msg: string) {
  return new Promise<{ url: string; data: Event }[]>((_, reject) => {
    setTimeout(() => {
      reject(msg);
    }, timeoutMs);
  });
}
