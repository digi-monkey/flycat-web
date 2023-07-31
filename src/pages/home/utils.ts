import { CallWorker } from 'core/worker/caller';
import { CallRelayType } from 'core/worker/type';
import { deserializeMetadata } from 'core/nostr/content';
import { isEventPTag } from 'core/nostr/util';
import {
  EventSetMetadataContent,
  WellKnownEventKind,
  PublicKey,
  EventTags,
  EventContactListPTag
} from 'core/nostr/type';
import { Event } from 'core/nostr/Event';

export function handleEvent(
  worker,
  myPublicKey,
  setUserMap,
  setMyContactList,
) {
  return function handleEvent(event: Event, relayUrl?: string) {
    console.debug(`[${worker?._workerId}]receive event`, relayUrl, event.kind);
    switch (event.kind) {
      case WellKnownEventKind.set_metadata:
        const metadata: EventSetMetadataContent = deserializeMetadata(
          event.content,
        );
        setUserMap(prev => {
          const newMap = new Map(prev);
          const oldData = newMap.get(event.pubkey) as { created_at: number };
          if (oldData && oldData.created_at > event.created_at) {
            // the new data is outdated
            return newMap;
          }

          newMap.set(event.pubkey, {
            ...metadata,
            ...{ created_at: event.created_at },
          });
          return newMap;
        });
        break;

      case WellKnownEventKind.contact_list:
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
        break;

      default:
        break;
    }
  };
}
