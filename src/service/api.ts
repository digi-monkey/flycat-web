import axios from 'axios';
import { HexStr, Utf8Str } from 'types';
import { Buffer } from 'buffer';
import {
  bech32Decode,
  bech32Encode,
  generateRandomBytes,
  getPublicKey,
  schnorrSign,
  Sha256,
} from './crypto';
import { maxStrings } from './helper';
const { version } = require('../../package.json');

export const DEFAULT_API_URL = 'https://nostr.build/api';
export const DEFAULT_WS_API_URL = 'wss://nostr.v0l.io'; //"wss://nostr.v0l.io"//"wss://relay.nostr.bg";//'wss://nostr-relay.digitalmob.ro'//'wss://relay.damus.io'; //'wss://jiggytom.ddns.net';// "wss://demo.piesocket.com/v3/channel_123?api_key=VCXCEuvhGcBDP7XhiJJUDvR1e1D3eiVjgZ9VRiaV&notify_self"/

//axios.defaults.withCredentials = true;
export type ApiHttpResponse = {
  status: 'ok' | 'failed';
  data?: any;
  error?: string;
};
export enum HttpProtocolMethod {
  'get',
  'post',
  'option',
}
export type HttpRequest = (
  subPath: string,
  params?: Params,
  type?: HttpProtocolMethod,
  cfg?: Cfg,
) => Promise<any>;

export interface Params {
  [key: string]: any;
}

export interface Cfg {
  [key: string]: any;
}

export class base {
  url: string;
  httpRequest: HttpRequest;

  constructor(baseUrl: string, httpRequest?: HttpRequest) {
    this.url = baseUrl.endsWith('/')
      ? baseUrl.slice(0, baseUrl.length - 1)
      : baseUrl;
    this.httpRequest = httpRequest || this.newHttpRequest();
  }

  newHttpRequest() {
    return async (
      subPath: string,
      params: Params = {},
      type: HttpProtocolMethod = HttpProtocolMethod.get,
      cfg: Cfg = {},
    ) => {
      const baseUrl = this.url;
      let axiosRes;
      const url = encodeURI(`${baseUrl}/${subPath}`);
      switch (type) {
        case HttpProtocolMethod.get:
          axiosRes = await axios.get(url, {
            params,
            ...cfg,
          });
          break;

        case HttpProtocolMethod.post:
          axiosRes = await axios.post(url, params, cfg);
          break;

        default:
          throw new Error(`unsupported HttpRequestType, ${type}`);
      }
      if (axiosRes.status !== 200) {
        throw new Error(`http request fails, ${axiosRes}`);
      }

      const response = axiosRes.data;
      return response;
    };
  }

  async ping() {
    return await this.httpRequest('ping');
  }

  setUrl(newUrl: string) {
    if (newUrl.startsWith('http')) {
      this.url = newUrl;
    } else {
      this.url = `http://${newUrl}`;
    }
  }

  getUrl() {
    return this.url;
  }
}

export class Api extends base {
  constructor(url?: string, httpRequest?: HttpRequest) {
    const newHttpRequest = async (
      subPath: string,
      params: object = {},
      type: HttpProtocolMethod = HttpProtocolMethod.get,
    ) => {
      const response: ApiHttpResponse = await super.newHttpRequest()(
        subPath,
        params,
        type,
      );
      return response;
    };
    super(url || DEFAULT_API_URL, httpRequest || newHttpRequest);
  }

  async getVersion(): Promise<string | null> {
    return await this.httpRequest('version', {}, HttpProtocolMethod.get);
  }

  async uploadImage(formData: FormData) {
    const headers = {
      'Content-Type': 'multipart/form-data',
    };
    const url: string = await this.httpRequest(
      'upload/flycat.php',
      formData,
      HttpProtocolMethod.post,
      {
        headers,
      },
    );
    return url;
  }
}

export type Hash64Bytes = string;
export type Hash32Bytes = string;
export type RelayUrl = string;
export type PetName = string;
export type SubscriptionId = HexStr;
export type ErrorReason = Utf8Str;
export type Reason = Utf8Str;
export type Challenge = string;
export type Naddr = string; // <kind>:<pubkey>:<d-identifier>

export type EventId = Hash32Bytes;
export type PublicKey = Hash32Bytes;
export type PrivateKey = Hash32Bytes;
export type Signature = Hash64Bytes;
export type EventKind = number;
export enum WellKnownEventKind {
  set_metadata = 0,
  text_note = 1,
  recommend_server = 2,
  contact_list = 3,
  event_del = 5,
  reposts = 6,
  like = 7,
  article_highlight = 9802,
  flycat_site_metadata = 10000,
  long_form = 30023, // see nip23
}

export enum EventETagMarker {
  reply = "reply",
  root = "root",
  mention = "mention",
}

export enum EventTags {
  E = 'e',
  P = 'p',
  D = 'd',
  T = 't',
  A = 'a',
}

export type EventETag = [EventTags.E, EventId, RelayUrl];
export type EventPTag = [EventTags.P, PublicKey, RelayUrl];
export type EventDTag = [EventTags.D, string];
export type EventATag = [EventTags.A, Naddr, RelayUrl]; // ["a", "<kind>:<pubkey>:<d-identifier>", "<relay url>"]
export type EventTTag = [EventTags.T, string];
export type EventContactListPTag = [EventTags.P, PublicKey, RelayUrl, PetName];

// relay response
export enum RelayResponseType {
  SubEvent = 'EVENT',
  SubReachEnd = 'EOSE',
  SubAuth = 'AUTH',
  PubEvent = 'OK',
  Notice = 'NOTICE',
}

export type EventSubResponse = [
  RelayResponseType.SubEvent,
  SubscriptionId,
  Event,
];
export type EventSubReachEndResponse = [
  RelayResponseType.SubReachEnd,
  SubscriptionId,
];
export type AuthSubResponse = [RelayResponseType.SubAuth, Challenge];
export type EventPubResponse = [
  RelayResponseType.PubEvent,
  EventId,
  boolean,
  Reason,
];
export type NoticeResponse = [RelayResponseType.Notice, ErrorReason];

export type RelayResponse =
  | EventSubResponse
  | EventSubReachEndResponse
  | AuthSubResponse
  | EventPubResponse
  | NoticeResponse;

// client request
export enum ClientRequestType {
  PubEvent = 'EVENT',
  PubAuth = 'AUTH',
  SubFilter = 'REQ',
  Close = 'CLOSE',
}

export type EventPubRequest = [ClientRequestType.PubEvent, Event];
export type EventSubRequest = [
  ClientRequestType.SubFilter,
  SubscriptionId,
  Filter,
];
export type SubCloseRequest = [ClientRequestType.Close, SubscriptionId];
export type AuthPubRequest = [ClientRequestType.PubAuth, Event];

export type ClientRequest =
  | EventPubRequest
  | EventSubRequest
  | SubCloseRequest
  | AuthPubRequest;

export interface Filter {
  ids?: EventId[];
  authors?: PublicKey[];
  kinds?: EventKind[];
  '#e'?: EventId[];
  '#p'?: PublicKey[];
  '#d'?: string[];
  '#t'?: string[];
  '#a'?: string[];
  since?: number;
  until?: number;
  limit?: number;
}

export type Tags = (
  | EventETag
  | EventPTag
  | EventDTag
  | EventTTag
  | EventATag
  | EventContactListPTag
  | string[]
  | any[]
)[];
export interface Event {
  id: EventId;
  pubkey: PublicKey;
  created_at: number; // unix timestamp in seconds,
  kind: EventKind;
  tags: Tags;
  content: string;
  sig: Signature;
}

export interface RawEvent {
  id?: EventId;
  pubkey: PublicKey;
  created_at: number; // unix timestamp in seconds,
  kind: EventKind;
  tags: Tags;
  content: string;
}

export class Nostr {
  static async newLikeRawEvent(toEventId: string, toPublicKey: string) {
    const kind = WellKnownEventKind.like;
    const content = '+';
    const tag: EventETag = [EventTags.E, toEventId, ''];
    const tag1: EventPTag = [EventTags.P, toPublicKey, ''];
    const tags = [tag, tag1];
    const rawEvent = new RawEvent('', kind, tags, content);
    return rawEvent;
  }

  static async newDisLikeRawEvent(
    toEventId: string,
    toPublicKey: string,
  ): Promise<RawEvent> {
    const kind = WellKnownEventKind.like;
    const content = '-';
    const tag: EventETag = [EventTags.E, toEventId, ''];
    const tag1: EventPTag = [EventTags.P, toPublicKey, ''];
    const tags = [tag, tag1];
    return new RawEvent('', kind, tags, content);
  }

  static async newProfileRawEvent(
    content: EventSetMetadataContent,
  ): Promise<RawEvent> {
    const kind = WellKnownEventKind.set_metadata;
    const tags = [];
    return new RawEvent('', kind, tags, JSON.stringify(content));
  }
}

export class RawEvent implements RawEvent {
  public id?: EventId;
  public pubkey: PublicKey;
  public created_at: number; // unix timestamp in seconds,
  public kind: EventKind;
  public tags: Tags;
  public content: string;

  constructor(
    pubkey: PublicKey,
    kind: EventKind,
    tags?: Tags,
    content?: string,
    created_at?: number,
  ) {
    this.pubkey = pubkey;
    this.kind = kind;
    this.tags = tags ?? [];
    this.content = content ?? '';
    this.created_at = created_at ?? Math.round(Date.now() / 1000);
  }

  sha256() {
    const data = this.serialize();
    return Sha256(data);
  }

  serialize() {
    const data = [
      0,
      this.pubkey.toLowerCase(), // <pubkey, as a (lowercase) hex string>,
      this.created_at, // <created_at, as a number>,
      this.kind, // <kind, as a number>,
      this.tags, // <tags, as an array of arrays of non-null strings>,
      this.content, // <content, as a string>
    ];
    return JSON.stringify(data);
  }

  async sign(privateKey: PrivateKey): Promise<Signature> {
    if (this.pubkey == null || this.pubkey.length === 0) {
      this.pubkey = getPublicKey(privateKey);
    }
    const hash = this.sha256();
    return await schnorrSign(hash, privateKey);
  }

  async toEvent(privateKey: PrivateKey): Promise<Event> {
    const sig = await this.sign(privateKey);
    const id = this.sha256();
    const event: Event = {
      id,
      pubkey: this.pubkey,
      kind: this.kind,
      content: this.content,
      created_at: this.created_at,
      tags: this.tags,
      sig,
    };
    return event;
  }
}

export interface EventSetMetadataContent {
  display_name: string;
  name: string; // username
  about: string; // user description,
  picture: string; // image url
  lud06: string;
  lud16: string;
  website: string;
  banner: string;
  nip05: string;
}

export interface WsApiHandler {
  onMsgHandler?: (evt: any) => any;
  onOpenHandler?: (evt: WsEvent) => any;
  onCloseHandler?: (evt: WsEvent) => any;
  onErrHandler?: (evt: WsEvent) => any;
}

export type WsEvent = globalThis.Event;

export class WsApi {
  private ws: WebSocket;
  public maxSub: number;
  private maxKeepAlive: number;
  private maxInstant: number;
  public instantPool: Map<SubscriptionId, Filter>;
  public keepAlivePool: Map<SubscriptionId, Filter>;

  constructor(
    url: string,
    wsHandler: WsApiHandler,
    maxSub = 10,
    maxKeepAlive = 2,
    reconnectIntervalSecs?: 10,
  ) {
    if (maxSub <= maxKeepAlive) {
      throw new Error('maxSub <= maxKeepAlive');
    }

    this.ws = new WebSocket(url || DEFAULT_WS_API_URL);
    this.updateListeners(url, wsHandler, reconnectIntervalSecs);
    this.maxSub = maxSub;
    this.maxKeepAlive = maxKeepAlive;
    this.maxInstant = maxSub - maxKeepAlive;
    this.instantPool = new Map();
    this.keepAlivePool = new Map();
  }

  isDuplicatedFilter(
    map: Map<SubscriptionId, Filter>,
    filter: Filter,
  ): boolean {
    return (
      Array.from(map.values()).filter(f => isFilterEqual(f, filter)).length > 0
    );
  }

  private updateListeners(
    url?: string,
    wsHandler?: WsApiHandler,
    reconnectIntervalSecs = 3,
  ) {
    if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
      this.ws = new WebSocket(url || DEFAULT_WS_API_URL);
    }

    const reconnect = (e: CloseEvent) => {
      this.handleClose(e, () => {
        setTimeout(() => {
          if (wsHandler?.onCloseHandler) {
            wsHandler?.onCloseHandler(e);
          }
          console.log('try reconnect..');
          this.updateListeners(url, wsHandler, reconnectIntervalSecs);
        }, reconnectIntervalSecs * 1000);
      });
    };

    this.ws.addEventListener('open', event => {
      if (wsHandler?.onOpenHandler) {
        wsHandler?.onOpenHandler(event);
      }
    });
    this.ws.onopen = wsHandler?.onOpenHandler || this.handleOpen;
    this.ws.onmessage = evt => {
      this.handleResponse(evt, wsHandler?.onMsgHandler);
    };
    this.ws.onerror = wsHandler?.onErrHandler || this.handleError;
    this.ws.onclose = reconnect;
  }

  url() {
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
    } else {
      console.log(
        `${this.url()} not open, abort send msg.., ws.readState: ${
          this.ws.readyState
        }`,
      );
    }
  }

  handleClose(event: any, callBack?: any) {
    console.log('ws close!', event);
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
    const msg: RelayResponse = JSON.parse(evt.data);
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
    const reason = this.url() + ' => ' + msg[1];
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

  handleEventSub(evt: any, callback?: (msg: WsEvent) => any) {
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

const isObject = object => object != null && typeof object === 'object';

export const isDeepEqual = (object1, object2) => {
  const objKeys1 = Object.keys(object1);
  const objKeys2 = Object.keys(object2);

  if (objKeys1.length !== objKeys2.length) return false;

  for (const key of objKeys1) {
    const value1 = object1[key];
    const value2 = object2[key];

    const isObjects = isObject(value1) && isObject(value2);

    if (
      (isObjects && !isDeepEqual(value1, value2)) ||
      (!isObjects && value1 !== value2)
    ) {
      return false;
    }
  }
  return true;
};

export function isFilterEqual(f1: Filter, f2: Filter): boolean {
  return isDeepEqual(f1, f2);
}

export function isEventSubResponse(data: any): data is EventSubResponse {
  return (
    Array.isArray(data) &&
    data[0] === 'EVENT' &&
    typeof data[1] === 'string' &&
    isEvent(data[2])
  );
}

export function isEvent(data: any): data is Event {
  return (
    'id' in data &&
    'pubkey' in data &&
    'created_at' in data &&
    'kind' in data &&
    'tags' in data &&
    'content' in data &&
    'sig' in data
  );
}

export function isEventETag(data: any[]): data is EventETag {
  return (
    Array.isArray(data) &&
    data[0] === EventTags.E &&
    typeof data[1] === 'string' &&
    data[1].length === 64
  );
}

export function isEventPTag(data: any[]): data is EventPTag {
  return (
    Array.isArray(data) &&
    data[0] === EventTags.P &&
    typeof data[1] === 'string' &&
    data[1].length === 64
  );
}

export enum Nip19DataType {
  Pubkey = 'pubkey',
  Privkey = 'privkey',
  EventId = 'eventId',
}

export enum Nip19DataPrefix {
  Pubkey = 'npub',
  Privkey = 'nsec',
  EventId = 'note',
}

export function nip19Encode(data: string, type: Nip19DataType) {
  if (data.length === 0) {
    return '';
  }

  switch (type) {
    case Nip19DataType.Pubkey:
      return bech32Encode(data, Nip19DataPrefix.Pubkey);

    case Nip19DataType.Privkey:
      return bech32Encode(data, Nip19DataPrefix.Privkey);

    case Nip19DataType.EventId:
      return bech32Encode(data, Nip19DataPrefix.EventId);
    default:
      throw new Error(`unsupported type ${type}`);
  }
}

export function nip19Decode(data: string) {
  const { decoded, prefix } = bech32Decode(data);
  switch (prefix) {
    case Nip19DataPrefix.Pubkey:
      return { data: decoded, type: Nip19DataType.Pubkey };

    case Nip19DataPrefix.Privkey:
      return { data: decoded, type: Nip19DataType.Privkey };

    case Nip19DataPrefix.EventId:
      return { data: decoded, type: Nip19DataType.EventId };

    default:
      throw new Error(`unsupported prefix type ${prefix}`);
  }
}

export function newSubId(portId: number, subId: string) {
  // todo: fix the patch
  if (subId.includes(':')) return subId;

  return `${portId}:${subId}`;
}

export function getPortIdFomSubId(subId: string): number | null {
  if (!subId.includes(':')) return null;

  return +subId.split(':')[0];
}

export function randomSubId(size = 8): HexStr {
  return generateRandomBytes(size);
}

export function deserializeMetadata(content: string): EventSetMetadataContent {
  const metadata: EventSetMetadataContent = JSON.parse(content);
  return normalizeMetadata(metadata);
}

export function normalizeMetadata(
  metadata: EventSetMetadataContent,
): EventSetMetadataContent {
  metadata.name = maxStrings(metadata.name, 30);
  metadata.about = maxStrings(metadata.about, 500);
  return metadata;
}

export function encodeMsg(userId: number, msg: Utf8Str): Buffer {
  const msgBytes = utf8StrToBuffer(msg);
  const msgSize = u32ToLEBuffer(msgBytes.length);
  const id = u32ToLEBuffer(userId);
  return Buffer.concat([id, msgSize, msgBytes]);
}

export function decodeMsg(msgInfo: Buffer) {
  const userIdBuf = msgInfo.slice(0, 4);
  const msgSizeBuf = msgInfo.slice(4, 8);
  const msgBuf = msgInfo.slice(8);

  const userIdNumber = LEBufferToU32(userIdBuf);
  const msg = bufferToUtf8Str(msgBuf);
  const msgSize = LEBufferToU32(msgSizeBuf);
  return {
    userId: userIdNumber,
    msgSize,
    msg,
  };
}

export function u32ToLEBuffer(u32: number): Buffer {
  const buf = Buffer.alloc(4);
  buf.writeUInt32LE(u32);
  return buf;
}

export function LEBufferToU32(buf: Buffer): number {
  const value = buf.readUInt32LE();
  return value;
}

export function utf8StrToBuffer(msg: Utf8Str): Buffer {
  const encoder = new TextEncoder();
  const uint8array = encoder.encode(msg);
  return Buffer.from(uint8array);
}

export function bufferToUtf8Str(buf: Buffer) {
  const decoder = new TextDecoder();
  const string = decoder.decode(buf);
  return string;
}

class Queue<T> {
  private data: T[] = [];

  enqueue(item: T) {
    this.data.push(item);
  }

  dequeue(): T | undefined {
    return this.data.shift();
  }

  peek(): T | undefined {
    return this.data[0];
  }

  get length(): number {
    return this.data.length;
  }

  isEmpty(): boolean {
    return this.length === 0;
  }
}
