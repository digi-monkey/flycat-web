import { DbEvent } from 'core/db/schema';
import { useCallback, useEffect } from 'react';

export interface ShowNewMsgWhenDbNoDataProp {
  onClickNewMsg: () => any;
  isDBNoData: boolean;
  msgList: DbEvent[];
  newComingMsg: DbEvent[];
}

export function useShowNewMsgWhenDbNoData({
  onClickNewMsg,
  isDBNoData,
  msgList,
  newComingMsg,
}: ShowNewMsgWhenDbNoDataProp) {
  const show = useCallback(() => {
    if (isDBNoData && msgList.length === 0 && newComingMsg.length > 0) {
      onClickNewMsg();
    }
  }, [onClickNewMsg, isDBNoData, msgList, newComingMsg]);

  useEffect(() => {
    show();
  }, [show]);
}
