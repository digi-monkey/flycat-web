import { Msgs } from 'components/layout/msg/Msg';
import { Paths } from 'constants/path';
import { Button } from '@mui/material';
import { UserMap } from 'service/type';
import { connect } from 'react-redux';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { BlogFeeds } from '../blog/feed';
import { getDraftId } from 'utils/common';
import { LoginFormTip } from 'components/layout/NavHeader';
import { EventWithSeen } from 'pages/type';
import { useCallWorker } from 'hooks/useWorker';
import { useMyPublicKey } from 'hooks/useMyPublicKey';
import { useTranslation } from 'next-i18next';
import { PubNoteTextarea } from 'components/layout/PubNoteTextarea';
import { loginMapStateToProps } from 'pages/helper';
import { LoginMode, SignEvent } from 'store/loginReducer';
import { BaseLayout, Left, Right } from 'components/layout/BaseLayout';
import { handleEvent, onSubmitText, refreshMsg } from './utils';
import { Event, PublicKey, RelayUrl, PetName } from 'service/api';
import {
  useSubGlobalMsg,
  useSubMsg,
  useSubMetaDataAndContactList,
  useLoadMoreMsg,
} from './hooks';

import styles from './index.module.scss';
import BasicTabs from 'components/layout/SimpleTabs';
import CreateIcon from '@mui/icons-material/Create';
import PublicIcon from '@mui/icons-material/Public';
import GroupAddIcon from '@mui/icons-material/GroupAdd';

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

  const tabItems = {
    note: (
      <>
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
              fullWidth
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
          <Button fullWidth onClick={() => setLoadMoreCount(prev => prev + 1)}>
            {t('home.loadMoreBtn')}
          </Button>
        </div>
      </>
    ),
    post: (
      <div>
        <div
          style={{
            margin: '10px 0px 40px 0px',
          }}
        >
          <Button
            fullWidth
            variant="contained"
            style={{
              textTransform: 'capitalize',
              color: 'white',
            }}
            onClick={() =>
              router.push({
                pathname: Paths.write,
                query: { did: getDraftId() },
              })
            }
          >
            <CreateIcon />
            &nbsp;{t('nav.menu.blogDashboard')}
          </Button>
        </div>
        <BlogFeeds />
      </div>
    ),
  };

  return (
    <BaseLayout>
      <Left>
        <BasicTabs items={tabItems} />
      </Left>
      <Right>
        <ul className={styles.menu}>
          <li onClick={() => router.push({ pathname: Paths.universe })}>
            <PublicIcon />
            <span style={{ marginLeft: '5px' }}>
              {'explore nostr universe'}
            </span>
          </li>
          <li onClick={() => router.push({ pathname: Paths.fof })}>
            <GroupAddIcon />
            <span style={{ marginLeft: '5px' }}>
              {'find friend of friends'}
            </span>
          </li>
        </ul>
      </Right>
    </BaseLayout>
  );
};

export default connect(loginMapStateToProps)(HomePage);
