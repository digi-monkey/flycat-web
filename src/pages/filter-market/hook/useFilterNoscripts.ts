import { CallWorker } from 'core/worker/caller';
import { useQuery } from '@tanstack/react-query';
import { EventId, Filter } from 'core/nostr/type';
import { useCallback, useMemo } from 'react';
import { useQueryMsg } from 'components/TimelineRender/hook/useQueryMsg';
import {
  FilterOptPayload,
  Nip188,
  NoscriptContent,
  NoscriptPayload,
} from 'core/nip/188';
import { cloneDeep } from 'lodash';

export interface FilterOption extends NoscriptPayload, FilterOptPayload {
  eventId: EventId;
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
  const queryFn = useCallback(async () => {
    const data = await queryMsg({ filter, worker });

    // prevent db data will not update forever
    if (data.length > 0) {
      const lastTimestamp = data[0].created_at;
      const newFilter = cloneDeep(filter);
      newFilter.since = lastTimestamp;
      worker?.subFilter({ filter: newFilter });
    }

    return data;
  }, [queryMsg, worker]);

  const { data } = useQuery({
    queryKey,
    queryFn,
    retry: false,
  });

  const filterOpts = useMemo(() => {
    if (!data) {
      return [];
    }

    return data.map(e => {
      const noscriptContent: NoscriptContent = JSON.parse(e.content);

      const n = new NoscriptContent(
        noscriptContent.wasm,
        noscriptContent.binding,
      );
      console.log('noscriptContent: ', n.parseBindingString());

      const filterOptPayload = Nip188.parseFilterOptPayload(e);
      const noscriptPayload = Nip188.parseNoscriptPayload(e);

      const title = noscriptPayload.title!;
      const description = noscriptPayload.description || 'no description';
      const picture = noscriptPayload.picture;
      const version = noscriptPayload.version || e.id.slice(0, 7);
      const source_code = noscriptPayload.source_code;
      const published_at = noscriptPayload.published_at;

      const item: FilterOption = {
        filter: filterOptPayload.filter,
        mode: filterOptPayload.mode,

        title,
        description,
        picture,
        version,
        source_code,
        published_at,

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
