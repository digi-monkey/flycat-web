import { Dispatch, SetStateAction, useEffect } from 'react';
import { CallRelayType } from 'core/worker/type';
import {
  ContactList,
  PublicKey,
} from 'core/nostr/type';
import { CallWorker } from 'core/worker/caller';

export function useSubContactList(
  myPublicKey: PublicKey,
  newConn: string[],
  worker: CallWorker | undefined,
) {
  useEffect(() => {
    if (!worker) return;
    if (!myPublicKey || myPublicKey.length === 0) return;

    const callRelay =
      newConn.length === 0
        ? { type: CallRelayType.all, data: [] }
        : { type: CallRelayType.batch, data: newConn };

    worker.subContactList(
      [myPublicKey],
      'userContactList',
      callRelay,
    ).iterating({
      cb: (event, relayUrl) => {
        //storeEvent(event, relayUrl!);
        console.log("sub contact: ", relayUrl, event);
      }
    });
  }, [myPublicKey, newConn]);
}
