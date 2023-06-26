import { isEventSubResponse, isFilterEqual } from 'core/nostr/util';
import {
  AuthPubRequest,
  AuthSubResponse,
  Challenge,
  ClientRequestType, ErrorReason,
  EventId,
  EventPubRequest,
  EventPubResponse,
  EventSubReachEndResponse,
  EventSubRequest,
  Filter,
  NoticeResponse,
  Reason,
  RelayResponse,
  RelayResponseType,
  SubCloseRequest,
  SubscriptionId
} from 'core/nostr/type';
import { Event } from 'core/nostr/Event';
import WebSocket, {MessageEvent, CloseEvent, OpenEvent, ErrorEvent} from 'ws';
import { randomSubId } from 'utils/common';

export interface NodeWsApiHandler {
  onMsgHandler?: (evt: MessageEvent) => any;
  onOpenHandler?: (evt: OpenEvent) => any;
  onCloseHandler?: (evt: CloseEvent) => any;
  onErrHandler?: (evt: ErrorEvent) => any;
}

// websocket used on backend
export class NodeWsApi {
  private ws: WebSocket;
  public maxSub: number;
  private maxKeepAlive: number;
  private maxInstant: number;
  public instantPool: Map<SubscriptionId, Filter>;
  public keepAlivePool: Map<SubscriptionId, Filter>;

  constructor(
    url: string,
    wsHandler: NodeWsApiHandler,
    maxSub = 10,
    maxKeepAlive: 5,
  ) {
    if (maxSub <= maxKeepAlive) {
      throw new Error('maxSub <= maxKeepAlive');
    }

    this.ws = new WebSocket(url);
		this.updateListeners(url, wsHandler);
    this.maxSub = maxSub;
    this.maxKeepAlive = maxKeepAlive;
    this.maxInstant = maxSub - maxKeepAlive;
    this.instantPool = new Map();
    this.keepAlivePool = new Map();
  }

  private updateListeners(
    url?: string,
    wsHandler?: NodeWsApiHandler,
  ) {
    if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
      this.ws = new WebSocket(url || "");
    }

    this.ws.onopen = wsHandler?.onOpenHandler || this.handleOpen;
    this.ws.onmessage = evt => {
      this.handleResponse(evt, wsHandler?.onMsgHandler);
    };
    this.ws.onerror = wsHandler?.onErrHandler || this.handleError;
    this.ws.onclose = () => {console.log(this.ws.url, "closed")};
  }

  isDuplicatedFilter(
    map: Map<SubscriptionId, Filter>,
    filter: Filter,
  ): boolean {
    return (
      Array.from(map.values()).filter(f => isFilterEqual(f, filter)).length > 0
    );
  }

  get url() {
    return this.ws.url;
  }

  isConnected() {
    if (this.ws == null) return false;

    if (this.ws.readyState === WebSocket.OPEN) {
      return true;
    } else {
      return false;
    }
  }

  isClose() {
    if (this.ws == null) return false;

    if (this.ws.readyState === WebSocket.CLOSED) {
      return true;
    } else {
      return false;
    }
  }

  close() {
    this.ws.close();
  }

  async _send(data: string | ArrayBuffer) {
    if (this.isConnected()) {
      await this.ws.send(data);
      console.debug(this.ws.url, " sent data: ", data);
    } else {
      console.log(
        `${this.url} not open, abort send msg.., ws.readState: ${this.ws.readyState}`,
      );
    }
  }

  handleClose(event: any, callBack?: any) {
    console.log('ws close!');
    if (callBack) {
      callBack();
    }
  }

  handleOpen(event: any) {
    console.log('[handleOpen]ws connected!', event);
  }

  handleError(event: any) {
    console.error('error =>', event);
    if (this.ws) {
      this.ws.close();
    }
  }
  /******* above is websocket handling */

  /******* below is nostr handling */
  handleResponse(evt: MessageEvent, onEventSubCallback?: (msg: any) => any) {
    const msg: RelayResponse = JSON.parse(evt.data as string);
    const type = msg[0];
    switch (type) {
      case RelayResponseType.Notice:
        this.handleNotice(evt);
        break;

      case RelayResponseType.PubEvent:
        this.handleEventPub(evt);
        break;

      case RelayResponseType.SubAuth:
        this.handleAuthSub(evt);
        break;

      case RelayResponseType.SubEvent:
        this.handleEventSub(evt, onEventSubCallback);
        break;

      case RelayResponseType.SubReachEnd:
        this.handleSubReachEnd(evt);
        break;

      default:
        break;
    }
  }

  // handle relay response message
  handleEventPub(
    evt: any,
    callback?: ({
      eventId,
      isSuccess,
      reason,
    }: {
      eventId: EventId;
      isSuccess: boolean;
      reason: Reason;
    }) => any,
  ) {
    const res = JSON.parse(evt.data);
    const type = (res as RelayResponse)[0];
    if (type !== RelayResponseType.PubEvent) {
      return;
    }

    const msg: EventPubResponse = res;
    const eventId = msg[1];
    const isSuccess = msg[2];
    const reason = msg[3];
    if (callback) {
      callback({ eventId, isSuccess, reason });
    }
  }

  handleNotice(evt: any, callback?: (reason: ErrorReason) => any) {
    const res = JSON.parse(evt.data);
    const type = (res as RelayResponse)[0];
    if (type !== RelayResponseType.Notice) {
      return;
    }

    const msg: NoticeResponse = res;
    const reason = this.url + ' => ' + msg[1];
    const cb = callback || console.warn;
    cb(reason);
  }

  handleSubReachEnd(evt: any, callback?: (subId: SubscriptionId) => any) {
    const res = JSON.parse(evt.data);
    const type = (res as RelayResponse)[0];
    if (type !== RelayResponseType.SubReachEnd) {
      return;
    }

    const msg: EventSubReachEndResponse = res;
    const subId = msg[1];
    const defaultCb = (subId: SubscriptionId) => {
      if (this.instantPool.has(subId)) {
        this.killInstantSub(subId);
      }
    };
    const cb = callback || defaultCb;
    cb(subId);
  }

  handleAuthSub(evt: any, callback?: (challenge: Challenge) => any) {
    const res = JSON.parse(evt.data);
    const type = (res as RelayResponse)[0];
    if (type !== RelayResponseType.SubAuth) {
      return;
    }

    const msg: AuthSubResponse = res;
    const challenge = msg[1];
    const defaultCb = (challenge: Challenge) => {
      // todo: sign this challenge and send it
    };
    const cb = callback || defaultCb;
    cb(challenge);
  }

  handleEventSub(evt: any, callback?: (msg: globalThis.Event) => any) {
    const msg: any = JSON.parse(evt.data);
    if (isEventSubResponse(msg)) {
      if (callback != null) {
        callback(evt);
      }
    }
  }

  // do request to relay
  async pubAuth(event: Event) {
    const data: AuthPubRequest = [ClientRequestType.PubAuth, event];
    return await this._send(JSON.stringify(data));
  }

  async pubEvent(event: Event) {
    const data: EventPubRequest = [ClientRequestType.PubEvent, event];
    return await this._send(JSON.stringify(data));
  }

  async subFilter(filter: Filter, keepAlive?: boolean, _subId?: string) {
    const subId = _subId || randomSubId();
    if (keepAlive === true) {
      const isDuplicated = this.isDuplicatedFilter(this.keepAlivePool, filter);
      const isReplaceId = _subId != null && this.keepAlivePool.has(_subId);
      if (isReplaceId) {
        // replace in pool
        this.killKeepAliveSub(subId);
        this.keepAlivePool.set(_subId, filter);
        // send new
        const data: EventSubRequest = [
          ClientRequestType.SubFilter,
          _subId,
          filter,
        ];
        console.log('replace keep-alive sub!');
        return await this._send(JSON.stringify(data));
      }

      if (!isDuplicated && this.keepAlivePool.size < this.maxKeepAlive) {
        this.keepAlivePool.set(subId, filter);
        const data: EventSubRequest = [
          ClientRequestType.SubFilter,
          subId,
          filter,
        ];
        return await this._send(JSON.stringify(data));
      }
    }

    // for instant subs, we just replace with new
    if (this.instantPool.has(subId)) {
      this.killInstantSub(subId);
    }

    if (this.instantPool.size >= this.maxInstant) {
      // randomly close some first
      const id = this.instantPool.keys().next().value;
      this.killInstantSub(id);
    }

    this.instantPool.set(subId, filter);
    const data: EventSubRequest = [ClientRequestType.SubFilter, subId, filter];
    return await this._send(JSON.stringify(data));
  }

  killInstantSub(id: SubscriptionId) {
    if (this.instantPool.has(id)) {
      this.sendCloseSub(id);
      this.instantPool.delete(id);
      //console.debug(`${this.url()} kill instant sub ${id}`);
    }
  }

  killKeepAliveSub(id: SubscriptionId) {
    if (this.keepAlivePool.has(id)) {
      this.sendCloseSub(id, true);
      this.keepAlivePool.delete(id);
      //console.debug(`${this.url()} kill keep-alive sub ${id}`);
    }
  }

  async sendCloseSub(subId: SubscriptionId, closeKeepAlive = false) {
    if (!closeKeepAlive && this.isKeepAlive(subId)) {
      return;
    }

    const data: SubCloseRequest = [ClientRequestType.Close, subId];
    return await this._send(JSON.stringify(data));
  }

  subPoolLength() {
    return this.instantPool.size + this.keepAlivePool.size;
  }

  isKeepAlive(subId: SubscriptionId) {
    return this.keepAlivePool.has(subId);
  }
}
