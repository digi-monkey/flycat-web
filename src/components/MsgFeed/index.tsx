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

export interface MsgFeedProp {
  msgFilter: Filter;
  isValidEvent?: (event: Event) => boolean;
  worker: CallWorker | undefined;
  newConn: string[];
  userMap: UserMap;
  setUserMap: Dispatch<SetStateAction<UserMap>>;
  eventMap: EventMap;
  setEventMap: Dispatch<SetStateAction<EventMap>>;
  emptyDataReactNode: React.ReactNode;
}

export const MsgFeed: React.FC<MsgFeedProp> = ({
  msgFilter,
  isValidEvent,
  worker,
  newConn,
  userMap,
  setUserMap,
  eventMap,
  setEventMap,
  emptyDataReactNode,
}) => {
  const { t } = useTranslation();
  const [loadMoreCount, setLoadMoreCount] = useState<number>(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [msgList, setMsgList] = useState<EventWithSeen[]>([]);

  const maxMsgLength = 50;
  const relayUrls = worker?.relays.map(r => r.url) || [];

  useSubMsg({
    msgFilter,
    isValidEvent,
    setIsRefreshing,
    worker,
    newConn,
    setMsgList,
    setUserMap,
    setEventMap,
    maxMsgLength,
  });
  useLastReplyEvent({ msgList, worker, userMap, setUserMap, setEventMap });
  useLoadMoreMsg({
    msgFilter,
    isValidEvent,
    msgList,
    worker,
    setEventMap,
    maxMsgLength,
    setMsgList,
    loadMoreCount,
  });

  useEffect(() => {
    return () => {
      setMsgList([]);
    };
  }, []);

  return (
    <>
      <div className={styles.reloadFeedBtn}>
        <Button
          loading={isRefreshing}
          type="link"
          block
          onClick={async () => {
            setIsRefreshing(true);
            await subMsgAsync({
              msgFilter,
              worker,
              setMsgList,
              setEventMap,
              maxMsgLength,
            });
            setIsRefreshing(false);
          }}
        >
          Refresh timeline
        </Button>
      </div>
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
                userMap={userMap}
                relays={relayUrls}
                eventMap={eventMap}
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
