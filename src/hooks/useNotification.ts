import { useEffect, useState } from 'react';
import { Event } from 'core/nostr/Event';
import { fetchSince, get } from 'core/last-notify';
import { useReadonlyMyPublicKey } from './useMyPublicKey';
import { useCallWorker } from './useWorker';
import { notifyKinds } from 'pages/notification/kinds';
import { EventId, EventTags, Naddr, WellKnownEventKind } from 'core/nostr/type';
import { createCallRelay } from 'core/worker/util';
import { Nip172 } from 'core/nip/172';

export function useNotification() {
  const [eventIds, setEventIds] = useState<EventId[]>([]);
  const [commAddrs, setCommAddrs] = useState<Map<EventId, Naddr>>(new Map());
  const [requestApproveMsgList, setRequestApproveMsgList] = useState<Event[]>(
    [],
  );

  const myPublicKey = useReadonlyMyPublicKey();
  const { worker, newConn } = useCallWorker();
  function handleEvent(event: Event, relayUrl?: string) {
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
  }
  useEffect(() => {
    if (myPublicKey == null || myPublicKey.length === 0) return;
    if (newConn.length === 0) return;
    if (!worker || worker?.portId == null) return;

    const callRelay = createCallRelay(newConn);

    const lastReadTime = get() || fetchSince;
    const since = lastReadTime + 1; // exclude the last read msg itself
    worker
      .subFilter({
        filter: {
          '#p': [myPublicKey],
          kinds: notifyKinds,
          since,
          limit: 1, // reduce data since we are only need to know true or false
        },
        customId: 'useNotification',
        callRelay,
      })
      .iterating({ cb: handleEvent });

    worker
      .subFilter({
        filter: {
          '#p': [myPublicKey],
          kinds: [WellKnownEventKind.community_metadata],
        },
      })
      .iterating({
        cb: event => {
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
        },
      });
  }, [newConn, myPublicKey, worker]);

  useEffect(() => {
    if (!worker) return;

    const lastReadTime = get() || fetchSince;
    const since = lastReadTime + 1; // exclude the last read msg itself

    const addrs = Array.from(commAddrs.values());
    if (addrs.length > 0) {
      worker
        .subFilter({
          filter: {
            '#a': addrs,
            kinds: [WellKnownEventKind.text_note, WellKnownEventKind.long_form],
            since,
          },
        })
        .iterating({
          cb: (event, relayUrl) => {
            //if(event.pubkey === myPublicKey)return;
            if (event.tags.filter(t => Nip172.isCommunityATag(t)).length === 0)
              return;

            setRequestApproveMsgList(oldArray => {
              if (!oldArray.map(e => e.id).includes(event.id)) {
                // do not add duplicated msg

                const newItems = [
                  ...oldArray,
                  { ...event, ...{ seen: [relayUrl!] } },
                ];
                // sort by timestamp
                const sortedItems = newItems.sort((a, b) =>
                  a.created_at >= b.created_at ? -1 : 1,
                );
                return sortedItems;
              }

              return oldArray;
            });
          },
        });
    }
  }, [commAddrs.size, worker]);

  return eventIds.length + requestApproveMsgList.length > 0;
}
