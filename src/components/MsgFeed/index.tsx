import { Button, message } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { CallWorker } from 'core/worker/caller';
import { Filter, WellKnownEventKind } from 'core/nostr/type';
import { _handleEvent } from 'components/Comments/util';
import { Event } from 'core/nostr/Event';
import { useLastReplyEvent } from './hook/useSubLastReply';
import { useTranslation } from 'react-i18next';
import { dbQuery } from 'core/db';
import { DbEvent } from 'core/db/schema';
import { validateFilter } from './util';
import { useSubMsg } from './hook/useSubMsg';
import { mergeAndSortUniqueDbEvents } from 'utils/common';
import { noticePubEventResult } from 'components/PubEventNotice';
import { Loader } from 'components/Loader';
import { createQueryCacheId, queryCache } from 'core/cache/query';

import PullToRefresh from 'react-simple-pull-to-refresh';
import classNames from 'classnames';
import PostItems from 'components/PostItems';
import styles from './index.module.scss';

export interface MsgSubProp {
  msgFilter?: Filter;
  isValidEvent?: (event: Event) => boolean;
  emptyDataReactNode?: React.ReactNode;
}

export interface MsgFeedProp {
  msgSubProp: MsgSubProp;
  worker: CallWorker | undefined;
  maxMsgLength?: number;
}

export const MsgFeed: React.FC<MsgFeedProp> = ({
  msgSubProp,
  worker,
  maxMsgLength: _maxMsgLength,
}) => {
  const { t } = useTranslation();
  const { msgFilter, isValidEvent, emptyDataReactNode } = msgSubProp;

  const [msgList, setMsgList] = useState<DbEvent[]>([]);
  const [newComingMsg, setNewComingMsg] = useState<DbEvent[]>([]);
  const [isLoadingMsg, setIsLoadingMsg] = useState<boolean>(false);
  const [isPullRefreshing, setIsPullRefreshing] = useState<boolean>(false);
  const [isLoadMore, setIsLoadMore] = useState<boolean>(false);

  const relayUrls = useMemo(
    () => worker?.relays.map(r => r.url) || [],
    [worker?.relays],
  );
  const memoMsgList = useMemo(() => msgList, [msgList]);
  const queryCacheId = useMemo(
    () =>
      createQueryCacheId({
        msgFilter,
        isValidEvent,
        relayUrls,
      }),
    [msgFilter, isValidEvent, relayUrls],
  );

  useSubMsg({
    setNewComingMsg,
    msgFilter,
    isValidEvent,
    worker,
    setMsgList
  });
  useLastReplyEvent({ msgList: memoMsgList, worker });

  const query = async () => {    
    if (!msgFilter || !validateFilter(msgFilter)) return [] as DbEvent[];
    setIsLoadingMsg(true);

    // get from cache first
    const cache = queryCache.get(queryCacheId);
    if (cache) {
      console.log('hit cache!');
      setMsgList(cache);
      setIsLoadingMsg(false);
      return;
    }

    let events = await dbQuery.matchFilterRelay(
      msgFilter,
      relayUrls,
      isValidEvent,
    );
    events = events.map(e => {
      if (e.kind === WellKnownEventKind.community_approval) {
        const event = { ...e, ...(JSON.parse(e.content) as DbEvent) };
        return event;
      }
      return e;
    });
    events = mergeAndSortUniqueDbEvents(events, events);
    console.log('query: ', events.length, relayUrls, msgFilter);
    setMsgList(events);
    // save cache
    queryCache.set(queryCacheId, events);

    setIsLoadingMsg(false);
  };

  const loadMore = async () => {
    if (!worker) return;
    if (!msgFilter || !validateFilter(msgFilter)) return;

    setIsLoadMore(true);

    const lastMsg = msgList.at(msgList.length - 1);
    if (!lastMsg) {
      return;
    }

    const filter = { ...msgFilter, ...{ until: lastMsg.created_at } };
    worker.subFilter({ filter });

    const relayUrls = worker.relays.map(r => r.url) || [];
    let events = await dbQuery.matchFilterRelay(
      filter,
      relayUrls,
      isValidEvent,
    );
    events = events.map(e => {
      if (e.kind === WellKnownEventKind.community_approval) {
        const event = { ...e, ...(JSON.parse(e.content) as DbEvent) };
        return event;
      }
      return e;
    });
    events = mergeAndSortUniqueDbEvents(events, events);
    setMsgList(prev => {
      const newData = prev.concat(events);
      queryCache.set(queryCacheId, newData);
      return newData;
    });
    setIsLoadMore(false);
  };

  useEffect(() => {
    if (!worker?.relayGroupId || !worker?.relays || worker?.relays.length === 0)
      return;
    setNewComingMsg([]);
    setMsgList([]);

    query();
  }, [msgFilter, worker?.relayGroupId]);

  const onClickNewMsg = () => {
    setMsgList(prev => {
      const newData = mergeAndSortUniqueDbEvents(newComingMsg, prev);
      queryCache.set(queryCacheId, newData);
      return newData;
    });
    setNewComingMsg([]);
  };

  const onPullToRefresh = async () => {
    if (!msgFilter || !validateFilter(msgFilter)) return;

    setIsPullRefreshing(true);
    worker?.subFilter({ filter: msgFilter });
    await query();
    setIsPullRefreshing(false);
  };

  const onBroadcastEvent = async (event: Event, msg: typeof message) => {
    if (!worker) return msg.error('worker not found.');
    const pubHandler = worker.pubEvent(event);
    noticePubEventResult(worker.relays.length, pubHandler);
  };

  const extraMenu = [
    {
      label: 'broadcast',
      onClick: onBroadcastEvent,
    },
  ];

  return (
    <>
      <Loader isLoading={isLoadingMsg && !isPullRefreshing} />
      <PullToRefresh onRefresh={onPullToRefresh}>
        <>
          {newComingMsg.length > 0 && (
            <div className={styles.reloadFeedBtn}>
              <Button onClick={onClickNewMsg} type="link">
                Show {newComingMsg.length} new posts
              </Button>
            </div>
          )}

          <div
            className={classNames(styles.home, {
              [styles.noData]: msgList.length === 0,
            })}
          >
            {msgList.length > 0 && (
              <>
                <div className={styles.msgList}>
                  <PostItems
                    msgList={memoMsgList}
                    worker={worker!}
                    showLastReplyToEvent={true}
                    extraMenu={extraMenu}
                  />
                </div>
                <Loader isLoading={isLoadMore} />
                {!isLoadMore && (
                  <Button type="link" block onClick={loadMore}>
                    {t('home.loadMoreBtn')}
                  </Button>
                )}
                <br />
                <br />
                <br />
                <br />
                <br />
              </>
            )}
            {msgList.length === 0 && !isLoadingMsg && emptyDataReactNode}
          </div>
        </>
      </PullToRefresh>
    </>
  );
};
