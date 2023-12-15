import { deserializeMetadata } from 'core/nostr/content';
import {
  UserMap,
  EventMap,
  EventId,
  PublicKey,
  EventTags,
  WellKnownEventKind,
  EventSetMetadataContent,
} from 'core/nostr/type';
import { CallWorker } from 'core/worker/caller';
import { EventWithSeen } from 'pages/type';
import { Dispatch, SetStateAction, useEffect } from 'react';

export function useLastReplyEvent({
  msgList,
  worker,
  userMap,
  setEventMap,
  setUserMap,
}: {
  msgList: EventWithSeen[];
  worker?: CallWorker;
  userMap: UserMap;
  setEventMap: Dispatch<SetStateAction<EventMap>>;
  setUserMap: Dispatch<SetStateAction<UserMap>>;
}) {
  const subEvent: EventId[] = msgList.map(e => e.id);
  const subPks: PublicKey[] = Array.from(userMap.keys());

  useEffect(() => {
    if (!worker) return;

    const replies = msgList
      .map(msgEvent => {
        const lastReply = msgEvent.tags
          .filter(t => t[0] === EventTags.E)
          .map(t => t[1] as EventId)
          .pop();
        if (lastReply) {
          return lastReply;
        }
        return null;
      })
      .filter(r => r != null)
      .map(r => r!);

    const newIds = replies.filter(id => !subEvent.includes(id));

    const userPks = msgList
      .map(msgEvent => {
        const lastReply = msgEvent.tags
          .filter(t => t[0] === EventTags.P)
          .map(t => t[1] as PublicKey)
          .pop();
        if (lastReply) {
          return lastReply;
        }
        return null;
      })
      .filter(r => r != null)
      .map(r => r!);

    const newPks = userPks.filter(pk => !subPks.includes(pk));

    worker
      .subFilter({
        filter: {
          ids: newIds,
        },
        customId: 'replies-user',
      })
      .iterating({
        cb: event => {
          setEventMap(prev => {
            const newMap = new Map(prev);
            const oldData = newMap.get(event.id);
            if (oldData && oldData.created_at > event.created_at) {
              // the new data is outdated
              return newMap;
            }

            newMap.set(event.id, event);
            return newMap;
          });
        },
      });

    worker
      .subFilter({
        filter: { authors: newPks, kinds: [WellKnownEventKind.set_metadata] },
      })
      .iterating({
        cb: event => {
          switch (event.kind) {
            case WellKnownEventKind.set_metadata:
              const metadata: EventSetMetadataContent = deserializeMetadata(
                event.content,
              );
              setUserMap(prev => {
                const newMap = new Map(prev);
                const oldData = newMap.get(event.pubkey) as {
                  created_at: number;
                };
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

            default:
              break;
          }
        },
      });

    subEvent.push(...newIds);
    subPks.push(...newPks);
  }, [msgList.length]);
}
