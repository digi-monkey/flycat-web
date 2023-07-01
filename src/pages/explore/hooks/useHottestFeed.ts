import { EventWithSeen } from 'pages/type';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { deserializeMetadata } from 'core/nostr/content';
import { isEventPTag } from 'core/nostr/util';
import {
  EventMap,
  EventSetMetadataContent,
  WellKnownEventKind
} from 'core/nostr/type';
import { Event } from 'core/nostr/Event';
import { UserMap } from 'core/nostr/type';
import { CallWorker } from 'core/worker/caller';
import { CallRelayType } from 'core/worker/type';

// todo: get reactive data and sort by hot
export function useHottestFeed({
  worker,
  newConn,
  userMap,
  setUserMap,
  setEventMap,
  maxMsgLength = 50,
}: {
  worker?: CallWorker;
  newConn: string[];
  userMap: UserMap;
  setUserMap: Dispatch<SetStateAction<UserMap>>;
  setEventMap: Dispatch<SetStateAction<EventMap>>;
  maxMsgLength?: number;
}) {
  const [feed, setFeed] = useState<EventWithSeen[]>([]);

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
        setEventMap(prev => {
          prev.set(event.id, event);
          return prev;
        })

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
            for (const t of event.tags) {
              if (isEventPTag(t)) {
                const pk = t[1];
                if (userMap.get(pk) == null) {
                  newPks.push(pk);
                }
              }
            }
            if (newPks.length > 0) {
              const sub = worker?.subMetadata(newPks, undefined, {
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
      default:
        break;
    }
  };

  const getFeed = async (conns: string[]) => {
    if (!worker) return;

    const pks: string[] = [];
    const callRelay = newConn.length > 0 ? {
      type: CallRelayType.batch,
      data: conns,
    }: {
      type: CallRelayType.connected,
      data: [],
    };
    const limit = 50;
    const sub = worker.subMsg(pks, undefined, callRelay, { limit })!;

    sub.iterating({ cb: handleEvent });
  };

  useEffect(() => {
    getFeed(newConn);
  }, [newConn, worker]);

  return feed;
}
