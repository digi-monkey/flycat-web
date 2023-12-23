import { useCallWorker } from 'hooks/useWorker';
import { useEffect, useState } from 'react';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { deserializeMetadata } from 'core/nostr/content';
import { EventSetMetadataContent } from 'core/nostr/type';
import { isValidPublicKey } from 'utils/validator';
import { profileQuery } from 'core/db';

export function useUserInfo() {
  const myPublicKey = useReadonlyMyPublicKey();
  const { worker } = useCallWorker();
  const [myProfile, setMyProfile] = useState<
    EventSetMetadataContent | undefined
  >();

  useEffect(() => {
    if (!worker) return;
    if (!isValidPublicKey(myPublicKey)) return;
    worker.subMetadata([myPublicKey]);
  }, [worker, myPublicKey]);

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
