import { useQuery } from '@tanstack/react-query';
import { dbEventTable, dbQuery } from 'core/db';
import { DbEvent } from 'core/db/schema';
import { Nip01 } from 'core/nip/01';
import { TimelineFilterOption } from 'core/timeline-filter';
import { FilterOption } from 'pages/filter-market/hook/useFilterNoscripts';
import { useFilterOptionSetting } from 'pages/filter-market/hook/useFilterOptionSetting';
import { resolve } from 'path';
import { useCallback } from 'react';

export function useNoscriptTimelineFilter() {
  const filterOptSetting = useFilterOptionSetting();
  const filterOpts = filterOptSetting.getOpts();

  const queryFn = useCallback(async () => {
    const promises = filterOpts.map(f => {
      return new Promise(async resolve => {
        const eventId = f.eventId;
        const addr = f.naddr;
        let event: DbEvent | undefined | null = await dbEventTable.get(eventId);
        if (!event) {
          event = await dbQuery.getEventByAddr(addr, []);
        }
        return resolve([event, f]);
      }) as Promise<[DbEvent | undefined | null, FilterOption]>;
    });

    const res = await Promise.all(promises);

    const msgFilters = res
      .map(item => {
        const [e, opt] = item;
        if (e) {
          return filterOptSetting.toTimelineFilter(opt, e);
        }
        return null;
      })
      .filter(m => m != null) as TimelineFilterOption[];
    return msgFilters;
  }, [filterOpts]);

  const queryKey = ['noscript-msg-filter', filterOpts];

  const { data } = useQuery({
    queryKey,
    queryFn,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
  });

  return data;
}
