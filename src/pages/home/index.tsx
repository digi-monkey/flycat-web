import { Paths } from 'constants/path';
import { connect } from 'react-redux';
import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useCallWorker } from 'hooks/useWorker';
import { useMyPublicKey } from 'hooks/useMyPublicKey';
import { useTranslation } from 'next-i18next';
import { loginMapStateToProps, parsePubKeyFromTags } from 'pages/helper';
import { LoginMode, SignEvent } from 'store/loginReducer';
import { Button, Input, Segmented, Tabs } from 'antd';
import { BaseLayout, Left, Right } from 'components/BaseLayout';
import { PublicKey } from 'core/nostr/type';
import { useSubContactList } from './hooks';
import { MsgFeed, MsgSubProp } from 'components/MsgFeed';
import { Event } from 'core/nostr/Event';
import { useMatchMobile } from 'hooks/useMediaQuery';
import { useLiveQuery } from 'dexie-react-hooks';
import { contactQuery } from 'core/db';
import { isValidPublicKey } from 'utils/validator';
import { homeMsgFilters, HomeMsgFilterType } from './filter';
import {
  getLastSelectedTabKeyAndFilter,
  updateLastSelectedTabKeyAndFilter,
} from './util';

import Icon from 'components/Icon';
import Link from 'next/link';
import PubNoteTextarea from 'components/PubNoteTextarea';
import dynamic from 'next/dynamic';
import styles from './index.module.scss';
import _ from 'lodash';
import { trendingTags } from './hashtags';
import { updates } from './updates';

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
  const defaultSelectedFilter = HomeMsgFilterType.all;
  const [selectTabKey, setSelectTabKey] = useState<string>();
  const [selectFilter, setSelectFilter] = useState<HomeMsgFilterType>();

  useEffect(() => {
    const lastSelected = getLastSelectedTabKeyAndFilter();
    if (lastSelected.selectedTabKey) {
      setSelectTabKey(lastSelected.selectedTabKey);
    } else {
      setSelectTabKey(defaultTabActivateKey);
    }
    if (lastSelected.selectedFilter) {
      setSelectFilter(lastSelected.selectedFilter as HomeMsgFilterType);
    } else {
      setSelectFilter(defaultSelectedFilter);
    }
  }, []);

  useEffect(() => {
    if (selectFilter && selectTabKey) {
      updateLastSelectedTabKeyAndFilter(selectTabKey, selectFilter);
    }
  }, [selectFilter, selectTabKey]);

  const [myContactEvent, setMyContactEvent] = useState<Event>();
  const [msgSubProp, setMsgSubProp] = useState<MsgSubProp>({});
  const [alreadyQueryMyContact, setAlreadyQueryMyContact] =
    useState<boolean>(false);
  useSubContactList(myPublicKey, newConn, worker);

  useLiveQuery(() => {
    if (!isLoggedIn) {
      setAlreadyQueryMyContact(true);
      return;
    }

    if (!isValidPublicKey(myPublicKey)) return;
    contactQuery.getContactByPubkey(myPublicKey).then(e => {
      setAlreadyQueryMyContact(true);
      if (e != null) {
        setMyContactEvent(e);
      }
    });
  }, [isLoggedIn, myPublicKey]);

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

  const onMsgFilterChanged = () => {
    if (selectTabKey == null) return 'unknown tab key';
    if (selectFilter == null) return 'unknown filter type';

    let msgFilter = homeMsgFilters.find(v => v.type === selectFilter)?.filter;
    msgFilter = msgFilter ? _.cloneDeep(msgFilter) : undefined;
    const isValidEvent = homeMsgFilters.find(
      v => v.type === selectFilter,
    )?.isValidEvent;
    let emptyDataReactNode: ReactNode | null = null;

    if (msgFilter == null) return 'unknown filter';

    const pks: PublicKey[] = [];
    if (selectTabKey === 'follow') {
      if (!isLoggedIn) {
        return console.debug('not login');
      }
      if (myPublicKey == null || myPublicKey.length === 0) {
        return console.debug('no my public key', myPublicKey);
      }

      const followings: string[] = myContactEvent
        ? parsePubKeyFromTags(myContactEvent.tags)
        : [];
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
    setMsgSubProp(msgSubProp);
  };

  useEffect(() => {
    if (!alreadyQueryMyContact) return;

    onMsgFilterChanged();
  }, [
    selectFilter,
    selectTabKey,
    myContactEvent,
    myPublicKey,
    alreadyQueryMyContact,
  ]);

  return (
    <BaseLayout>
      <Left>
        <div>
          <Tabs
            items={[
              { key: 'follow', label: 'Follow', disabled: !isLoggedIn },
              { key: 'global', label: 'Global' },
            ]}
            activeKey={selectTabKey}
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
              onChange={val => setSelectFilter(val as HomeMsgFilterType)}
              options={homeMsgFilters.map(val => {
                return {
                  value: val.type,
                  label: val.label,
                };
              })}
            />
          </div>
        </div>

        <MsgFeed msgSubProp={msgSubProp} worker={worker} />
      </Left>
      <Right>
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
          <div className={styles.flycat}>
            <Link href={Paths.landing}>Install mobile app (PWA)</Link>
            <h2>Flycat updates</h2>
            {updates.map((item, key) => (
              <Link href={item.url} key={key}>
                <div className={styles.item}>
                  <p>{item.content}</p>
                  {item.isNew && <span>New</span>}
                </div>
              </Link>
            ))}
            <Link href={'https://github.com/digi-monkey/flycat-web/releases'}>Learn more</Link>
          </div>

          <div className={styles.trending}>
            <h2>Trending hashtags</h2>
            {trendingTags.map((item, key) => (
              <Link href={Paths.hashTags + item.value} key={key}>
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
