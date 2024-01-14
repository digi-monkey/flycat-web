import { Filter, WellKnownEventKind } from 'core/nostr/type';
import { CallWorker } from 'core/worker/caller';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { validateFilter } from '../util';
import { DbEvent } from 'core/db/schema';
import { cancelableQuery, dbQuery } from 'core/db';
import { queryCache } from 'core/cache/query';
import { mergeAndSortUniqueDbEvents } from 'utils/common';
import { Event } from 'core/nostr/Event';
import { useQueryCacheId } from './useQueryCacheId';

export interface QueryDbMsgPro {
  feedId: string;
  worker: CallWorker | undefined;
  msgFilter: Filter | undefined;
  isValidEvent?: (event: Event) => boolean;
  readFromCache?: boolean;
}

export function useQueryDbMsg({
  worker,
  msgFilter,
  isValidEvent,
  feedId,
  readFromCache = true,
}: QueryDbMsgPro) {
  const [msgList, setMsgList] = useState<DbEvent[]>([]);
  const [isQueryMsg, setIsQueryMsg] = useState<boolean>(false);
  const [isDBNoData, setIsDBNoData] = useState<boolean>(false);
  const [cancelQueryMsg, setCancelQueryMsg] = useState<() => void>();

  const relayUrls = useMemo(
    () => worker?.relays.map(r => r.url) || [],
    [worker?.relays],
  );
  const queryCacheId = useQueryCacheId({
    feedId,
    worker,
    msgFilter,
    isValidEvent,
  });

  const queryMsgFromDb = useCallback(
    async (readFromCache = true) => {
      if (relayUrls.length === 0) return;
      if (!msgFilter || !validateFilter(msgFilter)) return;
      setIsQueryMsg(true);
      setMsgList([]);

      // get from cache first
      if (readFromCache) {
        const cache = queryCache.get(queryCacheId);
        if (cache) {
          console.log('hit cache!');
          setMsgList(cache);
          setIsQueryMsg(false);
          return;
        }
      }

      const queryFn = () =>
        dbQuery.matchFilterRelay(msgFilter, relayUrls, isValidEvent);

      const { queryPromise, cancel } = cancelableQuery(
        dbQuery.tableName(),
        queryFn,
      );
      setCancelQueryMsg(prev => {
        if (typeof prev === 'function') {
          prev(); // abort last query
        }
        return cancel;
      });

      queryPromise
        .then((events: DbEvent[]) => {
          events = events.map(e => {
            if (e.kind === WellKnownEventKind.community_approval) {
              const event = { ...e, ...(JSON.parse(e.content) as DbEvent) };
              return event;
            }
            return e;
          });
          events = mergeAndSortUniqueDbEvents(events, events);
          console.log('load query: ', events.length, relayUrls, msgFilter);

          if (events.length === 0) {
            if (msgList.length === 0) {
              setIsDBNoData(true);
            }
            setIsQueryMsg(false);
            return;
          }

          // save cache
          queryCache.set(queryCacheId, events);
          setMsgList(events);
          setIsDBNoData(false);
          setIsQueryMsg(false);
        })
        .catch((error: any) => {
          console.debug('query cancel: ', error.message);
          //setIsLoadingMsg(false);
        });
    },
    [msgFilter, isValidEvent, relayUrls, queryCache, queryCacheId],
  );

  useEffect(() => {
    queryMsgFromDb(readFromCache);

    return () => {
      if (typeof cancelQueryMsg === 'function') {
        cancelQueryMsg();
      }
    };
  }, [readFromCache, queryMsgFromDb]);

  return {
    queryMsgFromDb,
    msgList,
    setMsgList,
    isQueryMsg,
    isDBNoData,
    cancelQueryMsg,
  };
}
