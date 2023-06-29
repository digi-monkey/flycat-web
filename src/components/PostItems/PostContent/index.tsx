import { EventMap, EventTags } from 'core/nostr/type';
import { Event } from 'core/nostr/Event';
import { UserMap } from 'core/nostr/type';
import { useTranslation } from 'next-i18next';
import { useEffect, useState } from 'react';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { useLoadSelectedRelays } from 'components/RelaySelector/hooks/useLoadSelectedRelays';
import { Relay } from 'core/relay/type';
import { extractEmbedRef } from './Embed/util';
import { transformRefEmbed } from './Embed';
import { MediaPreviews } from './Media';
import { OneTimeWebSocketClient } from 'core/websocket/onetime';
import styles from './index.module.scss';
import { Avatar } from 'antd';
import { normalizeContent, shortifyPublicKey } from 'core/nostr/content';
import { CallWorker } from 'core/worker/caller';
import { Nip23 } from 'core/nip/23';
import PostArticle from '../PostArticle';

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
  const [contentComponents, setContentComponents] = useState<any[]>([]);
  const [lastReplyToEvent, setLastReplyToEvent] = useState<Event>();

  const { modifiedText } = normalizeContent(msgEvent.content);

  useLoadSelectedRelays(myPublicKey, (r: Relay[]) => {
    setRelayUrls(r.map(r => r.url));
  });

  useEffect(() => {
    transformContent();
    if (showLastReplyToEvent) {
      buildLastReplyEvent();
    }
  }, [modifiedText, userMap, relayUrls]);

  const transformContent = async () => {
    const ref = await extractEmbedRef(modifiedText, userMap, relayUrls);
    const result = transformRefEmbed(modifiedText, ref);
    setContentComponents(result);
  };

  const buildLastReplyEvent = async () => {
    const lastReply = msgEvent.tags
      .filter(t => t[0] === EventTags.E)
      .map(t => {
        return { id: t[1], relay: t[2] };
      })
      .pop();

    if (lastReply) {
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

  return (
    <div>
      <div>{contentComponents}</div>

      {showLastReplyToEvent && lastReplyToEvent && (
        <SubPostItem userMap={userMap} event={lastReplyToEvent} />
      )}

      <MediaPreviews content={msgEvent.content} />
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
      <div className={styles.content} onClick={clickEventBody}>
        {event.content}
        <MediaPreviews content={event.content} />
      </div>
    </div>
  );
};
