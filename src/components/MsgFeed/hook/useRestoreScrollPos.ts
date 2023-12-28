import { scrollPositionCache } from 'core/cache/query';
import { useEffect } from 'react';

export function useRestoreScrollPos(
  scrollHeight: number,
  queryCacheId: string,
  canRestore: boolean,
) {
  // remember and restore the last visit position in the feed
  // todo: better way to do this?
  useEffect(() => {
    if (scrollHeight > 0) {
      scrollPositionCache.set(queryCacheId, scrollHeight);
    }
  }, [scrollHeight]);

  useEffect(() => {
    const pos = scrollPositionCache.get(queryCacheId);
    if (pos && canRestore) {
      window.scrollTo({ top: pos, behavior: 'instant' as ScrollBehavior });
    }
  }, [queryCacheId, canRestore]);
}
