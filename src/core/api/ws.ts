import { randomSubId } from 'core/api/wsApi';
import {
  ClientRequestType,
  EventPubRequest,
  EventSubRequest,
  Filter,
  SubscriptionId,
} from 'core/nostr/type';
import { Event } from 'core/nostr/Event';
import { Queue } from 'types/queue';
import { Pool } from 'types/pool';
import {
  createAuthStream,
  createPublishEventResultStream,
  createSubscriptionEventStream,
  createSubscriptionNoticeStream,
} from './sub';

export class WS {
  private _ws: WebSocket;
  public url: string;
  public maxSub: number;
  public reconnectIdleSecs: number;

  public subscriptionFilters: Map<SubscriptionId, Filter>;
  public pendingSubscriptions: Queue<SubscriptionId>;
  public activeSubscriptions: Pool<SubscriptionId>;

  constructor(
    urlOrWebsocket: string | WebSocket,
    maxSub = 10,
    reconnectIdleSecs = 10,
  ) {
    if (typeof urlOrWebsocket === 'string') {
      this.url = urlOrWebsocket;
      this._ws = new WebSocket(urlOrWebsocket);
      this.onCloseReconnectListeners(urlOrWebsocket);
    } else {
      this.url = urlOrWebsocket.url;
      this._ws = urlOrWebsocket;
    }

    this.maxSub = maxSub;
    this.reconnectIdleSecs = reconnectIdleSecs;
    this.subscriptionFilters = new Map();
    this.pendingSubscriptions = new Queue<SubscriptionId>();
    this.activeSubscriptions = new Pool<SubscriptionId>(this.maxSub);
  }

  // todo: change to async and get pub response
  pubEvent(event: Event) {
    const data: EventPubRequest = [ClientRequestType.PubEvent, event];
    this._send(JSON.stringify(data));
    return createPublishEventResultStream(this._ws, event.id);
  }

  subFilter(filter: Filter, _subId?: string) {
    const subId = _subId || randomSubId();
    this.subscriptionFilters.set(subId, filter);

    this.processSubFilter(subId);
    return createSubscriptionEventStream(this._ws, subId);
  }

  subNotice() {
    return createSubscriptionNoticeStream(this._ws);
  }

  subAuth() {
    return createAuthStream(this._ws);
  }

  releaseActiveSubscription(subId: SubscriptionId) {
    const isRemoved = this.activeSubscriptions.removeItem(subId);
    if (isRemoved) {
      this.subscriptionFilters.delete(subId);
      const newSubId = this.pendingSubscriptions.dequeue();
      if (newSubId) {
        this.processSubFilter(newSubId);
      }
    }
  }

  private processSubFilter(subId: SubscriptionId) {
    const filter = this.subscriptionFilters.get(subId);
    if (filter == null) {
      throw new Error(`filter ${subId} not found`);
    }
    const data: EventSubRequest = [ClientRequestType.SubFilter, subId, filter];

    if (this.activeSubscriptions.isFull()) {
      this.pendingSubscriptions.enqueue(subId);
      return;
    }

    try {
      this._send(JSON.stringify(data));
      this.activeSubscriptions.addItem(subId);
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  private _send(data: string | ArrayBuffer) {
    if (this.isConnected()) {
      this._ws.send(data);
    } else {
      throw new Error(
        `${this.url} not open, abort send msg.., ws.readState: ${this._ws.readyState}`,
      );
    }
  }

  private onCloseReconnectListeners(url: string) {
    if (!this._ws || this._ws.readyState === WebSocket.CLOSED) {
      this._ws = new WebSocket(url);
    }

    const reconnect = (_e: CloseEvent) => {
      setTimeout(() => {
        console.log('try reconnect..');
        this.onCloseReconnectListeners(url);
      }, this.reconnectIdleSecs * 1000);
    };

    this._ws.onclose = reconnect;
  }

  isConnected() {
    if (this._ws == null) return false;

    if (this._ws.readyState === WebSocket.OPEN) {
      return true;
    } else {
      return false;
    }
  }

  isClose() {
    if (this._ws == null) return false;

    if (this._ws.readyState === WebSocket.CLOSED) {
      return true;
    } else {
      return false;
    }
  }

  close() {
    this._ws.onclose = null;
    this._ws.close();
  }
}
