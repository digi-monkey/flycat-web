import { Button, message } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
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
import {
  createQueryCacheId,
  queryCache,
  scrollPositionCache,
} from 'core/cache/query';
import { useIntersectionObserver, useInterval } from 'usehooks-ts';

import PullToRefresh from 'react-simple-pull-to-refresh';
import classNames from 'classnames';
import PostItems from 'components/PostItems';
import styles from './index.module.scss';
import useScrollValue from './hook/useScrollValue';

export interface MsgSubProp {
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
  const { msgFilter, isValidEvent, placeholder } = msgSubProp;

  const [msgList, setMsgList] = useState<DbEvent[]>([]);
  const [newComingMsg, setNewComingMsg] = useState<DbEvent[]>([]);
  const [isLoadingMsg, setIsLoadingMsg] = useState<boolean>(false);
  const [isPullRefreshing, setIsPullRefreshing] = useState<boolean>(false);
  const [isLoadMore, setIsLoadMore] = useState<boolean>(false);

  const newMsgNotifyRef = useRef<HTMLDivElement | null>(null);
  const entry = useIntersectionObserver(newMsgNotifyRef, {});
  const isNotifyVisible = !!entry?.isIntersecting;

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
  const scrollHeight = useScrollValue();

  const subNewMsg = async () => {
    if (!worker) return;
    if (!msgFilter || !validateFilter(msgFilter)) return;
    if (isLoadingMsg || isPullRefreshing) return;

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

      console.debug(
        'start sub msg..',
        filter,
        isValidEvent,
        typeof isValidEvent,
      );
      const dataStream = worker.subFilter({ filter }).getIterator();
      for await (const data of dataStream) {
        const event = data.event;
        if (isValidEvent) {
          if (!isValidEvent(event)) {
            continue;
          }
        }
        if (latest) {
          if (event.created_at <= latest) {
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
      console.log('sub diff: ', events, events.length, filter);
      setNewComingMsg(prev => mergeAndSortUniqueDbEvents(events as any, prev));

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
    };

    const latest = memoMsgList[0]?.created_at || 0;
    request(latest);
  };

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
    if (events.length > 0) {
      queryCache.set(queryCacheId, events);
    }

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

  useLastReplyEvent({ msgList: memoMsgList, worker });
  useInterval(subNewMsg, 8000);

  // remember and restore the last visit position in the feed
  // todo: better way to do this?
  useEffect(() => {
    if (scrollHeight > 0) {
      scrollPositionCache.set(queryCacheId, scrollHeight);
    }
  }, [scrollHeight]);
  useEffect(() => {
    const pos = scrollPositionCache.get(queryCacheId);
    if (pos && memoMsgList.length > 0) {
      window.scrollTo({ top: pos, behavior: 'instant' as ScrollBehavior });
    }
  }, [queryCacheId, memoMsgList.length > 0]);

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
    if (!isNotifyVisible) {
      window.scrollTo({ top: 0 });
    }
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
            <div ref={newMsgNotifyRef} className={styles.reloadFeedBtn}>
              <Button onClick={onClickNewMsg} type="link">
                Show {newComingMsg.length} new posts
              </Button>
            </div>
          )}

          {newComingMsg.length > 0 && !isNotifyVisible && (
            <div className={classNames(styles.reloadFeedBtn, styles.fixed)}>
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
