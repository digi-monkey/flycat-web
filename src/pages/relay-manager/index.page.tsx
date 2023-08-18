import { useTranslation } from 'next-i18next';
import { useState } from 'react';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { BaseLayout, Left } from 'components/BaseLayout';
import { RelayPoolManager } from './RelayPool';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { RelayGroup } from './RelyaGroup';
import { RelayGroup as RelayGroupClass } from 'core/relay/group';
import styles from './index.module.scss';
import Icon from 'components/Icon';
import { useDefaultGroup } from './hooks/useDefaultGroup';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { useLoadRelayGroup } from './hooks/useLoadRelayGroup';
import { Input, Modal } from 'antd';
import { RelayPool } from 'core/relay/pool';
import { SearchResult } from './SearchResult';

const { Search } = Input;

export interface RelayMenuProp {
  showRelayPool: boolean;
  setShowRelayPool: any;
}

export const RelayMenu: React.FC<RelayMenuProp> = ({
  showRelayPool,
  setShowRelayPool,
}) => {
  const [searchKeyWords, setSearchKeyWords] = useState<string>();
  const onSearch = async () => {
    if (!searchKeyWords) return;
    const relayPool = new RelayPool();
    const relays = await relayPool.getAllRelays();
    Modal.info({
      title: 'Search ' + searchKeyWords + ' in ' + relays.length + ' relays',
      content: <SearchResult keyWords={searchKeyWords} relays={relays} />,
    });
  };

  return showRelayPool ? (
    <div className={styles.header}>
      <div
        className={styles.exploreTitle}
        onClick={() => setShowRelayPool(false)}
      >
        <Icon type="icon-arrow-left" className={styles.icon} />
        <div className={styles.title}>Browse all relays</div>
      </div>
      <div className={styles.search}>
        <Input
          value={searchKeyWords}
          onChange={e => setSearchKeyWords(e.target.value)}
          onPressEnter={_e => onSearch()}
          placeholder="search relay key words.."
          prefix={<Icon type="icon-search" />}
        />
      </div>
    </div>
  ) : (
    <div className={styles.pageTitle}>
      <div className={styles.title}>Relays</div>
      <div className={styles.btn} onClick={() => setShowRelayPool(true)}>
        Explore 500+ relays
      </div>
    </div>
  );
};

export function RelayManager() {
  const { t } = useTranslation();

  const myPublicKey = useReadonlyMyPublicKey();
  const [showRelayPool, setShowRelayPool] = useState(false);
  const [groups, setGroups] = useState<RelayGroupClass>();

  const defaultGroup = useDefaultGroup();
  useLoadRelayGroup({ myPublicKey, defaultGroup, setGroups });

  return (
    <BaseLayout>
      <Left>
        <div className={styles.root}>
          <RelayMenu
            setShowRelayPool={setShowRelayPool}
            showRelayPool={showRelayPool}
          />
          {!showRelayPool && (
            <RelayGroup groups={groups} setGroups={setGroups} />
          )}
          {showRelayPool && (
            <RelayPoolManager groups={groups} setGroups={setGroups} />
          )}
        </div>
      </Left>
    </BaseLayout>
  );
}

export default RelayManager;

export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale, ['common'])),
  },
});
