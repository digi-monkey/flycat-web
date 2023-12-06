import { Nip18 } from 'core/nip/18';
import { Event } from 'core/nostr/Event';
import { useEffect, useState } from 'react';
import { EventWithSeen } from 'pages/type';
import { CallWorker } from 'core/worker/caller';
import { PostContent } from '../PostContent';
import { Paths } from 'constants/path';
import { toUnSeenEvent } from 'core/nostr/util';
import { Button } from 'antd';
import { deserializeMetadata, shortifyEventId } from 'core/nostr/content';
import { useLiveQuery } from 'dexie-react-hooks';
import { dbQuery, dexieDb } from 'core/db';
import { DbEvent } from 'core/db/schema';

import PostUser from '../PostUser';
import styles from '../index.module.scss';
import PostReactions from '../PostReactions';
import Link from 'next/link';
import Icon from 'components/Icon';

export interface PostRepostProp {
  event: Event;
  worker: CallWorker;
  showLastReplyToEvent?: boolean;
}

const PostRepost: React.FC<PostRepostProp> = ({
  event,
  worker,
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

  const relayUrls = worker.relays.map(r => r.url) || [];
  const targetEventFromDb = useLiveQuery(dbQuery.createEventByIdQuerier(relayUrls, Nip18.getTargetEventIdRelay(event).id), [event,]);

  useEffect(() => {
    if (targetEvent == null) {
      if (targetEventFromDb) {
        setTargetMsg(targetEventFromDb);
      }
    }
  }, [targetEventFromDb]);

  const pks = [event.pubkey];
  if (targetEvent) {
    pks.push(targetEvent.pubkey);
  }
  const profileEvents = useLiveQuery(async () => {
    const events = await dexieDb.profileEvent.bulkGet(pks);
    return events.filter(e => e != null) as DbEvent[];
  }, [targetEvent], [] as DbEvent[]);
 
  const getUser = (pubkey: string) => {
    const user = profileEvents.find(e => e.pubkey === pubkey);
    if(user){
      return deserializeMetadata(user.content);
    }
    return null;
  }

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
          {getUser(event.pubkey)?.name}
        </Link>
        just repost
      </div>
      {targetEvent ? (
        <>
          <PostUser
            publicKey={targetEvent.pubkey}
            profile={getUser(targetEvent.pubkey)}
            event={targetEvent}
          />
          <div className={styles.content}>
            <PostContent
              ownerEvent={targetEvent}
              worker={worker}
              showLastReplyToEvent={showLastReplyToEvent}
            />
            <PostReactions
              ownerEvent={toUnSeenEvent(targetEvent)}
              worker={worker}
              seen={targetEvent.seen!}
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
