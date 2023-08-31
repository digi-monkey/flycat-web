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

export function useSubMsg({
  msgFilter,
  isValidEvent,
  setIsRefreshing,
  worker,
  newConn,
  setUserMap,
}: {
  msgFilter?: Filter;
  isValidEvent?: (event: Event) => boolean;
  setIsRefreshing: Dispatch<SetStateAction<boolean>>;
  worker: CallWorker | undefined;
  newConn: string[];
  setUserMap: Dispatch<SetStateAction<UserMap>>;
}) {
  const subMsg = async () => {
    if (!worker) return;
    if (!msgFilter || !validateFilter(msgFilter)) return;
    setIsRefreshing(true);
    const pks: string[] = [];

    const callRelay = createCallRelay(newConn);
    console.debug(
      'start sub msg..',
      newConn,
      msgFilter,
      callRelay,
      isValidEvent,
      typeof isValidEvent,
    );
    const dataStream = worker
      .subFilter({ filter: msgFilter, callRelay })
      .getIterator();
    for await (const data of dataStream) {
      const event = data.event;
      if (isValidEvent) {
        if (!isValidEvent(event)) {
          continue;
        }
      }

      if (!pks.includes(event.pubkey)) {
        pks.push(event.pubkey);
      }
    }
    dataStream.unsubscribe();
    console.debug('finished sub msg!');
    setIsRefreshing(false);

    // sub user profiles
    if (pks.length > 0) {
      worker
        ?.subFilter({
          filter: {
            kinds: [WellKnownEventKind.set_metadata],
            authors: pks,
          },
          callRelay,
        })
        .iterating({
          cb: event => {
            onSetUserMap(event, setUserMap);
          },
        });
    }
  };

  useEffect(() => {
    subMsg();
  }, [worker, newConn, msgFilter]);
}

export async function subMsgAsync({
  msgFilter,
  worker,
}: {
  msgFilter?: Filter;
  worker: CallWorker | undefined;
}) {
  if (!worker) return;
  if (!msgFilter || !validateFilter(msgFilter)) return;

  const callRelay = createCallRelay([]);
  worker
    .subFilter({ filter: msgFilter, callRelay })
  return;
}
