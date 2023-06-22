import { hash } from 'service/crypto';
import { Relay } from '../type';

export interface RelayPoolDB {
  save: (relay: Relay) => Promise<string> | string; // return key
  loadAll: () => Promise<Relay[]> | Relay[];
  getAllKeys: () => Promise<string[]> | string[];
  load: (url: string) => Promise<Relay | null> | (Relay | null);
}

export interface StoreAdapter {
  get(key: string): string | null;
  set(key: string, val: string): any;
}

export class LocalStorageAdapter implements StoreAdapter {
  get(key: string) {
    return localStorage.getItem(key);
  }

  set(key: string, val: string) {
    localStorage.setItem(key, val);
  }
}

export class RelayPoolDatabase implements RelayPoolDB {
  prefix = '__relayPool:db';
  storedKeysPrefix = '__storedKeys';

  private storeAdapter: StoreAdapter;

  constructor(storeAdapter?: StoreAdapter) {
    this.storeAdapter = storeAdapter || new LocalStorageAdapter();
  }

  static serializeRelay(relay: Relay) {
    return JSON.stringify(relay);
  }

  static deserializeRelay(data: string) {
    return JSON.parse(data) as Relay;
  }

  private hashKeyByUrl(wsUrl: string): string {
    const key = hash(wsUrl);
    return key;
  }

  private getKeyByUrl(wsUrl: string): string {
    return `${this.prefix}:${this.hashKeyByUrl(wsUrl)}`;
  }

  private getStoredKeysKey() {
    return `${this.prefix}:${this.storedKeysPrefix}`;
  }

  private get(storedKey: string) {
    const relay = this.storeAdapter.get(storedKey);
    if (relay) {
      return RelayPoolDatabase.deserializeRelay(relay);
    }
    return null;
  }

  getAllKeys(): string[] {
    const storedKeys = this.storeAdapter.get(this.getStoredKeysKey());
    if (storedKeys) {
      return JSON.parse(storedKeys);
    }
    return [];
  }

  save(relay: Relay) {
    const data = RelayPoolDatabase.serializeRelay(relay);
    const key = this.getKeyByUrl(relay.url);
    this.storeAdapter.set(key, data);

    // Add the key to the list of stored keys
    const storedKeys = this.getAllKeys();
    if (!storedKeys.includes(key)) {
      storedKeys.push(key);
      this.storeAdapter.set(
        this.getStoredKeysKey(),
        JSON.stringify(storedKeys),
      );
    }
    return key;
  }

  saveAll(relays: Relay[]) {
    for (const relay of relays) {
      this.save(relay);
    }
  }

  load(url: string) {
    const key = this.getKeyByUrl(url);
    return this.get(key);
  }

  loadAll() {
    const result: Relay[] = [];
    const storedKeys = this.getAllKeys();
    for (const key of storedKeys) {
      const relay = this.get(key);
      if (relay) {
        result.push(relay);
      }
    }
    return result;
  }

  incrementSuccessCount(url: string) {
    const relay = this.load(url);
		console.log(url, "incrementSuccessCount, relay:", relay)
    if (relay) {
      relay.successCount = (relay.successCount ?? 0) + 1;
      this.save(relay);
    }
  }

  incrementFailureCount(url: string) {
    const relay = this.load(url);
		console.log(url, "incrementFailureCount, relay:", relay)
    if (relay) {
      relay.failureCount = (relay.failureCount ?? 0) + 1;
      this.save(relay);
    }
  }
}
