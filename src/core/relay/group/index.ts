import { Event } from 'core/nostr/Event';
import { NIP_65_RELAY_LIST } from 'constants/relay';
import { Nip51 } from 'core/nip/51';
import { Nip65 } from 'core/nip/65';
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
      timestamp: event.created_at,
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
      if (groupMap.has(group.id)) {
        const oldGroup = groupMap.get(group.id);
        if (oldGroup?.timestamp && oldGroup.timestamp >= group.timestamp) {
          continue;
        }
      }
      groupMap.set(group.id, group);
      this.storage.save(groupMap);
    }
  }

  private async pubRelayGroup(group: RelayGroup) {
    if (!this.signEvent || !this.worker) {
      return;
    }

    const rawEvent =
      group.kind === WellKnownEventKind.relay_list
        ? Nip65.createRelayListEvent(group.relays)
        : Nip51.createRelaySetEvent(group);
    const event = await this.signEvent(rawEvent);
    this.worker.pubEvent(event);
    return event;
  }

  public async syncRelayGroup(id: string) {
    const groupMap = await this.loader;
    const group = groupMap.get(id);
    console.log(id, group);
    if (!group) {
      return;
    }
    const event = await this.pubRelayGroup(group);
    if (!event) {
      return;
    }
    group.timestamp = event.created_at;
    group.changed = false;
    groupMap.set(id, group);
    this.storage.save(groupMap);
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
    this.storage.save(groupMap);
  }

  public async removeGroup(id: string) {
    const groupMap = await this.loader;
    groupMap.delete(id);
    this.storage.save(groupMap);
  }

  public async setNip65RelayListByEvent(event: Event) {
    const id = NIP_65_RELAY_LIST;
    const relays = Nip65.toRelays(event);
    const groupMap = await this.loader;
    const oldGroup = groupMap.get(id);
    if (oldGroup?.timestamp && oldGroup.timestamp >= event.created_at) {
      return;
    }
    const newGroup: RelayGroup = {
      id,
      title: id,
      relays,
      timestamp: event.created_at,
      kind: WellKnownEventKind.relay_list,
    };
    groupMap.set(id, newGroup);
    this.storage.save(groupMap);
    return;
  }

  public async addRelayToGroup(id: string, relay: Relay[] | Relay) {
    const relays = Array.isArray(relay) ? relay : [relay];
    const groupMap = await this.loader;
    const group = groupMap.get(id);
    if (!group) {
      return;
    }
    const newRelays = relays.filter(r => {
      return !group.relays.some(r2 => r2.url === r.url);
    });
    group.relays = group.relays.concat(newRelays);
    group.timestamp = Date.now();
    group.changed = true;
    groupMap.set(id, group);
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
    group.timestamp = Date.now();
    group.changed = true;
    groupMap.set(id, group);
    this.storage.save(groupMap);
  }

  public async clean() {
    const groupMap = await this.loader;
    groupMap.clear();
    this.storage.clean();
  }
}
