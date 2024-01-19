import { DbEvent } from 'core/db/schema';
import { useEffect, useSyncExternalStore } from 'react';
import { useDebounce } from 'usehooks-ts';
import { scrollHeightCache } from 'core/cache/query';

export interface LastScrollProp {
  queryCacheId: string;
  feed: DbEvent[];
}

export function useLastScroll({ queryCacheId, feed }: LastScrollProp) {
  const scrollHeight = useScrollHeight();
  useRestoreScrollHeight(scrollHeight, queryCacheId, feed.length > 0);
}

export function useRestoreScrollHeight(
  scrollHeight: number,
  queryCacheId: string,
  canRestore: boolean,
) {
  // remember and restore the last visit position in the feed
  // todo: better way to do this?
  useEffect(() => {
    if (scrollHeight > 0) {
      scrollHeightCache.set(queryCacheId, scrollHeight);
    }
  }, [scrollHeight]);

  useEffect(() => {
    const pos = scrollHeightCache.get(queryCacheId);
    if (pos && canRestore) {
      window.scrollTo({ top: pos, behavior: 'instant' as ScrollBehavior });
    }
  }, [queryCacheId, canRestore]);
}

export const useScrollHeight = (debounceDelay = 500) => {
  const scrollValue = useSyncExternalStore(subscribe, getSnapshot, () => 0);
  const debounceScrollValue = useDebounce(scrollValue, debounceDelay);
  return debounceScrollValue;
};

function getSnapshot() {
  return window.scrollY;
}

function subscribe(callback) {
  window.addEventListener('scroll', callback);
  return () => {
    window.removeEventListener('scroll', callback);
  };
}
