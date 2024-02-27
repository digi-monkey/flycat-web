import { dbQuery, dexieDb } from 'core/db';
import { Nip23 } from 'core/nip/23';
import { shortifyEventId } from 'core/nostr/content';
import { EventSetMetadataContent } from 'core/nostr/type';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { CallWorker } from 'core/worker/caller';
import { useLiveQuery } from 'dexie-react-hooks';
import { Paths } from 'constants/path';
import { SmallLoader } from 'components/Loader';
import { PostContent } from '../PostContent';
import { PostCommunityHeader } from '../PostCommunityHeader';

import styles from './sub.module.scss';
import PostArticle from '../PostArticle';
import Link from 'next/link';
import PostUser from '../PostUser';
import { Button } from 'components/shared/ui/Button';

export interface SubPostUIProp {
  eventId: string;
  worker: CallWorker | undefined;
}

export const SubPostUI: React.FC<SubPostUIProp> = ({ eventId, worker }) => {
  const router = useRouter();
  const relayUrls = worker?.relays.map(r => r.url) || [];

  const [event, loaded] = useLiveQuery(
    dbQuery.createEventByIdQuerier(relayUrls, eventId),
    [eventId],
    [null, false], // default result: makes 'loaded' false while loading
  );

  const [loadedUserProfile, setLoadedUserProfile] =
    useState<EventSetMetadataContent>();
  const [isReloading, setIsReloading] = useState<boolean>(false);

  const loadUserProfile = async () => {
    if (!event) return;
    const profileEvent = await dexieDb.profileEvent.get(event.pubkey);
    if (profileEvent) {
      const metadata = JSON.parse(
        profileEvent.content,
      ) as EventSetMetadataContent;
      setLoadedUserProfile(metadata);
    }
  };

  const tryReloadLastReplyEvent = async () => {
    if (!eventId || !worker) return;
    setIsReloading(true);
    const handle = worker.subMsgByEventIds([eventId]).getIterator();
    for await (const data of handle) {
      if (data.event.id == eventId) {
        setIsReloading(false);
        break;
      }
    }
    setIsReloading(false);
  };

  useEffect(() => {
    loadUserProfile();
  }, [event]);

  useEffect(() => {
    if (loaded && event == null) {
      tryReloadLastReplyEvent();
    }
  }, [loaded]);

  if (event) {
    return Nip23.isBlogPost(event) ? (
      <PostArticle event={event} key={event.id} />
    ) : (
      <div className={styles.replyEvent} key={event.id}>
        <PostCommunityHeader event={event} />
        <PostUser
          publicKey={event.pubkey}
          profile={loadedUserProfile}
          event={event}
        />
        <div className={styles.content}>
          <PostContent
            worker={worker}
            ownerEvent={event}
            showLastReplyToEvent={false}
            truncate={false}
          />
        </div>
      </div>
    );
  }

  const ReloadUI = isReloading ? (
    <SmallLoader isLoading={isReloading} />
  ) : (
    <>
      <Link href={`${Paths.event + '/' + eventId}`}>
        event@{shortifyEventId(eventId)}
      </Link>
      <Button onClick={tryReloadLastReplyEvent} variant="link">
        try reload
      </Button>
    </>
  );

  return (
    <div className={styles.replyEvent}>
      {loaded ? ReloadUI : <SmallLoader isLoading={true} />}
    </div>
  );
};
