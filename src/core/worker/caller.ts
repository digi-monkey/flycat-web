import { randomSubId } from 'core/worker/util';
import {
  EventId,
  Filter,
  PublicKey,
  WellKnownEventKind,
} from 'core/nostr/type';
import { Event } from 'core/nostr/Event';
import { Nip23 } from 'core/nip/23';
import SharedWorkerPolyfill from './polyfill';
import {
  CallRelay,
  CallRelayType,
  SwitchRelays,
  FromProducerMsgType,
  WsConnectStatus,
  FromProducerMsg,
  FromConsumerMsg,
  FromConsumerMsgType,
  SubFilterMsg,
  PullRelayInfoMsg,
  SwitchRelayMsg,
  DisconnectMsg,
  PubEventMsg,
} from './type';
import { Relay } from 'core/relay/type';
import {
  SubFilterResultStream,
  createPubEventResultStream,
  createSubFilterResultStream,
} from './sub';

export type OnWsConnStatus = (wsConnStatus: WsConnectStatus) => any;

export interface SubFilterResultHandler {
  subscriptionId: string;
  getIterator: () => SubFilterResultStream;
  iterating: ({
    cb,
    onDone,
  }: {
    cb: (data: Event, relayUrl?: string) => any;
    onDone?: () => any;
  }) => any;
}

// this is main thread code that makes postMessage requests to a worker
export class CallWorker {
  public _workerId = 'defaultCallWorker';
  public _portId: number | undefined;
  public relays: Relay[] = [];
  public relayGroupId: string | undefined;
  public wsConnStatus: WsConnectStatus | undefined;

  receiveCount = 0;
  iteratorCount = 0;

  worker = new SharedWorkerPolyfill();

  constructor(onWsConnStatus?: OnWsConnStatus, workerId?: string) {
    if (workerId) {
      this._workerId = workerId;
    }
    this.worker.onerror = e => {
      console.log('worker error: ', e);
    };
    this.worker.port.onmessageerror = e => {
      console.log('port error:', e);
    };
    this.worker.port.onmessage = (event: MessageEvent) => {
      const res: FromProducerMsg = event.data;

      // Determine the data type and wrap it in an async iterator
      switch (res.type) {
        case FromProducerMsgType.relayInfo:
          {
            const data = res.data;
            this.wsConnStatus = data.wsConnectStatus;
            this.relayGroupId = data.id;
            if (onWsConnStatus) {
              onWsConnStatus(this.wsConnStatus);
            }
          }
          break;

        case FromProducerMsgType.portId:
          {
            const data = res.data;
            this._portId = data.portId;
          }
          break;
        default:
          break;
      }
    };

    const that = this;
    window.addEventListener('beforeunload', function () {
      that.closePort();
    });
  }

  get portId(): number {
    return this._portId!;
  }

  closePort() {
    const msg: FromConsumerMsg = {
      type: FromConsumerMsgType.closePort,
      data: { portId: this.portId },
    };
    this.worker.port.postMessage(msg);
  }

  pullRelayInfo() {
    const data: PullRelayInfoMsg = {
      portId: this.portId,
    };
    const msg: FromConsumerMsg = {
      type: FromConsumerMsgType.pullRelayInfo,
      data,
    };
    this.worker.port.postMessage(msg);
  }

  switchRelays(relays: SwitchRelays) {
    const data: SwitchRelayMsg = {
      portId: this.portId,
      switchRelays: relays,
    };
    const msg: FromConsumerMsg = {
      type: FromConsumerMsgType.switchRelays,
      data,
    };
    console.log('send ', msg);
    this.worker.port.postMessage(msg);
  }

  disconnect() {
    const data: DisconnectMsg = {
      portId: this.portId,
    };
    const msg: FromConsumerMsg = {
      type: FromConsumerMsgType.disconnect,
      data,
    };
    this.worker.port.postMessage(msg);
  }

  subFilter({
    filter,
    customId,
    callRelay = {
      type: CallRelayType.connected,
      data: [],
    },
  }: {
    filter: Filter;
    customId?: string;
    callRelay?: { type: CallRelayType; data: string[] };
  }): SubFilterResultHandler {
    const subId = customId || randomSubId(4);
    const data: SubFilterMsg = {
      portId: this.portId,
      filter,
      callRelay,
      subId,
    };
    console.log("sub: ", this._workerId, data);
    const msg: FromConsumerMsg = {
      type: FromConsumerMsgType.subFilter,
      data,
    };
    this.worker.port.postMessage(msg);
    const stream = createSubFilterResultStream(this.worker.port, subId);

    return {
      subscriptionId: subId,
      getIterator: () => {
        return stream;
      },
      iterating: async({ cb, onDone }) => {
        const iterator = stream;
        (async () => {
          const TIMEOUT_DURATION = 2000;// 2 seconds;
          while (true) {
            const resultPromise = Promise.race([
              iterator?.next(),
              new Promise<IteratorResult<any>>((resolve) =>
                setTimeout(() => {
                  resolve({ done: true } as any);
                  console.log("timeout! itering..");
                }, TIMEOUT_DURATION)
              )
            ]);
        
            const result = await resultPromise;
        
            if (result?.done) {
              if (onDone) onDone();
              break;
            } else {
              const res = result?.value;
              if (res == null) continue;
              cb(res.event, res.relayUrl);
            }
          }
          
          console.log("unscribe from iterting...");
          iterator.unsubscribe();
        })();
        
      },
    };
  }

  subMsg(
    pks: PublicKey[],
    customId?: string,
    callRelay?: CallRelay,
    overrides?: Omit<Filter, 'authors | ids '>,
  ) {
    const filter: Filter = {
      ...{
        authors: pks,
        limit: 50,
        kinds: [
          WellKnownEventKind.text_note,
          WellKnownEventKind.article_highlight,
          WellKnownEventKind.long_form,
        ],
      },
      ...overrides,
    };

    return this.subFilter({ filter, customId, callRelay });
  }

  subMsgByEventIds(eventIds: EventId[], customId?: string) {
    const filter: Filter = {
      ids: eventIds,
      limit: eventIds.length,
    };
    return this.subFilter({ filter, customId });
  }

  subMsgByETags(eventIds: EventId[], customId?: string, callRelay?: CallRelay) {
    const filter: Filter = {
      kinds: [WellKnownEventKind.text_note],
      '#e': eventIds,
      limit: 50,
    };
    return this.subFilter({ filter, customId, callRelay });
  }

  subMsgByPTags({
    publicKeys,
    kinds,
    since,
    customId,
    callRelay,
  }: {
    publicKeys: PublicKey[];
    kinds?: WellKnownEventKind[];
    since?: number;
    customId?: string;
    callRelay?: CallRelay;
  }) {
    const filter: Filter = {
      '#p': publicKeys,
      limit: 50,
    };
    if (kinds) {
      filter.kinds = kinds;
    }
    if (since) {
      filter.since = since;
    }
    return this.subFilter({ filter, customId, callRelay });
  }

  subMetadata(
    pks: PublicKey[],
    customId?: string,
    callRelay?: { type: CallRelayType; data: string[] },
  ) {
    const filter: Filter = {
      authors: pks,
      kinds: [WellKnownEventKind.set_metadata],
      limit: pks.length,
    };
    return this.subFilter({ filter, customId, callRelay });
  }

  subContactList(pks: PublicKey[], customId?: string, callRelay?: CallRelay) {
    const filter: Filter = {
      authors: pks,
      kinds: [WellKnownEventKind.contact_list],
      limit: Math.max(pks.length, 50),
    };
    return this.subFilter({ filter, customId, callRelay });
  }

  subMetaDataAndContactList(
    pks: PublicKey[],
    customId?: string,
    callRelay?: CallRelay,
  ) {
    const filter: Filter = {
      authors: pks,
      kinds: [WellKnownEventKind.set_metadata, WellKnownEventKind.contact_list],
      limit: pks.length * 2,
    };
    return this.subFilter({ filter, customId, callRelay });
  }

  subMsgAndMetaData(pks: PublicKey[], customId?: string) {
    const filter: Filter = {
      authors: pks,
      kinds: [WellKnownEventKind.set_metadata, WellKnownEventKind.text_note],
      limit: pks.length + 50,
    };
    return this.subFilter({ filter, customId });
  }

  subUserRecommendServer(pks: PublicKey[], customId?: string) {
    const filter: Filter = {
      authors: pks,
      kinds: [WellKnownEventKind.recommend_server],
      limit: pks.length,
    };
    return this.subFilter({ filter, customId });
  }

  subNip23Posts({
    pks,
    customId,
    callRelay,
    limit,
  }: {
    pks: PublicKey[];
    customId?: string;
    callRelay?: { type: CallRelayType; data: string[] };
    limit?: number;
  }) {
    const filter = Nip23.filter({
      authors: pks,
      overrides: {
        limit: limit || 50,
      },
    });
    return this.subFilter({ filter, customId, callRelay });
  }

  pubEvent(event: Event, callRelay?: { type: CallRelayType; data: string[] }) {
    const data: PubEventMsg = {
      portId: this.portId,
      callRelay: callRelay || { type: CallRelayType.connected, data: [] },
      event,
    };
    const msg: FromConsumerMsg = {
      type: FromConsumerMsgType.pubEvent,
      data,
    };
    this.worker.port.postMessage(msg);
    return createPubEventResultStream(this.worker.port, event.id);
  }
}
