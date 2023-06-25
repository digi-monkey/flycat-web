import { Paths } from 'constants/path';
import { UserMap } from 'core/nostr/type';
import { connect } from 'react-redux';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { handleEvent } from './utils';
import { EventWithSeen } from 'pages/type';
import { useCallWorker } from 'hooks/useWorker';
import { useMyPublicKey } from 'hooks/useMyPublicKey';
import { useTranslation } from 'next-i18next';
import { loginMapStateToProps } from 'pages/helper';
import { LoginMode, SignEvent } from 'store/loginReducer';
import { Avatar, Button, Input } from 'antd';
import { BaseLayout, Left, Right } from 'components/BaseLayout';
import { PublicKey, RelayUrl, PetName } from 'core/nostr/type';
import { useSubMsg, useSubMetaDataAndContactList, useLoadMoreMsg } from './hooks';

import styles from './index.module.scss';
import Icon from 'components/Icon';
import Link from 'next/link';
import classNames from 'classnames';
import PubNoteTextarea from 'components/PubNoteTextarea';
import PostItems from 'components/PostItems';

export type ContactList = Map<
  PublicKey,
  {
    relayer: RelayUrl;
    name: PetName;
  }
>;

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

  const [userMap, setUserMap] = useState<UserMap>(new Map());
  const [msgList, setMsgList] = useState<EventWithSeen[]>([]);
  const [loadMoreCount, setLoadMoreCount] = useState<number>(1);
  const [myContactList, setMyContactList] = useState<{ keys: PublicKey[]; created_at: number }>();

  const relayUrls = Array.from(wsConnectStatus.keys());

  const _handleEvent = handleEvent(
    worker,
    isLoggedIn,
    userMap,
    myPublicKey,
    setUserMap,
    setMsgList,
    setMyContactList,
  );

  useSubMetaDataAndContactList(
    myPublicKey,
    newConn,
    isLoggedIn,
    worker,
    _handleEvent,
  );
  useSubMsg(myContactList, myPublicKey, newConn, worker!, _handleEvent);
  useLoadMoreMsg({
    isLoggedIn,
    myContactList,
    myPublicKey,
    msgList,
    worker,
    userMap,
    setUserMap,
    setMsgList,
    setMyContactList,
    loadMoreCount,
  });

  // right test data
  const updates = [
    {
      content: '[4.13] Generating rss/json feed for...',
      isNew: true,
    },
    {
      content: '[4.12] ogp on blog post',
      isNew: false,
    }
  ];
  const friends = [
    {
      id: '1',
      name: 'ElectronicMonkey',
      desc: "🚀 Tackling what's next @ Web3 🤖  Love to learn ...",
      avatar: 'https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png',
    },
    {
      id: '2',
      name: 'ElectronicMonkey',
      desc: "🚀 Tackling what's next @ Web3 🤖  Love to learn ...",
      avatar: 'https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png',
    }
  ];
  const trending = [
    { tag: 'Nostr', url: Paths.home },
    { tag: 'Nip', url: Paths.home },
    { tag: 'Bitcoin', url: Paths.home },
    { tag: 'Zapping', url: Paths.home }
  ]

  return (
    <BaseLayout>
      <Left>
        <PubNoteTextarea />
        <div className={classNames(styles.home, {
          [styles.noData]: msgList.length === 0
        })}>
          {(msgList.length === 0 || !isLoggedIn) ? (
            <>
              <div className={styles.tipsy}>
                <h1>Share Your Thoughts with The Community</h1>
                <p>Only your notes and the ones you follow will show up here. Publish your ideas and discover what others are sharing!</p>
              </div>
              {!isLoggedIn && (
                <div className={styles.login}>
                  <Button type='primary' onClick={() => router.push(Paths.login)}>{t('nav.menu.signIn')}</Button>
                  <span onClick={() => router.push(Paths.login)} className={styles.explore}>Explore as a guest</span>
                </div>
              )}
            </>
          ) : (
            <>
              <div className={styles.msgList}>
                <PostItems msgList={msgList} worker={worker!} userMap={userMap} relays={relayUrls} showLastReplyToEvent={false} />
              </div>
              <Button block onClick={() => setLoadMoreCount(prev => prev + 1)}>{t('home.loadMoreBtn')}</Button>
            </>
          )}
        </div>
      </Left>
      <Right>
        <div className={styles.rightPanel}>
          <Input placeholder="Search" prefix={<Icon type='icon-search' />} />
          <div className={styles.flycat}>
            <h2>Flycat updates</h2>
            {
              updates.map((item, key) => (
                <div className={styles.item} key={key}>
                  <p>{item.content}</p>
                  { item.isNew && <span>New</span> }
                </div>
              ))
            }
            <Link href={Paths.home}>Learn more</Link>
          </div>
          <div className={styles.friends}>
            <h2>Friends of friends</h2>
            {
              friends.map((item, key) => (
                <div className={styles.friend} key={key}>
                  <Avatar src={item.avatar} />
                  <div className={styles.friendInfo}>
                    <h3>{item.name}</h3>
                    <p>{item.desc}</p>
                  </div>
                  <Button className={styles.follow}>Follow</Button>
                </div>
              ))
            }
          </div>
          <div className={styles.trending}>
            <h2>Trending hashtags</h2>
            { trending.map((item, key) => <Link href={item.url} key={key}>#{item.tag}</Link>) }
          </div>
        </div>
      </Right>
    </BaseLayout>
  );
};

export default connect(loginMapStateToProps)(HomePage);
