import { Msgs } from 'components/layout/msg/Msg';
import { Paths } from 'constants/path';
import { UserMap } from 'service/type';
import { connect } from 'react-redux';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { LoginFormTip } from 'components/layout/NavHeader';
import { EventWithSeen } from 'pages/type';
import { useCallWorker } from 'hooks/useWorker';
import { useMyPublicKey } from 'hooks/useMyPublicKey';
import { useTranslation } from 'next-i18next';
import { PubNoteTextarea } from 'components/layout/PubNoteTextarea';
import { loginMapStateToProps } from 'pages/helper';
import { LoginMode, SignEvent } from 'store/loginReducer';
import { Avatar, Button, Input } from 'antd';
import { BaseLayout, Left, Right } from 'components/layout/BaseLayout';
import { handleEvent, onSubmitText, refreshMsg } from './utils';
import { Event, PublicKey, RelayUrl, PetName } from 'service/api';
import { useSubGlobalMsg, useSubMsg, useSubMetaDataAndContactList, useLoadMoreMsg } from './hooks';

import styles from './index.module.scss';
import Icon from 'components/Icon';
import Link from 'next/link';

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

const HomePage = ({ isLoggedIn, mode, signEvent }: HomePageProps) => {
  const router = useRouter();
  const myPublicKey = useMyPublicKey();
  const { t } = useTranslation();
  const { worker, newConn, wsConnectStatus } = useCallWorker({});

  const [globalMsgList, setGlobalMsgList] = useState<Event[]>([]);
  const [msgList, setMsgList] = useState<EventWithSeen[]>([]);
  const [loadMoreCount, setLoadMoreCount] = useState<number>(1);

  const [userMap, setUserMap] = useState<UserMap>(new Map());
  const [myContactList, setMyContactList] =
    useState<{ keys: PublicKey[]; created_at: number }>();

  const relayUrls = Array.from(wsConnectStatus.keys());
  const isReadonlyMode = isLoggedIn && signEvent == null;

  const _handleEvent = handleEvent(
    worker,
    isLoggedIn,
    userMap,
    myPublicKey,
    setUserMap,
    setGlobalMsgList,
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
  useSubMsg(myContactList, myPublicKey, newConn, worker, _handleEvent);
  useSubGlobalMsg(isLoggedIn, newConn, worker, _handleEvent);
  useLoadMoreMsg({
    isLoggedIn,
    myContactList,
    myPublicKey,
    msgList,
    worker,
    userMap,
    setUserMap,
    setMsgList,
    setGlobalMsgList,
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
        <PubNoteTextarea
          mode={mode || ({} as LoginMode)}
          disabled={isReadonlyMode || !isLoggedIn}
          onSubmitText={text =>
            onSubmitText(text, signEvent, myPublicKey, worker)
          }
          userContactList={myContactList!}
          userMap={userMap}
        />

        <div style={{ marginTop: '5px' }}>
          <div>
            <Button
              block
              onClick={() =>
                refreshMsg({
                  myContactList,
                  myPublicKey,
                  worker,
                  handleEvent: _handleEvent,
                })
              }
            >
              {t('home.refreshBtn')}
            </Button>
          </div>
          <ul style={{ padding: '5px' }}>
            {msgList.length === 0 && !isLoggedIn && (
              <div>
                <p style={{ color: 'gray' }}>
                  {t('UserRequiredLoginBox.loginFirst')} <LoginFormTip />
                </p>
                <hr />
                <p style={{ color: 'gray', fontSize: '14px' }}>
                  {t('homeFeed.globalFeed')}
                </p>
                {Msgs(globalMsgList, worker!, userMap, relayUrls)}
              </div>
            )}
            {msgList.length === 0 && isLoggedIn && ( 
              <div>
                <p style={{ color: 'gray' }}>{t('homeFeed.noPostYet')}</p>
                <p style={{ color: 'gray' }}>{t('homeFeed.followHint')}</p>
              </div>
            )}
            {msgList.length > 0 &&
              isLoggedIn &&
              Msgs(msgList, worker!, userMap, relayUrls)}
          </ul>
        </div>
        <div>
          <Button block onClick={() => setLoadMoreCount(prev => prev + 1)}>
            {t('home.loadMoreBtn')}
          </Button>
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
