import { useQuery } from '@tanstack/react-query';
import { dbEventTable, dbQuery } from 'core/db';
import { DbEvent } from 'core/db/schema';
import { Nip01 } from 'core/nip/01';
import { TimelineFilterOption } from 'core/timeline-filter';
import { useFilterOptionSetting } from 'pages/filter-market/hook/useFilterOptionSetting';
import { useCallback } from 'react';

export function useNoscriptTimelineFilter() {
  const filterOptSetting = useFilterOptionSetting();
  const filterOpts = filterOptSetting.getOpts();

  const queryFn = useCallback(async () => {
    const naddrs = filterOpts.map(f => f.naddr);
    const events: DbEvent[] = [];
    for (const addr of naddrs) {
      const e = await dbQuery.getEventByAddr(addr, []);
      if (e) events.push(e);
    }

    const msgFilters = filterOpts
      .map(opt => {
        const e = events.find(e => Nip01.getAddr(e) === opt.naddr);
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
