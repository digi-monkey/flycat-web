import { Event, EventId, Filter, PublicKey } from 'service/api';
import {
  FromPostMsg,
  FromWorkerMessageData,
  FromWorkerMessageType,
  ToPostMsg,
  ToWorkerMessageData,
  ToWorkerMessageType,
} from './type';

// this is main thread code that makes postMessage requests to a worker
export class CallWorker {
  resolvers: { [key: string]: (arg: any) => unknown } = {};
  rejectors: { [key: string]: (arg: any) => unknown } = {};
  public workerId: string = 'defaultCallWorker';
  public _portId: number | undefined;

  msgCount = 0;
  receiveCount = 0;

  worker = new SharedWorker(new URL('./worker.ts', import.meta.url));

  constructor(
    onWsConnStatus?: (message: FromWorkerMessageData) => any,
    onNostrData?: (message: FromWorkerMessageData) => any,
    workerId?: string,
  ) {
    if (workerId) {
      this.workerId = workerId;
    }
    this.worker.onerror = e => {
      console.log('worker error: ', e);
    };
    //this.worker.port.start();
    this.worker.port.onmessage = (event: MessageEvent) => {
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
    this.worker.port.onmessage = (event: MessageEvent) => {
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

  subFilter(filter: Filter, keepAlive?: boolean, customId?: string) {
    const data: ToWorkerMessageData = {
      portId: this.portId,
      callMethod: 'subFilter',
      callData: [filter, keepAlive, customId],
    };
    const msg: ToPostMsg = {
      type: ToWorkerMessageType.CALL_API,
      data,
    };
    return this.call(msg);
  }

  subMsg(pks: PublicKey[]) {
    const filter: Filter = {
      authors: pks,
      limit: 50,
    };
    const data: ToWorkerMessageData = {
      portId: this.portId,
      callMethod: 'subFilter',
      callData: [filter],
    };
    const msg: ToPostMsg = {
      type: ToWorkerMessageType.CALL_API,
      data,
    };
    return this.call(msg);
  }

  subMsgByEventIds(eventIds: EventId[]) {
    const filter: Filter = {
      ids: eventIds,
      limit: 50,
    };
    const data: ToWorkerMessageData = {
      portId: this.portId,
      callMethod: 'subFilter',
      callData: [filter],
    };
    const msg: ToPostMsg = {
      type: ToWorkerMessageType.CALL_API,
      data,
    };
    return this.call(msg);
  }

  subMsgByETags(eventIds: EventId[]) {
    const filter: Filter = {
      '#e': eventIds,
      limit: 50,
    };
    const data: ToWorkerMessageData = {
      portId: this.portId,
      callMethod: 'subFilter',
      callData: [filter],
    };
    const msg: ToPostMsg = {
      type: ToWorkerMessageType.CALL_API,
      data,
    };
    return this.call(msg);
  }

  subMetadata(pks: PublicKey[]) {
    const data: ToWorkerMessageData = {
      portId: this.portId,
      callMethod: 'subUserMetadata',
      callData: [pks],
    };
    const msg: ToPostMsg = {
      type: ToWorkerMessageType.CALL_API,
      data,
    };
    return this.call(msg);
  }

  subContactList(publicKey: PublicKey) {
    const data: ToWorkerMessageData = {
      portId: this.portId,
      callMethod: 'subUserContactList',
      callData: [publicKey],
    };
    const msg: ToPostMsg = {
      type: ToWorkerMessageType.CALL_API,
      data,
    };
    return this.call(msg);
  }

  subUserRecommendServer(pks: PublicKey[]) {
    const data: ToWorkerMessageData = {
      portId: this.portId,
      callMethod: 'subUserRelayer',
      callData: [pks],
    };
    const msg: ToPostMsg = {
      type: ToWorkerMessageType.CALL_API,
      data,
    };
    return this.call(msg);
  }

  subBlogSiteMetadata(pks: PublicKey[]) {
    const data: ToWorkerMessageData = {
      portId: this.portId,
      callData: [pks],
      callMethod: 'subUserSiteMetadata',
    };
    const msg: ToPostMsg = {
      type: ToWorkerMessageType.CALL_API,
      data,
    };
    return this.call(msg);
  }

  pubEvent(event: Event) {
    const data: ToWorkerMessageData = {
      portId: this.portId,
      callMethod: 'pubEvent',
      callData: [event],
    };
    const msg: ToPostMsg = {
      type: ToWorkerMessageType.CALL_API,
      data,
    };
    return this.call(msg);
  }
}
