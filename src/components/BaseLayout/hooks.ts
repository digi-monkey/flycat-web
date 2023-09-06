import { useMatchPad } from 'hooks/useMediaQuery';
import { useCallWorker } from 'hooks/useWorker';
import { CallRelayType } from 'core/worker/type';
import { useEffect, useState } from 'react';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { deserializeMetadata } from 'core/nostr/content';
import { EventSetMetadataContent } from 'core/nostr/type';
import { isValidPublicKey } from 'utils/validator';
import { profileQuery } from 'core/db';

export function useUserInfo() {
  const myPublicKey = useReadonlyMyPublicKey();
  const { worker, newConn } = useCallWorker();
  const [myProfile, setMyProfile] = useState<
    EventSetMetadataContent | undefined
  >();

  useEffect(() => {
    if (!worker) return;
    if (!isValidPublicKey(myPublicKey)) return;
    if (myProfile != null) return;

    worker.subMetadata([myPublicKey], undefined, {
      type: CallRelayType.batch,
      data: newConn,
    });
  }, [worker, newConn]);

  useEffect(() => {
    if (!isValidPublicKey(myPublicKey)) return;

    profileQuery.getProfileByPubkey(myPublicKey).then(e => {
      if (e) {
        setMyProfile(deserializeMetadata(e.content));
      }
    });
  }, [myPublicKey]);

  return {
    myProfile,
  };
}
