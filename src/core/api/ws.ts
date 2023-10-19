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
  SubIdStatus,
  createAuthStream,
  createPublishEventResultStream,
  createSubscriptionEventStream,
  createSubscriptionNoticeStream,
} from './sub';
import { randomSubId } from 'utils/common';
import NodeWS from "ws";

const WebSocket = globalThis.WebSocket || NodeWS;

export class WS {
  public _ws: WebSocket;
  public url: string;
  public maxSub: number;
  public reconnectIdleSecs: number;
  public onCloseListeners: ((_e: CloseEvent) => any)[];
  public onOpenListener: ((_e: any) => any) | null = null;
  public onErrorListener: ((_e: any) => any) | null = null;

  public subscriptionFilters: Map<SubscriptionId, Filter>;
  public pendingSubscriptions: Queue<SubscriptionId>;
  public activeSubscriptions: Pool<SubscriptionId>;

  constructor(
    urlOrWebsocket: string | WebSocket,
    maxSub = 10,
    autoReconnect = true,
    reconnectIdleSecs = 3,
  ) {
    this.maxSub = maxSub;
    this.onCloseListeners = [];
    this.reconnectIdleSecs = reconnectIdleSecs;
    this.subscriptionFilters = new Map();
    this.pendingSubscriptions = new Queue<SubscriptionId>();
    this.activeSubscriptions = new Pool<SubscriptionId>(this.maxSub);

    if (typeof urlOrWebsocket === 'string') {
      this.url = urlOrWebsocket;
      this._ws = new WebSocket(urlOrWebsocket);
      if (autoReconnect) {
        this.doReconnect();
      }
    } else {
      this.url = urlOrWebsocket.url;
      this._ws = urlOrWebsocket;
    }
  }

  pubEvent(event: Event) {
    const data: EventPubRequest = [ClientRequestType.PubEvent, event];
    this._send(JSON.stringify(data));
    return createPublishEventResultStream(this._ws, event.id);
  }

  subFilter(filter: Filter, _subId?: string) {
    const subId = _subId || randomSubId();
    this.subscriptionFilters.set(subId, filter);

    this.processSubFilter(subId);

    const onUnsubscribe = (id: string) => {
      if (this.pendingSubscriptions.has(id)) {
        this.pendingSubscriptions.removeItem(id);
        return;
      }
      this.releaseActiveSubscription(id);
    };
    const getSubIdStatus = this.getSubIdStatus.bind(this);
    return createSubscriptionEventStream(
      this._ws,
      subId,
      getSubIdStatus,
      onUnsubscribe,
    );
  }

  getSubIdStatus(subId: string) {
    if (this.pendingSubscriptions.has(subId)) {
      return SubIdStatus.pending;
    }
    if (this.activeSubscriptions.has(subId)) {
      return SubIdStatus.activated;
    }
    return SubIdStatus.dropped;
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
      if (!this.pendingSubscriptions.has(subId)) {
        this.pendingSubscriptions.enqueue(subId);
      } else {
        console.debug(`${subId} already in the pending queue`);
      }
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

  private doReconnect() {
    const reconnect = (_e: CloseEvent) => {
      setTimeout(() => {
        console.log('try reconnect..', this.url);
        this.doReconnect();
      }, this.reconnectIdleSecs * 1000);
    };

    if (!this._ws || this._ws.readyState !== WebSocket.OPEN) {
      this._ws = new WebSocket(this.url);

      const CONNECT_TIMEOUT = 5000; // 5 seconds

      const connectTimer = setTimeout(() => {
        if (this._ws.readyState !== WebSocket.OPEN) {
          console.debug('WebSocket connection timeout', this.url);
        }
        if (this._ws.readyState === WebSocket.CONNECTING) {
          this._ws.close();
        }
      }, CONNECT_TIMEOUT);

      this._ws.addEventListener('open', e => {
        clearTimeout(connectTimer);
        console.debug('WebSocket connection established', this.url);

        if (this.onOpenListener) this.onOpenListener(e);
      });
    }

    this._ws.onclose = reconnect;
    this._ws.onerror = this.onErrorListener;
    //this._ws.onopen = this.onOpenListener;
    // note: do not change order the onclose and addEventListener otherwise added listener will gone.
    for (const listener of this.onCloseListeners) {
      this.addCloseListener(listener);
    }
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

  addCloseListener(cb: (event: CloseEvent) => any) {
    if (!this.onCloseListeners.includes(cb)) {
      this.onCloseListeners.push(cb);
    }

    this._ws.addEventListener('close', cb);
  }

  onOpen(cb: (event: WSEvent) => any) {
    this.onOpenListener = cb;
    this._ws.onopen = cb;
  }

  onError(cb: (event: WSEvent) => any) {
    this.onErrorListener = cb;
    this._ws.onerror = e => {
      this._ws.close();
      cb(e);
    };
  }
}

export type WSEvent = globalThis.Event;
