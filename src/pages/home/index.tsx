import { Paths } from 'constants/path';
import { connect } from 'react-redux';
import { ReactNode, useState } from 'react';
import { useRouter } from 'next/router';
import { handleEvent } from './utils';
import { EventWithSeen } from 'pages/type';
import { useCallWorker } from 'hooks/useWorker';
import { useMyPublicKey } from 'hooks/useMyPublicKey';
import { useTranslation } from 'next-i18next';
import { loginMapStateToProps } from 'pages/helper';
import { LoginMode, SignEvent } from 'store/loginReducer';
import { Button, Input, Segmented } from 'antd';
import { BaseLayout, Left, Right } from 'components/BaseLayout';
import {
  ContactList,
  EventMap,
  Filter,
  UserMap,
  WellKnownEventKind,
} from 'core/nostr/type';
import { useSubContactList } from './hooks';
import { CallRelayType } from 'core/worker/type';
import { MsgFeed } from 'components/MsgFeed';

import Icon from 'components/Icon';
import Link from 'next/link';
import PubNoteTextarea from 'components/PubNoteTextarea';

import styles from './index.module.scss';
import PageTitle from 'components/PageTitle';
import { Event } from 'core/nostr/Event';
import { stringHasImageUrl } from 'utils/common';

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
  const [myContactList, setMyContactList] = useState<ContactList>();
  const [selectFilter, setSelectFilter] = useState<string>('Follow');

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

  const emptyFollowReactData = (
    <>
      <div className={styles.tipsy}>
        <h1>Share Your Thoughts with The Community</h1>
        <p>
          Only your notes and the ones you follow will show up here. Publish
          your ideas and discover what others are sharing!
        </p>
      </div>
      {!isLoggedIn && (
        <div className={styles.login}>
          <Button type="primary" onClick={() => router.push(Paths.login)}>
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
  );

  const filterMsg = (
    <Segmented
      value={selectFilter}
      onChange={val => setSelectFilter(val as string)}
      options={['Follow', 'All', 'Article', 'Media']}
    />
  );

  const renderMsg = () => {
    let msgFilter: Filter | null = null;
    let isValidEvent: ((event: Event) => boolean) | undefined;
    let emptyData: ReactNode | null = null;

    if (selectFilter === 'Follow') {
      const pks = myContactList?.keys || [];
      msgFilter = {
        limit: 50,
        kinds: [
          WellKnownEventKind.text_note,
          WellKnownEventKind.article_highlight,
          WellKnownEventKind.long_form,
          WellKnownEventKind.reposts,
        ],
        authors: pks,
      };
      emptyData = emptyFollowReactData;
    }

    if (selectFilter === 'All') {
      msgFilter = {
        limit: 50,
        kinds: [
          WellKnownEventKind.text_note,
          WellKnownEventKind.article_highlight,
          WellKnownEventKind.long_form,
          WellKnownEventKind.reposts,
        ],
      };
    }

    if (selectFilter === 'Article') {
      msgFilter = {
        limit: 50,
        kinds: [WellKnownEventKind.long_form],
      };
    }

    if(selectFilter === 'Media'){
      msgFilter = {
        limit: 50,
        kinds: [
          WellKnownEventKind.text_note,
        ],
      }
      isValidEvent = (event: Event) => {
        return event.kind === WellKnownEventKind.text_note && stringHasImageUrl(event.content);
      }
    }

    if (msgFilter == null) return 'unknown filter';

    return (
      <MsgFeed
        key={selectFilter}
        msgFilter={msgFilter}
        isValidEvent={isValidEvent}
        worker={worker}
        newConn={newConn}
        setEventMap={setEventMap}
        setUserMap={setUserMap}
        eventMap={eventMap}
        userMap={userMap}
        emptyDataReactNode={emptyData}
      />
    );
  };

  return (
    <BaseLayout>
      <Left>
        <PageTitle title={'Home'} right={filterMsg} />
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
        {renderMsg()}
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
