import { Avatar, Button } from 'antd';
import { Event } from 'core/nostr/Event';
import { dbQuery, dexieDb } from 'core/db';
import { Nip23 } from 'core/nip/23';
import { shortifyEventId, shortifyPublicKey } from 'core/nostr/content';
import { EventSetMetadataContent } from 'core/nostr/type';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { maxStrings } from 'utils/common';
import { CallWorker } from 'core/worker/caller';
import { useLiveQuery } from 'dexie-react-hooks';
import { Paths } from 'constants/path';

import styles from './index.module.scss';
import PostArticle from '../PostArticle';
import Link from 'next/link';

export interface SubPostItemProp {
  eventId: string;
  worker: CallWorker | undefined;
}

export const SubPostItem: React.FC<SubPostItemProp> = ({ eventId, worker }) => {
  const router = useRouter();
  const relayUrls = worker?.relays.map(r => r.url) || [];

  const event = useLiveQuery(
    dbQuery.createEventByIdQuerier(relayUrls, eventId),
    [eventId],
  );

  const [loadedUserProfile, setLoadedUserProfile] =
    useState<EventSetMetadataContent>();

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

  const tryReloadLastReplyEvent = () => {
    if (!eventId) return;

    worker?.subMsgByEventIds([eventId]);
  };

  useEffect(() => {
    loadUserProfile();
  }, [event]);

  if (event) {
    return Nip23.isBlogPost(event) ? (
      <PostArticle event={event} key={event.id} />
    ) : (
      <div className={styles.replyEvent}>
        <div
          className={styles.user}
          onClick={() => {
            router.push(`/user/${event.pubkey}`);
          }}
        >
          <Avatar src={loadedUserProfile?.picture} alt="picture" />
          <span className={styles.name}>
            {loadedUserProfile?.name || shortifyPublicKey(event.pubkey)}
          </span>
        </div>
        <div className={styles.content}>
          <div
            className={styles.event}
            onClick={() => {
              router.push(`/event/${event.id}`);
            }}
          >
            {maxStrings(event.content, 150)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.replyEvent}>
      <Link href={`${Paths.event + '/' + eventId}`}>
        event@{shortifyEventId(eventId)}
      </Link>
      <Button onClick={tryReloadLastReplyEvent} type="link">
        try reload
      </Button>
    </div>
  );
};
