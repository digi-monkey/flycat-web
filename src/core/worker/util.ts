import { Event } from 'core/nostr/Event';
import { CallRelay, CallRelayType } from './type';
import { CallWorker } from './caller';
import { EventTags, PublicKey, WellKnownEventKind } from 'core/nostr/type';
import { RawEvent } from 'core/nostr/RawEvent';
import { Dispatch, SetStateAction } from 'react';

export function createCallRelay(newConn: string[]): CallRelay {
  const type =
    newConn.length > 0 ? CallRelayType.batch : CallRelayType.connected;
  return {
    type,
    data: newConn,
  };
}

export async function getContactEvent({
  worker,
  pk,
}: {
  worker: CallWorker;
  pk: PublicKey;
}) {
  worker.subContactList([pk]).iterating({
    cb: () => {
      //do nothing
    }
  });
}

export function isFollowed(
  contactEvent: Event,
  target: {
    type: 'people' | 'hashTag' | 'community';
    data: string;
  },
): boolean {
  if (target.type === 'people') {
    return (
      contactEvent.tags.filter(
        t => t[0] === EventTags.P && t[1] === target.data,
      ).length > 0
    );
  }
  if (target.type === 'hashTag') {
    return (
      contactEvent.tags.filter(
        t => t[0] === EventTags.T && t[1] === target.data,
      ).length > 0
    );
  }
  if (target.type === 'community') {
    return (
      contactEvent.tags.filter(
        t => t[0] === EventTags.A && t[1] === target.data,
      ).length > 0
    );
  }

  throw new Error('unknown target type');
}

export function createFollowContactEvent(
  contactEvent: Event,
  target: {
    type: 'people' | 'hashTag' | 'community';
    data: string;
  },
) {
  const isFollow = isFollowed(contactEvent, target);
  if (isFollow) {
    throw new Error('already followed!');
  }

  const newEvent: RawEvent = new RawEvent(
    '',
    contactEvent.kind,
    contactEvent.tags,
    contactEvent.content,
  );

  if (target.type === 'people') {
    newEvent.tags.push([EventTags.P, target.data, '']);
    return newEvent;
  }

  if (target.type === 'hashTag') {
    newEvent.tags.push([EventTags.T, target.data]);
    return newEvent;
  }

  if (target.type === 'community') {
    newEvent.tags.push([EventTags.A, target.data, '']);
    return newEvent;
  }

  throw new Error('unknown target type');
}

export function createInitialFollowContactEvent(
  target: {
    type: 'people' | 'hashTag' | 'community';
    data: string;
  },
) {
  const newEvent: RawEvent = new RawEvent(
    '',
    WellKnownEventKind.contact_list,
    undefined,
  );

  if (target.type === 'people') {
    newEvent.tags.push([EventTags.P, target.data, '']);
    return newEvent;
  }

  if (target.type === 'hashTag') {
    newEvent.tags.push([EventTags.T, target.data]);
    return newEvent;
  }

  if (target.type === 'community') {
    newEvent.tags.push([EventTags.A, target.data, '']);
    return newEvent;
  }

  throw new Error('unknown target type');
}

export function createUnFollowContactEvent(
  contactEvent: Event,
  target: {
    type: 'people' | 'hashTag' | 'community';
    data: string;
  },
) {
  const isFollow = isFollowed(contactEvent, target);
  if (!isFollow) {
    throw new Error('need follow first!');
  }

  const newEvent: RawEvent = new RawEvent(
    '',
    contactEvent.kind,
    contactEvent.tags,
    contactEvent.content,
  );

  if (target.type === 'people') {
    const tags = newEvent.tags.filter(
      t => (t[0] !== EventTags.P) || (t[0] === EventTags.P && t[1] !== target.data),
    );
    newEvent.tags = tags;
    return newEvent;
  }

  if (target.type === 'hashTag') {
    const tags = newEvent.tags.filter(
      t => (t[0] !== EventTags.T) || (t[0] === EventTags.T && t[1] !== target.data),
    );
    newEvent.tags = tags;
    return newEvent;
  }

  if (target.type === 'community') {
    const tags = newEvent.tags.filter(
      t => (t[0] !== EventTags.A) || (t[0] === EventTags.A && t[1] !== target.data),
    );
    newEvent.tags = tags;
    return newEvent;
  }

  throw new Error('unknown target type');
}
