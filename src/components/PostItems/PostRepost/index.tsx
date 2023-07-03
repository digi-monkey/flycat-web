import { Nip18 } from 'core/nip/18';
import { Event } from 'core/nostr/Event';
import PostUser from '../PostUser';
import styles from '../index.module.scss';
import { useEffect, useState } from 'react';
import { EventWithSeen } from 'pages/type';
import { UserMap, EventMap } from 'core/nostr/type';
import { CallWorker } from 'core/worker/caller';
import { PostContent } from '../PostContent';
import PostReactions from '../PostReactions';
import Link from 'next/link';
import { Paths } from 'constants/path';
import Icon from 'components/Icon';
import { toUnSeenEvent } from 'core/nostr/util';
import { Button } from 'antd';
import { shortifyEventId } from 'core/nostr/content';

export interface PostRepostProp {
  event: Event;
  worker: CallWorker;
  userMap: UserMap;
  eventMap: EventMap;
  showLastReplyToEvent?: boolean;
}

const PostRepost: React.FC<PostRepostProp> = ({
  event,
  userMap,
  worker,
  eventMap,
  showLastReplyToEvent,
}) => {
  const [targetEvent, setTargetMsg] = useState<EventWithSeen>();

  const getRepostTargetEvent = async () => {
    const msg = await Nip18.getRepostTargetEvent(
      event,
      worker.relays.map(r => r.url),
    );
    if (msg) {
      setTargetMsg(msg);
      return;
    }
  };

  useEffect(() => {
    getRepostTargetEvent();
  }, [event]);

  useEffect(() => {
    if (targetEvent == null) {
      const info = Nip18.getTargetEventIdRelay(event);
      const target = eventMap.get(info.id);
      if (target) {
        setTargetMsg(target);
      }
    }
  }, [eventMap]);

  const getUser = (msg: EventWithSeen) => userMap.get(msg.pubkey);

  const tryReload = () => {
    const info = Nip18.getTargetEventIdRelay(event);
    worker.subMsgByEventIds([info.id]).iterating({
      cb: (event, url) => {
        setTargetMsg({ ...event, ...{ seen: [url!] } });
      },
    });
  };

  return (
    <div className={styles.post} key={event.id}>
      <div className={styles.repost}>
        <Icon type="icon-repost" />
        <Link href={`${Paths.user + event.pubkey}`}>
          {getUser(event)?.name}
        </Link>
        just repost
      </div>
      {targetEvent ? (
        <>
          <PostUser
            publicKey={targetEvent.pubkey}
            avatar={getUser(targetEvent)?.picture || ''}
            name={getUser(targetEvent)?.name}
            time={targetEvent.created_at}
            event={targetEvent}
          />
          <div className={styles.content}>
            <PostContent
              ownerEvent={targetEvent}
              userMap={userMap}
              worker={worker}
              eventMap={eventMap}
              showLastReplyToEvent={showLastReplyToEvent}
            />
            <PostReactions
              ownerEvent={toUnSeenEvent(targetEvent)}
              worker={worker}
              seen={targetEvent.seen!}
              userMap={userMap}
            />
          </div>
        </>
      ) : (
        <div className={styles.content}>
          <Link href={`${Paths.event + '/' + event.id}`}>
            event@{shortifyEventId(Nip18.getTargetEventIdRelay(event).id)}
          </Link>
          <Button onClick={tryReload} type="link">
            try reload
          </Button>
        </div>
      )}
    </div>
  );
};

export default PostRepost;
