import { Event } from 'core/nostr/Event';
import { Filter } from 'core/nostr/type';
import { CallWorker } from 'core/worker/caller';
import { CallRelayType } from 'core/worker/type';
import { Dispatch, SetStateAction, useEffect } from 'react';
import { validateFilter } from '../util';
import { DbEvent } from 'core/db/schema';
import { dbQuery } from 'core/db';

export function useLoadMoreMsg({
  msgFilter,
  isValidEvent,
  worker,
  msgList,
  setMsgList,
  loadMoreCount,
}: {
  msgFilter?: Filter;
  isValidEvent?: (event: Event) => boolean;
  worker: CallWorker | undefined;
  msgList: DbEvent[];
  setMsgList: Dispatch<SetStateAction<DbEvent[]>>;
  loadMoreCount: number;
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
    worker.subFilter({ filter, callRelay }).iterating({
      cb: (event, relayUrl) => {
        //
      },
    });

    const relayUrls = worker.relays.map(r => r.url) || [];
    dbQuery.matchFilterRelay(filter, relayUrls).then(events => {
      if(isValidEvent){
        setMsgList(prev => prev.concat(events.filter(e => isValidEvent(e))));
      }else{
        setMsgList(prev => prev.concat(events));
      }
      
    })
  }, [msgFilter, isValidEvent, worker, loadMoreCount]);
}
