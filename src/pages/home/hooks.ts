import { useEffect } from 'react';
import { CallRelayType } from 'core/worker/type';
import {
  PublicKey,
} from 'core/nostr/type';
import { Event } from 'core/nostr/Event';
import { CallWorker } from 'core/worker/caller';

export function useSubContactList(
  myPublicKey: PublicKey,
  newConn: string[],
  worker: CallWorker | undefined,
  handleEvent: (event: Event, relayUrl?: string) => any,
) {
  useEffect(() => {
    if (!worker) return;
    if (!myPublicKey || myPublicKey.length === 0) return;

    const callRelay =
      newConn.length === 0
        ? { type: CallRelayType.all, data: [] }
        : { type: CallRelayType.batch, data: newConn };

    const sub = worker.subContactList(
      [myPublicKey],
      'userContactList',
      callRelay,
    );
    sub.iterating({
      cb: handleEvent,
    });
  }, [myPublicKey, newConn]);
}

