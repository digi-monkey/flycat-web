import { Paths } from 'constants/path';
import { connect } from 'react-redux';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { useCallWorker } from 'hooks/useWorker';
import { CommitCalendar } from 'components/CommitCalendar';
import { useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { loginMapStateToProps } from 'pages/helper';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { BaseLayout, Left, Right } from 'components/BaseLayout';
import { deserializeMetadata, shortifyPublicKey } from 'core/nostr/content';
import {
  EventSetMetadataContent,
  WellKnownEventKind,
  PublicKey,
  EventTags,
  EventContactListPTag,
  ContactInfo,
  Filter,
} from 'core/nostr/type';
import { Event } from 'core/nostr/Event';
import { RawEvent } from 'core/nostr/RawEvent';
import {
  Avatar,
  Button,
  Divider,
  Dropdown,
  Input,
  MenuProps,
  Tabs,
  Tooltip,
  message,
} from 'antd';
import { copyToClipboard, stringHasImageUrl } from 'utils/common';
import { Followings } from './followings';

import styles from './index.module.scss';
import Icon from 'components/Icon';
import { payLnUrlInWebLn } from 'core/lighting/lighting';
import { noticePubEventResult } from 'components/PubEventNotice';
import { useMatchMobile } from 'hooks/useMediaQuery';
import {
  createCallRelay,
  createFollowContactEvent,
  createInitialFollowContactEvent,
  createUnFollowContactEvent,
  getContactEvent,
  isFollowed,
} from 'core/worker/util';
import PageTitle from 'components/PageTitle';
import { DbEvent } from 'core/db/schema';
import { contactQuery, profileQuery } from 'core/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { TimelineRender } from 'components/TimelineRender';
import { isValidPublicKey } from 'utils/validator';
import { usePubkeyFromRouterQuery } from 'hooks/usePubkeyFromRouterQuery';
import AnswerMachine from './answerMachine.page';
import { Nip19, Nip19DataType } from 'core/nip/19';

type UserParams = {
  publicKey: PublicKey;
};

export const ProfilePage = ({ isLoggedIn, signEvent }) => {
  const router = useRouter();
  const isMobile = useMatchMobile();
  const myPublicKey = useReadonlyMyPublicKey();

  const publicKey = usePubkeyFromRouterQuery(
    (router.query as UserParams).publicKey,
  );
  const { worker, newConn } = useCallWorker();

  const [userProfile, setUserProfile] = useState<EventSetMetadataContent>();
  const [myContactEvent, setMyContactEvent] = useState<DbEvent>();
  const [userContactList, setUserContactList] = useState<ContactInfo>();
  const [messageApi, contextHolder] = message.useMessage();
  const [activeTabKey, setActiveTabKey] = useState<string>('all');

  useEffect(() => {
    if (!isValidPublicKey(publicKey)) return;

    profileQuery.getProfileByPubkey(publicKey).then(e => {
      if (e != null) {
        setUserProfile(deserializeMetadata(e.content));
      }
    });
    contactQuery.getContactByPubkey(publicKey).then(e => {
      if (e != null) {
        setUserContactList(prev => {
          if (prev && prev?.created_at >= e.created_at) {
            return prev;
          }

          const keys = (
            e.tags.filter(t => t[0] === EventTags.P) as EventContactListPTag[]
          ).map(t => t[1]);
          const list = new Map();
          for (const t of e.tags.filter(
            t => t[0] === EventTags.P,
          ) as EventContactListPTag[]) {
            list.set(t[1], {
              relayUrl: t[2],
              name: t[3],
            });
          }
          return {
            keys,
            created_at: e.created_at,
            list,
          };
        });
      }
    });
  }, [publicKey]);

  useLiveQuery(
    contactQuery.createContactByPubkeyQuerier(myPublicKey, setMyContactEvent),
    [myPublicKey],
  );

  const createFeedProp = useCallback(() => {
    if (!isValidPublicKey(publicKey)) return null;

    let msgFilter: Filter | null = null;
    let isValidEvent: ((event: Event) => boolean) | undefined;

    if (activeTabKey === 'all') {
      const kinds = [
        WellKnownEventKind.text_note,
        WellKnownEventKind.article_highlight,
        WellKnownEventKind.long_form,
        WellKnownEventKind.reposts,
      ];
      msgFilter = {
        limit: 50,
        kinds,
      };
      isValidEvent = (event: Event) => {
        return kinds.includes(event.kind);
      };
    }

    if (activeTabKey === 'longForm') {
      msgFilter = {
        limit: 50,
        kinds: [WellKnownEventKind.long_form],
      };
      isValidEvent = (event: Event) => {
        return event.kind === WellKnownEventKind.long_form;
      };
    }

    if (activeTabKey === 'media') {
      msgFilter = {
        limit: 50,
        kinds: [WellKnownEventKind.text_note],
      };
      isValidEvent = (event: Event) => {
        return (
          event.kind === WellKnownEventKind.text_note &&
          stringHasImageUrl(event.content)
        );
      };
    }

    if (msgFilter == null) return null;

    msgFilter.authors = [publicKey];

    console.log(
      'start sub msg.. !!!msgFilter: ',
      msgFilter,
      activeTabKey,
      isValidEvent,
    );

    return {
      feedId: `userProfile:${publicKey}:${activeTabKey}`,
      msgFilter,
      isValidEvent,
    };
  }, [activeTabKey, publicKey]);

  const feedProp = useMemo(createFeedProp, [createFeedProp]);

  useEffect(() => {
    if (!isValidPublicKey(publicKey)) return;
    if (!worker) return;

    const pks = [publicKey];
    if (isLoggedIn && isValidPublicKey(myPublicKey)) {
      pks.push(myPublicKey);
    }

    const callRelay = createCallRelay(newConn);
    worker.subContactList(pks, undefined, callRelay);
    worker.subMetadata(pks, undefined, callRelay);
  }, [worker, newConn, publicKey]);

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
    return noticePubEventResult(worker.relays.length, handler, () =>
      getContactEvent({ worker, pk: myPublicKey }),
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
    return noticePubEventResult(worker.relays.length, handler, () =>
      getContactEvent({ worker, pk: myPublicKey }),
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
    },
    {
      label: `Long-form`,
      key: 'longForm',
    },
    {
      label: `Media`,
      key: 'media',
    },
  ];

  const items: MenuProps['items'] = [
    {
      label: 'copy npub',
      key: '0',
      onClick: () => {
        try {
          copyToClipboard(Nip19.encode(publicKey, Nip19DataType.Npubkey));
          message.success('npub copy to clipboard!');
        } catch (error: any) {
          message.error(`npub copy failed! ${error.message}`);
        }
      },
    },
    {
      label: 'copy raw pubkey ',
      key: '1',
      onClick: () => {
        try {
          copyToClipboard(publicKey);
          message.success('raw pubkey copy to clipboard!');
        } catch (error: any) {
          message.error(`raw pubkey  copy failed! ${error.message}`);
        }
      },
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
        <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
          <Icon type="icon-more-vertical" className={styles.more} />
        </Dropdown>
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
            onClick={() => router.push('/api/rss/' + publicKey)}
          />
        </Tooltip>
        <Tooltip title={`Zap The User`}>
          <Icon
            type="icon-bolt"
            className={styles.icon}
            onClick={async () => {
              const lnUrl = userProfile?.lud06 || userProfile?.lud16;
              if (lnUrl == null) {
                return alert(
                  'no ln url, please tell the author to set up one.',
                );
              }
              await payLnUrlInWebLn(lnUrl);
            }}
          />
        </Tooltip>
        <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
          <Icon type="icon-more-vertical" className={styles.more} />
        </Dropdown>
      </div>
    );

  const mobileActionBtnGroups =
    myPublicKey === publicKey ? (
      <div className={styles.btnGroup}>
        <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
          <Icon type="icon-more-vertical" className={styles.more} />
        </Dropdown>
        <Icon
          type="icon-Gear"
          className={styles.icon}
          onClick={() => {
            router.push(Paths.setting + '?tabKey=preference');
          }}
        />
        <Button
          onClick={() => {
            router.push(Paths.setting);
          }}
        >
          Edit profile
        </Button>
      </div>
    ) : (
      <div className={styles.btnGroup}>
        <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
          <Icon type="icon-more-vertical" className={styles.more} />
        </Dropdown>
        <Tooltip title={`Article RSS URL`}>
          <Icon
            type="icon-rss"
            className={styles.icon}
            onClick={() => router.push('/api/rss/' + publicKey)}
          />
        </Tooltip>
        <Tooltip title={`Zap The User`}>
          <Icon
            type="icon-bolt"
            className={styles.icon}
            onClick={async () => {
              const lnUrl = userProfile?.lud06 || userProfile?.lud16;
              if (lnUrl == null) {
                return alert(
                  'no ln url, please tell the author to set up one.',
                );
              }
              await payLnUrlInWebLn(lnUrl);
            }}
          />
        </Tooltip>
        <Button type="primary" onClick={followOrUnfollow.action}>
          {followOrUnfollow.label}
        </Button>
      </div>
    );

  return (
    <BaseLayout>
      <Left>
        {contextHolder}
        {!isMobile && (
          <PageTitle
            title={
              (userProfile?.name || shortifyPublicKey(publicKey)) + "'s profile"
            }
            icon={
              <Icon
                onClick={() => router.back()}
                width={24}
                height={24}
                type="icon-arrow-left"
              />
            }
            right={
              <div className={styles.rightPanel}>
                <Input
                  placeholder="Search"
                  prefix={<Icon type="icon-search" />}
                  onPressEnter={value => {
                    const keyword = value.currentTarget.value;
                    if (keyword) {
                      router.push(Paths.search + `?keyword=${keyword}`);
                    }
                  }}
                />
              </div>
            }
          />
        )}
        {isMobile && (
          <>
            <PageTitle
              title={
                (userProfile?.name || shortifyPublicKey(publicKey)) +
                "'s profile"
              }
              icon={
                <Icon
                  onClick={() => router.back()}
                  width={24}
                  height={24}
                  type="icon-arrow-left"
                />
              }
            />
            <div className={styles.mobileProfile}>
              <div className={styles.profile}>
                <div>
                  <div className={styles.img}>
                    <Avatar
                      style={{ width: '100%', height: '100%' }}
                      src={userProfile?.picture}
                      alt=""
                    />
                  </div>
                  <div className={styles.name}>
                    {userProfile?.name || shortifyPublicKey(publicKey)}
                  </div>
                </div>
                <div>{isMobile ? mobileActionBtnGroups : actionBtnGroups}</div>
              </div>

              <div className={styles.description}>{userProfile?.about}</div>
            </div>
          </>
        )}

        {userProfile?.banner && (
          <div className={styles.banner}>
            <img src={userProfile?.banner} alt="" />
          </div>
        )}

        <div>
          <Tabs
            defaultActiveKey="all"
            centered
            items={tabItems}
            size={'large'}
            activeKey={activeTabKey}
            onChange={setActiveTabKey}
          />

          {feedProp && (
            <TimelineRender
              feedId={feedProp.feedId}
              msgFilter={feedProp.msgFilter}
              isValidEvent={feedProp.isValidEvent}
              worker={worker}
            />
          )}
        </div>
      </Left>
      <Right>
        <div>
          <div className={styles.profile}>
            <div className={styles.img}>
              <Avatar
                style={{ width: '100%', height: '100%' }}
                src={userProfile?.picture}
                alt=""
              />
            </div>
            <div className={styles.name}>
              {userProfile?.name || shortifyPublicKey(publicKey)}
            </div>
            <div className={styles.description}>{userProfile?.about}</div>
          </div>
        </div>

        <div className={styles.calendar}>
          <CommitCalendar pk={publicKey} />
        </div>

        {actionBtnGroups}

        <Followings
          buildFollowUnfollow={buildFollowUnfollow}
          pks={userContactList?.keys || []}
          worker={worker}
        />

        {/*
          <Divider></Divider>
          <AnswerMachine pubkey={publicKey} />
       */}
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
