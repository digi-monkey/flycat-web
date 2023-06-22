import { Event } from './Event';
import { Filter, RelayResponseType, EventSubReachEndResponse, EventSubResponse, EventETag, EventTags, EventPTag } from './type';

const isObject = object => object != null && typeof object === 'object';

export const isDeepEqual = (object1, object2) => {
  const objKeys1 = Object.keys(object1);
  const objKeys2 = Object.keys(object2);

  if (objKeys1.length !== objKeys2.length) return false;

  for (const key of objKeys1) {
    const value1 = object1[key];
    const value2 = object2[key];

    const isObjects = isObject(value1) && isObject(value2);

    if ((isObjects && !isDeepEqual(value1, value2)) ||
      (!isObjects && value1 !== value2)) {
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
  data: any
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
