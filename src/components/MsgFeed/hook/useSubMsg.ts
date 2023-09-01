import { Filter, WellKnownEventKind } from 'core/nostr/type';
import { CallWorker } from 'core/worker/caller';
import { createCallRelay } from 'core/worker/util';
import { useEffect, useState } from 'react';
import { validateFilter } from '../util';
import { Event } from 'core/nostr/Event';
import { dbQuery } from 'core/db';

export function useSubMsg({
  msgFilter,
  isValidEvent,
  worker,
}: {
  msgFilter?: Filter;
  isValidEvent?: (event: Event) => boolean;
  worker: CallWorker | undefined;
}) {
  const [intervalId, setIntervalId] = useState<number>();

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

    // sub user profiles
    if (pks.length > 0) {
      worker
        .subFilter({
          filter: {
            kinds: [WellKnownEventKind.set_metadata],
            authors: pks,
          },
          callRelay,
        })
    }
  };

  useEffect(() => {
    if(intervalId){
      clearInterval(intervalId); 
    }

    const id = setInterval(() => {
      subMsg();
    }, 5000); // Adjust the interval as needed (5000ms = 5 seconds)
    setIntervalId(id);

    return () => {
      clearInterval(intervalId); // Clear the interval when the component unmounts
    };
  }, [msgFilter, isValidEvent]); // Empty dependency array ensures the effect runs only once
}

