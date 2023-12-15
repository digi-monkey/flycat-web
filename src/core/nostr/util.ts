import { EventWithSeen } from 'pages/type';
import { Event } from './Event';
import {
  Filter,
  RelayResponseType,
  EventSubReachEndResponse,
  EventSubResponse,
  EventETag,
  EventTags,
  EventPTag,
  EventId,
  EventATag,
  Naddr,
  WellKnownEventKind,
} from './type';

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
    data[0] === RelayResponseType.SubEvent &&
    typeof data[1] === 'string' &&
    isEvent(data[2])
  );
}

export function isEventSubEoseResponse(
  data: any,
): data is EventSubReachEndResponse {
  return (
    Array.isArray(data) &&
    data[0] === RelayResponseType.SubReachEnd &&
    typeof data[1] === 'string'
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

export function isEventATag(data: any[]): data is EventATag {
  return (
    Array.isArray(data) &&
    data[0] === EventTags.A &&
    typeof data[1] === 'string'
  );
}

export const getLastPubKeyFromPTags = (tags: any[]) => {
  const pks = tags.filter(t => isEventPTag(t)).map(t => t[1]);
  if (pks.length > 0) {
    return pks[pks.length - 1] as string;
  } else {
    return null;
  }
};

export const getLastEventIdFromETags = (tags: any[]) => {
  const ids = tags.filter(t => isEventETag(t)).map(t => t[1]);
  if (ids.length > 0) {
    return ids[ids.length - 1] as string;
  } else {
    return null;
  }
};

export const getEventIdsFromETags = (tags: any[]) =>
  tags.filter(t => isEventETag(t)).map(t => t[1] as EventId);

export const getEventAddrFromATags = (tags: any[]) =>
  tags.filter(t => isEventATag(t)).map(t => t[1] as Naddr);

export const getEventDTagId = (tags: any[]) =>
  tags.filter(t => t[0] === EventTags.D).map(t => t[1] as string | null)[0];

export function toUnSeenEvent(event: EventWithSeen): Event {
  return {
    id: event.id,
    kind: event.kind,
    content: event.content,
    created_at: event.created_at,
    pubkey: event.pubkey,
    sig: event.sig,
    tags: event.tags,
  };
}

export function toSeenEvent(event: Event, relays: string[]): EventWithSeen {
  return {
    id: event.id,
    kind: event.kind,
    content: event.content,
    created_at: event.created_at,
    pubkey: event.pubkey,
    sig: event.sig,
    tags: event.tags,
    seen: relays,
  };
}

export function kindToReadable(kind: number) {
  switch (kind) {
    case WellKnownEventKind.bookmark_list:
      return 'Bookmarks';

    case WellKnownEventKind.article_highlight:
      return 'Highlight';

    case WellKnownEventKind.community_approval:
      return 'Community-Approve';

    case WellKnownEventKind.community_metadata:
      return 'Community-Metadata';

    case WellKnownEventKind.contact_list:
      return 'Contacts';

    case WellKnownEventKind.long_form:
      return 'Articles';

    case WellKnownEventKind.like:
      return 'Likes';

    case WellKnownEventKind.reposts:
      return 'Reposts';

    case WellKnownEventKind.set_metadata:
      return 'Profiles';

    case WellKnownEventKind.text_note:
      return 'Short-Notes';

    case WellKnownEventKind.relay_list:
      return 'Relay-List';

    default:
      return 'Kind-' + kind;
  }
}
