import { Tooltip, message } from 'antd';
import { useTranslation } from 'next-i18next';
import { fetchPublicBookmarkListEvent } from 'components/PostItems/PostReactions/util';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  EventSetMetadataContent,
  EventTags,
  EventZTag,
  WellKnownEventKind,
} from 'core/nostr/type';
import { Event } from 'core/nostr/Event';
import { sendPaymentInWebLn } from 'core/lighting/lighting';
import { Nip18 } from 'core/nip/18';
import { Nip51 } from 'core/nip/51';
import { Nip57 } from 'core/nip/57';
import { CallWorker } from 'core/worker/caller';
import { RootState } from 'store/configureStore';
import { noticePubEventResult } from 'components/PubEventNotice';
import { useRouter } from 'next/router';
import { dexieDb } from 'core/db';

import Icon from 'components/Icon';
import styles from './index.module.scss';

interface PostReactionsProp {
  ownerEvent: Event;
  worker: CallWorker;
  seen: string[];
}

const PostReactions: React.FC<PostReactionsProp> = ({
  ownerEvent,
  worker,
  seen,
}) => {
  const { t } = useTranslation();

  const router = useRouter();
  const myPublicKey = useReadonlyMyPublicKey();
  const signEvent = useSelector(
    (state: RootState) => state.loginReducer.signEvent,
  );
  const [messageApi, contextHolder] = message.useMessage();
  const [isBookmarking, setIsBookMarking] = useState(false);

  const repost = async () => {
    if (signEvent == null) return;
    if (seen == null || seen[0] == null)
      return messageApi.error('repost required seen relay, not found!');
    if (ownerEvent.kind !== WellKnownEventKind.text_note)
      return messageApi.error(
        'non kind-1 repost feature are not available now, WIP',
      );

    const rawEvent = Nip18.createRepost(ownerEvent, seen[0]);
    const event = await signEvent(rawEvent);
    const handler = worker.pubEvent(event);
    noticePubEventResult(handler);
  };

  const zap = async () => {
    if (signEvent == null) return;

    let zapEndpoint: any = null;
    let lnurl: string | undefined;
    const zapTags = ownerEvent.tags.filter(t => t[0] === EventTags.Z);
    if (zapTags.length > 0) {
      const zapTag = zapTags[0] as EventZTag;
      zapEndpoint = await Nip57.getZapEndpointByTag(zapTag);
    } else {
      let profile: EventSetMetadataContent | undefined;
      const profileEvent = await dexieDb.profileEvent.get(ownerEvent.pubkey); 
      if (profileEvent) {
        const metadata = JSON.parse(
          profileEvent.content,
        ) as EventSetMetadataContent;
        profile = metadata;
      }
      if (profile) zapEndpoint = await Nip57.getZapEndpointByProfile(profile);
      if (profile?.lud06) {
        lnurl = profile.lud06;
      }
    }
    if (zapEndpoint == null) return;

    const relays = seen;
    const receipt = ownerEvent.pubkey;
    const e = ownerEvent.id;

    const rawEvent = Nip57.createRequest({ relays, receipt, e, lnurl });
    const event = await signEvent(rawEvent);
    const eventStr = encodeURI(JSON.stringify(event));
    const amount = 21000; // 21 sats

    const api = lnurl
      ? `${zapEndpoint}?amount=${amount}&nostr=${eventStr}&lnurl=${lnurl}`
      : `${zapEndpoint}?amount=${amount}&nostr=${eventStr}`;
    const response = await fetch(api);
    const data = await response.json();
    if (data.pr) {
      sendPaymentInWebLn(data.pr);
    } else {
      messageApi.error(
        `something seems wrong with the zap endpoint response data`,
      );
      console.debug(`invalid zapEndpoint response data`, data);
    }
  };

  const comment = async () => {
    router.push(`/event/${ownerEvent.id}`);
  };

  const bookmark = async () => {
    if (signEvent == null) return;
    if (!worker == null) return;
    if (isBookmarking) return messageApi.error('already execute bookmarking..');

    setIsBookMarking(true);

    const result = await fetchPublicBookmarkListEvent(myPublicKey, worker);
    const eventIds = result
      ? result.tags.filter(t => t[0] === EventTags.E).map(t => t[1] as string)
      : [];
    eventIds.push(ownerEvent.id);

    console.debug('bookmarking..', result, eventIds);
    const rawEvent = await Nip51.createPublicNoteBookmarkList(eventIds);
    const event = await signEvent(rawEvent);

    const handler = worker.pubEvent(event);
    noticePubEventResult(handler);
    setIsBookMarking(false);
  };

  return (
    <ul className={styles.reactions}>
      {contextHolder}
      <li>
        <Tooltip placement="top" title={'repost'}>
          <Icon onClick={repost} type="icon-repost" className={styles.upload} />
        </Tooltip>
      </li>
      <li>
        <Tooltip placement="top" title={'zap'}>
          <Icon onClick={zap} type="icon-bolt" className={styles.upload} />
        </Tooltip>
      </li>
      <li>
        <Tooltip placement="top" title={'comment'}>
          <Icon
            onClick={comment}
            type="icon-comment"
            className={styles.upload}
          />
        </Tooltip>
      </li>
      <li>
        <Tooltip placement="top" title={'bookmark'}>
          <Icon
            style={{ cursor: isBookmarking ? 'not-allowed' : 'pointer' }}
            onClick={bookmark}
            type="icon-bookmark"
            className={styles.upload}
          />
        </Tooltip>
      </li>
    </ul>
  );
};

export default PostReactions;
