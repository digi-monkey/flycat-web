import { useMyPublicKey, useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { EventWithSeen } from 'pages/type';
import { useEffect, useState } from 'react';
import { deserializeMetadata } from 'core/nostr/content';
import { isEventPTag } from 'core/nostr/util';
import {
  EventSetMetadataContent,
  EventTags,
  Filter,
  WellKnownEventKind
} from 'core/nostr/type';
import { Event } from 'core/nostr/Event';
import { Nip51 } from 'core/nip/51';
import { UserMap } from 'core/nostr/type';
import { CallWorker } from 'core/worker/callWorker';
import { CallRelayType } from 'core/worker/type';

export function useBookmarkListFeed({
  worker,
  newConn,
  userMap,
  setUserMap,
  maxMsgLength = 50,
}: {
  worker?: CallWorker;
  newConn: string[];
  userMap: UserMap;
  setUserMap: any;
  maxMsgLength?: number;
}) {
	const myPublicKey = useReadonlyMyPublicKey();
  const [feed, setFeed] = useState<EventWithSeen[]>([]);
	const [bookmarkEvent, setBookmarkEvent] = useState<Event>();

  const handleEvent = (event: Event, relayUrl?: string) => {
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
        setFeed(oldArray => {
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
						if (userMap.get(event.pubkey) == null) {
							newPks.push(event.pubkey);
						}
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

			case WellKnownEventKind.bookmark_list:
				if(bookmarkEvent == null){
					setBookmarkEvent(event);
					return;
				}
				if(event.created_at > bookmarkEvent.created_at){
					setBookmarkEvent(event);
					return;
				}
				break;

      default:
        break;
    }
  };

  const getFeed = async (conns: string[]) => {
    if (!worker) return;

    const callRelay = {
      type: CallRelayType.batch,
      data: conns,
    };
    const limit = 50;
    const filter: Filter = {
      limit,
			authors: [myPublicKey],
      kinds: [WellKnownEventKind.bookmark_list],
			'#d': [Nip51.publicNoteBookmarkIdentifier]
    }
    const sub = worker.subFilter(filter, undefined, undefined, callRelay)!;

    sub.iterating({ cb: handleEvent });
  };

  useEffect(() => {
    getFeed(newConn);
  }, [newConn, worker]);

	useEffect(()=>{
		if(!bookmarkEvent)return;

		const events = bookmarkEvent.tags.filter(t => t[0] === EventTags.E).map(t => t[1]);
		worker?.subFilter({ids: events})?.iterating({cb: handleEvent});
	}, [bookmarkEvent]);

  return feed;
}
