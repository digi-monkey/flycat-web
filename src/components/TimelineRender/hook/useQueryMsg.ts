import { Filter, WellKnownEventKind } from 'core/nostr/type';
import { CallWorker } from 'core/worker/caller';
import { useCallback, useMemo, useState } from 'react';
import { validateFilter } from '../util';
import { DbEvent } from 'core/db/schema';
import { cancelableQuery, dbQuery } from 'core/db';
import { mergeAndSortUniqueDbEvents } from 'utils/common';
import { Event } from 'core/nostr/Event';

export interface QueryMsgPro {
  filter?: Filter;
  isValidEvent?: (event: Event) => boolean;
  worker?: CallWorker;
}

export function useQueryMsg() {
  const [isQueryMsg, setIsQueryMsg] = useState<boolean>(false);
  const [cancelQueryMsg, setCancelQueryMsg] = useState<() => void>();

  const subMsg = useCallback(
    async ({
      filter,
      isValidEvent,
      worker,
    }: {
      filter: Filter;
      isValidEvent?: (event: Event) => boolean;
      worker: CallWorker;
    }) => {
      let events: Event[] = [];

      console.debug('sub new coming msg..', filter, isValidEvent);
      const dataStream = worker.subFilter({ filter }).getIterator();
      for await (const data of dataStream) {
        const event = data.event;
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
      }

      events = events
        .filter(e => {
          if (e.kind === WellKnownEventKind.community_approval) {
            try {
              const targetEvent = JSON.parse(e.content);
              if (filter.since && targetEvent.created_at <= filter.since) {
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
      return events;
    },
    [],
  );

  // query msg from db first, if not found, subscribe from relays.
  // since local db query can takes a lot of time(if db is huge),
  // the cancelQueryMsg is a way to cancel the current db querying
  const queryMsg = useCallback(
    ({ filter, isValidEvent, worker }: QueryMsgPro) => {
      return new Promise(
        (
          resolve: (value: DbEvent[]) => void,
          _reject: (error: Error) => void,
        ) => {
          const emptyEvents: DbEvent[] = [];
          const relayUrls = worker?.relays.map(r => r.url) || [];
          console.log('query: ', filter, worker, isValidEvent);
          //if (isQueryMsg) return resolve(emptyEvents);
          if (!worker) return resolve(emptyEvents);
          if (relayUrls.length === 0) return resolve(emptyEvents);
          if (!filter || !validateFilter(filter)) return resolve(emptyEvents);

          const queryFn = () =>
            dbQuery.matchFilterRelay(filter, relayUrls, isValidEvent);

          const { queryPromise, cancel } = cancelableQuery(
            dbQuery.tableName(),
            queryFn,
          );

          setIsQueryMsg(true);
          setCancelQueryMsg(prev => {
            if (typeof prev === 'function') {
              prev(); // auto abort last query
            }
            return cancel;
          });
          queryPromise
            .then(async (events: DbEvent[]) => {
              if (events.length === 0) {
                events = (await subMsg({
                  filter,
                  isValidEvent,
                  worker,
                })) as DbEvent[]; // todo: map Event to DbEvent
              }

              events = events.map(e => {
                if (e.kind === WellKnownEventKind.community_approval) {
                  const event = { ...e, ...(JSON.parse(e.content) as DbEvent) };
                  return event;
                }
                return e;
              });
              events = mergeAndSortUniqueDbEvents(events, events);
              console.log('load query: ', events.length, relayUrls, filter);
              setIsQueryMsg(false);
              return resolve(events);
            })
            .catch((error: any) => {
              setIsQueryMsg(false);
              console.debug('query error: ', error.message);
              return resolve(emptyEvents);
            });
        },
      );
    },
    [subMsg],
  );

  return { queryMsg, isQueryMsg, cancelQueryMsg };
}
