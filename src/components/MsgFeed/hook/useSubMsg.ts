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
import { validateFilter } from '../util';
import { Event } from 'core/nostr/Event';

export function useSubMsg({
  msgFilter,
  isValidEvent,
  setIsRefreshing,
  worker,
  newConn,
  setMsgList,
  setEventMap,
  maxMsgLength,
}: {
  msgFilter: Filter;
  isValidEvent?: (event: Event) => boolean;
  setIsRefreshing:  Dispatch<SetStateAction<boolean>>; 
  worker: CallWorker | undefined;
  newConn: string[];
  setMsgList: Dispatch<SetStateAction<EventWithSeen[]>>;
  setEventMap: Dispatch<SetStateAction<EventMap>>;
  maxMsgLength?: number;
}) {
  const subMsg = async () => {
    if (!worker) return;
    if (!validateFilter(msgFilter)) return;
    setIsRefreshing(true);
    console.log("start sub msg..", newConn, msgFilter);
    const callRelay = createCallRelay(newConn);
    const dataStream = worker
      .subFilter({ filter: msgFilter, callRelay })
      .getIterator();
    for await (const data of dataStream) {
      const event = data.event;
      const relayUrl = data.relayUrl!;
      onSetEventMap(event, setEventMap);

      if (isValidEvent) {
        if (!isValidEvent(event)) {
          continue;
        }
      }

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
    console.log("finished sub msg!");
    setIsRefreshing(false);
  };

  useEffect(() => {
    subMsg();
  }, [worker, newConn]);
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
