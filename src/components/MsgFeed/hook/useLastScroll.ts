import { CallWorker } from 'core/worker/caller';
import { Filter } from 'core/nostr/type';
import { Event } from 'core/nostr/Event';
import { DbEvent } from 'core/db/schema';
import { useQueryCacheId } from './useQueryCacheId';
import { useState, useEffect } from 'react';
import { useDebounce } from 'usehooks-ts';
import { scrollHeightCache } from 'core/cache/query';

export interface LastScrollProp {
  queryCacheId: string;
  msgList: DbEvent[];
}

export function useLastScroll({ queryCacheId, msgList }: LastScrollProp) {
  const scrollHeight = useScrollHeight();
  useRestoreScrollHeight(scrollHeight, queryCacheId, msgList.length > 0);
}

export const useScrollHeight = (debounceDelay = 700) => {
  const [scrollValue, setScrollValue] = useState(0);
  const debounceScrollValue = useDebounce(scrollValue, debounceDelay);

  useEffect(() => {
    const handleScroll = () => {
      setScrollValue(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return debounceScrollValue;
};

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
