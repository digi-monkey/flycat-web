import { Event } from 'core/nostr/Event';
import { deserializeMetadata } from 'core/nostr/content';
import {
  WellKnownEventKind,
  EventSetMetadataContent,
  UserMap,
  EventId,
	EventMap,
} from 'core/nostr/type';
import { EventWithSeen } from 'pages/type';
import { Dispatch, SetStateAction } from 'react';

export function _handleEvent({
  setUserMap,
  eventId,
  setRootEvent,
	setEventMap,
}: {
  eventId: EventId;
  setUserMap: Dispatch<SetStateAction<UserMap>>;
	setEventMap: Dispatch<SetStateAction<EventMap>>;
  setRootEvent: Dispatch<SetStateAction<EventWithSeen | undefined>>;
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

      case WellKnownEventKind.article_highlight:
      case WellKnownEventKind.long_form:
      case WellKnownEventKind.text_note:
        {
					setEventMap(prev => {
						prev.set(event.id, event)
						return prev;
					});
					
          if (event.id === eventId) {
						setRootEvent(prev => {
							if(prev == null){
								return { ...event, ...{ seen: [relayUrl!] } }
							}

							prev.seen?.push(relayUrl!);
							return prev;
						});
						return;
          }
        }
        break;

      default:
        break;
    }
  };
}
