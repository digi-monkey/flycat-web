import { Nip18 } from 'core/nip/18';
import { Event } from 'core/nostr/Event';
import { useEffect, useMemo, useState } from 'react';
import { EventWithSeen } from 'pages/type';
import { CallWorker } from 'core/worker/caller';
import { PostContent } from '../PostContent';
import { Paths } from 'constants/path';
import { deserializeMetadata, shortifyEventId } from 'core/nostr/content';
import { useLiveQuery } from 'dexie-react-hooks';
import { dbQuery, dexieDb } from 'core/db';
import { DbEvent } from 'core/db/schema';
import { PostUI } from '../PostItem/ui';

import styles from '../index.module.scss';
import Link from 'next/link';
import Icon from 'components/Icon';
import { Button } from 'components/shared/ui/Button';

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
  const [targetEvent, setTargetMsg] = useState<EventWithSeen | DbEvent>();

  const repostTargetEventIdFromETag = useMemo(
    () => Nip18.getTargetEventIdRelay(event).id,
    [event],
  );

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
  const [targetEventFromDb] = useLiveQuery(
    dbQuery.createEventByIdQuerier(
      relayUrls,
      Nip18.getTargetEventIdRelay(event).id || '',
    ),
    [event],
    [],
  );

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
  const profileEvents = useLiveQuery(
    async () => {
      const events = await dexieDb.profileEvent.bulkGet(pks);
      return events.filter(e => e != null) as DbEvent[];
    },
    [targetEvent],
    [] as DbEvent[],
  );

  const getUser = (pubkey: string) => {
    const user = profileEvents.find(e => e.pubkey === pubkey);
    if (user) {
      return deserializeMetadata(user.content);
    }
    return null;
  };

  const tryReload = () => {
    const info = Nip18.getTargetEventIdRelay(event);
    if (info.id) {
      worker.subMsgByEventIds([info.id]).iterating({
        cb: (event, url) => {
          setTargetMsg({ ...event, ...{ seen: [url!] } });
        },
      });
    }
  };

  const repostHeader = (
    <div className={styles.repost}>
      <Icon type="icon-repost" />
      <Link href={`${Paths.user + event.pubkey}`}>
        {getUser(event.pubkey)?.name}
      </Link>
      just repost
    </div>
  );

  return (
    <div className={styles.post} key={event.id}>
      {repostHeader}
      {targetEvent ? (
        <PostUI
          content={
            <PostContent
              ownerEvent={targetEvent}
              worker={worker}
              showLastReplyToEvent={showLastReplyToEvent}
            />
          }
          profile={getUser(targetEvent.pubkey)}
          event={targetEvent as DbEvent}
          worker={worker}
        />
      ) : (
        <div className={styles.content}>
          <Link href={`${Paths.event + '/' + event.id}`}>
            event@
            {repostTargetEventIdFromETag
              ? shortifyEventId(repostTargetEventIdFromETag)
              : 'unkonw'}
          </Link>
          <Button onClick={tryReload} variant="link">
            try reload
          </Button>
        </div>
      )}
    </div>
  );
};

export default PostRepost;
