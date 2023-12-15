import { isDotBitName } from 'core/dotbit';
import { isNip05DomainName } from 'core/nip/05';
import { useEffect, useState } from 'react';
import {
  parseNpub,
  requestPublicKeyFromDotBit,
  requestPublicKeyFromNip05DomainName,
} from 'utils/common';
import { isValidNpub, isValidPublicKey } from 'utils/validator';

export function usePubkeyFromRouterQuery(userId: string | undefined) {
  const [publicKey, setPublicKey] = useState<string>('');

  useEffect(() => {
    if (userId) {
      if (isValidPublicKey(userId)) {
        setPublicKey(userId);
      }

      if (isValidNpub(userId)) {
        setPublicKey(parseNpub(userId));
      }

      if (isNip05DomainName(userId)) {
        requestPublicKeyFromNip05DomainName(userId).then(pk => {
          if (isValidPublicKey(pk)) {
            setPublicKey(pk);
          }
        });
      }

      if (isDotBitName(userId)) {
        requestPublicKeyFromDotBit(userId).then(pk => {
          if (isValidPublicKey(pk)) {
            setPublicKey(pk);
          }
        });
      }
    }
  }, [userId]);

  return publicKey;
}
