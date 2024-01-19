import { useCallback, useEffect, useMemo, useState } from 'react';
import { lastViewTimestampCache } from 'core/cache/query';
import { DbEvent } from 'core/db/schema';
import { InfiniteData } from '@tanstack/react-query';

export interface LastViewProp {
  queryCacheId: string;
  data: InfiniteData<DbEvent[], unknown> | undefined;
}

export function useLastView({ queryCacheId, data }: LastViewProp) {
  const [lastTimestamp, setLastTimestamp] = useState(0);

  const firstPageTimestamp = useMemo(() => {
    if (!data) return undefined;

    const len = data.pages.length;
    if (len > 0 && data.pages[len - 1].length > 0) {
      return data.pages[len - 1][0].created_at;
    }
    return undefined;
  }, [data]);

  // restore the lastTimestamp from cache
  const { saveLastViewCache, getLastViewCache } = useLastViewCache({
    queryCacheId,
  });
  const lastViewCache = useMemo(() => {
    return getLastViewCache() || 0;
  }, [queryCacheId, getLastViewCache]);
  useEffect(() => {
    setLastTimestamp(lastViewCache);
  }, [lastViewCache]);

  const lastView = useMemo(() => {
    if (!firstPageTimestamp) return undefined;

    return Math.max(firstPageTimestamp, lastTimestamp);
  }, [firstPageTimestamp, lastTimestamp]);

  const events = useMemo(() => {
    return data?.pages.flat(1) || [];
  }, [data]);

  const showLatest = useCallback(() => {
    if (events.length > 0) {
      const ts = events[0].created_at;
      saveLastViewCache(ts);
      setLastTimestamp(ts);
    }
  }, [events, saveLastViewCache]);

  return { lastView, showLatest };
}

export function useLastViewCache({ queryCacheId }: { queryCacheId: string }) {
  const saveLastViewCache = useCallback(
    (timestamp: number) => {
      if (timestamp > 0) {
        lastViewTimestampCache.set(queryCacheId, timestamp);
      }
    },
    [queryCacheId],
  );

  const getLastViewCache = useCallback(() => {
    return lastViewTimestampCache.get(queryCacheId);
  }, [queryCacheId]);

  return { saveLastViewCache, getLastViewCache };
}
