import { Button, message } from 'antd';
import { useEffect, useState } from 'react';
import { CallWorker } from 'core/worker/caller';
import { Filter, WellKnownEventKind } from 'core/nostr/type';
import { _handleEvent } from 'components/Comments/util';
import { Event } from 'core/nostr/Event';
import { useLastReplyEvent } from './hook/useSubLastReply';
import { useLoadMoreMsg } from './hook/useLoadMoreMsg';
import { useTranslation } from 'react-i18next';
import { dbQuery } from 'core/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { DbEvent } from 'core/db/schema';
import { validateFilter } from './util';
import { useSubMsg } from './hook/useSubMsg';
import { mergeAndSortUniqueDbEvents } from 'utils/common';
import { noticePubEventResult } from 'components/PubEventNotice';

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
  const [loadMoreCount, setLoadMoreCount] = useState<number>(1);
  const [msgList, setMsgList] = useState<DbEvent[]>([]);
  const [newComingMsg, setNewComingMsg] = useState<DbEvent[]>([]);

  const maxMsgLength = _maxMsgLength || 50;
  const relayUrls = worker?.relays.map(r => r.url) || [];

  useSubMsg({
    msgFilter,
    isValidEvent,
    worker,
  });
  useLastReplyEvent({ msgList, worker });
  useLoadMoreMsg({
    msgFilter,
    isValidEvent,
    msgList,
    worker,
    setMsgList,
    loadMoreCount,
  });

  useLiveQuery(
    async () => {
      if (!msgFilter || !validateFilter(msgFilter)) return [] as DbEvent[];
      if (msgList.length === 0) return [] as DbEvent[];

      const lastMsgItem = msgList[0];
      const since = lastMsgItem.created_at;
      const filter = { ...msgFilter, since };
      let events = await dbQuery.matchFilterRelay(
        filter,
        relayUrls,
        isValidEvent,
      );
      events = events
        .filter(e => {
          if (e.kind === WellKnownEventKind.community_approval) {
            try {
              const targetEvent = JSON.parse(e.content);
              if (targetEvent.created_at <= lastMsgItem.created_at) {
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
      events = mergeAndSortUniqueDbEvents(events, events);
      console.log('query diff: ', events, events.length, filter);
      setNewComingMsg(prev => mergeAndSortUniqueDbEvents(events, prev));
    },
    [msgSubProp, msgList[0]],
    [] as DbEvent[],
  );

  const query = async () => {
    if (!msgFilter || !validateFilter(msgFilter)) return [] as DbEvent[];
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
  };

  useEffect(() => {
    if (!worker?.relayGroupId || !worker?.relays || worker?.relays.length === 0)
      return;
    setNewComingMsg([]);
    setMsgList([]);

    query();
  }, [msgFilter, worker?.relayGroupId]);

  const onClickNewMsg = () => {
    setMsgList(prev =>
      mergeAndSortUniqueDbEvents(newComingMsg, prev).slice(0, maxMsgLength),
    );
    setNewComingMsg([]);
  };

  const onPullToRefresh = async () => {
    if (!msgFilter || !validateFilter(msgFilter)) return;

    console.log("refresh!");
    worker?.subFilter({ filter: msgFilter });
    await query();
  }

  const onBroadcastEvent = async (event: Event, msg: typeof message) => {
    if (!worker) return msg.error("worker not found.");
    const pubHandler = worker.pubEvent(event);
    noticePubEventResult(worker.relays.length, pubHandler);
  }

  const extraMenu = [
    {
      label: "broadcast",
      onClick: onBroadcastEvent
    }
  ]

  return (
    <>
      <PullToRefresh
        onRefresh={onPullToRefresh}
      >
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
                  msgList={msgList}
                  worker={worker!}
                  relays={relayUrls}
                  showLastReplyToEvent={true}
                  extraMenu={extraMenu}
                />
              </div>
              <Button
                type="link"
                block
                onClick={() => setLoadMoreCount(prev => prev + 1)}
              >
                {t('home.loadMoreBtn')}
              </Button>
              <br />
              <br />
              <br />
              <br />
              <br />
            </>
          )}
          {msgList.length === 0 && emptyDataReactNode}
        </div>
        </>
      </PullToRefresh>
    </>
  );
};
