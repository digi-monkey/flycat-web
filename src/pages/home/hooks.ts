import { Dispatch, SetStateAction, useEffect } from 'react';
import { CallRelayType } from 'core/worker/type';
import {
  ContactList,
  EventId,
  EventMap,
  EventSetMetadataContent,
  EventTags,
  PublicKey,
  WellKnownEventKind,
} from 'core/nostr/type';
import { Event } from 'core/nostr/Event';
import { EventWithSeen } from 'pages/type';
import { CallWorker } from 'core/worker/caller';
import { handleEvent } from './utils';
import { UserMap } from 'core/nostr/type';
import { deserializeMetadata } from 'core/nostr/content';
import { Nip23 } from 'core/nip/23';
import {
  NostrBandProvider,
  SuggestedProfiles,
  TrendingProfiles,
} from 'core/api/band';

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

export function useSubFollowingMsg(
  myContactList: ContactList | undefined,
  myPublicKey: PublicKey,
  newConn: string[],
  worker: CallWorker | undefined,
  handleEvent: (event: Event, relayUrl?: string) => any,
) {
  useEffect(() => {
    if (!worker) return;
    if (!myContactList) return;
    if (!myPublicKey || myPublicKey.length === 0) return;

    const pks = myContactList.keys;

    // subscribe myself msg too
    if (!pks.includes(myPublicKey)) pks.push(myPublicKey);

    if (pks.length > 0 && newConn.length > 0) {
      const callRelay = {
        type: CallRelayType.batch,
        data: newConn,
      };
      const subMetadata = worker.subMetadata(pks, 'homeMetadata', callRelay);
      subMetadata.iterating({
        cb: handleEvent,
      });

      const subMsg = worker.subMsg(pks, 'homeMsg', callRelay);
      subMsg.iterating({
        cb: handleEvent,
      });
    }
  }, [myContactList?.created_at, newConn, worker]);
}

export function useLoadMoreMsg({
  myContactList,
  myPublicKey,
  msgList,
  worker,
  userMap,
  setUserMap,
  setMsgList,
  setMyContactList,
  loadMoreCount,
}: {
  myContactList?: ContactList;
  setMyContactList: Dispatch<SetStateAction<ContactList | undefined>>;
  myPublicKey: string;
  msgList: EventWithSeen[];
  worker?: CallWorker;
  userMap: UserMap;
  setUserMap: Dispatch<SetStateAction<UserMap>>;
  setMsgList: Dispatch<SetStateAction<Event[]>>;
  loadMoreCount: number;
}) {
  useEffect(() => {
    if (!worker) return;
    if (!myContactList) return;
    if (!myPublicKey || myPublicKey.length === 0) return;

    if (loadMoreCount === 1) return; // initial value is 1

    const pks = myContactList.keys;
    // subscribe myself msg too
    if (!pks.includes(myPublicKey)) pks.push(myPublicKey);

    if (pks.length > 0) {
      const lastMsg = msgList.at(msgList.length - 1);
      if (!lastMsg) {
        return;
      }

      const callRelay = {
        type: CallRelayType.connected,
        data: [],
      };

      const subMsg = worker.subMsg(pks, 'homeMoreMsg', callRelay, {
        until: lastMsg.created_at,
      });
      subMsg.iterating({
        cb: handleEvent(
          worker,
          userMap,
          myPublicKey,
          setUserMap,
          setMsgList,
          setMyContactList,
          50 * loadMoreCount,
        ),
      });
    }
  }, [worker, myContactList?.created_at, loadMoreCount]);
}

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

    const articleReplies = msgList
      .map(msgEvent => {
        const lastReply = msgEvent.tags
          .filter(
            t =>
              t[0] === EventTags.A &&
              t[1].split(':')[0] === WellKnownEventKind.long_form.toString(),
          )
          .map(t => Nip23.addrToPkAndId(t[1]))
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

    if (articleReplies.length > 0) {
      console.log('a replie: ', articleReplies);
      worker
        .subFilter({
          filter: {
            '#d': articleReplies.map(a => a.articleId),
            authors: articleReplies.map(a => a.pubkey),
          },
          customId: 'last-replies-long-form',
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
    }

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

export function useSuggestedFollowings({
  myPublicKey,
  setSuggestedFollowings,
}: {
  myPublicKey: PublicKey;
  setSuggestedFollowings: Dispatch<SetStateAction<SuggestedProfiles | undefined>>;
}) {
  useEffect(() => {
    if(myPublicKey == null || myPublicKey === "")return;

    const provider = new NostrBandProvider();
    provider.suggestFollowings(myPublicKey).then(data => {
      setSuggestedFollowings(data);
    });
  }, [myPublicKey]);
}

export function useTrendingFollowings({
  setTrendingFollowings,
}: {
  setTrendingFollowings: Dispatch<SetStateAction<TrendingProfiles | undefined>>;
}) {
  useEffect(() => {
    const provider = new NostrBandProvider();
    provider.trendingFollowings().then(data => {
      setTrendingFollowings(data);
    });
  }, []);
}
