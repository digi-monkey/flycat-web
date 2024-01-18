import { RelayGroup, RelayGroupMap } from '../group/type';
import { Relay } from '../type';

export abstract class BaseStoreAdapter {
  abstract get(key: string): Promise<string | null>;
  abstract set(key: string, value: string): Promise<void>;
  abstract remove(key: string): Promise<void>;
}

export abstract class BaseRelayGroupManager {
  constructor(protected pubkey: string) {}
  abstract getAllGroupIds(): Promise<string[]>;
  abstract getGroupById(id: string): Promise<RelayGroup | undefined>;
  abstract setGroup(id: string, group: RelayGroup): void;
  abstract removeGroup(id: string): void;
  abstract addRelayToGroup(id: string, relay: Relay[] | Relay): void;
  abstract removeRelayFromGroup(id: string, relay: Relay[] | Relay): void;
  abstract clean(): void;
}

export abstract class BaseRelayGroupStorage {
  constructor(
    protected pubkey: string,
    protected storeAdapter: BaseStoreAdapter,
  ) {}
  abstract get storeKey(): string;
  abstract load(): Promise<RelayGroupMap>;
  abstract save(map: Map<string, RelayGroup>): void;
  abstract clean(): void;
}
