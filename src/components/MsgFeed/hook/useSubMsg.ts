import { Filter, WellKnownEventKind } from 'core/nostr/type';
import { CallWorker } from 'core/worker/caller';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { validateFilter } from '../util';
import { Event } from 'core/nostr/Event';
import { DbEvent } from 'core/db/schema';
import { mergeAndSortUniqueDbEvents } from 'utils/common';

export function useSubMsg({
  setNewComingMsg,
  setMsgList,
  msgFilter,
  isValidEvent,
  worker,
}: {
  setMsgList: Dispatch<SetStateAction<DbEvent[]>>;
  setNewComingMsg: Dispatch<SetStateAction<DbEvent[]>>;
  msgFilter?: Filter;
  isValidEvent?: (event: Event) => boolean;
  worker: CallWorker | undefined;
}) {
  const subIntervalSeconds = 8;
  let intervalId: number | undefined;

  const subMsg = async () => {
    if (!worker) return;
    if (!msgFilter || !validateFilter(msgFilter)) return;

    const exec = async (latest: number | undefined) => {
      let since = msgFilter.since;
    if (latest) {
      if (since == null) {
        since = latest;
      } else {
        if (latest > since) {
          since = latest;
        }
      }
    } else {
      if (since == null) {
        since = 0;
      }
    }
    const filter = { ...msgFilter, since };

    const pks: string[] = [];
    let events: Event[] = [];

    console.debug('start sub msg..', filter, isValidEvent, typeof isValidEvent);
    const dataStream = worker.subFilter({ filter }).getIterator();
    for await (const data of dataStream) {
      const event = data.event;
      if (isValidEvent) {
        if (!isValidEvent(event)) {
          continue;
        }
      }
      if (latest) {
        if (event.created_at <= latest) {
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
    console.log('sub diff: ', events, events.length, filter);
    setNewComingMsg(prev => mergeAndSortUniqueDbEvents(events as any, prev));

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
    }

    setMsgList(prev => {
      const latest = prev[0]?.created_at;
      exec(latest);
      return prev;
    })
  };

  const clearProcess = () => {
    if (intervalId) {
      clearInterval(intervalId);
      console.debug('clear interval id', intervalId);
      intervalId = undefined;
    }
  };

  const startProcess = (seconds: number) => {
    if (intervalId == null) {
      try {
        // call first and then get iteration
        subMsg();
        const id = setInterval(() => {
          subMsg();
        }, seconds);
        intervalId = id;
        console.debug('add new interval id', id);
      } catch (error: any) {
        console.debug('add failed, ', error.message);
      }
    }else{
      console.debug('use same interval id', intervalId);
    }
  };

  useEffect(() => {
    clearProcess();
    startProcess(subIntervalSeconds * 1000);

    return () => {
      console.debug('component destroyed..');
      clearProcess();
    };
  }, [msgFilter]);
}
