import { RelayPoolDatabase } from '../relay/pool/db';
import { Queue } from 'types/queue';
import { Pool } from 'types/pool';
import { WS } from 'core/api/ws';

export class ConnPool {
  maxConnection: number;
  urls: string[] = [];

  pendingConn: Queue<string>;
  activeConn: Pool<string>;

  constructor(maxConnection = 21) {
    this.maxConnection = maxConnection;
    this.pendingConn = new Queue();
    this.activeConn = new Pool(maxConnection);
  }

  // Add a new WebSocket connection URL to the pool
  addConnections(urls: string[]) {
    if(urls.length === 0)return;
    // note: since the executeConcurrently will modify the urls(splice), 
    // the original urls must be copied instead of passing. 
    this.urls = [...this.urls, ...urls];
    
    let available = this.maxConnection - this.activeConn.getSize();
    let index = 0;
    while(available > 0 && index < urls.length){
      this.activeConn.addItem(urls[index]);
      available--;
      index++
    }

    while(index < urls.length){
      this.pendingConn.enqueue(urls[index]);
      index++;
    }
  }

  private async execute(url: string, fnWithTimeout: (ws: WS) => Promise<any>, db: RelayPoolDatabase, progressCb?: (restCount: number) => any){
    if(progressCb){
      progressCb(this.activeConn.getSize() + this.pendingConn.size())
    }

    try {
      const ws = await connectWebSocket(url);  
      await fnWithTimeout(ws);
      db.incrementSuccessCount(url);
      ws.close();
    } catch (error) {
      console.debug('ws error: ', error);
      db.incrementFailureCount(url);
    } finally {
      this.activeConn.removeItem(url);
      const next = this.pendingConn.dequeue();
      if(next){
        this.activeConn.addItem(next);
        await this.execute(next, fnWithTimeout, db, progressCb);
      }
    }
  }

  public async executeConcurrently<T>(
    fn: (connection: WS) => Promise<T>,
    timeoutMs?: number,
    progressCb?: (restCount: number) => any
  ): Promise<T[]> {
    const results: T[] = [];
    const db = new RelayPoolDatabase();

    const fnWithTimeout = async (ws: WS) => {
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
      }catch(error: any){
        console.debug(error);
      } finally {
        ws.close();
      }
    };

    const requestPromises = this.activeConn.getItems().map(async url => {
      await this.execute(url, fnWithTimeout, db, progressCb);
    });

    await Promise.all(requestPromises);
    return results.filter(r => r!=null);
  }

  private async benchmark(url: string, getTime: (p: {url: string, t?: number, isFailed: boolean})=>any, db: RelayPoolDatabase, progressCb?: (restCount: number) => any){
    if(progressCb){
      progressCb(this.activeConn.getSize() + this.pendingConn.size())
    }

    try {
      const time = await wsConnectMilsec(url);
      db.incrementSuccessCount(url);
      getTime({url, t: time, isFailed: false});
    } catch (error) {
      console.debug('ws error: ', error);
      db.incrementFailureCount(url);
      getTime({url, isFailed: false});
    } finally {
      this.activeConn.removeItem(url);
      const next = this.pendingConn.dequeue();
      if(next){
        this.activeConn.addItem(next);
        await this.benchmark(next, getTime, db, progressCb);
      }
    }
  }

  public async benchmarkConcurrently(
    progressCb?: (restCount: number) => any
  ): Promise<{url: string, t?: number, isFailed: boolean}[]> {
    const results: {url: string, t?: number, isFailed: boolean}[] = [];
    const db = new RelayPoolDatabase();

    const getTime = async (res: {url: string, t?: number, isFailed: boolean}) => {
      results.push(res);
    };

    const requestPromises = this.activeConn.getItems().map(async url => {
      await this.benchmark(url, getTime, db, progressCb);
    });

    await Promise.all(requestPromises);
    return results.filter(r => r!=null);
  }
}

function getTimeoutPromise(timeoutMs: number, msg: string) {
  return new Promise<{ url: string; data: Event }[]>((_, reject) => {
    setTimeout(() => {
      reject(msg);
    }, timeoutMs);
  });
}

export function connectWebSocket(url: string, timeoutMs = 5000): Promise<WS> {
  return new Promise((resolve, reject) => {
    const socket = new WS(url,10,false);

    socket._ws.onopen = () => {
      resolve(socket);
    };

    socket._ws.onerror = (error) => {
      reject(error);
    };

    socket._ws.onclose = () => {
      reject("closed!");
    };

    const timeoutId = setTimeout(() => {
      clearTimeout(timeoutId);
      reject("Connection timed out!");
    }, timeoutMs);
  });
}

export function wsConnectMilsec(url: string, timeoutMs = 5000): Promise<number> {
  return new Promise((resolve, reject) => {
    const startTime = performance.now();
    const socket = new WS(url,10,false);

    socket._ws.onopen = () => {
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      resolve(executionTime);
      socket.close();
    };

    socket._ws.onerror = (error) => {
      reject(error);
    };

    socket._ws.onclose = () => {
      reject("closed!");
    };

    const timeoutId = setTimeout(() => {
      clearTimeout(timeoutId);
      reject("Connection timed out!");
    }, timeoutMs);
  });
}
