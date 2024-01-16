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
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);
  const { queryMsg, cancelQueryMsg } = useQueryMsg();

  const relayUrls = useMemo(
    () => worker?.relays.map(r => r.url) || [],
    [worker?.relays],
  );
  const initialPageParam: QueryMsgPro = useMemo(() => {
    return { filter, isValidEvent, worker };
  }, [filter, isValidEvent, worker]);

  const fetch = useCallback(
    async ({ pageParam }) => {
      const { filter, isValidEvent, worker } = pageParam;
      return await queryMsg({ filter, isValidEvent, worker });
    },
    [queryMsg],
  );

  const queryKey = ['timeline', feedId, relayUrls, filter, isValidEvent];

  const {
    data,
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
    queryKey,
    queryFn: fetch,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
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

  const events = useMemo(() => {
    return data?.pages.flat(1) || [];
  }, [data]);

  const [lastTimestamp, setLastTimestamp] = useState<number>(0);
  const firstPageTimestamp = useMemo(() => {
    if (!data) return undefined;

    const len = data.pages.length;
    if (len > 0 && data.pages[len - 1].length > 0) {
      return data.pages[len - 1][0].created_at;
    }
    return undefined;
  }, [data]);

  const lastViewTimestamp = useMemo(() => {
    if (!firstPageTimestamp) return undefined;

    return Math.max(firstPageTimestamp, lastTimestamp);
  }, [firstPageTimestamp, lastTimestamp]);

  const showLatest = useCallback(() => {
    if (events.length > 0) {
      setLastTimestamp(events[0].created_at);
    }
  }, [events]);

  const pullToRefresh = useCallback(async () => {
    setIsPullRefreshing(true);
    await refetch();
    setIsPullRefreshing(false);
  }, [refetch]);

  const loadMore = useCallback(async () => {
    if (hasNextPage) {
      return await fetchNextPage();
    }
  }, [fetchNextPage]);

  const cancelQueryDb = useCallback(() => {
    if (typeof cancelQueryMsg === 'function') {
      cancelQueryMsg();
    }
  }, [cancelQueryMsg]);

  const latestNewMsg = useMemo(() => {
    if (events.length === 0) return [];
    if (!lastViewTimestamp) return [];

    const pos = events.findIndex(e => e.created_at === lastViewTimestamp);
    if (pos === -1) {
      return events.filter(e => e.created_at > lastViewTimestamp);
    }
    const newMsg = events.slice(0, pos);
    return newMsg;
  }, [events, lastViewTimestamp]);

  const feed = useMemo(() => {
    if (events.length === 0) return [];
    if (!lastViewTimestamp) return [];

    const pos = events.findIndex(e => e.created_at === lastViewTimestamp);
    if (pos === -1) {
      return events.filter(e => e.created_at < lastViewTimestamp);
    }
    const viewFeed = events.slice(pos);
    return viewFeed;
  }, [events, lastViewTimestamp]);

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
  useLastScroll({ queryCacheId: scrollCacheKey, feed: events });
  useInterval(() => {
    if (
      hasPreviousPage &&
      !isFetching &&
      !isFetchingPreviousPage &&
      !isFetchingNextPage
    ) {
      fetchPreviousPage();
    }
  }, SUB_NEW_MSG_INTERVAL);

  return {
    feed,
    status,
    latestNewMsg,
    latestCursor: lastTimestamp,
    showLatest,
    loadMore,
    pullToRefresh,
    isLoadMore: isFetchingNextPage,
    isLoadingMainFeed:
      isFetching && !isFetchingPreviousPage && !isFetchingNextPage,
    isPullRefreshing,
    cancelQueryDb,
    queryKey,
    firstPageTimestamp,
  };
}
