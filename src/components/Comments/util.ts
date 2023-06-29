import { Event } from 'core/nostr/Event';
import { deserializeMetadata } from 'core/nostr/content';
import {
  WellKnownEventKind,
  EventSetMetadataContent,
  PublicKey,
  UserMap,
  EventId,
	EventMap,
} from 'core/nostr/type';
import { getEventIdsFromETags, isEventPTag } from 'core/nostr/util';
import { EventWithSeen } from 'pages/type';
import { Dispatch, SetStateAction } from 'react';

export function _handleEvent({
  userMap,
  setUserMap,
	setEventMap,
  eventId,
  setCommentList,
  unknownPks,
  setUnknownPks,
}: {
  eventId: EventId;
  userMap: UserMap;
  setUserMap: Dispatch<SetStateAction<UserMap>>;
	setEventMap: Dispatch<SetStateAction<EventMap>>;
  unknownPks: PublicKey[];
  setUnknownPks: Dispatch<SetStateAction<PublicKey[]>>;
  setCommentList: Dispatch<SetStateAction<EventWithSeen[]>>;
}) {
  return function handEvent(event: Event, relayUrl?: string) {
    switch (event.kind) {
      case WellKnownEventKind.set_metadata:
        const metadata: EventSetMetadataContent = deserializeMetadata(
          event.content,
        );
        setUserMap(prev => {
          const newMap = new Map(prev);
          const oldData = newMap.get(event.pubkey);
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
        {
					setEventMap(prev => {
						prev.set(event.id, event);
						return prev;
					});

          setCommentList(oldArray => {
            const replyToEventIds = oldArray
              .map(e => getEventIdsFromETags(e.tags))
              .reduce((prev, current) => prev.concat(current), []);
            const eTags = getEventIdsFromETags(event.tags);
            if (
              !oldArray.map(e => e.id).includes(event.id) &&
              (replyToEventIds.includes(event.id) ||
                eTags.includes(eventId) ||
                event.id === eventId)
            ) {
              // only add un-duplicated and replyTo msg
              const newItems = [
                ...oldArray,
                { ...event, ...{ seen: [relayUrl!] } },
              ];
              // sort by timestamp in asc
              const sortedItems = newItems.sort((a, b) =>
                a.created_at >= b.created_at ? 1 : -1,
              );

              // check if need to sub new user metadata
              const newPks: PublicKey[] = [];
              for (const t of event.tags) {
                if (isEventPTag(t)) {
                  const pk = t[1];
                  if (userMap.get(pk) == null && !unknownPks.includes(pk)) {
                    newPks.push(pk);
                  }
                }
              }
              if (
                userMap.get(event.pubkey) == null &&
                !unknownPks.includes(event.pubkey)
              ) {
                newPks.push(event.pubkey);
              }
              if (newPks.length > 0) {
                setUnknownPks([...unknownPks, ...newPks]);
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
        }
        break;

      default:
        break;
    }
  };
}
