import { Filter, WellKnownEventKind } from 'core/nostr/type';
import { CallWorker } from 'core/worker/caller';
import { createCallRelay } from 'core/worker/util';
import { useEffect } from 'react';
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
  const subIntervalSeconds = 8;
  let intervalId: number | undefined;

  const subMsg = async () => {
    if (!worker) return;
    if (!msgFilter || !validateFilter(msgFilter)) return;

    let since = msgFilter.since;

    const relayUrls = worker.relays.map(r => r.url) || [];
    const events = await dbQuery.matchFilterRelay(msgFilter, relayUrls, isValidEvent);
    if(events.length > 0){
      if(since == null){
        since = events[0].created_at;
      }else{
        if(since > events[0].created_at){
          since = events[0].created_at; 
        }
      }
    }else{
      if(since == null){
        since = 0;
      }
    }
    const filter = {...msgFilter, since};

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

  const clearProcess = () => {
    if(intervalId){
      clearInterval(intervalId);
      console.debug("clear interval id", intervalId);
      intervalId = undefined;
    }
  }

  const startProcess = (seconds: number) => {
    if(intervalId == null){
      try {
        // call first and then get iteration
        subMsg();
        const id = setInterval(() => {
          subMsg();
        }, seconds);
        intervalId = id;
        console.debug("add new interval id", id);
      } catch (error: any) {
        console.debug("add failed, ", error.message);
      }
    }
  }

  useEffect(() => {
    clearProcess(); 
    startProcess(subIntervalSeconds * 1000);

    return () => {
      console.debug("component destroyed..");
      clearProcess();
    };
  }, [msgFilter]);
}

