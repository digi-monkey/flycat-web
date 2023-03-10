import { useEffect, useState } from 'react';
import { Event, Filter } from 'service/api';
import { CallRelayType } from 'service/worker/type';
import { useCallWorker } from './useWorker';

export function useNotes(filter: Filter, deps: any[]) {
  const [notes, setNotes] = useState<Event[]>([]);
  const { worker, newConn } = useCallWorker();

  function handleEvent(event: Event, relayUrl?: string) {
    setNotes(oldArray => {
      if (!oldArray.map(e => e.id).includes(event.id)) {
        // do not add duplicated msg

        const newItems = [...oldArray, { ...event, ...{ seen: [relayUrl!] } }];
        // sort by timestamp
        const sortedItems = newItems.sort((a, b) =>
          a.created_at >= b.created_at ? -1 : 1,
        );
        return sortedItems;
      }

      return oldArray;
    });
  }

  useEffect(() => {
    if (newConn.length === 0) return;
    worker?.subFilter(filter, undefined, undefined, {
      type: CallRelayType.batch,
      data: newConn,
    });
  }, [worker, newConn]);

  return notes;
}
