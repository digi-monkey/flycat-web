import {
  Event,
  EventId,
  Filter,
  PublicKey,
  WellKnownEventKind,
} from 'service/api';
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

export type OnWsConnStatus = (message: FromWorkerMessageData) => any;
export type OnNostrData = (message: FromWorkerMessageData) => any;

// this is main thread code that makes postMessage requests to a worker
export class CallWorker {
  resolvers: { [key: string]: (arg: any) => unknown } = {};
  rejectors: { [key: string]: (arg: any) => unknown } = {};
  public workerId: string = 'defaultCallWorker';
  public _portId: number | undefined;
  public lastOnMsgListener;
  public listeners: { type: string; listener: any }[] = [];

  msgCount = 0;
  receiveCount = 0;

  worker = new SharedWorker(new URL('./worker.ts', import.meta.url));

  addEventListener(type, listener) {
    this.listeners.push({ type, listener });
    this.worker.port.addEventListener(type, listener);
  }

  removeEventListener(type, listener) {
    const index = this.listeners.findIndex(
      l => l.type === type && l.listener === listener,
    );
    if (index !== -1) {
      const { type, listener } = this.listeners.splice(index, 1)[0];
      this.worker.port.removeEventListener(type, listener);
    }
  }

  constructor(
    onWsConnStatus?: OnWsConnStatus,
    onNostrData?: OnNostrData,
    workerId?: string,
  ) {
    if (workerId) {
      this.workerId = workerId;
    }
    this.worker.onerror = e => {
      console.log('worker error: ', e);
    };
    //this.worker.port.start();
    this.lastOnMsgListener = (event: MessageEvent) => {
      //console.log("constructor")
      // const id = workerId ? workerId : "unNamedWorker";
      if (workerId) {
        console.debug(`received port message on ${workerId}`);
      }
      this.receiveCount++;
      //console.log("client receive post message count=>", this.receiveCount, event.data.type);
      const res: FromPostMsg = event.data;
      const data = res.data;

      switch (res.type) {
        case FromWorkerMessageType.WS_CONN_STATUS:
          if (onWsConnStatus) {
            onWsConnStatus(data);
          }
          break;

        case FromWorkerMessageType.NOSTR_DATA:
          if (onNostrData) {
            onNostrData(data);
          }
          break;

        case FromWorkerMessageType.PORT_ID:
          if (data.portId == null) {
            throw new Error('missing data.portId');
          }
          this._portId = data.portId;
          break;
        default:
          break;
      }
    };
    this.addEventListener('message', this.lastOnMsgListener);
    //this.worker.port.addEventListener("message", this.lastOnMsgListener);
    this.worker.port.onmessageerror = e => {
      console.log('port error:', e);
    };

    // get ws status
    //this.pullWsConnectStatus();
    var that = this;
    window.addEventListener('beforeunload', function () {
      that.closePort();
    });
  }

  get portId(): number {
    return this._portId!;
  }

  updateMsgListener(
    onWsConnStatus?: (message: FromWorkerMessageData) => any,
    onNostrData?: (message: FromWorkerMessageData) => any,
  ) {
    this.removeEventListener('message', this.lastOnMsgListener);
    //this.worker.port.removeEventListener("message", this.lastOnMsgListener);
    this.lastOnMsgListener = (event: MessageEvent) => {
      //console.log("updated..")
      // const id = workerId ? workerId : "unNamedWorker";
      if (this.workerId) {
        console.debug(`received port message on ${this.workerId}`);
      }
      this.receiveCount++;
      //console.log("client receive post message count=>", this.receiveCount, event.data.type);
      const res: FromPostMsg = event.data;
      const data = res.data;

      switch (res.type) {
        case FromWorkerMessageType.WS_CONN_STATUS:
          if (onWsConnStatus) {
            onWsConnStatus(data);
          }
          break;

        case FromWorkerMessageType.NOSTR_DATA:
          if (onNostrData) {
            onNostrData(data);
          }
          break;
        default:
          break;
      }
    };
    this.addEventListener('message', this.lastOnMsgListener);
    //this.worker.port.addEventListener("message", this.lastOnMsgListener);
  }

  removeListeners() {
    this.worker.onerror = null;
    this.worker.port.onmessage = null;
    this.worker.port.onmessageerror = null;
  }

  closePort() {
    const msg: ToPostMsg = {
      type: ToWorkerMessageType.CLOSE_PORT,
      data: { portId: this.portId },
    };
    this.worker.port.postMessage(msg);
  }

  call(msg: ToPostMsg) {
    const __messageId = this.msgCount++;
    this.worker.port.postMessage(msg);
    //console.debug('post..', msg);
    return new Promise((resolve, reject) => {
      this.resolvers[__messageId] = resolve;
      this.rejectors[__messageId] = reject;
    });
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
  ) {
    const filter: Filter = {
      authors: pks,
      limit: 50,
      kinds: [WellKnownEventKind.text_note],
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

  subMsgByETags(eventIds: EventId[], keepAlive?: boolean, customId?: string) {
    const filter: Filter = {
      kinds: [WellKnownEventKind.text_note],
      '#e': eventIds,
      limit: 50,
    };
    return this.subFilter(filter, keepAlive, customId);
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
      limit: pks.length,
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

  subBlogSiteMetadata(
    pks: PublicKey[],
    keepAlive?: boolean,
    customId?: string,
  ) {
    const filter: Filter = {
      authors: pks,
      kinds: [WellKnownEventKind.flycat_site_metadata],
      limit: pks.length,
    };
    return this.subFilter(filter, keepAlive, customId);
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
