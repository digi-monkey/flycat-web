import { RelayGroupMap } from '../group/type';
import { Relay } from '../type';
import { BaseRelayGroupManager } from './base';
import { PREDEFINE_RELAY_GROUPS } from './predefine';
import { RelayGroupStorage } from './store';

const predefineRelayGroups: [string, Relay[]][] = PREDEFINE_RELAY_GROUPS.map(
  g => {
    return [
      g.id,
      g.urls.map(u => {
        const relay: Relay = {
          url: u,
          write: true,
          read: true,
        };
        return relay;
      }),
    ] as [string, Relay[]];
  },
);

export class RelayGroupManager extends BaseRelayGroupManager {
  private storage: RelayGroupStorage;
  private loader: Promise<RelayGroupMap>;

  constructor(pubkey: string) {
    super(pubkey);
    this.storage = new RelayGroupStorage(pubkey);
    this.loader = this.storage.load().then((userGroupMap: RelayGroupMap) => {
      return new Map(
        Array.from(userGroupMap)
          .concat(Array.from(new Map(predefineRelayGroups)))
          .reduce((acc, [k, v]) => acc.set(k, v), new Map()),
      );
    });
  }

  async getAllGroupIds() {
    const groupMap = await this.loader;
    return Array.from(groupMap.keys());
  }

  async getGroupById(id: string) {
    const groupMap = await this.loader;
    return groupMap.get(id);
  }

  async setGroup(id: string, relays: Relay[]) {
    const groupMap = await this.loader;
    groupMap.set(id, relays);
    this.storage.save(groupMap);
  }

  async removeGroup(id: string) {
    const groupMap = await this.loader;
    groupMap.delete(id);
    this.storage.save(groupMap);
  }

  async addRelayToGroup(id: string, relay: Relay[] | Relay) {
    const relays = Array.isArray(relay) ? relay : [relay];
    const groupMap = await this.loader;
    const groupRelays = groupMap.get(id) || [];
    const newRelays = relays.filter(r => !groupRelays.includes(r));
    groupMap.set(id, groupRelays.concat(newRelays));
    this.storage.save(groupMap);
  }

  async removeRelayFromGroup(id: string, relay: Relay[] | Relay) {
    const relays = Array.isArray(relay) ? relay : [relay];
    const groupMap = await this.loader;
    const groupRelays = groupMap.get(id) || [];
    const newRelays = groupRelays.filter(r => {
      return !relays.some(r2 => r2.url === r.url);
    });
    groupMap.set(id, newRelays);
    this.storage.save(groupMap);
  }

  async clean() {
    const groupMap = await this.loader;
    groupMap.clear();
    this.storage.clean();
  }
}
