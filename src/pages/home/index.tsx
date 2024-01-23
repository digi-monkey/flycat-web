import { Input } from 'antd';
import { BaseLayout, Left, Right } from 'components/BaseLayout';
import Icon from 'components/Icon';
import PageTitle from 'components/PageTitle';
import PubNoteTextarea from 'components/PubNoteTextarea';
import { Paths } from 'constants/path';
import { useMatchMobile } from 'hooks/useMediaQuery';
import { useMyPublicKey } from 'hooks/useMyPublicKey';
import { useCallWorker } from 'hooks/useWorker';
import { useTranslation } from 'next-i18next';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { loginMapStateToProps } from 'pages/helper';
import { useMemo } from 'react';
import { connect } from 'react-redux';
import { LoginMode, SignEvent } from 'store/loginReducer';
import { isValidPublicKey } from 'utils/validator';
import {
  MsgFilterMode,
  MsgFilter,
  defaultMsgFilters,
} from '../../core/msg-filter/filter';
import { trendingTags } from './hashtags';
import { useSubContactList } from './hooks/useSubContactList';
import styles from './index.module.scss';
import { updates } from './updates';
import { useLocalStorage } from 'usehooks-ts';
import { SELECTED_FILTER_STORAGE_KEY } from './constants';
import { TimelineTabs } from 'components/TimelineTabs';
import { useFilterOptionSetting } from 'pages/filter-market/hook/useFilterOptionSetting';
import { useNoscriptMsgFilter } from './hooks/useNoscriptMsgFilter';

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

  const defaultSelectedFilter = isLoggedIn
    ? defaultMsgFilters.find(f => f.mode === MsgFilterMode.follow)!.key
    : defaultMsgFilters.find(f => f.mode === MsgFilterMode.global)!.key;

  const [lastSelectedFilter, setLastSelectedFilter] = useLocalStorage<string>(
    SELECTED_FILTER_STORAGE_KEY,
    defaultSelectedFilter,
  );

  useSubContactList(myPublicKey, newConn, worker);

  const noscriptMsgFilters = useNoscriptMsgFilter();

  const filterOpts = useMemo(() => {
    if (!isLoggedIn || !isValidPublicKey(myPublicKey)) {
      return defaultMsgFilters.filter(v => v.mode !== MsgFilterMode.follow);
    }

    if (noscriptMsgFilters) {
      console.debug('noscriptMsgFilters: ', noscriptMsgFilters);
      const opts: MsgFilter[] = [
        ...defaultMsgFilters.filter(f => f.mode === MsgFilterMode.follow),
        ...noscriptMsgFilters,
      ];
      return opts;
    }

    return defaultMsgFilters.filter(f => f.mode === MsgFilterMode.follow);
  }, [defaultMsgFilters, noscriptMsgFilters, isLoggedIn, myPublicKey]);

  return (
    <BaseLayout>
      <Left>
        <PageTitle title="Home" />
        {!isMobile && <PubNoteTextarea />}
        <TimelineTabs
          worker={worker}
          filterOptions={filterOpts}
          defaultActiveKey={lastSelectedFilter}
          onActiveKeyChanged={val => setLastSelectedFilter(val)}
          editOptUrl="/filter-market"
        />
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
