import { Filter, WellKnownEventKind } from 'core/nostr/type';
import { CallWorker } from 'core/worker/caller';
import { createCallRelay } from 'core/worker/util';
import { Dispatch, SetStateAction, useEffect } from 'react';
import { validateFilter } from '../util';
import { Event } from 'core/nostr/Event';
import { dbQuery } from 'core/db';

export function useSubMsg({
  msgFilter,
  isValidEvent,
  setIsRefreshing,
  worker,
  newConn,
}: {
  msgFilter?: Filter;
  isValidEvent?: (event: Event) => boolean;
  setIsRefreshing: Dispatch<SetStateAction<boolean>>;
  worker: CallWorker | undefined;
  newConn: string[];
}) {
  const subMsg = async () => {
    if (!worker) return;
    if (!msgFilter || !validateFilter(msgFilter)) return;

    let since = msgFilter.since;
    let filter = msgFilter;

    const relayUrls = worker.relays.map(r => r.url) || [];
    let events = await dbQuery.matchFilterRelay(msgFilter, relayUrls);
    if(isValidEvent){
      events = events.filter(e => isValidEvent(e));
    }
    if(events.length > 0){
      if(!since){
        since = events[0].created_at;
      }else{
        if(since > events[0].created_at){
          since = events[0].created_at; 
        }
      }
    }
    filter = {...msgFilter, since};

    setIsRefreshing(true);
    const pks: string[] = [];

    const callRelay = createCallRelay([]);
    console.debug(
      'start sub msg..',
      filter,
      callRelay,
      isValidEvent,
      typeof isValidEvent,
    );
    const dataStream = worker
      .subFilter({ filter, callRelay })
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
    }
  };

  useEffect(() => {
    const intervalId = setInterval(() => {
      subMsg();
    }, 5000); // Adjust the interval as needed (5000ms = 5 seconds)

    return () => {
      clearInterval(intervalId); // Clear the interval when the component unmounts
    };
  }, []); // Empty dependency array ensures the effect runs only once
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
