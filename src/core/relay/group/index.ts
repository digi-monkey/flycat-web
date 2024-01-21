import { Nip51 } from 'core/nip/51';
import { WellKnownEventKind } from 'core/nostr/type';
import { CallWorker } from 'core/worker/caller';
import { SubFilterResultMsg } from 'core/worker/type';
import { SignEvent } from 'store/loginReducer';
import { RelayGroup, RelayGroupMap } from '../group/type';
import { Relay } from '../type';
import { BaseRelayGroupManager } from './base';
import { RelayGroupStorage } from './store';

export class RelayGroupManager extends BaseRelayGroupManager {
  private storage: RelayGroupStorage;
  private loader: Promise<RelayGroupMap>;
  private worker: CallWorker;
  private signEvent: SignEvent | undefined;

  constructor(
    pubkey: string,
    worker: CallWorker,
    signEvent: SignEvent | undefined,
  ) {
    super(pubkey);
    this.worker = worker;
    this.signEvent = signEvent;
    this.storage = new RelayGroupStorage(pubkey);
    this.loader = this.storage.load();
    this.subRelaySet();
  }

  private getRelayGroupFromEvent({ event }: SubFilterResultMsg) {
    const { tags, kind } = event;
    if (kind !== WellKnownEventKind.relay_set) {
      return;
    }
    const relaySet = Nip51.parseRelaySet(tags);
    const { id, title, description } = relaySet;
    if (!id || !title) {
      return;
    }
    const relayGroup = {
      id,
      title,
      description,
      relays: [] as Relay[],
    };
    relaySet.relays.forEach(url => {
      const relay: Relay = { url, read: true, write: true };
      relayGroup.relays.push(relay);
    });
    return relayGroup;
  }

  private async subRelaySet() {
    if (!this.pubkey) {
      return;
    }

    const filter = Nip51.createRelaySetFilter(this.pubkey);
    const handler = this.worker.subFilter({ filter });
    const iterator = handler.getIterator();

    for await (const msg of iterator) {
      const group = this.getRelayGroupFromEvent(msg);
      if (!group) {
        continue;
      }
      const groupMap = await this.loader;
      groupMap.set(group.id, group);
      this.storage.save(groupMap);
    }
  }

  private async pubRelayGroup(group: RelayGroup) {
    if (!this.signEvent) {
      return;
    }
    const rawEvent = await Nip51.createRelaySet(group);
    const event = await this.signEvent(rawEvent);
    this.worker.pubEvent(event);
  }

  public async getAllGroupIds() {
    this.subRelaySet();
    const groupMap = await this.loader;
    return Array.from(groupMap.keys());
  }

  public async getGroupById(id: string) {
    const groupMap = await this.loader;
    return groupMap.get(id);
  }

  public async setGroup(id: string, group: RelayGroup) {
    const groupMap = await this.loader;
    groupMap.set(id, group);
    this.pubRelayGroup(group);
    this.storage.save(groupMap);
  }

  public async removeGroup(id: string) {
    const groupMap = await this.loader;
    groupMap.delete(id);
    this.storage.save(groupMap);
  }

  public async addRelayToGroup(id: string, relay: Relay[] | Relay) {
    const relays = Array.isArray(relay) ? relay : [relay];
    const groupMap = await this.loader;
    const group = groupMap.get(id);
    if (!group) {
      return;
    }
    const newRelays = relays.filter(r => !group.relays.includes(r));
    group.relays = group.relays.concat(newRelays);
    groupMap.set(id, group);
    this.pubRelayGroup(group);
    this.storage.save(groupMap);
  }

  public async removeRelayFromGroup(id: string, relay: Relay[] | Relay) {
    const relays = Array.isArray(relay) ? relay : [relay];
    const groupMap = await this.loader;
    const group = groupMap.get(id);
    if (!group) {
      return;
    }
    const newRelays = group.relays.filter(r => {
      return !relays.some(r2 => r2.url === r.url);
    });
    group.relays = newRelays;
    groupMap.set(id, group);
    this.pubRelayGroup(group);
    this.storage.save(groupMap);
  }

  public async clean() {
    const groupMap = await this.loader;
    groupMap.clear();
    this.storage.clean();
  }
}
