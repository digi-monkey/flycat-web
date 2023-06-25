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
  isLoggedIn,
  userMap,
  myPublicKey,
  setUserMap,
  setMsgList,
  setMyContactList,
  maxMsgLength = 50,
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

      case WellKnownEventKind.text_note:
      case WellKnownEventKind.article_highlight:
      case WellKnownEventKind.long_form:
        setMsgList(oldArray => {
          if (
            oldArray.length > maxMsgLength &&
            oldArray[oldArray.length - 1].created_at > event.created_at
          ) {
            return oldArray;
          }

          if (!oldArray.map(e => e.id).includes(event.id)) {
            // do not add duplicated msg

            // check if need to sub new user metadata
            const newPks: string[] = [];
            for (const t of event.tags) {
              if (isEventPTag(t)) {
                const pk = t[1];
                if (userMap.get(pk) == null) {
                  newPks.push(pk);
                }
              }
            }
            if (newPks.length > 0) {
              const sub = worker?.subMetadata(newPks, false, undefined, {
                type: CallRelayType.single,
                data: [relayUrl!],
              });
              sub?.iterating({ cb: handleEvent });
            }

            // save event
            const newItems = [
              ...oldArray,
              { ...event, ...{ seen: [relayUrl!] } },
            ];
            // sort by timestamp
            const sortedItems = newItems.sort((a, b) =>
              a.created_at >= b.created_at ? -1 : 1,
            );
            // cut to max size
            if (sortedItems.length > maxMsgLength) {
              return sortedItems.slice(0, maxMsgLength + 1);
            }
            return sortedItems;
          } else {
            const id = oldArray.findIndex(s => s.id === event.id);
            if (id === -1) return oldArray;

            if (!oldArray[id].seen?.includes(relayUrl!)) {
              oldArray[id].seen?.push(relayUrl!);
            }
          }
          return oldArray;
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

export function refreshMsg({
  myContactList,
  myPublicKey,
  worker,
  handleEvent,
}: {
  myContactList?: { keys: PublicKey[]; created_at: number };
  myPublicKey: string;
  worker?: CallWorker;
  handleEvent: (event: Event, relayUrl?: string | undefined) => void;
}) {
  const pks = myContactList?.keys || [];
  // subscribe myself msg too
  if (myPublicKey && !pks.includes(myPublicKey) && myPublicKey.length > 0)
    pks.push(myPublicKey);

  if (pks.length > 0) {
    const callRelay = {
      type: CallRelayType.connected,
      data: [],
    };

    const subMsg = worker?.subMsg(pks, false, 'homeRefreshMsg', callRelay);
    subMsg?.iterating({
      cb: handleEvent,
    });
  }
}
