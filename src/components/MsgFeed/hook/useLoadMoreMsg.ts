import { Event } from 'core/nostr/Event';
import { Filter } from 'core/nostr/type';
import { CallWorker } from 'core/worker/caller';
import { CallRelayType } from 'core/worker/type';
import { Dispatch, SetStateAction, useEffect } from 'react';
import { validateFilter } from '../util';
import { DbEvent } from 'core/db/schema';
import { dbQuery } from 'core/db';
import { queryCache } from 'core/cache/query';

export function useLoadMoreMsg({
  msgFilter,
  isValidEvent,
  worker,
  msgList,
  setMsgList,
  loadMoreCount,
  queryCacheId
}: {
  msgFilter?: Filter;
  isValidEvent?: (event: Event) => boolean;
  worker: CallWorker | undefined;
  msgList: DbEvent[];
  setMsgList: Dispatch<SetStateAction<DbEvent[]>>;
  loadMoreCount: number;
  queryCacheId: string;
}) {
  useEffect(() => {
    if (!worker) return;
    if (loadMoreCount <= 1) return;
    if (!msgFilter || !validateFilter(msgFilter)) return;

    const lastMsg = msgList.at(msgList.length - 1);
    if (!lastMsg) {
      return;
    }

    const callRelay = {
      type: CallRelayType.connected,
      data: [],
    };
    const filter = { ...msgFilter, ...{ until: lastMsg.created_at } };
    worker.subFilter({ filter, callRelay });

    const relayUrls = worker.relays.map(r => r.url) || [];
    dbQuery.matchFilterRelay(filter, relayUrls, isValidEvent).then(events => {
      setMsgList(prev => {
        const newData = prev.concat(events);
        queryCache.set(queryCacheId, newData);
        return newData;
      });
    })
  }, [msgFilter, isValidEvent, worker, loadMoreCount]);
}
