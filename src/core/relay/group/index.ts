import { Nip51 } from 'core/nip/51';
import { CallWorker } from 'core/worker/caller';
import { SignEvent } from 'store/loginReducer';
import { RelayGroupMap } from '../group/type';
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

  private async subRelaySet() {
    const filter = Nip51.createRelaySetFilter(this.pubkey);
    const handler = this.worker.subFilter({ filter });
    const iterator = handler.getIterator();

    for await (const event of iterator) {
      console.log('subRelaySet', event);
    }
  }

  private async pubRelaySet(id: string, relays: Relay[]) {
    if (!this.signEvent) {
      return;
    }
    const rawEvent = await Nip51.createRelaySet(
      id,
      relays.map(r => r.url),
    );
    const event = await this.signEvent(rawEvent);
    console.log('pubRelaySet', event);
    this.worker.pubEvent(event);
  }

  public async getAllGroupIds() {
    const groupMap = await this.loader;
    return Array.from(groupMap.keys());
  }

  public async getGroupById(id: string) {
    const groupMap = await this.loader;
    return groupMap.get(id);
  }

  public async setGroup(id: string, relays: Relay[]) {
    const groupMap = await this.loader;
    groupMap.set(id, relays);
    await this.pubRelaySet(id, relays);
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
    const groupRelays = groupMap.get(id) || [];
    const newRelays = relays.filter(r => !groupRelays.includes(r));
    groupMap.set(id, groupRelays.concat(newRelays));
    await this.pubRelaySet(id, newRelays);
    this.storage.save(groupMap);
  }

  public async removeRelayFromGroup(id: string, relay: Relay[] | Relay) {
    const relays = Array.isArray(relay) ? relay : [relay];
    const groupMap = await this.loader;
    const groupRelays = groupMap.get(id) || [];
    const newRelays = groupRelays.filter(r => {
      return !relays.some(r2 => r2.url === r.url);
    });
    groupMap.set(id, newRelays);
    await this.pubRelaySet(id, newRelays);
    this.storage.save(groupMap);
  }

  public async clean() {
    const groupMap = await this.loader;
    groupMap.clear();
    this.storage.clean();
  }
}
