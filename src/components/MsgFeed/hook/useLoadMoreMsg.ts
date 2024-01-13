import { createQueryCacheId, queryCache } from 'core/cache/query';
import { dbQuery } from 'core/db';
import { DbEvent } from 'core/db/schema';
import { Filter, WellKnownEventKind } from 'core/nostr/type';
import { CallWorker } from 'core/worker/caller';
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useMemo,
  useState,
} from 'react';
import { mergeAndSortUniqueDbEvents } from 'utils/common';
import { validateFilter } from '../util';
import { Event } from 'core/nostr/Event';
import { useQueryCacheId } from './useQueryCacheId';

export interface LoadMoreMsgProp {
  feedId: string;
  worker: CallWorker | undefined;
  msgFilter: Filter | undefined;
  isValidEvent?: (event: Event) => boolean;
  msgList: DbEvent[];
  setMsgList: Dispatch<SetStateAction<DbEvent[]>>;
}

export function useLoadMoreMsg({
  feedId,
  worker,
  msgFilter,
  isValidEvent,
  msgList,
  setMsgList,
}: LoadMoreMsgProp) {
  const relayUrls = useMemo(
    () => worker?.relays.map(r => r.url) || [],
    [worker?.relays],
  );
  const [isLoadMore, setIsLoadMore] = useState<boolean>(false);
  const queryCacheId = useQueryCacheId({
    feedId,
    worker,
    msgFilter,
    isValidEvent,
  });
  const loadMore = useCallback(async () => {
    if (!worker) return;
    if (!msgFilter || !validateFilter(msgFilter)) return;

    setIsLoadMore(true);

    const lastMsg = msgList.at(msgList.length - 1);
    if (!lastMsg) {
      return;
    }

    const filter = { ...msgFilter, ...{ until: lastMsg.created_at } };
    worker.subFilter({ filter });

    let events = await dbQuery.matchFilterRelay(
      filter,
      relayUrls,
      isValidEvent,
    );
    events = events.map(e => {
      if (e.kind === WellKnownEventKind.community_approval) {
        const event = { ...e, ...(JSON.parse(e.content) as DbEvent) };
        return event;
      }
      return e;
    });
    events = mergeAndSortUniqueDbEvents(events, events);
    setMsgList(prev => {
      const newData = prev.concat(events);
      queryCache.set(queryCacheId, newData);
      return newData;
    });
    setIsLoadMore(false);
  }, [
    msgList,
    msgFilter,
    isValidEvent,
    relayUrls,
    worker,
    setMsgList,
    queryCacheId,
  ]);
  return { loadMore, isLoadMore };
}
