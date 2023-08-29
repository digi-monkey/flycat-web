import { Paths } from 'constants/path';
import { connect } from 'react-redux';
import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useCallWorker } from 'hooks/useWorker';
import { useMyPublicKey } from 'hooks/useMyPublicKey';
import { useTranslation } from 'next-i18next';
import { loginMapStateToProps } from 'pages/helper';
import { LoginMode, SignEvent } from 'store/loginReducer';
import { Button, Input, Segmented, Tabs } from 'antd';
import { BaseLayout, Left, Right } from 'components/BaseLayout';
import {
  ContactList,
  EventMap,
  Filter,
  PublicKey,
  UserMap,
  WellKnownEventKind,
} from 'core/nostr/type';
import { useLoadContactList, useSubContactList } from './hooks';
import { MsgFeed, MsgSubProp } from 'components/MsgFeed';

import Icon from 'components/Icon';
import Link from 'next/link';
import PubNoteTextarea from 'components/PubNoteTextarea';

import styles from './index.module.scss';
import { Event } from 'core/nostr/Event';
import { stringHasImageUrl } from 'utils/common';

import dynamic from 'next/dynamic';
import { useMatchMobile } from 'hooks/useMediaQuery';

export interface HomePageProps {
  isLoggedIn: boolean;
  mode?: LoginMode;
  signEvent?: SignEvent;
}

const HomePage = ({ isLoggedIn }: HomePageProps) => {
  const { t } = useTranslation();

  const router = useRouter();
  const myPublicKey = useMyPublicKey();
  const { worker, newConn } = useCallWorker();
  const isMobile = useMatchMobile();
  const defaultTabActivateKey = isLoggedIn ? 'follow' : 'global';

  const [eventMap, setEventMap] = useState<EventMap>(new Map());
  const [userMap, setUserMap] = useState<UserMap>(new Map());
  const [myContactList, setMyContactList] = useState<ContactList>();
  const [selectTabKey, setSelectTabKey] = useState<string>(
    defaultTabActivateKey,
  );
  const [selectFilter, setSelectFilter] = useState<string>('All');

  const [msgSubProp, setMsgSubProp] = useState<MsgSubProp>({});
  useLoadContactList(myPublicKey, worker, setMyContactList);
  useSubContactList(myPublicKey, newConn, worker, setMyContactList);

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

  const onMsgFeedChanged = () => {
    if (selectTabKey == null) return 'unknown tab key';
    if (selectFilter == null) return 'unknown filter type';

    let msgFilter: Filter | null = null;
    let isValidEvent: ((event: Event) => boolean) | undefined;
    let emptyDataReactNode: ReactNode | null = null;

    if (selectFilter === 'All') {
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

    if (selectFilter === 'Article') {
      msgFilter = {
        limit: 50,
        kinds: [WellKnownEventKind.long_form],
      };
      isValidEvent = (event: Event) => {
        return event.kind === WellKnownEventKind.long_form;
      };
    }

    if (selectFilter === 'Media') {
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

    if (msgFilter == null) return 'unknown filter';

    const pks: PublicKey[] = [];
    if (selectTabKey === 'follow') {
      if (!isLoggedIn) {
        return console.debug('not login');
      }
      if (myPublicKey == null || myPublicKey.length === 0) {
        return console.debug('no my public key', myPublicKey);
      }

      const followings = myContactList?.keys || [];
      if (!followings.includes(myPublicKey)) {
        followings.push(myPublicKey);
      }
      pks.push(...followings);
      emptyDataReactNode = emptyFollowReactData;
      if (pks.length > 0) {
        msgFilter.authors = pks;
      }
    }

    console.log(
      'start sub msg.. !!!msgFilter: ',
      msgFilter,
      selectFilter,
      selectTabKey,
      isValidEvent,
    );

    const msgSubProp: MsgSubProp = {
      msgFilter,
      isValidEvent,
      emptyDataReactNode,
    };
    setMsgSubProp(prev => msgSubProp);
  };

  useEffect(() => {
    onMsgFeedChanged();
  }, [selectFilter, selectTabKey, myContactList, myPublicKey]);

  return (
    <BaseLayout>
      <Left>
        <div>
          <Tabs
            items={[
              { key: 'follow', label: 'Follow', disabled: !isLoggedIn },
              { key: 'global', label: 'Global' },
            ]}
            defaultActiveKey={defaultTabActivateKey}
            onChange={key => setSelectTabKey(key)}
          />
        </div>
        {!isMobile && (
          <PubNoteTextarea
            pubSuccessCallback={(eventId, relayUrl) => {
              // todo
            }}
          />
        )}
        <div className={isMobile ? styles.mobileFilter : ''}>
          <div className={styles.msgFilter}>
            <Segmented
              value={selectFilter}
              onChange={val => setSelectFilter(val as string)}
              options={['All', 'Article', 'Media']}
            />
          </div>
        </div>

        <MsgFeed
          msgSubProp={msgSubProp}
          worker={worker}
          newConn={newConn}
          setEventMap={setEventMap}
          setUserMap={setUserMap}
          eventMap={eventMap}
          userMap={userMap}
        />
      </Left>
      <Right>
        <div className={styles.rightPanel}>
          <Input placeholder="Search" prefix={<Icon type="icon-search" />} />
          <div className={styles.flycat}>
            <Link href={Paths.landing}>Install mobile app (PWA)</Link>
            <h2>Flycat updates</h2>
            {updates.map((item, key) => (
              <div className={styles.item} key={key}>
                <p>{item.content}</p>
                {item.isNew && <span>New</span>}
              </div>
            ))}
            <Link href={Paths.home}>Learn more</Link>
          </div>

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

export default dynamic(
  () => Promise.resolve(connect(loginMapStateToProps)(HomePage)),
  {
    ssr: false,
  },
);
