import { EventId, EventTags } from 'core/nostr/type';
import { Event } from 'core/nostr/Event';
import { useTranslation } from 'next-i18next';
import { useEffect, useRef, useState } from 'react';
import { extractEmbedRef, getPubkeysFromEmbedRef } from './Embed/util';
import { transformRefEmbed } from './Embed';
import { MediaPreviews } from './Media';
import { Button } from 'antd';
import { normalizeContent, shortifyEventId } from 'core/nostr/content';
import { CallWorker } from 'core/worker/caller';
import { Paths } from 'constants/path';
import { useLiveQuery } from 'dexie-react-hooks';
import { dbQuery, dexieDb } from 'core/db';
import { DbEvent } from 'core/db/schema';
import { isNsfwEvent } from 'utils/validator';

import styles from './index.module.scss';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const SubPostItem = dynamic(
  async () => {
    const mod = await import('./subPostItem');
    return mod.SubPostItem;
  },
  { loading: () => <p>Loading sub post ...</p>, ssr: false, suspense: true },
);

interface PostContentProp {
  ownerEvent: Event;
  worker: CallWorker;
  showLastReplyToEvent?: boolean;
}

export const PostContent: React.FC<PostContentProp> = ({
  ownerEvent: msgEvent,
  worker,
  showLastReplyToEvent = true,
}) => {
  const { t } = useTranslation();
  const [contentComponents, setContentComponents] = useState<any[]>([]);
  const [lastReplyToEventId, setLastReplyToEventId] = useState<EventId>();

  const relayUrls = worker.relays.map(r => r.url);

  useEffect(() => {
    transformContent();
  }, [msgEvent.id]);

  useEffect(() => {
    if (showLastReplyToEvent) {
      buildLastReplyEvent();
    }
  }, [msgEvent.id]);

  const lastReplyEventFromDb = useLiveQuery(
    dbQuery.createEventByIdQuerier(relayUrls, lastReplyToEventId),
    [relayUrls, lastReplyToEventId],
  );

  const transformContent = async () => {
    const { modifiedText } = normalizeContent(msgEvent.content);
    const embedRef = await extractEmbedRef(modifiedText, relayUrls);
    const pks = getPubkeysFromEmbedRef(embedRef);
    const profileEvents = (await dexieDb.profileEvent.bulkGet(pks)).filter(
      e => e != null,
    ) as DbEvent[];
    const result = transformRefEmbed(modifiedText, embedRef, profileEvents);
    setContentComponents(result);
  };

  const buildLastReplyEvent = async () => {
    const lastReply = msgEvent.tags
      .filter(t => t[0] === EventTags.E)
      .map(t => {
        return { id: t[1], relay: t[2]?.split(',')[0] };
      })
      .pop();

    if (lastReply) {
      setLastReplyToEventId(lastReply.id);

      if (lastReplyEventFromDb) {
        return;
      }

      // fallback
      // if (lastReply.relay && lastReply.relay !== '') {
      //   const replyToEvent = await OneTimeWebSocketClient.fetchEvent({
      //     eventId: lastReply.id,
      //     relays: [lastReply.relay],
      //   });
      //   if (replyToEvent) {
      //     //setLastReplyToEvent(replyToEvent);
      //   }
      // }
    }
  };

  const tryReloadLastReplyEvent = () => {
    if (!lastReplyToEventId) return;

    worker.subMsgByEventIds([lastReplyToEventId]);
  };

  const [expanded, setExpanded] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const isOverflow =
    contentRef.current &&
    contentRef.current.scrollHeight > contentRef.current.clientHeight;

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  const content = <div>{contentComponents}</div>;

  return (
    <div>
      {expanded ? (
        content
      ) : (
        <div>
          <div
            ref={contentRef}
            style={{ maxHeight: '100px', overflow: 'hidden' }}
          >
            {content}
          </div>
          {isOverflow && (
            <Button
              className={styles.viewMore}
              type="link"
              onClick={toggleExpanded}
            >
              {' '}
              View More
            </Button>
          )}
        </div>
      )}
      <>
        {showLastReplyToEvent && lastReplyEventFromDb && (
          <SubPostItem event={lastReplyEventFromDb} />
        )}
        {showLastReplyToEvent && !lastReplyEventFromDb && lastReplyToEventId && (
          <div className={styles.replyEvent}>
            <Link href={`${Paths.event + '/' + lastReplyToEventId}`}>
              event@{shortifyEventId(lastReplyToEventId)}
            </Link>
            <Button onClick={tryReloadLastReplyEvent} type="link">
              try reload
            </Button>
          </div>
        )}
        <MediaPreviews
          isNsfw={isNsfwEvent(msgEvent)}
          content={msgEvent.content}
        />
      </>
    </div>
  );
};

export default PostContent;
