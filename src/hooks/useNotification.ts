import { useEffect, useState } from 'react';
import { Event } from 'core/nostr/Event';
import { fetchSince, get } from 'core/last-notify';
import { useReadonlyMyPublicKey } from './useMyPublicKey';
import { useCallWorker } from './useWorker';
import { notifyKinds } from 'pages/notification/kinds';
import { EventId, EventTags, Naddr, WellKnownEventKind } from 'core/nostr/type';
import { Nip172 } from 'core/nip/172';
import { isValidPublicKey } from 'utils/validator';
import { dbQuery } from 'core/db';

export function useNotification() {
  const [eventIds, setEventIds] = useState<EventId[]>([]);
  const [commAddrs, setCommAddrs] = useState<Map<EventId, Naddr>>(new Map());
  const [requestApproveMsgList, setRequestApproveMsgList] = useState<Event[]>(
    [],
  );

  const { worker } = useCallWorker();
  const myPublicKey = useReadonlyMyPublicKey();
  
  const handleNotifyEvent = (event: Event) => {
    const lastReadTime = get();
    if (!notifyKinds.includes(event.kind)) return;
    if (lastReadTime && event.created_at <= lastReadTime) return;
    if (myPublicKey === event.pubkey) return;

    setEventIds(oldArray => {
      if (!oldArray.includes(event.id)) {
        // do not add duplicated msg

        const newItems = [...oldArray, event.id];
        return newItems;
      }

      return oldArray;
    });
  };
  const handleCommEvent = (event: Event) => {
    if (event.kind !== WellKnownEventKind.community_metadata) return;
    setCommAddrs(prev => {
      const newMap = new Map(prev);
      newMap.set(
        event.id,
        Nip172.communityAddr({
          identifier: event.tags
            .filter(t => t[0] === EventTags.D)
            .map(t => t[1])[0]!,
          author: event.pubkey,
        }),
      );
      return newMap;
    });
  };
  const handleCommApproveReqEvent = (event: Event) => {
    if (event.tags.filter(t => Nip172.isCommunityATag(t)).length === 0) return;

    setRequestApproveMsgList(oldArray => {
      if (!oldArray.map(e => e.id).includes(event.id)) {
        // do not add duplicated msg

        const newItems = [...oldArray, event];
        // sort by timestamp
        const sortedItems = newItems.sort((a, b) =>
          a.created_at >= b.created_at ? -1 : 1,
        );
        return sortedItems;
      }

      return oldArray;
    });
  };

  useEffect(() => {
    if (!isValidPublicKey(myPublicKey)) return;
    if (!worker || worker?.portId == null) return;

    const lastReadTime = get() || fetchSince;
    const since = lastReadTime + 1; // exclude the last read msg itself

    const filter = {
      '#p': [myPublicKey],
      kinds: notifyKinds,
      since,
      limit: 1, // reduce data since we are only need to know true or false
    };
    const commFilter = {
      '#p': [myPublicKey],
      kinds: [WellKnownEventKind.community_metadata],
    };

    dbQuery.matchFilterRelay(filter, []).then(events => {
      if (events.length > 0) {
        handleNotifyEvent(events[0]);
      } else {
        worker.subFilter({
          filter,
          customId: 'useNotification',
        });
      }
    });
    dbQuery.matchFilterRelay(commFilter, []).then(events => {
      if (events.length > 0) {
        events.every(handleCommEvent);
      } else {
        worker.subFilter({
          filter: commFilter,
        });
      }
    });
  }, [myPublicKey]);

  useEffect(() => {
    const lastReadTime = get() || fetchSince;
    const since = lastReadTime + 1; // exclude the last read msg itself
    const addrs = Array.from(commAddrs.values());

    if (addrs.length > 0) {
      const commApproveReqFilter = {
        '#a': addrs,
        kinds: [WellKnownEventKind.text_note, WellKnownEventKind.long_form],
        since,
        limit: 1, // reduce data since we are only need to know true or false
      };
      dbQuery.matchFilterRelay(commApproveReqFilter, []).then(events => {
        if (events.length > 0) {
          events.every(handleCommApproveReqEvent);
        } else {
          worker?.subFilter({
            filter: commApproveReqFilter,
          });
        }
      });
    }
  }, [commAddrs.size]);

  return eventIds.length + requestApproveMsgList.length > 0;
}
