import { CallWorker } from 'core/worker/caller';
import { useQuery } from '@tanstack/react-query';
import { Filter } from 'core/nostr/type';
import { useMemo } from 'react';
import { useQueryMsg } from 'components/TimelineRender/hook/useQueryMsg';
import { Nip188 } from 'core/nip/188';
import { Event } from 'core/nostr/Event';
import { cloneDeep } from 'lodash';

export interface NoscriptItem {
  event: Event;
  filter: Filter;
  title?: string;
  description?: string;
  picture?: string;
}

export function useFilterNoscript({
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

  const filterNoscripts = useMemo(() => {
    if (!data) {
      return [];
    }

    return data.map(e => {
      const filter = Nip188.parseNoscriptMsgFilterTag(e);
      const title = e.tags.find(t => t[0] === 'd')
        ? (e.tags.find(t => t[0] === 'd') as any)[1]
        : 'unknown-id';
      const description = e.tags.find(t => t[0] === 'description')
        ? (e.tags.find(t => t[0] === 'description') as any)[1]
        : 'no description';
      const item: NoscriptItem = {
        filter,
        title,
        description,
        event: e,
      };
      return item;
    });
  }, [data]);

  return filterNoscripts;
}
