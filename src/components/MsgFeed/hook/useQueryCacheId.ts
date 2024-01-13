import { createQueryCacheId } from 'core/cache/query';
import { Filter } from 'core/nostr/type';
import { CallWorker } from 'core/worker/caller';
import { useMemo } from 'react';
import { Event } from 'core/nostr/Event';

export interface QueryCacheIdProp {
  feedId: string;
  worker: CallWorker | undefined;
  msgFilter?: Filter;
  isValidEvent?: (event: Event) => boolean;
}

export function useQueryCacheId({
  feedId,
  worker,
  msgFilter,
  isValidEvent,
}: QueryCacheIdProp) {
  const relayUrls = useMemo(
    () => worker?.relays.map(r => r.url) || [],
    [worker?.relays],
  );
  const queryCacheId = useMemo(
    () =>
      createQueryCacheId({
        feedId,
        msgFilter,
        isValidEvent,
        relayUrls,
      }),
    [msgFilter, isValidEvent, relayUrls],
  );
  return queryCacheId;
}
