import { HexStr, Utf8Str } from 'types';
import { RawEvent } from './RawEvent';
import { Event } from './Event';

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
  zap_request = 9734,
  zap_receipt = 9735,
  article_highlight = 9802,

  flycat_site_metadata = 10000,

  mute_list = 10000,
  pin_list = 10001,
  relay_list = 10002,
  people_list = 30000,
  bookmark_list = 30001,

  long_form = 30023,
}

export enum EventETagMarker {
  reply = 'reply',
  root = 'root',
  mention = 'mention',
}

export enum EventTags {
  E = 'e',
  P = 'p',
  D = 'd',
  T = 't',
  A = 'a',
  Z = 'zap',
  R = 'r',
}

export type LudType = 'lud06' | 'lud16';

export type EventETag = [EventTags.E, EventId, RelayUrl];
export type EventPTag = [EventTags.P, PublicKey, RelayUrl];
export type EventDTag = [EventTags.D, string];
export type EventATag = [EventTags.A, Naddr, RelayUrl]; // ["a", "<kind>:<pubkey>:<d-identifier>", "<relay url>"]

export type EventTTag = [EventTags.T, string];
export type EventZTag = [EventTags.Z, string, LudType];
export type EventRTag = [EventTags.R, string, 'read' | 'write' | '' | null];
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

export type UserMap = Map<
  PublicKey,
  EventSetMetadataContent & { created_at: number }
>;

export type EventMap = Map<EventId, Event>;

export type ContactList = { keys: PublicKey[]; created_at: number };

export interface EventPubResult {
  isSuccess: boolean;
  reason?: string;
  relayUrl: string;
}
