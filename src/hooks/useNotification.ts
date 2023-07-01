import { useEffect, useState } from 'react';
import { Event } from 'core/nostr/Event';
import { fetchSince, get } from 'core/last-notify';
import { CallRelayType } from 'core/worker/type';
import { useReadonlyMyPublicKey } from './useMyPublicKey';
import { useCallWorker } from './useWorker';
import { notifyKinds } from 'pages/notification/kinds';
import { EventId } from 'core/nostr/type';

export function useNotification() {
  const [eventIds, setEventIds] = useState<EventId[]>([]);

  const myPublicKey = useReadonlyMyPublicKey();
  const { worker, newConn } = useCallWorker();
  function handleEvent(event: Event, relayUrl?: string) {
    //if (!notifyKinds.includes(event.kind)) return;
    const lastReadTime = get();
    //if (lastReadTime && event.created_at <= lastReadTime) return;
    setEventIds(oldArray => {
      if (!oldArray.includes(event.id)) {
        // do not add duplicated msg

        const newItems = [...oldArray, event.id ];
        return newItems;
      }

      return oldArray;
    });
  }
  useEffect(() => {
    if (myPublicKey == null || myPublicKey.length === 0) return;
    if (newConn.length === 0) return;
    if (!worker || worker?.portId == null) return;

    const callRelay =
      newConn.length === 0
        ? {
            type: CallRelayType.connected,
            data: [],
          }
        : {
            type: CallRelayType.batch,
            data: newConn,
          };

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
        customId: "useNotification",
        callRelay,
      })
      .iterating({ cb: handleEvent });
  }, [newConn, myPublicKey, worker]);

  return eventIds.length > 0;
}
