import { Dispatch, SetStateAction, useEffect } from 'react';
import { CallRelayType } from 'core/worker/type';
import {
  ContactList,
  EventContactListPTag,
  EventTags,
  PublicKey,
} from 'core/nostr/type';
import { CallWorker } from 'core/worker/caller';

export function useSubContactList(
  myPublicKey: PublicKey,
  newConn: string[],
  worker: CallWorker | undefined,
  setMyContactList: Dispatch<SetStateAction<ContactList | undefined>>
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
      cb: (event)=>{
        if (event.pubkey === myPublicKey) {
          setMyContactList(prev => {
            if (prev && prev?.created_at >= event.created_at) {
              return prev;
            }

            const keys = (
              event.tags.filter(
                t => t[0] === EventTags.P,
              ) as EventContactListPTag[]
            ).map(t => t[1]);
            return {
              keys,
              created_at: event.created_at,
            };
          });
        }
      },
    });
  }, [myPublicKey, newConn]);
}

