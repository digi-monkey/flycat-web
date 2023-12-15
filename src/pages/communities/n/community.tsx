import { CommunityMetadata, Nip172 } from 'core/nip/172';
import styles from '../index.module.scss';
import { Button, Empty, Modal, message, Tabs, Avatar, Tooltip } from 'antd';
import {
  EventId,
  EventMap,
  EventSetMetadataContent,
  UserMap,
  WellKnownEventKind,
} from 'core/nostr/type';
import { CallWorker } from 'core/worker/caller';
import {
  Dispatch,
  ReactNode,
  SetStateAction,
  useEffect,
  useState,
} from 'react';
import { EventWithSeen } from 'pages/type';
import { CallRelayType } from 'core/worker/type';
import { isEventPTag } from 'core/nostr/util';
import { deserializeMetadata } from 'core/nostr/content';
import PostItems from 'components/PostItems';
import Icon from 'components/Icon';
import PubNoteTextarea from 'components/PubNoteTextarea';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { useSelector } from 'react-redux';
import { RootState } from 'store/configureStore';
import { Event } from 'core/nostr/Event';
import { noticePubEventResult } from 'components/PubEventNotice';
import {
  createFollowContactEvent,
  createInitialFollowContactEvent,
  createUnFollowContactEvent,
  getContactEvent,
  isFollowed,
} from 'core/worker/util';
import { RawEvent } from 'core/nostr/RawEvent';
import { useRouter } from 'next/router';
import { useMatchMobile } from 'hooks/useMediaQuery';

interface CommunityProps {
  community: CommunityMetadata;
  userMap: UserMap;
  eventMap: EventMap;
  worker?: CallWorker;
  setUserMap: Dispatch<SetStateAction<UserMap>>;
  setEventMap: Dispatch<SetStateAction<EventMap>>;
  setPostCount?: Dispatch<SetStateAction<number>>;
  setContributorCount?: Dispatch<SetStateAction<number>>;
  setMyPostCount?: Dispatch<SetStateAction<number>>;
  setMyUnApprovalPostCount?: Dispatch<SetStateAction<number>>;
  setActionButton?: Dispatch<SetStateAction<ReactNode>>;
}

export function Community({
  community,
  userMap,
  worker,
  eventMap,
  setEventMap,
  setUserMap,
  setPostCount,
  setContributorCount,
  setMyPostCount,
  setMyUnApprovalPostCount,
  setActionButton,
}: CommunityProps) {
  const myPublicKey = useReadonlyMyPublicKey();
  const [myContactEvent, setMyContactEvent] = useState<Event>();
  const [msgList, setMsgList] = useState<EventWithSeen[]>([]);
  const [allMsgList, setAllMsgList] = useState<EventWithSeen[]>([]);
  const [myActionButton, setMyActionButton] = useState<ReactNode>();
  const [loading, setLoading] = useState(false);
  const [openWrite, setOpenWrite] = useState(false);
  const [selectTab, setSelectTab] = useState<string | number>('Latest');
  const [activeTab, setActiveTab] = useState('Latest');

  const router = useRouter();
  const isMobile = useMatchMobile();

  const signEvent = useSelector(
    (state: RootState) => state.loginReducer.signEvent,
  );

  useEffect(() => {
    getApprovalShortNoteId();
  }, [worker, community]);

  useEffect(() => {
    if (!worker) return;
    if (myPublicKey.length === 0) return;

    getContactEvent({ worker, pk: myPublicKey });
  }, [myPublicKey, worker]);

  const target: { type: 'people' | 'hashTag' | 'community'; data: string } = {
    type: 'community',
    data: Nip172.communityAddr({
      identifier: community.id,
      author: community.creator,
    }),
  };
  const follow = async () => {
    if (!signEvent) return message.error('no sign method');
    if (!worker) return message.error('no worker!');

    let rawEvent: RawEvent | null = null;
    if (myContactEvent) {
      rawEvent = createFollowContactEvent(myContactEvent, target);
    } else {
      const isConfirmed = window.confirm(
        'hey you have 0 followings, are you sure to continue? \n\n(if you think 0 followings is a wrong, please click CANCEL and try again, otherwise you might lost all your following!)',
      );
      if (!isConfirmed) return;
      rawEvent = createInitialFollowContactEvent(target);
    }

    const event = await signEvent(rawEvent);
    const handler = worker.pubEvent(event);
    return noticePubEventResult(worker.relays.length, handler, () =>
      getContactEvent({ worker, pk: myPublicKey }),
    );
  };
  const unfollow = async () => {
    if (!signEvent) return message.error('no sign method');
    if (!worker) return message.error('no worker!');
    if (!myContactEvent) return message.error('contact event not found!');
    const rawEvent = createUnFollowContactEvent(myContactEvent, target);
    const event = await signEvent(rawEvent);
    const handler = worker.pubEvent(event);
    return noticePubEventResult(worker.relays.length, handler, () =>
      getContactEvent({ worker, pk: myPublicKey }),
    );
  };

  useEffect(() => {
    const actionText =
      myContactEvent && isFollowed(myContactEvent, target)
        ? 'Unfollow'
        : 'Follow';
    const actionOnClick =
      myContactEvent && isFollowed(myContactEvent, target) ? unfollow : follow;
    const actionButton = (
      <Button type="primary" onClick={actionOnClick} disabled={!signEvent}>
        {actionText}
      </Button>
    );
    setMyActionButton(actionButton);
  }, [myContactEvent]);

  const getApprovalShortNoteId = async () => {
    if (!worker) return;
    setMsgList([]);
    const ids: EventId[] = [];

    const handleEvent = (event, relayUrl) => {
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
          });
          if (!Nip172.isCommunityPost(event)) return;
          setMsgList(oldArray => {
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

    setLoading(true);
    const filter = Nip172.approvalFilter({
      identifier: community.id,
      author: community.creator,
      moderators: community.moderators,
    });
    const dataStream = worker.subFilter({ filter }).getIterator();
    for await (const data of dataStream) {
      const id = Nip172.shortNoteIdFromApproval({ approvalEvent: data.event });

      const event = Nip172.parseNoteFromApproval(data.event);

      if (event != null) {
        console.log(event);
        setMsgList(oldArray => {
          if (event == null) return oldArray; //todo:fix this, very strange

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
              worker
                .subMetadata(newPks, undefined, {
                  type: CallRelayType.single,
                  data: [data.relayUrl!],
                })
                .iterating({ cb: handleEvent });
            }

            // save event
            const newItems = [
              ...oldArray,
              { ...event, ...{ seen: [data.relayUrl!] } }, // todo: this relay url is not the target event's relay
            ];
            // sort by timestamp
            const sortedItems = newItems.sort((a, b) =>
              a.created_at >= b.created_at ? -1 : 1,
            );
            return sortedItems;
          } else {
            const id = oldArray.findIndex(s => s.id === event.id);
            if (id === -1) return oldArray;

            if (!oldArray[id].seen?.includes(data.relayUrl!)) {
              oldArray[id].seen?.push(data.relayUrl!);
            }
          }
          return oldArray;
        });
        continue;
      }

      if (id && !ids.includes(id)) ids.push(id);
    }
    dataStream.unsubscribe();

    if (ids.length === 0) return setLoading(false);

    worker.subMsgByEventIds(ids).iterating({ cb: handleEvent });
    setLoading(false);
  };

  const getAllShortNoteId = async () => {
    if (!worker) return;
    setAllMsgList([]);

    const handleEvent = (event, relayUrl) => {
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
          });
          if (!Nip172.isCommunityPost(event)) return;

          setAllMsgList(oldArray => {
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

    const filter = Nip172.allPostsFilter({
      identifier: community.id,
      author: community.creator,
    });
    console.log('filter:', filter);
    worker.subFilter({ filter }).iterating({ cb: handleEvent });
  };

  const showPublishModal = () => {
    setOpenWrite(true);
  };

  useEffect(() => {
    if (selectTab === 'un-approval') {
      getAllShortNoteId();
    }
  }, [selectTab, community]);

  const isModerator = community.moderators.includes(myPublicKey);
  const unApprovalMsgList = allMsgList.filter(
    msg => !msgList.map(m => m.id).includes(msg.id),
  );

  const createApproval = async (postEvent: Event, message) => {
    if (!worker) return message.error('worker not found');
    if (!signEvent) return message.errpr('signEvent method not found');

    const rawEvent = Nip172.createApprovePostRawEvent(
      postEvent,
      community.id,
      community.creator,
    );
    const event = await signEvent(rawEvent);
    const handle = worker.pubEvent(event);
    noticePubEventResult(worker.relays.length, handle, () =>
      getApprovalShortNoteId(),
    );
  };

  const handleTabClick = tabName => {
    setActiveTab(tabName);
  };

  useEffect(() => {
    if (setPostCount) {
      setPostCount(msgList.length);
    }
    if (setContributorCount) {
      setContributorCount(new Set(msgList.map(item => item.pubkey)).size);
    }
    if (setMyPostCount) {
      setMyPostCount(
        msgList.filter(item => item.pubkey === myPublicKey).length,
      );
    }
  }, [msgList]);

  useEffect(() => {
    if (setMyUnApprovalPostCount) {
      const unApprovalMsgList = allMsgList.filter(
        msg => !msgList.map(m => m.id).includes(msg.id),
      );
      setMyUnApprovalPostCount(
        unApprovalMsgList.filter(item => item.pubkey === myPublicKey).length,
      );
    }
  }, [allMsgList]);

  useEffect(() => {
    if (myActionButton && setActionButton) {
      setActionButton(myActionButton);
    }
  }, [myActionButton]);

  return (
    <>
      <div className={styles.communityPage}>
        <div
          className={styles.communityNav}
          onClick={() => router.push('/communities')}
        >
          <Icon type="icon-arrow-left" />
          {community.id}
        </div>
        <div
          style={{ backgroundImage: `url(${community.image})` }}
          className={styles.banner}
        >
          <div className={styles.bannerContainer}>
            <div className={styles.bannerTitle}>{community.id}</div>
            <div className={styles.bannerContent}>{community.description}</div>
            {isMobile && (
              <div className={styles.mobilePanel}>
                <div className={styles.moderator}>
                  <div>
                    <Tooltip
                      key={community.creator}
                      title={userMap.get(community.creator)?.name}
                      placement="top"
                    >
                      <Avatar src={userMap.get(community.creator)?.picture} />
                    </Tooltip>

                    <Avatar.Group maxCount={3}>
                      {community.moderators.map(pk => (
                        <Tooltip
                          key={pk}
                          title={userMap.get(pk)?.name}
                          placement="top"
                        >
                          <a href={'/user/' + pk}>
                            <Avatar src={userMap.get(pk)?.picture} />
                          </a>
                        </Tooltip>
                      ))}
                    </Avatar.Group>
                  </div>
                </div>
                <div>{myActionButton}</div>
              </div>
            )}
          </div>
        </div>
        <div className={styles.selectBtn}>
          <Tabs
            defaultActiveKey="latest"
            onChange={val => setSelectTab(val)}
            items={[
              {
                label: 'Latest',
                key: 'latest',
                children: (
                  <>
                    <div className={styles.msgTypeWrapper}>
                      <div className={styles.typeButtonContainer}>
                        <div
                          className={`${styles.typeButton} ${
                            activeTab === 'Latest' ? styles.typeActive : ''
                          }`}
                          onClick={() => handleTabClick('Latest')}
                        >
                          Latest
                        </div>
                        <div
                          className={`${styles.typeButton} ${
                            activeTab === 'Hot' ? styles.typeActive : ''
                          }`}
                          onClick={() => handleTabClick('Hot')}
                        >
                          Hot
                        </div>
                        <div
                          className={`${styles.typeButton} ${
                            activeTab === 'Long-Form' ? styles.typeActive : ''
                          }`}
                          onClick={() => handleTabClick('Long-Form')}
                        >
                          Long-Form
                        </div>
                      </div>
                      <Button type="link" onClick={() => showPublishModal()}>
                        + Create Post
                      </Button>
                    </div>
                    {msgList.length === 0 && <Empty />}
                    <PostItems
                      msgList={msgList}
                      worker={worker!}
                      showFromCommunity={false}
                    />
                  </>
                ),
              },
              {
                label: 'Pin',
                key: 'hotest',
                children: 'Tab 2',
                disabled: true,
              },
              {
                label: 'UnApproval',
                key: 'un-approval',
                children: (
                  <>
                    {unApprovalMsgList.length === 0 && <Empty />}
                    <PostItems
                      msgList={unApprovalMsgList}
                      worker={worker!}
                      showFromCommunity={false}
                      extraMenu={
                        isModerator
                          ? [
                              {
                                label: 'approve this event',
                                onClick: (event, message) =>
                                  createApproval(event, message),
                              },
                            ]
                          : []
                      }
                    />
                  </>
                ),
              },
            ]}
          />
        </div>
        <Modal
          title={'Post to ' + community.id}
          wrapClassName={styles.modal}
          footer={null}
          open={openWrite}
          onCancel={() => setOpenWrite(false)}
          closeIcon={
            <Icon type="icon-cross" className={styles.modalCoseIcons} />
          }
        >
          <p>
            {
              'Your post will show up in your profile, but it needs to be approved by moderator to show up in the community'
            }
          </p>
          <PubNoteTextarea
            activeCommunity={Nip172.communityAddr({
              identifier: community.id,
              author: community.creator,
            })}
            pubSuccessCallback={() => setOpenWrite(false)}
          />
        </Modal>
      </div>
    </>
  );
}
