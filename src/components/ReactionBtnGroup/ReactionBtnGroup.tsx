import { useTranslation } from 'react-i18next';
import { CallWorker } from 'service/worker/callWorker';
import { Event, EventTags, EventZTag } from 'service/api';
import { Button } from 'antd';
import { Nip18 } from 'service/nip/18';
import { useSelector } from 'react-redux';
import { RootState } from 'store/configureStore';
import { UserMap } from 'service/type';
import { Nip57 } from 'service/nip/57';
import { bech32Encode } from 'service/crypto';
import fetch from 'cross-fetch';
import { payLnUrlInWebLn } from 'service/lighting/lighting';

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

  const signEvent = useSelector(
    (state: RootState) => state.loginReducer.signEvent,
  );

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
      // todo: fix lnurl
      //lnurl = bech32Encode(zapTag[1], 'lnurl');
    } else {
      const profile = userMap.get(ownerEvent.pubkey);
      if (profile) zapEndpoint = await Nip57.getZapEndpointByProfile(profile);
      if (profile?.lud16) {
        // todo: fix lnurl
        //lnurl = bech32Encode(profile.lud16, 'lnurl');
      }
    }
    if (zapEndpoint == null) return;

    const relays = seen;
    const receipt = ownerEvent.pubkey;
    const e = ownerEvent.id;

    const rawEvent = Nip57.createRequest({ relays, receipt, e });
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
    // todo
  };

  const bookmark = async () => {
    // todo
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
      <Button onClick={bookmark} disabled={!signEvent}>
        bookmark
      </Button>
    </div>
  );
};
