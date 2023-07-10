import { EventId, EventMap, EventTags } from 'core/nostr/type';
import { Event } from 'core/nostr/Event';
import { UserMap } from 'core/nostr/type';
import { useTranslation } from 'next-i18next';
import { useEffect, useRef, useState } from 'react';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { useLoadSelectedRelays } from 'components/RelaySelector/hooks/useLoadSelectedRelays';
import { Relay } from 'core/relay/type';
import { extractEmbedRef } from './Embed/util';
import { transformRefEmbed } from './Embed';
import { MediaPreviews } from './Media';
import { OneTimeWebSocketClient } from 'core/api/onetime';
import styles from './index.module.scss';
import { Avatar, Button } from 'antd';
import {
  normalizeContent,
  shortifyEventId,
  shortifyPublicKey,
} from 'core/nostr/content';
import { CallWorker } from 'core/worker/caller';
import { Nip23 } from 'core/nip/23';
import PostArticle from '../PostArticle';
import Link from 'next/link';
import { Paths } from 'constants/path';
import { maxStrings } from 'utils/common';
import Icon from 'components/Icon';

interface PostContentProp {
  ownerEvent: Event;
  eventMap: EventMap;
  userMap: UserMap;
  worker: CallWorker;
  showLastReplyToEvent?: boolean;
}

export const PostContent: React.FC<PostContentProp> = ({
  userMap,
  eventMap,
  ownerEvent: msgEvent,
  worker,
  showLastReplyToEvent = true,
}) => {
  const { t } = useTranslation();
  const myPublicKey = useReadonlyMyPublicKey();
  const [relayUrls, setRelayUrls] = useState<string[]>([]);
  const [embedRef, setEmbedRef] = useState<any>();
  const [contentComponents, setContentComponents] = useState<any[]>([]);
  const [lastReplyToEvent, setLastReplyToEvent] = useState<Event>();
  const [lastReplyToEventId, setLastReplyToEventId] = useState<EventId>();

  useLoadSelectedRelays(myPublicKey, (r: Relay[]) => {
    setRelayUrls(r.map(r => r.url));
  });

  useEffect(() => {
    extractFromContent();
  }, [msgEvent.content, relayUrls]);

  useEffect(() => {
    if (!embedRef) return;

    transformContent();
  }, [embedRef, userMap]);

  useEffect(() => {
    if (showLastReplyToEvent) {
      buildLastReplyEvent();
    }
  }, [msgEvent.content]);

  useEffect(() => {
    if (lastReplyToEventId && eventMap.get(lastReplyToEventId)) {
      setLastReplyToEvent(eventMap.get(lastReplyToEventId));
    }
  }, [eventMap, lastReplyToEventId]);

  const transformContent = async () => {
    const { modifiedText } = normalizeContent(msgEvent.content);
    const result = transformRefEmbed(modifiedText, embedRef, userMap);
    setContentComponents(result);
  };

  const extractFromContent = async () => {
    const { modifiedText } = normalizeContent(msgEvent.content);
    const ref = await extractEmbedRef(modifiedText, userMap, relayUrls);
    setEmbedRef(ref);
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

      if (eventMap.get(lastReply.id)) {
        setLastReplyToEvent(eventMap.get(lastReply.id));
        return;
      }

      // fallback
      if (lastReply.relay && lastReply.relay !== '') {
        const replyToEvent = await OneTimeWebSocketClient.fetchEvent({
          eventId: lastReply.id,
          relays: [lastReply.relay],
        });
        if (replyToEvent) {
          setLastReplyToEvent(replyToEvent);
        }
      }
    }
  };

  const tryReloadLastReplyEvent = () => {
    if (!lastReplyToEventId) return;

    worker.subMsgByEventIds([lastReplyToEventId]).iterating({
      cb: (event, url) => {
        setLastReplyToEvent({ ...event, ...{ seen: [url!] } });
      },
    });
  };

  const [expanded, setExpanded] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const isOverflow =
    contentRef.current &&
    contentRef.current.scrollHeight > contentRef.current.clientHeight;

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  const content = (
    <div>
      <div>{contentComponents}</div>
      {showLastReplyToEvent && lastReplyToEvent && (
        <SubPostItem userMap={userMap} event={lastReplyToEvent} />
      )}
      {showLastReplyToEvent && !lastReplyToEvent && lastReplyToEventId && (
        <div className={styles.replyEvent}>
          <Link href={`${Paths.event + '/' + lastReplyToEventId}`}>
            event@{shortifyEventId(lastReplyToEventId)}
          </Link>
          <Button onClick={tryReloadLastReplyEvent} type="link">
            try reload
          </Button>
        </div>
      )}
      <MediaPreviews content={msgEvent.content} />
    </div>
  );

  return (
    <div>
      {expanded ? (
        content
      ) : (
        <div>
          <div
            ref={contentRef}
            style={{ maxHeight: '150px', overflow: 'hidden' }}
          >
            {content}
          </div>
          {isOverflow && 
            <div className={styles.expandContent}>
              <Icon type="icon-arrow-down" />
              <Button type='link' onClick={toggleExpanded}> Expand</Button>
            </div>
          }
        </div>
      )}
    </div>
  );
};

export interface SubPostItemProp {
  event: Event;
  userMap: UserMap;
}

export const SubPostItem: React.FC<SubPostItemProp> = ({ event, userMap }) => {
  const clickUserProfile = () => {
    window.location.href = `/user/${event.pubkey}`;
  };
  const clickEventBody = () => {
    window.location.href = `/event/${event.id}`;
  };

  return Nip23.isBlogPost(event) ? (
    <PostArticle
      userAvatar={userMap.get(event.pubkey)?.picture || ''}
      userName={userMap.get(event.pubkey)?.name || ''}
      event={event}
      key={event.id}
    />
  ) : (
    <div className={styles.replyEvent}>
      <div className={styles.user} onClick={clickUserProfile}>
        <Avatar src={userMap.get(event.pubkey)?.picture} alt="picture" />
        <span className={styles.name}>
          {userMap.get(event.pubkey)?.name || shortifyPublicKey(event.pubkey)}
        </span>
      </div>
      <div className={styles.content}>
        <div className={styles.event} onClick={clickEventBody}>
          {maxStrings(event.content, 150)}
        </div>
        <MediaPreviews content={event.content} />
      </div>
    </div>
  );
};
