import { contactQuery } from 'core/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { parsePubKeyFromTags } from 'pages/helper';
import { useMemo } from 'react';
import { isValidPublicKey } from 'utils/validator';

export function useMyFollowings() {
  const myPublicKey = useReadonlyMyPublicKey();
  const myContactEvent = useLiveQuery(
    contactQuery.createContactByPubkeyQuerier(myPublicKey),
    [myPublicKey],
  );
  const myFollowings = useMemo(() => {
    if (myContactEvent) {
      const pks = parsePubKeyFromTags(myContactEvent.tags);
      if (!pks.includes(myPublicKey)) {
        pks.push(myPublicKey);
      }
      return pks;
    }

    if (isValidPublicKey(myPublicKey)) {
      return [myPublicKey];
    }

    return [];
  }, [myPublicKey, myContactEvent]);

  return myFollowings;
}
