import { Result } from 'antd';
import { connectWebSocket } from './util';

export class ConnPool {
  maxConnection: number;
  urls: string[] = [];

  constructor(maxConnection = 20) {
    this.maxConnection = maxConnection;
  }

  // Add a new WebSocket connection URL to the pool
  async addConnections(urls: string[]) {
    this.urls = urls;
  }

  public async executeConcurrently<T>(
    fn: (connection: WebSocket) => Promise<T>,
    timeoutMs?: number,
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

    while (urls.length > 0) {
      const requests = urls.splice(0, this.maxConnection - currentConcurrency); // 选择下一个要处理的请求数量
      currentConcurrency += requests.length;

      const requestPromises = requests.map(async url => {
        try {
          const ws = await connectWebSocket(url);
          await fnWithTimeout(ws);
        } catch (error) {
          console.debug('ws error: ', error);
        } finally {
          currentConcurrency--;
        }
      });

      await Promise.all(requestPromises);
    }
    return results;
  }
}

function getTimeoutPromise(timeoutMs: number, msg: string) {
  return new Promise<{ url: string; data: Event }[]>((_, reject) => {
    setTimeout(() => {
      reject(msg);
    }, timeoutMs);
  });
}
