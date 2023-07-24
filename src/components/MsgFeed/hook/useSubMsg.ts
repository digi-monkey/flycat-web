import { EventMap, Filter } from 'core/nostr/type';
import { CallWorker } from 'core/worker/caller';
import { createCallRelay } from 'core/worker/util';
import { EventWithSeen } from 'pages/type';
import { Dispatch, SetStateAction, useEffect } from 'react';
import {
  onSetEventMap,
  setEventWithSeenMsgList,
  setMaxLimitEventWithSeenMsgList,
} from 'pages/helper';

export function useSubMsg({
  msgFilter,
  worker,
  newConn,
  setMsgList,
  setEventMap,
  maxMsgLength,
}: {
  msgFilter: Filter;
  worker: CallWorker | undefined;
  newConn: string[];
  setMsgList: Dispatch<SetStateAction<EventWithSeen[]>>;
  setEventMap: Dispatch<SetStateAction<EventMap>>;
  maxMsgLength?: number;
}) {
  useEffect(() => {
    if (!worker) return;

    const callRelay = createCallRelay(newConn);
    worker.subFilter({ filter: msgFilter, callRelay }).iterating({
      cb: (event, relayUrl) => {
        onSetEventMap(event, setEventMap);

        if (maxMsgLength) {
          setMaxLimitEventWithSeenMsgList(
            event,
            relayUrl!,
            setMsgList,
            maxMsgLength,
          );
        } else {
          setEventWithSeenMsgList(event, relayUrl!, setMsgList);
        }
      },
    });
  }, [msgFilter, worker, newConn]);
}

export async function subMsgAsync({
  msgFilter,
  worker,
  setMsgList,
  setEventMap,
  maxMsgLength,
}: {
  msgFilter: Filter;
  worker: CallWorker | undefined;
  setMsgList: Dispatch<SetStateAction<EventWithSeen[]>>;
  setEventMap: Dispatch<SetStateAction<EventMap>>;
  maxMsgLength?: number;
}) {
  if (!worker) return;

  const callRelay = createCallRelay([]);
  const dataStream = worker
    .subFilter({ filter: msgFilter, callRelay })
    .getIterator();
  for await (const data of dataStream) {
    const event = data.event;
    const relayUrl = data.relayUrl!;
    onSetEventMap(event, setEventMap);

    if (maxMsgLength) {
      setMaxLimitEventWithSeenMsgList(
        event,
        relayUrl!,
        setMsgList,
        maxMsgLength,
      );
    } else {
      setEventWithSeenMsgList(event, relayUrl!, setMsgList);
    }
  }

  dataStream.unsubscribe();
  return;
}
