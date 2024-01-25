import { useQuery } from '@tanstack/react-query';
import { dbEventTable, dbQuery } from 'core/db';
import { DbEvent } from 'core/db/schema';
import { MsgFilter } from 'core/msg-filter/filter';
import { useFilterOptionSetting } from 'pages/filter-market/hook/useFilterOptionSetting';
import { useCallback } from 'react';

export function useNoscriptMsgFilter() {
  const filterOptSetting = useFilterOptionSetting();
  const filterOpts = filterOptSetting.getOpts();

  const queryFn = useCallback(async () => {
    const eventIds = filterOpts.map(f => f.eventId);
    const events = (await dbEventTable.bulkGet(eventIds)).filter(
      e => e != null,
    ) as DbEvent[];

    const msgFilters = filterOpts
      .map(opt => {
        const e = events.find(e => e.id === opt.eventId);
        if (e) {
          return filterOptSetting.toMsgFilter(opt, e);
        }
        return null;
      })
      .filter(m => m != null) as MsgFilter[];
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
