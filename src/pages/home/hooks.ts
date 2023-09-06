import { useEffect } from 'react';
import { PublicKey } from 'core/nostr/type';
import { CallWorker } from 'core/worker/caller';
import { createCallRelay } from 'core/worker/util';

export function useSubContactList(
  myPublicKey: PublicKey,
  newConn: string[],
  worker: CallWorker | undefined,
) {
  useEffect(() => {
    if (!worker) return;
    if (!myPublicKey || myPublicKey.length === 0) return;

    const callRelay = createCallRelay(newConn);

    worker
      .subContactList([myPublicKey], 'userContactList', callRelay)
      .iterating({
        cb: (event, relayUrl) => {
          console.debug('sub contact: ', relayUrl, event);
        },
      });
  }, [myPublicKey, newConn]);
}
