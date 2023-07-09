import { connect, useSelector } from 'react-redux';
import { EventId, EventMap, EventTags, Naddr, UserMap } from 'core/nostr/type';
import { CallWorker } from 'core/worker/caller';
import { CallRelayType } from 'core/worker/type';
import { useCallWorker } from 'hooks/useWorker';
import { useEffect, useState } from 'react';
import { loginMapStateToProps } from 'pages/helper';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { BaseLayout, Left, Right } from 'components/BaseLayout';
import { fetchSince, get, update } from 'core/last-notify';
import { deserializeMetadata, shortifyNPub } from 'core/nostr/content';
import { EventSetMetadataContent, WellKnownEventKind } from 'core/nostr/type';
import { Event } from 'core/nostr/Event';

import { Avatar, Badge, Button, Empty, List, Tabs, message } from 'antd';
import PostItems from 'components/PostItems';
import { useSubLastReplyEvent } from 'hooks/useSubLastReplyEvent';
import PageTitle from 'components/PageTitle';
import { Nip57 } from 'core/nip/57';

import styles from './index.module.scss';
import { timeSince } from 'utils/time';
import { notifyKinds } from './kinds';
import { Nip172 } from 'core/nip/172';
import { Nip19, Nip19DataType } from 'core/nip/19';
import Icon from 'components/Icon';
import Link from 'next/link';
import { createCallRelay } from 'core/worker/util';
import { RootState } from 'store/configureStore';
import { noticePubEventResult } from 'components/PubEventNotice';

export interface ItemProps {
  msg: Event;
  eventId: string;
  userMap: UserMap;
  worker: CallWorker;
}

export function Notification({ isLoggedIn }: { isLoggedIn: boolean }) {
  const myPublicKey = useReadonlyMyPublicKey();
  const signEvent = useSelector(
    (state: RootState) => state.loginReducer.signEvent,
  );

  const { worker, newConn } = useCallWorker();
  const [userMap, setUserMap] = useState<UserMap>(new Map());
  const [eventMap, setEventMap] = useState<EventMap>(new Map());
  const [msgList, setMsgList] = useState<Event[]>([]);

  const [unreadMentions, setUnreadMentions] = useState<EventId[]>([]);
  const [unreadReposts, setUnreadReposts] = useState<EventId[]>([]);
  const [unreadZaps, setUnreadZaps] = useState<EventId[]>([]);
  const [unreadApproval, setUnreadApproval] = useState<EventId[]>([]);
  const [unreadRequestApproval, setUnreadRequestApproval] = useState<EventId[]>(
    [],
  );
  const [commAddrs, setCommAddrs] = useState<Map<EventId, Naddr>>(new Map());
  const [requestApproveMsgList, setRequestApproveMsgList] = useState<Event[]>(
    [],
  );
  const [approveByMe, setApproveByMe] = useState<EventId[]>(
    [],
  );

  function handleEvent(event: Event, relayUrl?: string) {
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

      default:
        setEventMap(prev => {
          prev.set(event.id, event);
          return prev;
        });

        if (!notifyKinds.includes(event.kind)) return;
        if (event.pubkey === myPublicKey) return; // filter ourself

        setMsgList(oldArray => {
          if (!oldArray.map(e => e.id).includes(event.id)) {
            // do not add duplicated msg

            const newItems = [
              ...oldArray,
              { ...event, ...{ seen: [relayUrl!] } },
            ];
            // sort by timestamp
            const sortedItems = newItems.sort((a, b) =>
              a.created_at >= b.created_at ? -1 : 1,
            );

            // check if need to sub new user metadata
            const newPks: string[] = [];
            if (
              userMap.get(event.pubkey) == null &&
              !newPks.includes(event.pubkey)
            ) {
              newPks.push(event.pubkey);
            }

            if (newPks.length > 0) {
              worker
                ?.subMetadata(newPks, undefined, {
                  type: CallRelayType.single,
                  data: [relayUrl!],
                })
                ?.iterating({ cb: handleEvent });
            }
            return sortedItems;
          }

          return oldArray;
        });

        break;
    }
  }

  useEffect(() => {
    if (myPublicKey == null || myPublicKey.length === 0) return;
    if (newConn.length === 0) return;
    if (!worker) return;

    const callRelay = createCallRelay(newConn);
    worker
      .subFilter({
        filter: {
          '#p': [myPublicKey],
          kinds: notifyKinds,
          since: fetchSince,
        },
        callRelay,
      })
      .iterating({ cb: handleEvent });
    worker
      .subFilter({
        filter: {
          '#p': [myPublicKey],
          kinds: [WellKnownEventKind.community_metadata],
          since: fetchSince,
        },
      })
      .iterating({
        cb: event => {
          if (event.kind !== WellKnownEventKind.community_metadata) return;

          setCommAddrs(prev => {
            const newMap = new Map(prev);
            newMap.set(
              event.id,
              Nip172.communityAddr({
                identifier: event.tags
                  .filter(t => t[0] === EventTags.D)
                  .map(t => t[1])[0]!,
                author: event.pubkey,
              }),
            );
            return newMap;
          });
        },
      });
    worker.subFilter({
      filter: {
        authors: [myPublicKey],
        kinds: [WellKnownEventKind.community_approval],
        since: fetchSince
      },
      callRelay
    }).iterating({cb: (event)=> {
      if(event.kind !== WellKnownEventKind.community_approval)return;

      const eventIds = event.tags.filter(t => t[0] === EventTags.E).map(t => t[1] as EventId);
      if(eventIds.length === 0)return;

      setApproveByMe(prev => {
        const newData = prev;
        if(!newData.includes(eventIds[0])){
          newData.push(eventIds[0]);
        }
        return newData;
      })
    }})
  }, [newConn, myPublicKey, worker]);

  useEffect(() => {
    if (!worker) return;

    const addrs = Array.from(commAddrs.values());
    if (addrs.length > 0) {
      worker
        .subFilter({
          filter: {
            '#a': addrs,
            kinds: [WellKnownEventKind.text_note, WellKnownEventKind.long_form],
          },
        })
        .iterating({
          cb: (event, relayUrl) => {
            //if(event.pubkey === myPublicKey)return;
            if (event.tags.filter(t => Nip172.isCommunityATag(t)).length === 0)
              return;

            setRequestApproveMsgList(oldArray => {
              if (!oldArray.map(e => e.id).includes(event.id)) {
                // do not add duplicated msg

                const newItems = [
                  ...oldArray,
                  { ...event, ...{ seen: [relayUrl!] } },
                ];
                // sort by timestamp
                const sortedItems = newItems.sort((a, b) =>
                  a.created_at >= b.created_at ? -1 : 1,
                );

                // check if need to sub new user metadata
                const newPks: string[] = [];
                if (
                  userMap.get(event.pubkey) == null &&
                  !newPks.includes(event.pubkey)
                ) {
                  newPks.push(event.pubkey);
                }

                if (newPks.length > 0) {
                  worker
                    ?.subMetadata(newPks, undefined, {
                      type: CallRelayType.single,
                      data: [relayUrl!],
                    })
                    ?.iterating({ cb: handleEvent });
                }
                return sortedItems;
              }

              return oldArray;
            });
          },
        });
    }
  }, [commAddrs.size, worker]);

  useSubLastReplyEvent({ msgList, worker, userMap, setUserMap, setEventMap });

  const getUnreadEventIds = (kind: WellKnownEventKind) => {
    return msgList
      .filter(msg => msg.kind === kind)
      .filter(msg => {
        if (get() != null) {
          return msg.created_at > get()!;
        }

        return true;
      })
      .map(msg => msg.id);
  };

  const getUnreadRequestApproveEventIds = () => {
    return requestApproveMsgList
      .filter(msg => {
        if (get() != null) {
          return msg.created_at > get()!;
        }

        return true;
      })
      .map(msg => msg.id);
  };

  const updateUnreadItems = () => {
    setUnreadMentions(getUnreadEventIds(WellKnownEventKind.text_note));
    setUnreadReposts(getUnreadEventIds(WellKnownEventKind.reposts));
    setUnreadZaps(getUnreadEventIds(WellKnownEventKind.zap_receipt));
    setUnreadApproval(getUnreadEventIds(WellKnownEventKind.community_approval));
  };

  useEffect(() => {
    updateUnreadItems();
  }, [msgList]);

  useEffect(()=>{
    setUnreadRequestApproval(getUnreadRequestApproveEventIds());
  }, [unreadRequestApproval])

  const onMarkAll = () => {
    update(Math.round(Date.now() / 1000));
    updateUnreadItems();
  };

  const markAll = (
    <Button type="link" onClick={onMarkAll}>
      Mark all as read
    </Button>
  );

  const items = [
    {
      label: <Badge count={unreadMentions.length}>Mentions</Badge>,
      key: 'mentions',
      children: (
        <>
          {msgList.filter(e => e.kind === WellKnownEventKind.text_note)
            .length === 0 && <Empty />}
          <PostItems
            relays={worker?.relays.map(r => r.url) || []}
            msgList={msgList.filter(
              e => e.kind === WellKnownEventKind.text_note,
            )}
            worker={worker!}
            userMap={userMap}
            eventMap={eventMap}
          />
        </>
      ),
    },
    {
      label: <Badge count={unreadReposts.length}>Reposts</Badge>,
      key: 'reposts',
      children: (
        <>
          {msgList.filter(e => e.kind === WellKnownEventKind.reposts).length ===
            0 && <Empty />}
          <PostItems
            relays={worker?.relays.map(r => r.url) || []}
            msgList={msgList.filter(e => e.kind === WellKnownEventKind.reposts)}
            worker={worker!}
            userMap={userMap}
            eventMap={eventMap}
          />
        </>
      ),
    },
    {
      label: <Badge count={unreadZaps.length}>Zaps</Badge>,
      key: 'zaps',
      children: (
        <List>
          {msgList.filter(e => e.kind === WellKnownEventKind.zap_receipt)
            .length === 0 && <Empty />}
          {msgList
            .filter(e => e.kind === WellKnownEventKind.zap_receipt)
            .map(msg => {
              const zapInfo = Nip57.parseZapReceiptInfo(msg);
              if (zapInfo) {
                worker
                  ?.subMetadata([zapInfo.sender, zapInfo.wallet])
                  .iterating({ cb: handleEvent });
              }
              return (
                <List.Item key={msg.id} style={{ paddingLeft: '20px' }}>
                  {zapInfo ? (
                    <List.Item.Meta
                      avatar={
                        <Avatar src={userMap.get(zapInfo.sender)?.picture} />
                      }
                      title={
                        <>
                          {userMap.get(zapInfo.sender)?.name}
                          {' just zapped you '}
                          <span className={styles.sats}>
                            {+zapInfo.human_readable_part.amount / 1000} sats
                          </span>
                        </>
                      }
                      description={
                        'from ' +
                        (userMap.get(zapInfo.wallet)?.name || 'unknown wallet')
                      }
                    />
                  ) : (
                    'unknown zap info'
                  )}
                </List.Item>
              );
            })}
        </List>
      ),
    },
    {
      label: <Badge count={unreadApproval.length}>New Approval</Badge>,
      key: 'new-approval',
      children: (
        <>
          {msgList.filter(e => e.kind === WellKnownEventKind.community_approval)
            .length === 0 && <Empty />}
          {msgList
            .filter(e => e.kind === WellKnownEventKind.community_approval)
            .map(msg => {
              const moderator = msg.pubkey;
              const postEvent = Nip172.parseNoteFromApproval(msg);
              const community = Nip172.parseCommunityAddr(
                msg.tags.filter(t => Nip172.isCommunityATag(t))[0][1],
              );
              const header = (
                <div className={styles.approvalHeader}>
                  <div className={styles.description}>
                    <Link href={'/user/' + moderator}>
                      {userMap.get(moderator)?.name ||
                        shortifyNPub(
                          Nip19.encode(moderator, Nip19DataType.Npubkey),
                        )}
                    </Link>
                    {' just approve your post from '}
                    <span
                      className={styles.communityHeader}
                      onClick={() =>
                        window.open(
                          '/explore/community/' +
                            encodeURIComponent(Nip172.communityAddr(community)),
                        )
                      }
                    >
                      {' '}
                      <Icon type="icon-explore" /> {community.identifier}
                    </span>
                  </div>
                  <div className={styles.time}>{timeSince(msg.created_at)}</div>
                </div>
              );

              return (
                <>
                  {postEvent ? (
                    <>
                      <PostItems
                        extraHeader={header}
                        msgList={[postEvent!]}
                        worker={worker!}
                        userMap={userMap}
                        eventMap={eventMap}
                        relays={worker?.relays.map(r => r.url) || []}
                        showFromCommunity={false}
                      />
                    </>
                  ) : (
                    'Unknown approval post info'
                  )}
                </>
              );
            })}
        </>
      ),
    },
    {
      label: (
        <Badge count={unreadRequestApproval.length}>Request Approval</Badge>
      ),
      key: 'new-request-approval',
      children: (
        <>
          {requestApproveMsgList.length === 0 && <Empty />}
          {requestApproveMsgList.map(msg => {
            const community = Nip172.parseCommunityAddr(
              msg.tags.filter(t => Nip172.isCommunityATag(t))[0][1],
            );
            const isAlreadyApproved = approveByMe.includes(msg.id);
            const createApproval = async (postEvent: Event, message) => {
              if (!worker) return message.error('worker not found');
              if (!signEvent)
                return message.errpr('signEvent method not found');

              const rawEvent = Nip172.createApprovePostRawEvent(
                postEvent,
                community.identifier,
                community.author,
              );
              const event = await signEvent(rawEvent);
              const handle = worker.pubEvent(event);
              noticePubEventResult(handle);
            };
            const header = (
              <div className={styles.approvalHeader}>
                <div className={styles.description}>
                  <Link href={'/user/' + msg.pubkey}>
                    {userMap.get(msg.pubkey)?.name ||
                      shortifyNPub(
                        Nip19.encode(msg.pubkey, Nip19DataType.Npubkey),
                      )}
                  </Link>
                  {' request post approval in '}
                  <span
                    className={styles.communityHeader}
                    onClick={() =>
                      window.open(
                        '/explore/community/' +
                          encodeURIComponent(Nip172.communityAddr(community)),
                      )
                    }
                  >
                    {' '}
                    <Icon type="icon-explore" /> {community.identifier}
                  </span>
                </div>
                <div><Button type="primary" onClick={()=>createApproval(msg, message)} disabled={isAlreadyApproved}>{isAlreadyApproved ? 'Approved':'Approve'}</Button></div>
              </div>
            );

            return (
              <>
                {msg ? (
                  <>
                    <PostItems
                      extraHeader={header}
                      msgList={[msg!]}
                      worker={worker!}
                      userMap={userMap}
                      eventMap={eventMap}
                      relays={worker?.relays.map(r => r.url) || []}
                      showFromCommunity={false}
                      extraMenu={isAlreadyApproved ? [] : [
                        {
                          label: 'approve this event',
                          onClick: (event, message) =>
                            createApproval(event, message),
                        },
                      ]}
                    />
                  </>
                ) : (
                  'Unknown request post approval info'
                )}
              </>
            );
          })}
        </>
      ),
    },
  ];

  return (
    <BaseLayout>
      <Left>
        <PageTitle title="Notifications" right={markAll} />
        <Tabs centered items={items} />
        <Button type="link">Since {timeSince(fetchSince)} ago</Button>
      </Left>
      <Right></Right>
    </BaseLayout>
  );
}

export default connect(loginMapStateToProps)(Notification);

export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale, ['common'])),
  },
});
