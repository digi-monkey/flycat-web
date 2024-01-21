import { Relay } from '../type';
import { BaseRelayGroupStorage, BaseStoreAdapter } from './base';
import { RelayGroupMap } from './type';

class LocalStorageAdapter extends BaseStoreAdapter {
  async get(key: string) {
    if (typeof window === 'undefined') {
      return null;
    }
    return localStorage.getItem(key);
  }

  async set(key: string, value: string) {
    if (typeof window === 'undefined') {
      return;
    }
    localStorage.setItem(key, value);
  }

  async remove(key: string) {
    if (typeof window === 'undefined') {
      return;
    }
    localStorage.removeItem(key);
  }
}

export class RelayGroupStorage extends BaseRelayGroupStorage {
  private prefix = '__relayGroup:db';
  private listeners = new Set<(map: RelayGroupMap) => void>();

  constructor(pubkey: string) {
    super(pubkey, new LocalStorageAdapter());
  }

  public get storeKey() {
    return `${this.prefix}:${this.pubkey}`;
  }

  public subscribe(listener: (map: RelayGroupMap) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public async load() {
    const data = await this.storeAdapter.get(this.storeKey);
    if (data == null) {
      return new Map();
    }
    const unserialized = JSON.parse(data);
    const map = new Map(unserialized as [string, Relay[]][]);
    return map;
  }

  public async save(map: RelayGroupMap) {
    this.listeners.forEach(listener => {
      listener(map);
    });
    const data = JSON.stringify(Array.from(map));
    await this.storeAdapter.set(this.storeKey, data);
  }

  public async clean() {
    await this.storeAdapter.remove(this.storeKey);
  }
}
