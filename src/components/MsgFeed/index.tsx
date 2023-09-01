import { Button } from 'antd';

import { useEffect, useState } from 'react';
import { CallWorker } from 'core/worker/caller';
import { Filter } from 'core/nostr/type';
import { _handleEvent } from 'components/Comments/util';
import { Event } from 'core/nostr/Event';
import { useLastReplyEvent } from './hook/useSubLastReply';
import { useLoadMoreMsg } from './hook/useLoadMoreMsg';
import { useTranslation } from 'react-i18next';

import classNames from 'classnames';
import PostItems from 'components/PostItems';
import styles from './index.module.scss';
import { dbQuery } from 'core/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { DbEvent } from 'core/db/schema';
import { validateFilter } from './util';
import { useSubMsg } from './hook/useSubMsg';

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

      const filter = { ...msgFilter, ...{ since: msgList[0].created_at } };
      let events = await dbQuery.matchFilterRelay(filter, relayUrls);
      if (isValidEvent) {
        events = events.filter(e => isValidEvent(e));
      }
      console.log('query diff: ', events.length, filter);
      setNewComingMsg(prev => events.concat(prev));
    },
    [msgSubProp, msgList[0]],
    [] as DbEvent[],
  );

  const query = async () => {
    if (!msgFilter || !validateFilter(msgFilter)) return [] as DbEvent[];
    let events = await dbQuery.matchFilterRelay(msgFilter, relayUrls);
    if (isValidEvent) {
      events = events.filter(e => isValidEvent(e));
    }
    console.log('query: ', events.length, relayUrls, msgFilter);
    setMsgList(events);
  };

  useEffect(() => {
    setNewComingMsg([]);
    setMsgList([]);

    query();
  }, [msgFilter, worker?.relayGroupId]);

  const onClickNewMsg = () => {
    setMsgList(prev => newComingMsg.concat(prev).slice(0, maxMsgLength));
    setNewComingMsg([]);
  };

  return (
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
  );
};
