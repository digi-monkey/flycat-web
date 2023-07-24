import { Paths } from 'constants/path';
import { connect } from 'react-redux';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { handleEvent, refreshMsg } from './utils';
import { EventWithSeen } from 'pages/type';
import { useCallWorker } from 'hooks/useWorker';
import { useMyPublicKey } from 'hooks/useMyPublicKey';
import { useTranslation } from 'next-i18next';
import { loginMapStateToProps } from 'pages/helper';
import { LoginMode, SignEvent } from 'store/loginReducer';
import { Avatar, Button, Input, Segmented } from 'antd';
import { BaseLayout, Left, Right } from 'components/BaseLayout';
import { ContactList, EventMap, UserMap } from 'core/nostr/type';
import {
  useSubFollowingMsg,
  useSubContactList,
  useLoadMoreMsg,
  useLastReplyEvent,
  useTrendingFollowings,
  useSuggestedFollowings,
} from './hooks';

import Icon from 'components/Icon';
import Link from 'next/link';
import classNames from 'classnames';
import PubNoteTextarea from 'components/PubNoteTextarea';
import PostItems from 'components/PostItems';

import styles from './index.module.scss';
import PageTitle from 'components/PageTitle';
import {
  SuggestedProfiles,
  TrendingProfiles,
  parseMetadata,
} from 'core/api/band';
import { CallRelayType } from 'core/worker/type';

import dynamic from 'next/dynamic';

export interface HomePageProps {
  isLoggedIn: boolean;
  mode?: LoginMode;
  signEvent?: SignEvent;
}

const HomePage = ({ isLoggedIn }: HomePageProps) => {
  const { t } = useTranslation();
  const { worker, newConn, wsConnectStatus } = useCallWorker({});

  const router = useRouter();
  const myPublicKey = useMyPublicKey();

  const [eventMap, setEventMap] = useState<EventMap>(new Map());
  const [userMap, setUserMap] = useState<UserMap>(new Map());
  const [msgList, setMsgList] = useState<EventWithSeen[]>([]);
  const [loadMoreCount, setLoadMoreCount] = useState<number>(1);
  const [myContactList, setMyContactList] = useState<ContactList>();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [trendingProfiles, setTrendingFollowings] =
    useState<TrendingProfiles>();
  const [suggestedProfiles, setSuggestedFollowings] =
    useState<SuggestedProfiles>();

  const relayUrls = Array.from(wsConnectStatus.keys());

  const _handleEvent = handleEvent(
    worker,
    userMap,
    myPublicKey,
    setUserMap,
    setMsgList,
    setMyContactList,
  );

  useSubContactList(myPublicKey, newConn, worker, _handleEvent);

  // right test data
  const updates = [
    {
      content: '[4.13] Generating rss/json feed for...',
      isNew: true,
    },
    {
      content: '[4.12] ogp on blog post',
      isNew: false,
    },
  ];
  const trending = [
    { tag: 'Nostr', url: Paths.home },
    { tag: 'Nip', url: Paths.home },
    { tag: 'Bitcoin', url: Paths.home },
    { tag: 'Zapping', url: Paths.home },
  ];

  const filterMsg = <Segmented options={['Follow', 'Global', 'Article', 'Media']} />;

  return (
    <BaseLayout>
      <Left>
        <PageTitle title={'Home'} right={filterMsg}/>
        <PubNoteTextarea
          pubSuccessCallback={(eventId, relayUrl) => {
            worker
              ?.subMsgByEventIds([eventId], undefined, {
                type: CallRelayType.batch,
                data: relayUrl,
              })
              .iterating({ cb: _handleEvent });
          }}
        />
        <div className={styles.reloadFeedBtn}>
          <Button
            loading={isRefreshing}
            type="link"
            block
            onClick={async () => {
              setIsRefreshing(true);
              await refreshMsg({
                myContactList,
                myPublicKey,
                worker,
                handleEvent: _handleEvent,
              });
              setIsRefreshing(false);
            }}
          >
            Refresh timeline
          </Button>
        </div>
        <div
          className={classNames(styles.home, {
            [styles.noData]: msgList.length === 0,
          })}
        >
          {msgList.length === 0 || !isLoggedIn ? (
            <>
              <div className={styles.tipsy}>
                <h1>Share Your Thoughts with The Community</h1>
                <p>
                  Only your notes and the ones you follow will show up here.
                  Publish your ideas and discover what others are sharing!
                </p>
              </div>
              {!isLoggedIn && (
                <div className={styles.login}>
                  <Button
                    type="primary"
                    onClick={() => router.push(Paths.login)}
                  >
                    {t('nav.menu.signIn')}
                  </Button>
                  <span
                    onClick={() => router.push(Paths.login)}
                    className={styles.explore}
                  >
                    Explore as a guest
                  </span>
                </div>
              )}
            </>
          ) : (
            <>
              <div className={styles.msgList}>
                <PostItems
                  msgList={msgList}
                  worker={worker!}
                  userMap={userMap}
                  relays={relayUrls}
                  eventMap={eventMap}
                  showLastReplyToEvent={true}
                />
              </div>
              <Button
                type="link"
                block
                onClick={() => setLoadMoreCount(prev => prev + 1)}
              >
                {t('home.loadMoreBtn')}
              </Button>
              <br />
              <br />
              <br />
              <br />
              <br />
            </>
          )}
        </div>
      </Left>
      <Right>
        <div className={styles.rightPanel}>
          <Input placeholder="Search" prefix={<Icon type="icon-search" />} />
          <div className={styles.flycat}>
            <h2>Flycat updates</h2>
            {updates.map((item, key) => (
              <div className={styles.item} key={key}>
                <p>{item.content}</p>
                {item.isNew && <span>New</span>}
              </div>
            ))}
            <Link href={Paths.home}>Learn more</Link>
          </div>
          {/*
             {recommendProfiles && recommendProfiles.length > 0 && (
            <div className={styles.friends}>
              <h2>Suggested Followings</h2>
              {recommendProfiles.map((value, key) => {
                const item = parseMetadata(value.profile.content);
                return (
                  <div className={styles.friend} key={key}>
                    <div className={styles.info}>
                      <Avatar src={item?.picture} />
                      <div className={styles.friendInfo}>
                        <h3>{item?.name}</h3>
                        <p>{item?.about}</p>
                      </div>
                    </div>
                    <Button
                      className={styles.follow}
                      onClick={() =>
                        window.open('/user/' + value.pubkey, 'blank')
                      }
                    >
                      View
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
          */}

          <div className={styles.trending}>
            <h2>Trending hashtags</h2>
            {trending.map((item, key) => (
              <Link href={item.url} key={key}>
                #{item.tag}
              </Link>
            ))}
          </div>
        </div>
      </Right>
    </BaseLayout>
  );
};

export default dynamic(() => Promise.resolve(connect(loginMapStateToProps)(HomePage)), {
  ssr: false,
});
