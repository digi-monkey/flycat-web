import { Api, PublicKey, Event, WellKnownEventKind } from 'service/api';
import { Relay } from './type';
import { ConnPool } from './connection/pool';
import { WS } from './connection/ws';
import { PubkeyRelay } from './auto/pubkey-relay';
import { Assignment } from './auto/assignment';
import { db } from './auto';

export interface BenchmarkResult {
  [url: string]: { benchmark: number; isFailed: boolean };
}

export class Pool {
  public apiUrl = 'https://api.nostr.watch/v1/online';
  public relays: Relay[] = [];

  private api: Api;

  constructor(url?: string) {
    if (url) this.apiUrl = url;
    this.api = new Api(this.apiUrl);
  }

  async getAllRelays() {
    const res: string[] = await this.api.httpRequest('');
    this.relays = res.map(r => {
      return {
        url: r,
        read: true,
        write: true,
        isConnected: true,
      };
    });
    return this.relays;
  }

  static async benchmark(urls: string[]): Promise<BenchmarkResult> {
    return new Promise(resolve => {
      let completedCount = 0;
      const results: BenchmarkResult = {};

      const checkBenchmarkCompletion = () => {
        if (completedCount === urls.length) {
          return resolve(results);
        }
      }; 

      // todo: impl a queue to avoid resource insufficient
      urls.forEach(url => {
        const start = performance.now();
        const socket = new WebSocket(url);

        socket.onopen = () => {
          completedCount++;
          checkBenchmarkCompletion();

          const delay = Math.round(performance.now() - start);
          results[url] = {
            benchmark: delay,
            isFailed: false,
          };
          socket.close();
        };

        socket.onerror = () => {
          completedCount++;
          checkBenchmarkCompletion();

          const delay = 10000000000000000;
          results[url] = {
            benchmark: delay,
            isFailed: true,
          };

          socket.close();
        };
      });
    });
  }

  static async getFastest(urls: string[]) {
    const benchmarkMap = await this.benchmark(urls);
    console.log(benchmarkMap);
    const sorted = Object.entries(benchmarkMap).sort(
      (a, b) => a[1].benchmark - b[1].benchmark,
    );
    return sorted[0];
  }

  static async getAverageBenchmark(urls: string[]) {
    const benchmarkMap = await this.benchmark(urls);
    const benchmarks = Object.values(benchmarkMap);
    const totalBenchmark = benchmarks.reduce(
      (sum, { benchmark }) => sum + benchmark,
      0,
    );
    const averageBenchmark = totalBenchmark / benchmarks.length;
    return averageBenchmark;
  }

  static async getBestRelay(urls: string[], pubkey: PublicKey){
    const connPool = new ConnPool();
    await connPool.addConnections(urls);

    async function getRankData(conn: WebSocket): Promise<{ url: string, data: Event }[]> {
      const ws = new WS(conn);
      const dataStream = ws.subFilter({ kinds: [WellKnownEventKind.contact_list, WellKnownEventKind.set_metadata, WellKnownEventKind.long_form, WellKnownEventKind.text_note], limit: 4, authors: [pubkey] });
      const result: { url: string, data: Event }[] = [];
      
      for await (const data of dataStream) {
        result.push({ url: conn.url, data });
      }
      return result;
    }
    
    const timeoutMs = 5000;
    const _results = await connPool.executeConcurrently(getRankData, timeoutMs);
    const results = ([] as { url: string, data: Event }[]).concat(..._results)

    results.map(res => res.url).forEach(url => {
      const pubkeyRelay: PubkeyRelay = initPubkeyRelay(pubkey, url); 
      db.add(pubkeyRelay);
    });

    for(const res of results){
     let pr = db.get(pubkey, res.url);
     if(!pr){
      pr = initPubkeyRelay(pubkey, res.url);
     }

     const event = res.data;
     switch (event.kind) {
      case WellKnownEventKind.text_note:
        if(pr.last_kind_1 >= event.created_at)return;

        pr.last_kind_1 = event.created_at;
        break;

        case WellKnownEventKind.contact_list:
          if(pr.last_kind_3 >= event.created_at)return;

          pr.last_kind_3 = event.created_at; 
        break;

        case WellKnownEventKind.set_metadata:
          if(pr.last_kind_0 >= event.created_at)return;

          pr.last_kind_0 = event.created_at;
        break;

        case WellKnownEventKind.long_form:
          if(pr.last_kind_30023 >= event.created_at)return;

          pr.last_kind_30023 = event.created_at;
        break;
     
      default:
        break;
     }
     db.add(pr);
    }

    const prs: PubkeyRelay[] = [];
    for(const  res of results){
      let pr = db.get(pubkey, res.url);
     if(!pr){
      pr = initPubkeyRelay(pubkey, res.url); 
     }

     pr.score = Assignment.calcScore(pr);
     db.add(pr);
     if(!prs.includes(pr)){
      prs.push(pr);
     }
    }

    const sorted = prs.sort((a, b) => b.score - a.score);
    for(const pr of sorted){
      console.debug("high score: ", pr.relay, pr.score);
    }

    return sorted;
  }

  static async pickRelay(urls: string[], pubKeys: PublicKey[]){
    //todo
    console.log("not impl")
  }
}


function initPubkeyRelay(pubkey: string, relay: string){
  const pubkeyRelay: PubkeyRelay = {
    pubkey: pubkey,
    relay: relay,
    last_kind_0: 0,
    last_kind_1: 0,
    last_kind_3: 0,
    last_kind_30023: 0,
    score: 0,
  }
  return pubkeyRelay;
}
