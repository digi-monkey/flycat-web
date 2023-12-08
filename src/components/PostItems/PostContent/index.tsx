import { EventId, EventTags } from 'core/nostr/type';
import { Event } from 'core/nostr/Event';
import { useTranslation } from 'next-i18next';
import { useEffect, useRef, useState } from 'react';
import { Button } from 'antd';
import { shortifyEventId } from 'core/nostr/content';
import { CallWorker } from 'core/worker/caller';
import { Paths } from 'constants/path';
import { useLiveQuery } from 'dexie-react-hooks';
import { dbQuery } from 'core/db';
import { isNsfwEvent } from 'utils/validator';
import { renderContent } from './content';
import { transformText } from './text';

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
  worker?: CallWorker;
  showLastReplyToEvent?: boolean;
}

export const PostContent: React.FC<PostContentProp> = ({
  ownerEvent: msgEvent,
  worker,
  showLastReplyToEvent = true,
}) => {
  const { t } = useTranslation();
  const [lastReplyToEventId, setLastReplyToEventId] = useState<EventId>();

  const relayUrls = worker?.relays.map(r => r.url) || [];

  useEffect(() => {
    if (showLastReplyToEvent) {
      buildLastReplyEvent();
    }
  }, [msgEvent.id]);

  const lastReplyEventFromDb = useLiveQuery(
    dbQuery.createEventByIdQuerier(relayUrls, lastReplyToEventId),
    [relayUrls, lastReplyToEventId],
  );

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

    worker?.subMsgByEventIds([lastReplyToEventId]);
  };

  const [expanded, setExpanded] = useState(true);
  const [content, setContent] = useState<any[]>([]);

  const contentRef = useRef<HTMLDivElement>(null);

  const isOverflow =
    contentRef.current &&
    contentRef.current.scrollHeight > contentRef.current.clientHeight;

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  useEffect(() => {
    setContent(
      renderContent(
        transformText(
          msgEvent.content,
          msgEvent.tags
            .filter(t => t[0] === 't')
            .flat()
            .filter(t => t != 't'),
        ),
        0,
        isNsfwEvent(msgEvent),
      ),
    );
  }, []);

  return (
    <div>
      {expanded ? (
        content
      ) : (
        <div>
          <div
            ref={contentRef}
            style={{ maxHeight: '100px', overflow: 'scroll' }}
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
      </>
    </div>
  );
};

export default PostContent;
