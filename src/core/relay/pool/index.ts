import { ImageProvider } from 'core/api/img';
import { PublicKey, WellKnownEventKind } from 'core/nostr/type';
import { Event } from 'core/nostr/Event';
import { Relay, RelayTracker } from '../type';
import { ConnPool } from '../connection/pool';
import { WS } from '../connection/ws';
import { PubkeyRelay } from '../auto/pubkey-relay';
import { Assignment } from '../auto/assignment';
import { db } from '../auto';
import { RelayPoolDatabase } from './db';
import { Nip65 } from 'core/nip/65';
import { seedRelays } from './seed';

export interface BenchmarkResult {
  [url: string]: { benchmark: number; isFailed: boolean };
}

export class RelayPool {
  public apiUrl = 'https://api.nostr.watch/v1/online';
  public relays: Relay[] = [];
  public seedRelays: string[];

  private api: ImageProvider;
  private db: RelayPoolDatabase;

  constructor(url?: string) {
    if (url) this.apiUrl = url;
    this.api = new ImageProvider(this.apiUrl);
    this.db = new RelayPoolDatabase();
    this.seedRelays = seedRelays;
  }

  private async fetchApi() {
    const res: string[] = await this.api.httpRequest('');
    const relays = res.map(r => {
      return {
        url: r,
        read: true,
        write: true,
        isConnected: true,
      };
    });
    return relays;
  }

  async getAllRelays(alwaysFetch = false) {
    let relays = this.db.loadAll();

    if (alwaysFetch) {
      const urls = relays.map(r => r.url);
      const newRelays = await this.fetchApi();
      for (const r of newRelays) {
        if (!urls.includes(r.url)) {
          this.db.save(r);
          relays.push(r);
        }
      }

      return relays;
    }

    if (relays.length === 0) {
      relays = await this.fetchApi();
      for (const r of relays) {
        this.db.save(r);
      }
    }

    this.relays = relays.sort((a,b)=> RelayTracker.success_rate(a) - RelayTracker.success_rate(b));
    return relays;
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

  static async getBestRelay(urls: string[], pubkey: PublicKey, progressCb?: (restCount: number) => any) {
    const connPool = new ConnPool();
    await connPool.addConnections(urls);

    async function getRankData(
      conn: WebSocket,
    ): Promise<{ url: string; data: Event }[]> {
      const ws = new WS(conn);
      const dataStream = ws.subFilter({
        kinds: [
          WellKnownEventKind.contact_list,
          WellKnownEventKind.set_metadata,
          WellKnownEventKind.long_form,
          WellKnownEventKind.text_note,
        ],
        limit: 4,
        authors: [pubkey],
      });
      const result: { url: string; data: Event }[] = [];

      for await (const data of dataStream) {
        result.push({ url: conn.url, data });
      }
      return result;
    }

    const timeoutMs = 5000;
    const _results = await connPool.executeConcurrently(getRankData, timeoutMs, progressCb);
    const results = ([] as { url: string; data: Event }[]).concat(..._results);

    results
      .map(res => res.url)
      .forEach(url => {
        const pubkeyRelay: PubkeyRelay = initPubkeyRelay(pubkey, url);
        db.add(pubkeyRelay);
      });

    for (const res of results) {
      let pr = db.get(pubkey, res.url);
      if (!pr) {
        pr = initPubkeyRelay(pubkey, res.url);
      }

      const event = res.data;
      switch (event.kind) {
        case WellKnownEventKind.text_note:
          if (pr.last_kind_1 >= event.created_at) return;

          pr.last_kind_1 = event.created_at;
          break;

        case WellKnownEventKind.contact_list:
          if (pr.last_kind_3 >= event.created_at) return;

          pr.last_kind_3 = event.created_at;
          break;

        case WellKnownEventKind.set_metadata:
          if (pr.last_kind_0 >= event.created_at) return;

          pr.last_kind_0 = event.created_at;
          break;

        case WellKnownEventKind.long_form:
          if (pr.last_kind_30023 >= event.created_at) return;

          pr.last_kind_30023 = event.created_at;
          break;

        default:
          break;
      }
      db.add(pr);
    }

    const prs: PubkeyRelay[] = [];
    for (const res of results) {
      let pr = db.get(pubkey, res.url);
      if (!pr) {
        pr = initPubkeyRelay(pubkey, res.url);
      }

      pr.score = Assignment.calcScore(pr);
      db.add(pr);
      if (!prs.includes(pr)) {
        prs.push(pr);
      }
    }

    const sorted = prs.sort((a, b) => b.score - a.score);
    for (const pr of sorted) {
      console.debug('high score: ', pr.relay, pr.score);
    }

    return sorted;
  }

  static async pickRelay(relayUrls: string[], pubKeys: PublicKey[]) {
    console.log("pick -->", relayUrls, relayUrls.length, pubKeys.length);
    const connPool = new ConnPool();
    await connPool.addConnections(relayUrls);

  
    async function getRelayList(
      conn: WebSocket,
    ): Promise<{ url: string; data: Event }[]> {
      const ws = new WS(conn);
      const dataStream = ws.subFilter({
        kinds: [WellKnownEventKind.relay_list],
        limit: pubKeys.length,
        authors: pubKeys,
      });
      const result: { url: string; data: Event }[] = [];

      for await (const data of dataStream) {
        result.push({ url: conn.url, data });
      }
      return result;
    }

    const timeoutMs = 5000;
    const _results = await connPool.executeConcurrently(
      getRelayList,
      timeoutMs,
    );
    const results = ([] as { url: string; data: Event }[]).concat(..._results);
    const map = new Map<string, string[]>(); // relay, pub keys
    for (const res of results) {
      const user = res.data.pubkey;
      const relays = Nip65.toRelays(res.data)
        .filter(r => r.write === true)
        .map(r => r.url);
      for (const relay of relays) {
        if (map.has(relay)) {
          const pubKeys = map.get(relay)!;
          if (!pubKeys.includes(user)) {
            pubKeys.push(user);
            map.set(relay, pubKeys);
          }
        } else {
          map.set(relay, [user]);
        }
      }
    }

    // return the most 3 coverage relays
    const sortedKeys = Array.from(map.keys()).sort((a, b) => {
      const lengthA = map.get(a)?.length || 0;
      const lengthB = map.get(b)?.length || 0;
      return lengthB - lengthA;
    });

    console.log(map)
    return getCoverNeededRelays(map) 
    //return sortedKeys.slice(0, 3);
  }
}

function getCoverNeededRelays(relayPubkeys: Map<string, string[]>){
  // Assuming your relayPubkeys is a Map<string, string[]>
const relayPubkeysArray = Array.from(relayPubkeys.entries());

// Sort relays by the number of pubkeys they cover in descending order
relayPubkeysArray.sort(
  ([, pubkeysA], [, pubkeysB]) => pubkeysB.length - pubkeysA.length
);

const selectedRelays = new Set();
const coveredPubkeys = new Set();

for (const [relay, pubkeys] of relayPubkeysArray) {
  const uncoveredPubkeys = pubkeys.filter(pubkey => !coveredPubkeys.has(pubkey));
  
  if (uncoveredPubkeys.length > 0) {
    selectedRelays.add(relay);
    uncoveredPubkeys.forEach(pubkey => coveredPubkeys.add(pubkey));
  }
}

const numRelays = selectedRelays.size;
console.log(`You need ${numRelays} relays to cover all the pubkey lists.`);
console.log(`Selected relays:`, selectedRelays);
return Array.from(selectedRelays) as string[];
}

function initPubkeyRelay(pubkey: string, relay: string) {
  const pubkeyRelay: PubkeyRelay = {
    pubkey: pubkey,
    relay: relay,
    last_kind_0: 0,
    last_kind_1: 0,
    last_kind_3: 0,
    last_kind_30023: 0,
    score: 0,
  };
  return pubkeyRelay;
}
