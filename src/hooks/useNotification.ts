import React, { useEffect, useState } from 'react';
import {
  EventSubResponse,
  isEventSubResponse,
  Event,
  WellKnownEventKind,
} from 'service/api';
import { get } from 'service/last-notify';
import { CallRelayType } from 'service/worker/type';
import { useReadonlyMyPublicKey } from './useMyPublicKey';
import { useCallWorker } from './useWorker';

export function useNotification() {
  const [notes, setNotes] = useState<Event[]>([]);

  const myPublicKey = useReadonlyMyPublicKey();
  const { worker, newConn } = useCallWorker({
    onMsgHandler,
    updateWorkerMsgListenerDeps: [myPublicKey],
  });
  function onMsgHandler(nostrData: any, relayUrl?: string) {
    const msg = JSON.parse(nostrData);
    if (isEventSubResponse(msg)) {
      const event = (msg as EventSubResponse)[2];
      if (
        event.kind !== WellKnownEventKind.like &&
        event.kind !== WellKnownEventKind.text_note
      )
        return;
      const lastReadTime = get();
      if (event.created_at <= lastReadTime) return;

      setNotes(oldArray => {
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
    }
  }
  useEffect(() => {
    if (myPublicKey == null || myPublicKey.length === 0) return;
    if (newConn.length === 0) return;
    if (worker?.portId == null) return;

    const lastReadTime = get();
    const since = lastReadTime + 1; // exclude the last read msg itself
    worker?.subMsgByPTags({
      publicKeys: [myPublicKey],
      since,
      callRelay: {
        type: CallRelayType.batch,
        data: newConn,
      },
      customId: 'useNotification',
    });
  }, [newConn, myPublicKey]);

  return notes.length;
}
