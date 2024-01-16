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
import { useQueryNoScript } from './hooks/useQueryNoscript';
import {
  MsgFilterMode,
  defaultMsgFiltersMap,
  MsgFilterKey,
  MsgFilter,
} from '../../core/msg-filter/filter';
import { trendingTags } from './hashtags';
import { useSubContactList } from './hooks/useSubContactList';
import styles from './index.module.scss';
import { updates } from './updates';
import { useLocalStorage } from 'usehooks-ts';
import { SELECTED_FILTER_STORAGE_KEY } from './constants';
import * as Tabs from '@radix-ui/react-tabs';
import { Timeline } from 'components/Timeline';

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
    ? MsgFilterKey.follow
    : MsgFilterKey.globalAll;

  const [lastSelectedFilter, setLastSelectedFilter] =
    useLocalStorage<MsgFilterKey>(
      SELECTED_FILTER_STORAGE_KEY,
      defaultSelectedFilter,
    );

  useSubContactList(myPublicKey, newConn, worker);

  const noscriptFiltersMap = useQueryNoScript({ worker, newConn });

  const filtersMap = useMemo(() => {
    const filter: Record<MsgFilterKey, MsgFilter> = {
      ...defaultMsgFiltersMap,
      ...noscriptFiltersMap,
    };
    if (!isLoggedIn || !isValidPublicKey(myPublicKey)) {
      return Object.values(filter)
        .filter(v => v.mode !== MsgFilterMode.follow)
        .reduce(
          (map, filter) => ({
            ...map,
            [filter.key]: filter,
          }),
          {} as Record<MsgFilterKey, MsgFilter>,
        );
    }
    return filter;
  }, [defaultMsgFiltersMap, noscriptFiltersMap, isLoggedIn, myPublicKey]);

  return (
    <BaseLayout>
      <Left>
        <PageTitle title="Home" />
        {!isMobile && <PubNoteTextarea />}
        <Tabs.Root
          className="w-full"
          value={lastSelectedFilter}
          onValueChange={val => setLastSelectedFilter(val as MsgFilterKey)}
        >
          <div className="px-4 sticky top-16 bg-white sm:bg-transparent bg-opacity-80 backdrop-blur z-40">
            <Tabs.List className="flex overflow-scroll border-0 border-b border-solid border-b-gray-200">
              {Object.values(filtersMap).map(val => (
                <Tabs.Trigger
                  className="cursor-pointer py-4 px-2 text-gray-600 font-medium focus:outline-none whitespace-nowrap border-transparent bg-transparent border-0 data-[state=active]:text-green-700 data-[state=active]:border-b-2 data-[state=active]:border-green-500"
                  key={val.key}
                  value={val.key}
                >
                  {val.label}
                </Tabs.Trigger>
              ))}
            </Tabs.List>
          </div>
          <div className="px-2">
            {Object.values(filtersMap).map(val => (
              <Tabs.Content key={val.key} value={val.key}>
                <div className="mt-2 text-sm text-text-secondary border border-solid border-brand capitalize px-2 py-2 rounded-lg bg-primary-100">
                  {filtersMap[val.key]?.description}
                </div>

                <Timeline worker={worker} msgFilter={filtersMap[val.key]} />
              </Tabs.Content>
            ))}
          </div>
        </Tabs.Root>
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
