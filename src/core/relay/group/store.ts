import { BaseRelayGroupStorage, BaseStoreAdapter } from './base';
import { legacyRelayGroupMapSchema, relayGroupMapSchema } from './schema';
import { RelayGroupMap } from './type';
import { v4 as uuidv4 } from 'uuid';

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

    // parse legacy relay group data
    const legacy = legacyRelayGroupMapSchema.safeParse(unserialized);
    if (legacy.success) {
      const map = new Map(
        legacy.data.map(([title, relays]) => {
          const id = uuidv4();
          return [
            id,
            {
              id,
              title,
              relays,
              timestamp: 0,
            },
          ];
        }),
      );
      return map;
    }
    const result = relayGroupMapSchema.safeParse(unserialized);
    if (!result.success) {
      return new Map();
    }
    const map = new Map(result.data);
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
