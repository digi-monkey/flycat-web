import { useTranslation } from 'react-i18next';
import { CallWorker } from 'service/worker/callWorker';
import {
  Event,
  EventETag,
  EventPTag,
  EventTags,
  EventZTag,
  RawEvent,
  WellKnownEventKind,
} from 'service/api';
import { Button } from 'antd';
import { Nip18 } from 'service/nip/18';
import { useSelector } from 'react-redux';
import { RootState } from 'store/configureStore';
import { UserMap } from 'service/type';
import { Nip57 } from 'service/nip/57';
import { payLnUrlInWebLn } from 'service/lighting/lighting';
import { Nip51 } from 'service/nip/51';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { fetchPublicBookmarkListEvent } from './util';
import { useState } from 'react';
import fetch from 'cross-fetch';

export const ReactionBtnGroups = ({
  ownerEvent,
  worker,
  seen,
  userMap,
}: {
  ownerEvent: Event;
  worker: CallWorker;
  seen: string[];
  userMap: UserMap;
}) => {
  const { t } = useTranslation();

  const myPublicKey = useReadonlyMyPublicKey();
  const signEvent = useSelector(
    (state: RootState) => state.loginReducer.signEvent,
  );

  const [isBookmarking, setIsBookMarking] = useState(false);

  const repost = async () => {
    if (signEvent == null) return;
    const rawEvent = Nip18.createRepost(ownerEvent, seen[0]);
    const event = await signEvent(rawEvent);
    worker.pubEvent(event);
    alert('published!');
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
      const profile = userMap.get(ownerEvent.pubkey);
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
    const amount = 210000;

    const api = lnurl
      ? `${zapEndpoint}?amount=${amount}&nostr=${eventStr}&lnurl=${lnurl}`
      : `${zapEndpoint}?amount=${amount}&nostr=${eventStr}`;
    const response = await fetch(api);
    const data = await response.json();
    if (data.pr) {
      payLnUrlInWebLn(data.pr);
    } else {
      alert(data);
    }
  };

  const comment = async () => {
    // todo: below is how to post a comment.
    // for the real case we should jump to the event page with comment input
    if (signEvent == null) return;

    const text = window.prompt('input the comment:');
    if (text == null) return;

    const rawEvent = new RawEvent(
      '',
      WellKnownEventKind.text_note,
      [
        [EventTags.E, ownerEvent.id, seen[0]] as EventETag,
        [EventTags.P, ownerEvent.pubkey, seen[0]] as EventPTag,
      ],
      text,
    );

    const event = await signEvent(rawEvent);
    worker?.pubEvent(event);
    alert('published!');
  };

  const bookmark = async () => {
    setIsBookMarking(true);
    if (signEvent == null) return;

    const result = await fetchPublicBookmarkListEvent(myPublicKey, worker);
    const eventIds = result
      ? result.tags.filter(t => t[0] === EventTags.E).map(t => t[1] as string)
      : [];
    eventIds.push(ownerEvent.id);

    console.log(result, eventIds);
    const rawEvent = await Nip51.createPublicNoteBookmarkList(eventIds);
    const event = await signEvent(rawEvent);

    worker?.pubEvent(event);
    setIsBookMarking(false);
    alert('published!');
  };

  return (
    <div style={{ marginTop: '15px' }}>
      <Button onClick={repost} disabled={!signEvent}>
        repost
      </Button>
      <Button onClick={zap} disabled={!signEvent}>
        zap
      </Button>
      <Button onClick={comment} disabled={!signEvent}>
        comment
      </Button>
      <Button loading={isBookmarking} onClick={bookmark} disabled={!signEvent}>
        bookmark
      </Button>
    </div>
  );
};
