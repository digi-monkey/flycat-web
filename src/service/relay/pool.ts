import { Api } from 'service/api';
import { Relay } from './type';

export class Pool {
  public apiUrl = 'https://api.nostr.watch/v1/online';
  public relays: Relay[] = [];

  private api: Api;

  constructor(url?: string) {
    if (url) this.apiUrl = url;
    this.api = new Api(this.apiUrl);
  }

  async fetch() {
    const res: string[] = await this.api.httpRequest('');
    this.relays = res.map(r => {
      return {
        url: r,
        read: true,
        write: true,
        isConnected: true,
      };
    });
  }

  async benchmark(callback?: (index: number, ms: number) => any) {
    const batchSize = 10;
    const urls = this.relays.map(r => r.url);

    const delayResults: number[] = [];
    const urlBatches: string[][] = [];

    for (let i = 0; i < urls.length; i += batchSize) {
      urlBatches.push(urls.slice(i, i + batchSize));
    }

    for (let i = 0; i < urlBatches.length; i++) {
      const batchResults = await benchmarkWebSocketUrls(urlBatches[i]);
      delayResults.push(...batchResults);
      batchResults.map((ms, index) => {
        this.relays[i * batchSize + index].benchmark = ms;
        if(callback){
          callback(i * batchSize + index, ms);
        }
      });
    }

    return this.relays;
  }

  async benchmarkAsync() {
    const batchSize = 10;
    const delays = await benchmarkWebSocketUrlsBatched(
      this.relays.map(r => r.url),
      batchSize,
    );
    this.relays = this.relays.map((r, index) => {
      r.benchmark = delays[index];
      return r;
    });
  }
}

async function benchmarkWebSocketUrlsBatched(
  urls: string[],
  batchSize: number,
): Promise<number[]> {
  const delayResults: number[] = [];
  const urlBatches: string[][] = [];

  for (let i = 0; i < urls.length; i += batchSize) {
    urlBatches.push(urls.slice(i, i + batchSize));
  }

  for (let i = 0; i < urlBatches.length; i++) {
    const batchResults = await benchmarkWebSocketUrls(urlBatches[i]);
    delayResults.push(...batchResults);
  }

  return delayResults;
}

async function benchmarkWebSocketUrls(urls: string[]): Promise<number[]> {
  const delayResults: number[] = [];

  await Promise.all(
    urls.map(
      (url, index) =>
        new Promise<void>((resolve, reject) => {
          const start = Date.now();
          const socket = new WebSocket(url);

          socket.addEventListener('open', () => {
            const end = Date.now();
            const delay = end - start;
            delayResults[index] = delay;
            socket.close();
            resolve();
          });

          socket.addEventListener('error', error => {
            console.error(`Failed to connect to ${url}: ${error}`);
            delayResults[index] = -1;
            socket.close();
            reject(error);
          });
        }),
    ),
  ).catch(error => {
    console.error('Error:', error);
  });

  return delayResults;
}
