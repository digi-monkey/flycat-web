import { Dispatch, SetStateAction, useEffect } from 'react';
import { CallRelayType } from 'core/worker/type';
import {
  ContactList,
  EventContactListPTag,
  EventTags,
  Filter,
  PublicKey,
  WellKnownEventKind,
} from 'core/nostr/type';
import { CallWorker } from 'core/worker/caller';

export function useLoadContactList(
  myPublicKey: PublicKey,
  worker: CallWorker | undefined,
  setMyContactList: Dispatch<SetStateAction<ContactList | undefined>>
) {
  useEffect(() => {
    if (!worker || !worker.relayGroupId) return;
    if (!myPublicKey || myPublicKey.length === 0) return;

    const relays = worker.relays.map(r => r.url);
    const filter: Filter = {
      authors: [myPublicKey],
      kinds: [WellKnownEventKind.contact_list],
      limit: 1
    }
    worker.queryFilterFromDb(
      { filter, relays }
    ).then(events => {
      for (const event of events) {
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
      }
    });

  }, [myPublicKey, worker, worker?.relayGroupId]);
}

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
      cb: (event) => {
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
