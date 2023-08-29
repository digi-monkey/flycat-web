import { EventMap, Filter, UserMap, WellKnownEventKind } from 'core/nostr/type';
import { CallWorker } from 'core/worker/caller';
import { createCallRelay } from 'core/worker/util';
import { EventWithSeen } from 'pages/type';
import { Dispatch, SetStateAction, useEffect } from 'react';
import {
  onSetEventMap,
  onSetUserMap,
  setEventWithSeenMsgList,
  setMaxLimitEventWithSeenMsgList,
} from 'pages/helper';
import { validateFilter } from '../util';
import { Event } from 'core/nostr/Event';

export function useLoadMsgFromDb({
  msgFilter,
  isValidEvent,
  setIsRefreshing,
  worker,
  setMsgList,
  setUserMap,
  setEventMap,
  maxMsgLength,
}: {
  msgFilter?: Filter;
  isValidEvent?: (event: Event) => boolean;
  setIsRefreshing: Dispatch<SetStateAction<boolean>>;
  worker: CallWorker | undefined;
  setMsgList: Dispatch<SetStateAction<EventWithSeen[]>>;
  setUserMap: Dispatch<SetStateAction<UserMap>>;
  setEventMap: Dispatch<SetStateAction<EventMap>>;
  maxMsgLength?: number;
}) {
  useEffect(() => {
    const loadMsg = async () => {
      if (!worker || !worker.relayGroupId) return;
      if (!msgFilter || !validateFilter(msgFilter)) return;
      setIsRefreshing(true);
      const pks: string[] = [];

      console.debug(
        'start load msg from db..',
        msgFilter,
        isValidEvent,
        typeof isValidEvent,
      );
      const relays = worker.relays.map(f => f.url);
      const events = await worker
        .queryFilterFromDb({ filter: msgFilter, relays });

      for (const event of events) {
        onSetEventMap(event, setEventMap);
        if (!pks.includes(event.pubkey)) {
          pks.push(event.pubkey);
        }
        for (const relay of event.seen) {
          if (maxMsgLength) {
            setMaxLimitEventWithSeenMsgList(event, relay, setMsgList, maxMsgLength);
          } else {
            setEventWithSeenMsgList(event, relay, setMsgList);
          }
        }
      }
      console.debug('finished load msg!');
      setIsRefreshing(false);

      // sub user profiles
      if (pks.length > 0) {
        const events = await worker
          ?.queryFilterFromDb({
            filter: {
              kinds: [WellKnownEventKind.set_metadata],
              authors: pks,
            },
            relays,
          });
        for (const event of events) {
          onSetUserMap(event, setUserMap);
        }
      }
    };
    loadMsg();
  }, [worker?.relayGroupId, worker, msgFilter]);
}
