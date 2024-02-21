import { useQueryMsg } from 'components/TimelineRender/hook/useQueryMsg';
import { EventId, Filter, WellKnownEventKind } from 'core/nostr/type';
import { CallWorker } from 'core/worker/caller';
import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

export interface ReactionCountProp {
  worker: CallWorker | undefined;
  eventId: EventId;
}

export interface ReactionCount {
  repost: number;
  zap: number;
  comment: number;
  bookmark: number;
}

export function useReactionCount({ worker, eventId }: ReactionCountProp) {
  const relayUrls = useMemo(
    () => worker?.relays.map(r => r.url) || [],
    [worker?.relays],
  );
  const filter: Filter = useMemo(() => {
    return {
      '#e': [eventId],
      kinds: [
        WellKnownEventKind.text_note,
        WellKnownEventKind.reposts,
        WellKnownEventKind.zap_receipt,
        WellKnownEventKind.bookmark_list,
      ],
    };
  }, [eventId]);

  const { queryMsg } = useQueryMsg();

  const queryFn = useCallback(async () => {
    return await queryMsg({ filter, worker });
  }, [filter, relayUrls, worker, queryMsg]);

  const queryKey = ['reaction-count', filter, relayUrls];
  const { data, isFetching } = useQuery({
    queryKey,
    queryFn,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
  });

  const reactCount = useMemo(() => {
    if (!data) return undefined;

    const reactCount: ReactionCount = {
      repost: data.filter(e => e.kind === WellKnownEventKind.reposts).length,
      comment: data.filter(e => e.kind === WellKnownEventKind.reposts).length,
      zap: data.filter(e => e.kind === WellKnownEventKind.zap_receipt).length,
      bookmark: data.filter(e => e.kind === WellKnownEventKind.bookmark_list)
        .length,
    };
    return reactCount;
  }, [data]);

  return { reactCount, isFetching };
}
