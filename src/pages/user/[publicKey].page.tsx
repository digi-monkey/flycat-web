import { Paths } from 'constants/path';
import { connect } from 'react-redux';
import { UserMap } from 'core/nostr/type';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { useCallWorker } from 'hooks/useWorker';
import { CommitCalendar } from 'components/ContributorCalendar/Calendar';
import { useState, useEffect } from 'react';
import { loginMapStateToProps } from 'pages/helper';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { BaseLayout, Left, Right } from 'components/BaseLayout';
import { CallRelay, CallRelayType } from 'core/worker/type';
import { deserializeMetadata } from 'core/nostr/content';
import { isEventPTag } from 'core/nostr/util';
import {
  EventSetMetadataContent,
  WellKnownEventKind,
  PublicKey,
  RelayUrl,
  PetName,
  EventTags,
  EventContactListPTag
} from 'core/nostr/type';
import { Event } from 'core/nostr/Event';
import { RawEvent } from 'core/nostr/RawEvent';
import { Avatar, Button, Tabs } from 'antd';

import Swal from 'sweetalert2/dist/sweetalert2.js';

import newStyles from './index.module.scss';
import PostItems from 'components/PostItems';
import { stringHasImageUrl } from 'utils/common';
import Icon from 'components/Icon';

export type ContactList = Map<
  PublicKey,
  {
    relayer: RelayUrl;
    name: PetName;
  }
>;

export interface ContactInfo {
  created_at: number;
  list: ContactList;
  keys: string[];
}

type UserParams = {
  publicKey: PublicKey;
};

export const ProfilePage = ({ isLoggedIn, signEvent }) => {
  const router = useRouter();
  const { publicKey } = router.query as UserParams;
  const myPublicKey = useReadonlyMyPublicKey();
  const [msgList, setMsgList] = useState<Event[]>([]);
  const [userMap, setUserMap] = useState<UserMap>(new Map());
  const [myContactList, setMyContactList] = useState<ContactInfo>();
  const [userContactList, setUserContactList] = useState<ContactInfo>();
  const [articleMsgList, setArticleMsgList] = useState<Event[]>([]);

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
      case WellKnownEventKind.article_highlight:
        if (event.pubkey === publicKey) {
          setMsgList(oldArray => {
            if (!oldArray.map(e => e.id).includes(event.id)) {
              // do not add duplicated msg
              const newItems = [...oldArray, event];
              // sort by timestamp
              const sortedItems = newItems.sort((a, b) =>
                a.created_at >= b.created_at ? -1 : 1,
              );
              return sortedItems;
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
              ?.subMetadata(newPks, false, undefined, {
                type: CallRelayType.single,
                data: [relayUrl!],
              })
              ?.iterating({ cb: handleEvent });
          }
        }
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
        setArticleMsgList(oldArray => {
          if (!oldArray.map(e => e.id).includes(event.id)) {
            // do not add duplicated msg
            const newItems = [...oldArray, event];
            // sort by timestamp
            const sortedItems = newItems.sort((a, b) =>
              a.created_at >= b.created_at ? -1 : 1,
            );
            return sortedItems;
          }
          return oldArray;
        });

        setMsgList(oldArray => {
          if (!oldArray.map(e => e.id).includes(event.id)) {
            // do not add duplicated msg
            const newItems = [...oldArray, event];
            // sort by timestamp
            const sortedItems = newItems.sort((a, b) =>
              a.created_at >= b.created_at ? -1 : 1,
            );
            return sortedItems;
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
            ?.subMetadata(newPks, false, undefined, {
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
    if (newConn.length === 0) return;

    const pks = [publicKey];
    if (isLoggedIn && myPublicKey.length > 0) {
      pks.push(myPublicKey);
    }

    const callRelay: CallRelay = {
      type: CallRelayType.batch,
      data: newConn,
    };
    worker
      ?.subContactList(pks, undefined, undefined, callRelay)
      ?.iterating({ cb: handleEvent });
    worker
      ?.subMetadata(pks, undefined, undefined, callRelay)
      ?.iterating({ cb: handleEvent });
    worker
      ?.subMsg([publicKey], undefined, undefined, callRelay)
      ?.iterating({ cb: handleEvent });
    worker
      ?.subNip23Posts({ pks: [publicKey], callRelay })
      ?.iterating({ cb: handleEvent });
  }, [newConn]);

  useEffect(() => {
    if (!worker) return;
    if (!userContactList || userContactList.keys.length === 0) return;

    worker?.subMetadata(userContactList.keys)?.iterating({ cb: handleEvent });
  }, [worker, userContactList?.keys]);

  const followUser = async () => {
    if (signEvent == null) {
      Swal.fire({
        icon: 'error',
        text: 'no sign method!',
      });
      return;
    }

    const pks = myContactList?.keys || [];
    if (pks.length === 0) {
      const isConfirmed = window.confirm(
        'hey you have 0 followings, are you sure to continue? \n\n(if you think 0 followings is a wrong, please click CANCEL and try again, otherwise you might lost all your following!)',
      );

      if (!isConfirmed) return;
    }

    const tags = myContactList
      ? pks.map(
          pk =>
            [
              EventTags.P,
              pk,
              myContactList.list.get(pk)?.relayer ?? '',
              myContactList.list.get(pk)?.name ?? '',
            ] as EventContactListPTag,
        )
      : [];
    tags.push([EventTags.P, publicKey, '', '']);

    if (tags.length != pks.length + 1) {
      Swal.fire({
        icon: 'error',
        text: 'something went wrong with contact list',
      });
      return;
    }

    const rawEvent = new RawEvent(
      myPublicKey,
      WellKnownEventKind.contact_list,
      tags,
    );
    const event = await signEvent(rawEvent);
    worker?.pubEvent(event);
    Swal.fire({
      icon: 'success',
      text: 'done, refresh page please!',
    });
  };
  const unfollowUser = async () => {
    if (signEvent == null) {
      Swal.fire({
        icon: 'error',
        text: 'no sign method!',
      });
      return;
    }
    if (!myContactList) return;

    const pks = myContactList.keys;
    if (pks.length === 0) {
      const isConfirmed = window.confirm(
        'hey you have 0 followings, are you sure to continue? \n\n(if you think 0 followings is a wrong, please click CANCEL and try again, otherwise you might lost all your following!)',
      );
      if (!isConfirmed) return;
    }
    const tags = pks
      .filter(pk => pk !== publicKey)
      .map(
        pk =>
          [
            EventTags.P,
            pk,
            myContactList.list.get(pk)?.relayer ?? '',
            myContactList.list.get(pk)?.name ?? '',
          ] as EventContactListPTag,
      );
    if (tags.length != pks.length - 1) {
      Swal.fire({
        icon: 'error',
        text: 'something went wrong with contact list',
      });
      return;
    }

    const rawEvent = new RawEvent(
      myPublicKey,
      WellKnownEventKind.contact_list,
      tags,
    );
    const event = await signEvent(rawEvent);
    worker?.pubEvent(event);

    Swal.fire({
      icon: 'success',
      text: 'done, refresh page please!',
    });
  };
  const isFollowed =
    isLoggedIn && myContactList && myContactList?.keys.includes(publicKey);
  const followOrUnfollowOnClick = isFollowed ? unfollowUser : followUser;

  const tabItems = [
    {
      label: `all`,
      key: 'all',
      children: (
        <ul>
          <PostItems
            msgList={msgList}
            worker={worker!}
            userMap={userMap}
            relays={[]}
          />
        </ul>
      ),
    },
    {
      label: `long-form`,
      key: 'longForm',
      children: (
        <ul>
          <PostItems
            msgList={articleMsgList}
            worker={worker!}
            userMap={userMap}
            relays={[]}
          />
        </ul>
      ),
    },
    {
      label: `media`,
      key: 'media',
      children: (
        <ul>
          <PostItems
            msgList={msgList.filter(
              e =>
                e.kind === WellKnownEventKind.text_note &&
                stringHasImageUrl(e.content),
            )}
            worker={worker!}
            userMap={userMap}
            relays={[]}
          />
        </ul>
      ),
    },
  ];

  return (
    <BaseLayout>
      <Left>
        {userMap.get(publicKey)?.banner && (
          <div className={newStyles.banner}>
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
          <div className={newStyles.profile}>
            <div className={newStyles.img}>
              <Avatar
                style={{ width: '100%', height: '100%' }}
                src={userMap.get(publicKey)?.picture}
                alt=""
              />
            </div>
            <div className={newStyles.name}>{userMap.get(publicKey)?.name}</div>
            <div className={newStyles.description}>
              {userMap.get(publicKey)?.about}
            </div>
          </div>
        </div>

        <div className={newStyles.calendar}>
          <CommitCalendar pk={publicKey} />
        </div>

        <div className={newStyles.btnGroup}>
          <Button onClick={followOrUnfollowOnClick}>
            {isFollowed ? 'unfollow' : 'follow'}
          </Button>
          <Icon type="icon-rss" className={newStyles.icon} />
          <Icon type="icon-bolt" className={newStyles.icon} />
        </div>

        <div className={newStyles.following}>
          <div className={newStyles.followingTitle}>Followings</div>
          <ul>
            {userContactList?.keys.slice(0, 5).map(key => (
              <li key={key} className={newStyles.followingList}>
                <Avatar src={userMap.get(key)?.picture} alt="" />
                <div>{userMap.get(key)?.name}</div>
                <Icon type="icon-more-horizontal" className={newStyles.icon} />
              </li>
            ))}
          </ul>
          <div>
            <Button onClick={()=>window.location.href = "/contact/"+publicKey}>View all {userContactList?.keys.length}</Button>
          </div>
        </div>
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
