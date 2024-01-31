import { CallWorker } from 'core/worker/caller';
import { useQuery } from '@tanstack/react-query';
import { EventId, Filter } from 'core/nostr/type';
import { useMemo } from 'react';
import { useQueryMsg } from 'components/TimelineRender/hook/useQueryMsg';
import { FilterOptMode, Nip188 } from 'core/nip/188';
import { cloneDeep } from 'lodash';

export interface FilterOption {
  eventId: EventId;
  filter: Filter;
  mode: FilterOptMode;
  title?: string;
  description?: string;
  picture?: string;
  pubkey: string;
  naddr: string;
  disabled: boolean;
}

export function useNoscriptFilterOptions({
  worker,
}: {
  worker: CallWorker | undefined;
}) {
  const filter: Filter = Nip188.createQueryNoscriptFilter([]);
  const relayUrls = useMemo(
    () => worker?.relays.map(r => r.url) || [],
    [worker?.relays],
  );
  const { queryMsg } = useQueryMsg();
  const queryKey = ['filter-market', filter, relayUrls];
  const queryFn = async () => {
    const data = await queryMsg({ filter, worker });

    // prevent db data will not update forever
    if (data.length > 0) {
      const lastTimestamp = data[0].created_at;
      const newFilter = cloneDeep(filter);
      newFilter.since = lastTimestamp;
      worker?.subFilter({ filter: newFilter });
    }

    return data;
  };
  const { data } = useQuery({
    queryKey,
    queryFn,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
  });

  const filterOpts = useMemo(() => {
    if (!data) {
      return [];
    }

    return data.map(e => {
      const filterOptPayload = Nip188.parseFilterOptPayload(e);
      const noscriptPayload = Nip188.parseNoscriptPayload(e);
      const title = noscriptPayload.title!;
      const description = noscriptPayload.description || 'no description';
      const item: FilterOption = {
        filter: filterOptPayload.filter,
        mode: filterOptPayload.mode,
        title,
        description,
        eventId: e.id,
        naddr: Nip188.parseNoscriptNaddr(e),
        disabled: false,
        pubkey: e.pubkey,
      };
      return item;
    });
  }, [data]);

  return filterOpts;
}
