import { Event, EventTags, WellKnownEventKind } from 'service/api';
import { UserMap } from 'service/type';
import { useTranslation } from 'next-i18next';
import { useEffect, useState } from 'react';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { useLoadSelectedRelays } from 'components/RelaySelector/hooks/useLoadSelectedRelays';
import { Relay } from 'service/relay/type';
import { extractEmbedRef } from './Embed/util';
import { transformRefEmbed } from './Embed';
import { MediaPreviews } from './Media';
import { OneTimeWebSocketClient } from 'service/websocket/onetime';
import styles from './index.module.scss';
import { Avatar } from 'antd';
import { shortPublicKey } from 'service/helper';

interface PostContentProp {
  ownerEvent: Event;
  userMap: UserMap;
}

export const PostContent: React.FC<PostContentProp> = ({
  userMap,
  ownerEvent: msgEvent,
}) => {
  const { t } = useTranslation();
  const myPublicKey = useReadonlyMyPublicKey();
  const [relayUrls, setRelayUrls] = useState<string[]>([]);
  const [contentComponents, setContentComponents] = useState<any[]>([]);
  const [lastReplyToEvent, setLastReplyToEvent] = useState<Event>();

  useLoadSelectedRelays(myPublicKey, (r: Relay[]) => {
    setRelayUrls(r.map(r => r.url));
  });

  useEffect(() => {
    transformContent();
    buildLastReplyEvent();
  }, [msgEvent.content, userMap, relayUrls]);

  const transformContent = async () => {
    const ref = await extractEmbedRef(msgEvent.content, userMap, relayUrls);
    const result = transformRefEmbed(msgEvent.content, ref);
    setContentComponents(result);
  };

  const buildLastReplyEvent = async () => {
    const lastReply = msgEvent.tags
      .filter(t => t[0] === EventTags.E)
      .map(t => {
        return { id: t[1], relay: t[2] };
      })[0];
    if (lastReply) {
      const replyToEvent = await OneTimeWebSocketClient.fetchEvent({
        eventId: lastReply.id,
        relays:
          lastReply.relay && lastReply.relay !== ''
            ? [lastReply.relay]
            : relayUrls,
      });
      if (replyToEvent) setLastReplyToEvent(replyToEvent);
    }
  };

  return (
    <div>
      <div>{contentComponents}</div>

      {lastReplyToEvent && (
        <div className={styles.replyEvent}>
          <div>
            <Avatar
              src={userMap.get(lastReplyToEvent.pubkey)?.picture}
              alt="picture"
            />{' '}
            @
            {userMap.get(lastReplyToEvent.pubkey)?.name ||
              shortPublicKey(lastReplyToEvent.pubkey)}
          </div>
          {lastReplyToEvent.content}
          <MediaPreviews content={lastReplyToEvent.content} />
        </div>
      )}

      <MediaPreviews content={msgEvent.content} />
    </div>
  );
};
