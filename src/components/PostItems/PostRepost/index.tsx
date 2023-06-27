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
  const [msg, setMsg] = useState<Event>();

  const getRepostTargetEvent = async () => {
    const msg = await Nip18.getRepostTargetEvent(
      event,
      worker.relays.map(r => r.url),
    );
    if (msg) {
      setMsg(msg);
    }
  };

  useEffect(() => {
    getRepostTargetEvent();
  }, [event]);

  const getUser = (msg: EventWithSeen) => userMap.get(msg.pubkey);

  return (
    <div className={styles.post} key={event.id}>
      <div className={styles.repost}>
        <Icon type="icon-repost" />
        <Link href={`${Paths.user + event.pubkey}`}>
          {getUser(event)?.name}
        </Link>
        just repost
      </div>
      {msg ? (
        <>
          <PostUser
            publicKey={msg.pubkey}
            avatar={getUser(msg)?.picture || ''}
            name={getUser(msg)?.name}
            time={msg.created_at}
	    event={msg}
          />
          <div className={styles.content}>
            <PostContent
              ownerEvent={msg}
              userMap={userMap}
              worker={worker}
              eventMap={eventMap}
              showLastReplyToEvent={showLastReplyToEvent}
            />
            <PostReactions
              ownerEvent={msg}
              worker={worker}
              seen={[]}
              userMap={userMap}
            />
          </div>
        </>
      ) : (
        <div className={styles.content}>
          <p>
            <Link href={`${Paths.event + '/' + event.id}`}>event@{event.id}</Link>
          </p>
        </div>
      )}
    </div>
  );
};

export default PostRepost;
