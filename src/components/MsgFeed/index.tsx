import { Button, message } from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CallWorker } from 'core/worker/caller';
import { Filter, WellKnownEventKind } from 'core/nostr/type';
import { _handleEvent } from 'components/Comments/util';
import { Event } from 'core/nostr/Event';
import { useLastReplyEvent } from './hook/useSubLastReply';
import { useTranslation } from 'react-i18next';
import { dbQuery } from 'core/db';
import { DbEvent } from 'core/db/schema';
import { validateFilter } from './util';
import { mergeAndSortUniqueDbEvents } from 'utils/common';
import { noticePubEventResult } from 'components/PubEventNotice';
import { Loader } from 'components/Loader';
import { createQueryCacheId, queryCache } from 'core/cache/query';
import { useInterval } from 'usehooks-ts';
import { useRestoreScrollPos } from './hook/useRestoreScrollPos';

import PullToRefresh from 'react-simple-pull-to-refresh';
import classNames from 'classnames';
import PostItems from 'components/PostItems';
import styles from './index.module.scss';
import useScrollValue from './hook/useScrollValue';

export interface MsgSubProp {
  msgId?: string;
  msgFilter?: Filter;
  isValidEvent?: (event: Event) => boolean;
  placeholder?: React.ReactNode;
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
  const { msgId, msgFilter, isValidEvent, placeholder } = msgSubProp;

  const [msgList, setMsgList] = useState<DbEvent[]>([]);
  const [newComingMsg, setNewComingMsg] = useState<DbEvent[]>([]);
  const [isLoadingMsg, setIsLoadingMsg] = useState<boolean>(false);
  const [isSubNewComingMsg, setIsSubNewComingMsg] = useState<boolean>(false);
  const [isPullRefreshing, setIsPullRefreshing] = useState<boolean>(false);
  const [isLoadMore, setIsLoadMore] = useState<boolean>(false);
  const [isDBNoData, setIsDBNoData] = useState<boolean>(false);

  const SUB_NEW_MSG_INTERVAL = 2000; // milsecs

  const relayUrls = useMemo(
    () => worker?.relays.map(r => r.url) || [],
    [worker?.relays],
  );
  const memoMsgList = useMemo(() => msgList, [msgList]);
  const queryCacheId = useMemo(
    () =>
      createQueryCacheId({
        msgId,
        msgFilter,
        isValidEvent,
        relayUrls,
      }),
    [msgId, msgFilter, isValidEvent, relayUrls],
  );
  const queryLoading = useMemo(
    () => isLoadingMsg && !isPullRefreshing,
    [isLoadingMsg, isPullRefreshing],
  );
  const fetchWhenDBNoDataLoading = useMemo(
    () => isDBNoData && isSubNewComingMsg,
    [isDBNoData, isSubNewComingMsg],
  );
  const scrollHeight = useScrollValue();

  const subNewComingMsg = useCallback(async () => {
    if (!worker) return;
    if (!msgFilter || !validateFilter(msgFilter)) return;
    if (isLoadingMsg || isPullRefreshing || isSubNewComingMsg) return;

    const request = async (latest: number | undefined) => {
      let since = msgFilter.since;
      if (latest) {
        if (since == null) {
          since = latest;
        } else {
          if (latest > since) {
            since = latest;
          }
        }
      } else {
        if (since == null) {
          since = 0;
        }
      }
      const filter = { ...msgFilter, since };

      const pks: string[] = [];
      let events: Event[] = [];

      console.debug('start sub msg..', filter, isValidEvent);
      const dataStream = worker.subFilter({ filter }).getIterator();
      for await (const data of dataStream) {
        const event = data.event;
        if (latest) {
          if (event.created_at <= latest) {
            continue;
          }
        }
        if (typeof isValidEvent === 'function') {
          try {
            const isValid = isValidEvent(event);
            if (!isValid) {
              continue;
            }
          } catch (error: any) {
            console.debug(error.message);
            continue;
          }
        }

        events.push(event);
        if (!pks.includes(event.pubkey)) {
          pks.push(event.pubkey);
        }
      }

      events = events
        .filter(e => {
          if (e.kind === WellKnownEventKind.community_approval) {
            try {
              const targetEvent = JSON.parse(e.content);
              if (latest && targetEvent.created_at <= latest) {
                return false;
              }
            } catch (error) {
              return false;
            }
          }
          return true;
        })
        .map(e => {
          if (e.kind === WellKnownEventKind.community_approval) {
            const event = { ...e, ...(JSON.parse(e.content) as DbEvent) };
            return event;
          }
          return e;
        });
      events = mergeAndSortUniqueDbEvents(events as any, events as any);
      console.log('sub diff: ', events.length, filter.since);
      dataStream.unsubscribe();
      console.debug('finished sub msg!');

      // sub user profiles
      if (pks.length > 0) {
        worker.subFilter({
          filter: {
            kinds: [WellKnownEventKind.set_metadata],
            authors: pks,
          },
        });
      }

      if (events.length > 0) {
        if (isDBNoData && msgList.length === 0) {
          setMsgList(events as DbEvent[]);
          setIsDBNoData(false);
        } else {
          setNewComingMsg(prev =>
            mergeAndSortUniqueDbEvents(events as any, prev),
          );
        }
      }
    };

    const latest =
      newComingMsg[0]?.created_at || memoMsgList[0]?.created_at || 0;
    setIsSubNewComingMsg(true);
    await request(latest);
    setIsSubNewComingMsg(false);
  }, [
    worker,
    msgId,
    msgFilter,
    newComingMsg,
    memoMsgList,
    isValidEvent,
    isLoadingMsg,
    isPullRefreshing,
    isSubNewComingMsg,
  ]);

  const loadMsgFromDb = useCallback(async () => {
    if (!msgFilter || !validateFilter(msgFilter)) return;
    setIsLoadingMsg(true);
    setNewComingMsg([]);
    setMsgList([]);

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
    console.log('load query: ', events.length, relayUrls, msgFilter);

    if (events.length === 0) {
      if (msgList.length === 0) {
        setIsDBNoData(true);
      }
      setIsLoadingMsg(false);
      return;
    }

    // save cache
    setMsgList(events);
    queryCache.set(queryCacheId, events);
    setIsDBNoData(false);

    setIsLoadingMsg(false);
  }, [msgId, msgFilter, isValidEvent, relayUrls, queryCache]);

  useLastReplyEvent({ msgList: memoMsgList, worker });
  useInterval(subNewComingMsg, SUB_NEW_MSG_INTERVAL);
  useRestoreScrollPos(scrollHeight, queryCacheId, memoMsgList.length > 0);

  useEffect(() => {
    if (!worker?.relayGroupId || relayUrls.length === 0) return;
    loadMsgFromDb();
  }, [msgId, msgFilter, isValidEvent, worker?.relayGroupId, relayUrls]);

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
    await loadMsgFromDb();
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
      <Loader isLoading={queryLoading || fetchWhenDBNoDataLoading} />
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
            {msgList.length === 0 && !isLoadingMsg && placeholder}
          </div>
        </>
      </PullToRefresh>
    </>
  );
};
