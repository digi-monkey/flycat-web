import { CallWorker } from 'core/worker/caller';
import { QueryMsgPro, useQueryMsg } from './useQueryMsg';
import { Filter } from 'core/nostr/type';
import { Event } from 'core/nostr/Event';
import { useCallback, useMemo, useState } from 'react';
import { validateFilter } from '../util';
import { useInterval } from 'usehooks-ts';
import { useInfiniteQuery } from '@tanstack/react-query';
import { cloneDeep } from 'lodash-es';
import { createQueryCacheId } from 'core/cache/query';
import { useLastScroll } from './useLastScroll';

const SUB_NEW_MSG_INTERVAL = 8000;

export interface TimelineMsgPro {
  feedId: string;
  filter?: Filter;
  isValidEvent?: (event: Event) => boolean;
  worker?: CallWorker;
}

export function useTimelineMsg({
  feedId,
  worker,
  filter,
  isValidEvent,
}: TimelineMsgPro) {
  const [latestCursor, setLatestCursor] = useState<number>(
    Math.round(Date.now() / 1000),
  );
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);
  const { queryMsg, cancelQueryMsg } = useQueryMsg();
  const [isEnable, setIsEnable] = useState(true);

  const relayUrls = useMemo(
    () => worker?.relays.map(r => r.url) || [],
    [worker?.relays],
  );
  const initialPageParam: QueryMsgPro = useMemo(() => {
    console.log('query: initialPageParam', filter, worker?.relays);
    return { filter, isValidEvent, worker };
  }, [filter, isValidEvent, worker]);

  const fetch = useCallback(
    async ({ pageParam }) => {
      const { filter, isValidEvent, worker } = pageParam;
      return await queryMsg({ filter, isValidEvent, worker });
    },
    [queryMsg],
  );

  const {
    data,
    error,
    fetchNextPage,
    fetchPreviousPage,
    hasNextPage,
    hasPreviousPage,
    isFetching,
    isFetchingNextPage,
    isFetchingPreviousPage,
    status,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['timeline', feedId, relayUrls, filter, isValidEvent],
    queryFn: fetch,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
    //initialData: keepPreviousData,
    initialPageParam: initialPageParam,
    getNextPageParam: (lastPage, _pages) => {
      if (lastPage.length === 0) return undefined;
      if (!filter || !validateFilter(filter)) return undefined;
      const msgFilter = cloneDeep(filter);
      const oldestTimestamp = lastPage[lastPage.length - 1].created_at;

      let until = msgFilter.until;
      if (until == null) {
        until = oldestTimestamp;
      } else {
        if (oldestTimestamp < until) {
          until = oldestTimestamp;
        }
      }

      const oldestUntilFilter: Filter = { ...msgFilter, until };
      return { isValidEvent, worker, filter: oldestUntilFilter };
    },
    getPreviousPageParam: (firstPage, _pages) => {
      //console.log("query: getPreviousPageParam")
      if (firstPage.length === 0) return undefined;
      if (!filter || !validateFilter(filter)) return undefined;

      const msgFilter = cloneDeep(filter);
      const latestTimestamp = firstPage[0].created_at + 1;
      let since = msgFilter.since;
      if (since == null) {
        since = latestTimestamp;
      } else {
        if (latestTimestamp > since) {
          since = latestTimestamp;
        }
      }

      const latestSinceFilter: Filter = { ...msgFilter, since };
      return { filter: latestSinceFilter, isValidEvent, worker };
    },
  });

  useInterval(
    () => {
      if (
        hasPreviousPage &&
        !isFetching &&
        !isFetchingPreviousPage &&
        !isFetchingNextPage
      ) {
        console.log('query: useInterval');
        fetchPreviousPage();
      }
    },
    isEnable ? SUB_NEW_MSG_INTERVAL : null,
  );

  const events = useMemo(() => {
    return data?.pages.flat(1) || [];
  }, [data]);

  const showLatest = useCallback(() => {
    if (events.length > 0) {
      setLatestCursor(events[0].created_at);
    }
  }, [events]);

  const pullToRefresh = useCallback(async () => {
    setIsPullRefreshing(true);
    await refetch();
    setIsPullRefreshing(false);
  }, [refetch]);

  const feed = useMemo(() => {
    console.log('feed:', events.length, latestCursor);
    if (events.length === 0) return [];

    const pos = events.findIndex(e => e.created_at === latestCursor);
    if (pos === -1) {
      return events.filter(e => e.created_at < latestCursor);
    }
    const viewFeed = events.slice(pos);
    return viewFeed;
  }, [events, latestCursor]);

  const latestNewMsg = useMemo(() => {
    if (events.length === 0) return [];

    const pos = events.findIndex(e => e.created_at === latestCursor);
    if (pos === -1) {
      return events.filter(e => e.created_at > latestCursor);
    }
    const newMsg = events.slice(0, pos);
    return newMsg;
  }, [events, latestCursor]);

  const scrollCacheKey = useMemo(
    () =>
      createQueryCacheId({
        feedId,
        relayUrls,
        isValidEvent,
        msgFilter: filter,
      }),
    [feedId, relayUrls, isValidEvent, filter],
  );
  useLastScroll({ queryCacheId: scrollCacheKey, msgList: events });

  return {
    feed,
    status,
    latestNewMsg,
    latestCursor,
    showLatest,
    loadMore: fetchNextPage,
    pullToRefresh,
    isLoadMore: isFetchingNextPage,
    isLoadingMainFeed:
      isFetching && !isFetchingPreviousPage && !isFetchingNextPage,
    isPullRefreshing,
  };
}
