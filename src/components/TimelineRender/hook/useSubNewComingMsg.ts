import { Filter, WellKnownEventKind } from 'core/nostr/type';
import { CallWorker } from 'core/worker/caller';
import { useCallback, useEffect, useState } from 'react';
import { useInterval } from 'usehooks-ts';
import { validateFilter } from '../util';
import { Event } from 'core/nostr/Event';
import { mergeAndSortUniqueDbEvents } from 'utils/common';
import { DbEvent } from 'core/db/schema';

export const SUB_NEW_MSG_INTERVAL = 2000; // milsecs

export interface SubNewComingMsgProp {
  worker: CallWorker | undefined;
  msgFilter: Filter | undefined;
  disabled: boolean;
  isValidEvent?: (event: Event) => boolean;
  latestTimestamp?: number;
}

export function useSubNewComingMsg({
  worker,
  msgFilter,
  disabled,
  isValidEvent,
  latestTimestamp,
}: SubNewComingMsgProp) {
  const [newComingMsg, setNewComingMsg] = useState<DbEvent[]>([]);
  const [isSubNewComingMsg, setIsSubNewComingMsg] = useState<boolean>(false);

  const subNewComingMsg = useCallback(async () => {
    if (!worker) return;
    if (!msgFilter || !validateFilter(msgFilter)) return;
    if (disabled) return;

    const request = async (latest: number) => {
      let since = msgFilter.since;
      if (since == null) {
        since = latest;
      } else {
        if (latest > since) {
          since = latest;
        }
      }
      const filter = { ...msgFilter, since };

      const pks: string[] = [];
      let events: Event[] = [];

      console.debug('sub new coming msg..', filter, isValidEvent);
      const dataStream = worker.subFilter({ filter }).getIterator();
      for await (const data of dataStream) {
        const event = data.event;
        if (latest) {
          if (event.created_at <= latest) {
            continue;
          }
        }
        if (typeof isValidEvent === 'function') {
          try {
            const isValid = isValidEvent(event);
            if (!isValid) {
              continue;
            }
          } catch (error: any) {
            console.debug(error.message);
            continue;
          }
        }

        events.push(event);
        if (!pks.includes(event.pubkey)) {
          pks.push(event.pubkey);
        }
      }

      events = events
        .filter(e => {
          if (e.kind === WellKnownEventKind.community_approval) {
            try {
              const targetEvent = JSON.parse(e.content);
              if (latest && targetEvent.created_at <= latest) {
                return false;
              }
            } catch (error) {
              return false;
            }
          }
          return true;
        })
        .map(e => {
          if (e.kind === WellKnownEventKind.community_approval) {
            const event = { ...e, ...(JSON.parse(e.content) as DbEvent) };
            return event;
          }
          return e;
        });
      events = mergeAndSortUniqueDbEvents(events as any, events as any);
      console.log('sub diff: ', events.length, filter.since);
      dataStream.unsubscribe();
      console.debug('finished sub msg!');

      // sub user profiles
      if (pks.length > 0) {
        worker.subFilter({
          filter: {
            kinds: [WellKnownEventKind.set_metadata],
            authors: pks,
          },
        });
      }

      if (events.length > 0) {
        setNewComingMsg(prev =>
          mergeAndSortUniqueDbEvents(events as any, prev),
        );
      }
    };

    const latest = newComingMsg[0]?.created_at || latestTimestamp || 0;
    setIsSubNewComingMsg(true);
    await request(latest);
    setIsSubNewComingMsg(false);
  }, [
    worker,
    disabled,
    msgFilter,
    newComingMsg,
    latestTimestamp,
    isValidEvent,
    setIsSubNewComingMsg,
    mergeAndSortUniqueDbEvents,
    setNewComingMsg,
  ]);

  useInterval(subNewComingMsg, SUB_NEW_MSG_INTERVAL);

  return { newComingMsg, isSubNewComingMsg, setNewComingMsg };
}
