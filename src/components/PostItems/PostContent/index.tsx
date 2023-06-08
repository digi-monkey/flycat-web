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
import { shortPublicKey } from 'service/helper';
import { CallWorker } from 'service/worker/callWorker';

interface PostContentProp {
  ownerEvent: Event;
  userMap: UserMap;
  worker: CallWorker;
}

export const PostContent: React.FC<PostContentProp> = ({
  userMap,
  ownerEvent: msgEvent,
  worker,
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
