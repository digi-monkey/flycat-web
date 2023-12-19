import { Button, Input, Segmented, Tabs } from 'antd';
import { BaseLayout, Left, Right } from 'components/BaseLayout';
import Icon from 'components/Icon';
import { MsgFeed, MsgSubProp } from 'components/MsgFeed';
import PageTitle from 'components/PageTitle';
import PubNoteTextarea from 'components/PubNoteTextarea';
import { Paths } from 'constants/path';
import { contactQuery } from 'core/db';
import { Event } from 'core/nostr/Event';
import { PublicKey } from 'core/nostr/type';
import { useLiveQuery } from 'dexie-react-hooks';
import { useMatchMobile } from 'hooks/useMediaQuery';
import { useMyPublicKey } from 'hooks/useMyPublicKey';
import { useCallWorker } from 'hooks/useWorker';
import { cloneDeep } from 'lodash-es';
import { useTranslation } from 'next-i18next';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { loginMapStateToProps, parsePubKeyFromTags } from 'pages/helper';
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { connect } from 'react-redux';
import { LoginMode, SignEvent } from 'store/loginReducer';
import { isValidPublicKey } from 'utils/validator';
import { CustomFilter } from './custom-filter';
import { homeMsgFilters, homeMsgFiltersMap, HomeMsgFilterType } from './filter';
import { trendingTags } from './hashtags';
import { useSubContactList } from './hooks';
import styles from './index.module.scss';
import { updates } from './updates';
import { useLocalStorage } from 'usehooks-ts';
import {
  SELECTED_FILTER_STORAGE_KEY,
  SELECTED_TAB_KEY_STORAGE_KEY,
} from './constants';

export interface HomePageProps {
  isLoggedIn: boolean;
  mode?: LoginMode;
  signEvent?: SignEvent;
}

enum TabKey {
  Follow = 'follow',
  Global = 'global',
  Custom = 'custom',
}

const HomePage = ({ isLoggedIn }: HomePageProps) => {
  const { t } = useTranslation();

  const router = useRouter();
  const myPublicKey = useMyPublicKey();
  const { worker, newConn } = useCallWorker();
  const isMobile = useMatchMobile();

  const defaultTabActivateKey = isLoggedIn ? TabKey.Follow : TabKey.Global;
  const defaultSelectedFilter = HomeMsgFilterType.all;

  const [lastSelectedTabKey, setLastSelectedTabKey] = useLocalStorage<TabKey>(
    SELECTED_TAB_KEY_STORAGE_KEY,
    defaultTabActivateKey,
  );
  const [lastSelectedFilter, setLastSelectedFilter] =
    useLocalStorage<HomeMsgFilterType>(
      SELECTED_FILTER_STORAGE_KEY,
      defaultSelectedFilter,
    );

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

  const emptyFollowPlaceholder = useMemo(
    () => (
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
    ),
    [isLoggedIn, router, t],
  );

  const onMsgFilterChanged = useCallback(() => {
    if (
      !lastSelectedTabKey ||
      !lastSelectedFilter ||
      lastSelectedTabKey === TabKey.Custom
    ) {
      return;
    }

    const selectedMsgFilter = homeMsgFiltersMap[lastSelectedFilter] ?? {};
    if (!selectedMsgFilter) {
      return;
    }

    const msgFilter = cloneDeep(selectedMsgFilter);
    const isValidEvent = selectedMsgFilter.isValidEvent;
    let placeholder: ReactNode | null = null;

    if (lastSelectedTabKey === TabKey.Follow) {
      if (!isLoggedIn || myPublicKey == null || myPublicKey.length === 0) {
        return;
      }

      const followings: PublicKey[] = myContactEvent
        ? parsePubKeyFromTags(myContactEvent.tags)
        : [];
      if (!followings.includes(myPublicKey)) {
        followings.push(myPublicKey);
      }
      placeholder = emptyFollowPlaceholder;
      if (followings.length > 0) {
        msgFilter.authors = followings;
      }
    }

    const msgSubProp: MsgSubProp = {
      msgFilter,
      isValidEvent,
      placeholder,
    };
    setMsgSubProp(msgSubProp);
  }, [
    emptyFollowPlaceholder,
    isLoggedIn,
    myContactEvent,
    myPublicKey,
    lastSelectedFilter,
    lastSelectedTabKey,
  ]);

  useEffect(() => {
    if (!alreadyQueryMyContact) return;
    onMsgFilterChanged();
  }, [alreadyQueryMyContact, onMsgFilterChanged]);

  return (
    <BaseLayout>
      <Left>
        <PageTitle title="Home" />
        {!isMobile && <PubNoteTextarea />}
        <div>
          <Tabs
            items={[
              { key: TabKey.Follow, label: 'Follow', disabled: !isLoggedIn },
              { key: TabKey.Global, label: 'Global' },
              { key: TabKey.Custom, label: 'Custom' },
            ]}
            activeKey={lastSelectedTabKey}
            onChange={key => setLastSelectedTabKey(key as TabKey)}
          />
        </div>
        <div className={isMobile ? styles.mobileFilter : styles.msgFilter}>
          <div>
            {lastSelectedTabKey === TabKey.Custom ? (
              <CustomFilter worker={worker} onMsgPropChange={setMsgSubProp} />
            ) : (
              <Segmented
                value={lastSelectedFilter}
                onChange={val =>
                  setLastSelectedFilter(val as HomeMsgFilterType)
                }
                options={homeMsgFilters.map(val => {
                  return {
                    value: val.type,
                    label: val.label,
                  };
                })}
              />
            )}
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
            <Link href={'https://github.com/digi-monkey/flycat-web/releases'}>
              Learn more
            </Link>
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
