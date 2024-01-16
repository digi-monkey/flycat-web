import { contactQuery } from 'core/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { parsePubKeyFromTags } from 'pages/helper';
import { useCallback, useMemo, useState } from 'react';
import { isValidPublicKey } from 'utils/validator';

export function useMyFollowings() {
  const [isAlreadyQueryContact, setIsAlreadyQueryContact] = useState(false);
  const myPublicKey = useReadonlyMyPublicKey();
  const getContact = useCallback(async () => {
    if (!isValidPublicKey(myPublicKey)) {
      return null;
    }
    return await contactQuery.getContactByPubkey(myPublicKey);
  }, [myPublicKey]);

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
