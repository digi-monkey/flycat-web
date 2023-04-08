import {
  Event,
  EventId,
  EventSubResponse,
  Filter,
  isEventSubResponse,
  PublicKey,
  randomSubId,
  RelayResponseType,
  WellKnownEventKind,
} from 'service/api';
import { Nip23 } from 'service/nip/23';
import SharedWorkerPolyfill from './polyfill';
import {
  CallRelay,
  CallRelayType,
  FromPostMsg,
  FromWorkerMessageData,
  FromWorkerMessageType,
  ToPostMsg,
  ToWorkerMessageData,
  ToWorkerMessageType,
} from './type';

class GroupedAsyncGenerator<T, K> {
  private resolveFunctions = new Map<
    K,
    (value: IteratorResult<T, any>) => void
  >();

  constructor(private messageStream: () => AsyncGenerator<T>) {}

  async *getGenerator(key: K): AsyncGenerator<T, any, undefined> {
    while (true) {
      const { value, done } = await this.messageStream().next();
      const data = JSON.parse(value.nostrData);
      const subscriptionId = data[1]?.split(':')[1] as K;

      if (subscriptionId === key) {
        yield value as unknown as T;
      }

      if (done) {
        this.resolveFunctions.get(subscriptionId)?.({
          value: undefined,
          done: true,
        });
        break;
      }
    }
  }
}

export type OnWsConnStatus = (message: FromWorkerMessageData) => any;
export type OnNostrData = (message: FromWorkerMessageData) => any;

export interface CallResultHandler {
  subscriptionId: string;
  getIterator: () => AsyncGenerator<FromWorkerMessageData, void, unknown>;
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

  receiveCount = 0;
  iteratorCount = 0;

  worker = new SharedWorkerPolyfill();

  groupedEvents: GroupedAsyncGenerator<FromWorkerMessageData, string>;

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
      const res: FromPostMsg = event.data;
      const data: FromWorkerMessageData = res.data;

      // Determine the data type and wrap it in an async iterator
      switch (res.type) {
        case FromWorkerMessageType.WS_CONN_STATUS:
          {
            if (onWsConnStatus) {
              onWsConnStatus(data);
            }
          }
          break;

        case FromWorkerMessageType.PORT_ID:
          {
            //console.log('portId:', data.portId);
            if (data.portId == null) {
              throw new Error('missing data.portId');
            }
            this._portId = data.portId;
          }
          break;
        default:
          break;
      }
    };

    const that = this;
    async function* messageStream(): AsyncGenerator<FromWorkerMessageData> {
      while (true) {
        yield await new Promise<FromWorkerMessageData>(resolve => {
          const listener = (event: MessageEvent) => {
            const res: FromPostMsg = event.data;
            const data: FromWorkerMessageData = res.data;

            // Determine the data type and wrap it in an async iterator
            switch (res.type) {
              case FromWorkerMessageType.NOSTR_DATA:
                {
                  if (data.nostrData == null) {
                    throw new Error('nostrData is null!');
                  }
                  const subResponse = JSON.parse(
                    data.nostrData,
                  ) as EventSubResponse;
                  const [resHead] = subResponse;
                  if (resHead !== RelayResponseType.SubEvent) {
                    throw new Error('invalid subEvent response');
                  }
                  that.receiveCount++;
                  resolve(data);

                  // release the listener
                  that.worker.port.removeEventListener('message', listener);
                }
                break;

              case FromWorkerMessageType.PORT_ID:
                {
                  if (data.portId == null) {
                    throw new Error('missing data.portId');
                  }
                  //console.log('inside, port id', data.portId);
                  that._portId = data.portId;
                }
                break;

              default:
                break;
            }
          };
          that.worker.port.addEventListener('message', listener);
        });
      }
    }
    this.groupedEvents = new GroupedAsyncGenerator<
      FromWorkerMessageData,
      string
    >(messageStream);

    window.addEventListener('beforeunload', function () {
      that.closePort();
    });
  }

  get portId(): number {
    return this._portId!;
  }

  closePort() {
    const msg: ToPostMsg = {
      type: ToWorkerMessageType.CLOSE_PORT,
      data: { portId: this.portId },
    };
    this.worker.port.postMessage(msg);
  }

  call(msg: ToPostMsg): CallResultHandler | undefined {
    if (
      msg.type === ToWorkerMessageType.CALL_API &&
      msg.data.callData &&
      typeof msg.data.callData[2] === 'undefined'
    ) {
      // add a random sub id
      msg.data.callData[2] = randomSubId(4);
    }

    this.worker.port.postMessage(msg);

    if (
      msg.type === ToWorkerMessageType.CALL_API &&
      msg.data.callData &&
      msg.data.callData[2]
    ) {
      const subscriptionId = msg.data.callData[2];
      return {
        subscriptionId,
        getIterator: () => {
          return this.groupedEvents.getGenerator(subscriptionId);
        },
        iterating: ({ cb, onDone }) => {
          const iterator = this.groupedEvents.getGenerator(subscriptionId);

          (async () => {
            //await new Promise(resolve => setTimeout(resolve, 500));
            while (true) {
              const result = await iterator?.next();
              if (result?.done) {
                // todo: empty this.messageGroups[subscriptionId] value but not delete the key
                if (onDone) onDone();
                break;
              } else {
                const res = result?.value;
                if (res == null) continue;
                const msg = JSON.parse(res.nostrData); //todo: callback other datatype as well
                if (isEventSubResponse(msg)) {
                  const event = (msg as EventSubResponse)[2];
                  cb(event, res.relayUrl);
                }
              }
            }
          })();
        },
      };
    }

    return undefined;
  }

  pullWsConnectStatus() {
    const data: ToWorkerMessageData = {
      portId: this.portId,
    };
    const msg: ToPostMsg = {
      type: ToWorkerMessageType.PULL_RELAY_STATUS,
      data,
    };
    return this.call(msg);
  }

  addRelays(relays: string[]) {
    const data: ToWorkerMessageData = {
      portId: this.portId,
      urls: relays,
    };
    const msg: ToPostMsg = {
      type: ToWorkerMessageType.ADD_RELAY_URL,
      data,
    };
    return this.call(msg);
  }

  disconnect() {
    const data: ToWorkerMessageData = {
      portId: this.portId,
    };
    const msg: ToPostMsg = {
      type: ToWorkerMessageType.DISCONNECT,
      data,
    };
    return this.call(msg);
  }

  subFilter(
    filter: Filter,
    keepAlive?: boolean,
    customId?: string,
    callRelay?: { type: CallRelayType; data: string[] },
  ) {
    const data: ToWorkerMessageData = {
      portId: this.portId,
      callMethod: 'subFilter',
      callData: [filter, keepAlive, customId],
      callRelayType: callRelay?.type,
      callRelayUrls: callRelay?.data,
    };
    const msg: ToPostMsg = {
      type: ToWorkerMessageType.CALL_API,
      data,
    };
    return this.call(msg);
  }

  subMsg(
    pks: PublicKey[],
    keepAlive?: boolean,
    customId?: string,
    callRelay?: CallRelay,
    overrides?: Omit<Filter, 'authors | ids '>,
  ) {
    const filter: Filter = {
      ...{
        authors: pks,
        limit: 50,
        kinds: [WellKnownEventKind.text_note],
      },
      ...overrides,
    };

    return this.subFilter(filter, keepAlive, customId, callRelay);
  }

  subMsgByEventIds(
    eventIds: EventId[],
    keepAlive?: boolean,
    customId?: string,
  ) {
    const filter: Filter = {
      ids: eventIds,
      limit: eventIds.length,
    };
    return this.subFilter(filter, keepAlive, customId);
  }

  subMsgByETags(
    eventIds: EventId[],
    keepAlive?: boolean,
    customId?: string,
    callRelay?: CallRelay,
  ) {
    const filter: Filter = {
      kinds: [WellKnownEventKind.text_note],
      '#e': eventIds,
      limit: 50,
    };
    return this.subFilter(filter, keepAlive, customId, callRelay);
  }

  subMsgByPTags({
    publicKeys,
    kinds,
    since,
    keepAlive,
    customId,
    callRelay,
  }: {
    publicKeys: PublicKey[];
    kinds?: WellKnownEventKind[];
    since?: number;
    keepAlive?: boolean;
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
    return this.subFilter(filter, keepAlive, customId, callRelay);
  }

  subMetadata(
    pks: PublicKey[],
    keepAlive?: boolean,
    customId?: string,
    callRelay?: { type: CallRelayType; data: string[] },
  ) {
    const filter: Filter = {
      authors: pks,
      kinds: [WellKnownEventKind.set_metadata],
      limit: pks.length,
    };
    return this.subFilter(filter, keepAlive, customId, callRelay);
  }

  subContactList(
    pks: PublicKey[],
    keepAlive?: boolean,
    customId?: string,
    callRelay?: CallRelay,
  ) {
    const filter: Filter = {
      authors: pks,
      kinds: [WellKnownEventKind.contact_list],
      limit: Math.max(pks.length, 50),
    };
    return this.subFilter(filter, keepAlive, customId, callRelay);
  }

  subMetaDataAndContactList(
    pks: PublicKey[],
    keepAlive?: boolean,
    customId?: string,
    callRelay?: CallRelay,
  ) {
    const filter: Filter = {
      authors: pks,
      kinds: [WellKnownEventKind.set_metadata, WellKnownEventKind.contact_list],
      limit: pks.length * 2,
    };
    return this.subFilter(filter, keepAlive, customId, callRelay);
  }

  subMsgAndMetaData(pks: PublicKey[], keepAlive?: boolean, customId?: string) {
    const filter: Filter = {
      authors: pks,
      kinds: [WellKnownEventKind.set_metadata, WellKnownEventKind.text_note],
      limit: pks.length + 50,
    };
    return this.subFilter(filter, keepAlive, customId);
  }

  subUserRecommendServer(
    pks: PublicKey[],
    keepAlive?: boolean,
    customId?: string,
  ) {
    const filter: Filter = {
      authors: pks,
      kinds: [WellKnownEventKind.recommend_server],
      limit: pks.length,
    };
    return this.subFilter(filter, keepAlive, customId);
  }

  subNip23Posts({
    pks,
    keepAlive,
    customId,
    callRelay,
  }: {
    pks: PublicKey[];
    keepAlive?: boolean;
    customId?: string;
    callRelay?: { type: CallRelayType; data: string[] };
  }) {
    const filter = Nip23.filter({
      authors: pks,
      overrides: {
        limit: 50,
      },
    });
    return this.subFilter(filter, keepAlive, customId, callRelay);
  }

  subBlogSiteMetadata(
    pks: PublicKey[],
    keepAlive?: boolean,
    customId?: string,
    callRelay?: { type: CallRelayType; data: string[] },
  ) {
    const filter: Filter = {
      authors: pks,
      kinds: [WellKnownEventKind.flycat_site_metadata],
      limit: pks.length,
    };
    return this.subFilter(filter, keepAlive, customId, callRelay);
  }

  pubEvent(event: Event, callRelay?: { type: CallRelayType; data: string[] }) {
    const data: ToWorkerMessageData = {
      portId: this.portId,
      callMethod: 'pubEvent',
      callRelayType: callRelay?.type,
      callRelayUrls: callRelay?.data,
      callData: [event],
    };
    const msg: ToPostMsg = {
      type: ToWorkerMessageType.CALL_API,
      data,
    };
    return this.call(msg);
  }
}
