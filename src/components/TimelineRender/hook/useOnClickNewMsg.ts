import { queryCache } from 'core/cache/query';
import { mergeAndSortUniqueDbEvents } from 'utils/common';
import { useQueryCacheId } from './useQueryCacheId';
import { Dispatch, SetStateAction, useCallback } from 'react';
import { CallWorker } from 'core/worker/caller';
import { Filter } from 'core/nostr/type';
import { Event } from 'core/nostr/Event';
import { DbEvent } from 'core/db/schema';

export interface ClickNewMsgProp {
  queryCacheId: string;
  setMsgList: Dispatch<SetStateAction<DbEvent[]>>;
  setNewComingMsg: Dispatch<SetStateAction<DbEvent[]>>;
  newComingMsg: DbEvent[];
}

export function useOnClickNewMsg({
  queryCacheId,
  setMsgList,
  setNewComingMsg,
  newComingMsg,
}: ClickNewMsgProp) {
  const onClickNewMsg = useCallback(() => {
    setMsgList(prev => {
      const newData = mergeAndSortUniqueDbEvents(newComingMsg, prev);
      queryCache.set(queryCacheId, newData);
      return newData;
    });
    setNewComingMsg([]);
  }, [
    setMsgList,
    setNewComingMsg,
    queryCacheId,
    mergeAndSortUniqueDbEvents,
    newComingMsg,
  ]);
  return { onClickNewMsg };
}
