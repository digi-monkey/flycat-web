import { useEffect } from 'react';
import { PublicKey } from 'core/nostr/type';
import { CallWorker } from 'core/worker/caller';
import { isValidPublicKey } from 'utils/validator';

export function useSubContactList(
  myPublicKey: PublicKey,
  newConn: string[],
  worker: CallWorker | undefined,
) {
  useEffect(() => {
    if (!worker) return;
    if (!isValidPublicKey(myPublicKey)) return;

    worker.subContactList([myPublicKey], 'userContactList').iterating({
      cb: (event, relayUrl) => {
        console.debug('sub contact: ', relayUrl, event);
      },
    });
  }, [myPublicKey, worker]);
}
