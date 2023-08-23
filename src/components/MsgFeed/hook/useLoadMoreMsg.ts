import { Event } from 'core/nostr/Event';
import { EventMap, Filter } from 'core/nostr/type';
import { CallWorker } from 'core/worker/caller';
import { CallRelayType } from 'core/worker/type';
import {
  onSetEventMap,
  setMaxLimitEventWithSeenMsgList,
  setEventWithSeenMsgList,
} from 'pages/helper';
import { EventWithSeen } from 'pages/type';
import { Dispatch, SetStateAction, useEffect } from 'react';
import { validateFilter } from '../util';

export function useLoadMoreMsg({
  msgFilter,
  isValidEvent,
  worker,
  msgList,
  setEventMap,
  setMsgList,
  maxMsgLength,
  loadMoreCount,
}: {
  msgFilter?: Filter;
  isValidEvent?: (event: Event) => boolean;
  worker: CallWorker | undefined;
  msgList: EventWithSeen[];
  setMsgList: Dispatch<SetStateAction<EventWithSeen[]>>;
  setEventMap: Dispatch<SetStateAction<EventMap>>;
  maxMsgLength?: number;
  loadMoreCount: number;
}) {
  useEffect(() => {
    if (!worker) return;
    if (loadMoreCount <= 1) return;
    if (!msgFilter || !validateFilter(msgFilter)) return;

    const lastMsg = msgList.at(msgList.length - 1);
    if (!lastMsg) {
      return;
    }

    const callRelay = {
      type: CallRelayType.connected,
      data: [],
    };
    const filter = { ...msgFilter, ...{ until: lastMsg.created_at } };
    worker.subFilter({ filter, callRelay }).iterating({
      cb: (event, relayUrl) => {
        onSetEventMap(event, setEventMap);

        if (isValidEvent) {
          if (!isValidEvent(event)) {
            return;
          }
        }

        if (maxMsgLength) {
          setMaxLimitEventWithSeenMsgList(
            event,
            relayUrl!,
            setMsgList,
            maxMsgLength * loadMoreCount,
          );
        } else {
          setEventWithSeenMsgList(event, relayUrl!, setMsgList);
        }
      },
    });
  }, [msgFilter, worker, loadMoreCount]);
}
