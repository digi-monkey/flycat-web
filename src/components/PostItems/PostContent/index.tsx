import {
  Event,
  EventSubResponse,
  EventTags,
  WellKnownEventKind,
  isEventSubResponse,
} from 'service/api';
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
import { normalizeContent, shortPublicKey } from 'service/helper';
import { CallWorker } from 'service/worker/callWorker';
import { EventWithSeen } from 'pages/type';

interface PostContentProp {
  ownerEvent: Event;
  userMap: UserMap;
  worker: CallWorker;
  showLastReplyToEvent?: boolean;
}

export const PostContent: React.FC<PostContentProp> = ({
  userMap,
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
      }).pop();
      
    if (lastReply) {
      const handler = worker.subMsgByEventIds([lastReply.id])!;
      const dataStream = handler.getIterator();
      let result: Event | undefined;
      for await (const data of dataStream) {
        const msg = JSON.parse(data.nostrData);
        if (isEventSubResponse(msg)) {
          const event = (msg as EventSubResponse)[2];

          if (event.kind !== WellKnownEventKind.text_note) continue;

          if (!result) {
            result = event;
          }

          if (result && result.created_at < event.created_at) {
            result = event;
          }
        }
      }

      if (result) {
        setLastReplyToEvent(result);
        return;
      }

      // fallback
      if (lastReply.relay && lastReply.relay !== '') {
        const replyToEvent = await OneTimeWebSocketClient.fetchEvent({
          eventId: lastReply.id,
          relays: [lastReply.relay],
        });
        if (replyToEvent) setLastReplyToEvent(replyToEvent);
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
  return (
    <div className={styles.replyEvent}>
      <div className={styles.user} onClick={clickUserProfile}>
        <Avatar src={userMap.get(event.pubkey)?.picture} alt="picture" /> @
        {userMap.get(event.pubkey)?.name || shortPublicKey(event.pubkey)}
      </div>
      <div className={styles.content} onClick={clickEventBody}>
        {event.content}
        <MediaPreviews content={event.content} />
      </div>
    </div>
  );
};
