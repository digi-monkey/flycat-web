import { Button } from 'antd';
import { useEffect, useMemo } from 'react';
import { CallWorker } from 'core/worker/caller';
import { Filter } from 'core/nostr/type';
import { Event } from 'core/nostr/Event';
import { useLastReplyEvent } from './hook/useSubLastReply';
import { useTranslation } from 'react-i18next';
import { Loader } from 'components/Loader';
import { useSubNewComingMsg } from './hook/useSubNewComingMsg';
import { useQueryDbMsg } from './hook/useQueryDbMsg';
import { useLoadMoreMsg } from './hook/useLoadMoreMsg';
import { useLastScroll } from './hook/useLastScroll';
import { usePullToRefresh } from './hook/usePullToRefresh';
import { useOnClickNewMsg } from './hook/useOnClickNewMsg';

import PullToRefresh from 'react-simple-pull-to-refresh';
import PostItems from 'components/PostItems';
import { useQueryCacheId } from './hook/useQueryCacheId';
import { useShowNewMsgWhenDbNoData } from './hook/useShowNewMsgWhenDbNoData';

export interface MsgFeedProp {
  feedId: string;
  msgFilter?: Filter;
  isValidEvent?: (event: Event) => boolean;
  placeholder?: React.ReactNode;
  worker: CallWorker | undefined;
}

export const MsgFeed: React.FC<MsgFeedProp> = ({
  feedId,
  msgFilter,
  isValidEvent,
  placeholder,
  worker,
}) => {
  const { t } = useTranslation();

  const queryCacheId = useQueryCacheId({
    feedId,
    worker,
    msgFilter,
    isValidEvent,
  });

  const { queryMsgFromDb, msgList, setMsgList, isQueryMsg, isDBNoData } =
    useQueryDbMsg({
      feedId,
      worker,
      msgFilter,
      isValidEvent,
    });

  const { newComingMsg, setNewComingMsg } = useSubNewComingMsg({
    worker,
    msgFilter,
    isValidEvent,
    disabled: isQueryMsg,
    latestTimestamp: msgList[0]?.created_at,
  });

  const { loadMore, isLoadMore } = useLoadMoreMsg({
    feedId,
    worker,
    msgFilter,
    isValidEvent,
    msgList,
    setMsgList,
  });

  const { pullToRefresh, isPullRefreshing } = usePullToRefresh({
    queryMsgFromDb,
  });

  useLastScroll({ queryCacheId, msgList });

  useLastReplyEvent({ msgList, worker });

  const { onClickNewMsg } = useOnClickNewMsg({
    queryCacheId,
    setMsgList,
    setNewComingMsg,
    newComingMsg,
  });

  useShowNewMsgWhenDbNoData({
    isDBNoData,
    msgList,
    newComingMsg,
    onClickNewMsg,
  });

  return (
    <>
      <Loader isLoading={isQueryMsg && !isPullRefreshing} />
      <PullToRefresh onRefresh={pullToRefresh}>
        <>
          {newComingMsg.length > 0 && (
            <div className="w-full py-2 mt-4 border-b border-neutral-02 text-center">
              <Button
                onClick={onClickNewMsg}
                type="link"
                className="text-primary-06"
              >
                Show {newComingMsg.length} new posts
              </Button>
            </div>
          )}

          {msgList.length > 0 && (
            <div className="mt-5">
              <PostItems
                msgList={msgList}
                worker={worker!}
                showLastReplyToEvent={true}
              />
              <Loader isLoading={isLoadMore} />
              {!isLoadMore && (
                <Button type="link" block onClick={loadMore}>
                  {t('home.loadMoreBtn')}
                </Button>
              )}
            </div>
          )}

          {msgList.length === 0 && !isQueryMsg && (
            <div className="mt-5 lg:mt-32">{placeholder}</div>
          )}
        </>
      </PullToRefresh>
    </>
  );
};
