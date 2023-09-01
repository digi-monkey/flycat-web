import { Button } from 'antd';

import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { EventWithSeen } from 'pages/type';
import { CallWorker } from 'core/worker/caller';
import { EventMap, Filter, UserMap } from 'core/nostr/type';
import { _handleEvent } from 'components/Comments/util';
import { Event } from 'core/nostr/Event';
import { subMsgAsync, useSubMsg } from './hook/useSubMsg';
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

export interface MsgSubProp {
  msgFilter?: Filter;
  isValidEvent?: (event: Event) => boolean;
  emptyDataReactNode?: React.ReactNode;
}

export interface MsgFeedProp {
  msgSubProp: MsgSubProp;
  worker: CallWorker | undefined;
  newConn: string[];
  maxMsgLength?: number;
}

export const MsgFeed: React.FC<MsgFeedProp> = ({
  msgSubProp,
  worker,
  newConn,
  maxMsgLength: _maxMsgLength
}) => {
  const { t } = useTranslation();
  const { msgFilter, isValidEvent, emptyDataReactNode } = msgSubProp;
  const [loadMoreCount, setLoadMoreCount] = useState<number>(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [msgList, setMsgList] = useState<EventWithSeen[]>([]);

  const maxMsgLength = _maxMsgLength || 50;
  const relayUrls = worker?.relays.map(r => r.url) || [];

  useSubMsg({
    msgFilter,
    isValidEvent,
    setIsRefreshing,
    worker,
    newConn,
  });
  useLastReplyEvent({ msgList, worker });
  useLoadMoreMsg({
    msgFilter,
    isValidEvent,
    msgList,
    worker,
    maxMsgLength,
    setMsgList,
    loadMoreCount,
  });

  useLiveQuery(async () => {
    if(!msgFilter || !validateFilter(msgFilter))return [] as DbEvent[];
    let events = await dbQuery.matchFilterRelay(msgFilter, relayUrls);
    if(isValidEvent){
      events = events.filter(e => isValidEvent(e));
    }
    console.log("query: ", events.length, relayUrls, msgFilter);
    setMsgList(events);
  }, [msgSubProp], [] as DbEvent[]);

  return (
    <>
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
