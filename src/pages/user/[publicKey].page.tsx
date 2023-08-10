import { Paths } from 'constants/path';
import { connect } from 'react-redux';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { useCallWorker } from 'hooks/useWorker';
import { CommitCalendar } from 'components/CommitCalendar';
import { useState, useEffect } from 'react';
import { loginMapStateToProps } from 'pages/helper';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { BaseLayout, Left, Right } from 'components/BaseLayout';
import { CallRelay, CallRelayType } from 'core/worker/type';
import {
  deserializeMetadata,
  shortifyEventId,
  shortifyPublicKey,
} from 'core/nostr/content';
import { isEventPTag } from 'core/nostr/util';
import {
  EventSetMetadataContent,
  WellKnownEventKind,
  PublicKey,
  EventTags,
  EventContactListPTag,
  ContactInfo,
  UserMap,
  EventMap,
} from 'core/nostr/type';
import { Event } from 'core/nostr/Event';
import { RawEvent } from 'core/nostr/RawEvent';
import { Avatar, Button, Input, Tabs, Tooltip, message } from 'antd';
import { stringHasImageUrl } from 'utils/common';
import { useLastReplyEvent } from './hooks';
import { Followings } from './followings';

import styles from './index.module.scss';
import PostItems from 'components/PostItems';
import Icon from 'components/Icon';
import { payLnUrlInWebLn } from 'core/lighting/lighting';
import { EventWithSeen } from 'pages/type';
import { noticePubEventResult } from 'components/PubEventNotice';
import { useMatchMobile } from 'hooks/useMediaQuery';
import {
  createFollowContactEvent,
  createInitialFollowContactEvent,
  createUnFollowContactEvent,
  isFollowed,
  updateMyContactEvent,
} from 'core/worker/util';

type UserParams = {
  publicKey: PublicKey;
};

export const ProfilePage = ({ isLoggedIn, signEvent }) => {
  const myPublicKey = useReadonlyMyPublicKey();
  const isMobile = useMatchMobile();

  const router = useRouter();
  const { publicKey } = router.query as UserParams;

  const [msgList, setMsgList] = useState<EventWithSeen[]>([]);
  const [userMap, setUserMap] = useState<UserMap>(new Map());
  const [eventMap, setEventMap] = useState<EventMap>(new Map());
  const [myContactEvent, setMyContactEvent] = useState<Event>();
  const [userContactList, setUserContactList] = useState<ContactInfo>();
  const [articleMsgList, setArticleMsgList] = useState<EventWithSeen[]>([]);
  const [messageApi, contextHolder] = message.useMessage();

  const { worker, newConn } = useCallWorker();

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

      case WellKnownEventKind.text_note:
      case WellKnownEventKind.reposts:
      case WellKnownEventKind.article_highlight:
        setEventMap(prev => {
          prev.set(event.id, event);
          return prev;
        });

        if (event.pubkey === publicKey) {
          setMsgList(oldArray => {
            if (!oldArray.map(e => e.id).includes(event.id)) {
              // do not add duplicated msg

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
            worker
              ?.subMetadata(newPks, undefined, {
                type: CallRelayType.single,
                data: [relayUrl!],
              })
              ?.iterating({ cb: handleEvent });
          }
        }
        break;

      case WellKnownEventKind.contact_list:
        if (event.pubkey === publicKey) {
          setUserContactList(prev => {
            if (prev && prev?.created_at >= event.created_at) {
              return prev;
            }

            const keys = (
              event.tags.filter(
                t => t[0] === EventTags.P,
              ) as EventContactListPTag[]
            ).map(t => t[1]);
            const list = new Map();
            for (const t of event.tags.filter(
              t => t[0] === EventTags.P,
            ) as EventContactListPTag[]) {
              list.set(t[1], {
                relayUrl: t[2],
                name: t[3],
              });
            }
            return {
              keys,
              created_at: event.created_at,
              list,
            };
          });
        }

        break;

      case WellKnownEventKind.long_form:
        setEventMap(prev => {
          prev.set(event.id, event);
          return prev;
        });

        setArticleMsgList(oldArray => {
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

        setMsgList(oldArray => {
          if (!oldArray.map(e => e.id).includes(event.id)) {
            // do not add duplicated msg

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
          worker
            ?.subMetadata(newPks, undefined, {
              type: CallRelayType.single,
              data: [relayUrl!],
            })
            ?.iterating({ cb: handleEvent });
        }
        break;

      default:
        break;
    }
  }

  useEffect(() => {
    // todo: validate publicKey
    if (publicKey && publicKey.length === 0) return;

    const pks = [publicKey];
    if (isLoggedIn && myPublicKey.length > 0) {
      pks.push(myPublicKey);
    }

    const callRelay: CallRelay =
      newConn.length > 0
        ? {
            type: CallRelayType.batch,
            data: newConn,
          }
        : {
            type: CallRelayType.connected,
            data: [],
          };
    worker
      ?.subContactList([publicKey], undefined, callRelay)
      ?.iterating({ cb: handleEvent });
    worker
      ?.subMetadata(pks, undefined, callRelay)
      ?.iterating({ cb: handleEvent });
    worker
      ?.subMsg([publicKey], undefined, callRelay)
      ?.iterating({ cb: handleEvent });
    worker
      ?.subNip23Posts({ pks: [publicKey], callRelay })
      ?.iterating({ cb: handleEvent });
  }, [newConn, publicKey]);

  useEffect(() => {
    if (!worker) return;
    if (myPublicKey.length === 0) return;

    updateMyContactEvent({ worker, pk: myPublicKey, setMyContactEvent });
  }, [worker, myPublicKey]);

  useEffect(() => {
    if (!worker) return;
    if (!userContactList || userContactList.keys.length === 0) return;

    worker?.subMetadata(userContactList.keys)?.iterating({ cb: handleEvent });
  }, [worker, userContactList?.keys]);

  useLastReplyEvent({
    msgList,
    worker,
    userMap,
    setUserMap,
    setEventMap,
  });

  const relayUrls = worker?.relays.map(r => r.url) || [];

  const _followUser = async (publicKey: string) => {
    if (signEvent == null) {
      messageApi.error('no sign method!', 3);
      return;
    }
    if (!worker) return messageApi.error('no worker!', 3);

    const target: {
      type: 'people' | 'hashTag' | 'community';
      data: string;
    } = { type: 'people', data: publicKey };

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
    return noticePubEventResult(handler, () =>
      updateMyContactEvent({ worker, pk: myPublicKey, setMyContactEvent }),
    );
  };
  const _unfollowUser = async (publicKey: string) => {
    if (signEvent == null) {
      messageApi.error('no sign method!', 3);
      return;
    }
    if (!myContactEvent) return messageApi.error('no contact event!', 3);
    if (!worker) return messageApi.error('no worker!', 3);

    const rawEvent = createUnFollowContactEvent(myContactEvent, {
      type: 'people',
      data: publicKey,
    });
    const event = await signEvent(rawEvent);
    const handler = worker.pubEvent(event);
    return noticePubEventResult(handler, () =>
      updateMyContactEvent({ worker, pk: myPublicKey, setMyContactEvent }),
    );
  };

  const buildFollowUnfollow = (publicKey: string) => {
    const isFollow =
      isLoggedIn &&
      myContactEvent?.id && // use ?.id to trigger UI update
      isFollowed(myContactEvent, { type: 'people', data: publicKey });
    
    return isFollow
      ? {
          label: 'unfollow',
          action: () => _unfollowUser(publicKey),
        }
      : {
          label: 'follow',
          action: () => _followUser(publicKey),
        };
  };
  const followOrUnfollow = buildFollowUnfollow(publicKey);

  const tabItems = [
    {
      label: `All`,
      key: 'all',
      children: (
        <PostItems
          msgList={msgList}
          worker={worker!}
          userMap={userMap}
          relays={[]}
          eventMap={eventMap}
        />
      ),
    },
    {
      label: `Long-form`,
      key: 'longForm',
      children: (
        <PostItems
          msgList={articleMsgList}
          worker={worker!}
          userMap={userMap}
          relays={relayUrls}
          eventMap={eventMap}
        />
      ),
    },
    {
      label: `Media`,
      key: 'media',
      children: (
        <PostItems
          msgList={msgList.filter(
            e =>
              e.kind === WellKnownEventKind.text_note &&
              stringHasImageUrl(e.content),
          )}
          worker={worker!}
          userMap={userMap}
          relays={relayUrls}
          eventMap={eventMap}
        />
      ),
    },
  ];

  const actionBtnGroups =
    myPublicKey === publicKey ? (
      <div className={styles.btnGroup}>
        <Button
          onClick={() => {
            router.push(Paths.setting);
          }}
        >
          Edit profile
        </Button>
        <Icon
          type="icon-Gear"
          className={styles.icon}
          onClick={() => {
            router.push(Paths.setting + '?tabKey=preference');
          }}
        />
      </div>
    ) : (
      <div className={styles.btnGroup}>
        <Button type="primary" onClick={followOrUnfollow.action}>
          {followOrUnfollow.label}
        </Button>
        <Tooltip title={`Article RSS URL`}>
          <Icon
            type="icon-rss"
            className={styles.icon}
            onClick={() => router.push('/api/rss/' + publicKey, 'blank')}
          />
        </Tooltip>
        <Tooltip title={`Zap The User`}>
          <Icon
            type="icon-bolt"
            className={styles.icon}
            onClick={async () => {
              const lnUrl =
                userMap.get(publicKey)?.lud06 || userMap.get(publicKey)?.lud16;
              if (lnUrl == null) {
                return alert(
                  'no ln url, please tell the author to set up one.',
                );
              }
              await payLnUrlInWebLn(lnUrl);
            }}
          />
        </Tooltip>
      </div>
    );

  return (
    <BaseLayout>
      <Left>
        {contextHolder}
        {!isMobile && (
          <div className={styles.pageTitle}>
            <div className={styles.titleBox}>
              <div className={styles.arrow}>
                {' '}
                <Icon
                  style={{ width: '24px', height: '24px' }}
                  type="icon-arrow-left"
                ></Icon>{' '}
              </div>
              <div className={styles.title}>
                {userMap.get(publicKey)?.name || shortifyPublicKey(publicKey)}
                &apos;s profile
              </div>
            </div>
            <div>
              <Input
                placeholder="Search"
                prefix={<Icon type="icon-search" />}
              />
            </div>
          </div>
        )}
        {isMobile && (
          <div className={styles.mobileProfile}>
            <div className={styles.profile}>
              <div>
                <div className={styles.img}>
                  <Avatar
                    style={{ width: '100%', height: '100%' }}
                    src={userMap.get(publicKey)?.picture}
                    alt=""
                  />
                </div>
                <div className={styles.name}>
                  {userMap.get(publicKey)?.name || shortifyPublicKey(publicKey)}
                </div>
              </div>
              <div>{actionBtnGroups}</div>
            </div>

            <div className={styles.description}>
              {userMap.get(publicKey)?.about}
            </div>
          </div>
        )}

        {userMap.get(publicKey)?.banner && (
          <div className={styles.banner}>
            <img src={userMap.get(publicKey)?.banner} alt="" />
          </div>
        )}

        <div>
          <Tabs
            defaultActiveKey="all"
            centered
            items={tabItems}
            size={'large'}
          />
        </div>
      </Left>
      <Right>
        <div>
          <div className={styles.profile}>
            <div className={styles.img}>
              <Avatar
                style={{ width: '100%', height: '100%' }}
                src={userMap.get(publicKey)?.picture}
                alt=""
              />
            </div>
            <div className={styles.name}>
              {userMap.get(publicKey)?.name || shortifyPublicKey(publicKey)}
            </div>
            <div className={styles.description}>
              {userMap.get(publicKey)?.about}
            </div>
          </div>
        </div>

        <div className={styles.calendar}>
          <CommitCalendar pk={publicKey} />
        </div>

        {actionBtnGroups}

        <Followings
          buildFollowUnfollow={buildFollowUnfollow}
          pks={userContactList?.keys || []}
          userMap={userMap}
        />
      </Right>
    </BaseLayout>
  );
};

export default connect(loginMapStateToProps)(ProfilePage);

export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale, ['common'])),
  },
});

export const getStaticPaths = () => ({ paths: [], fallback: true });
