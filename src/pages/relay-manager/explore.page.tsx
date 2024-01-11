import { BaseLayout, Left } from 'components/BaseLayout';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useState } from 'react';
import { useDefaultGroup } from './hooks/useDefaultGroup';
import { useRelayGroupState } from './hooks/useLoadRelayGroup';
import { RelayPoolManager } from './RelayPool';
import styles from './index.module.scss';
import Icon from 'components/Icon';
import { Input, Modal } from 'antd';
import { RelayPool } from 'core/relay/pool';
import { SearchResult } from './SearchResult';
import { useRouter } from 'next/router';

export default function RelayExplorePage() {
  const router = useRouter();
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

  const myPublicKey = useReadonlyMyPublicKey();
  const defaultGroup = useDefaultGroup();
  const [groups, setGroups] = useRelayGroupState(myPublicKey, defaultGroup);

  return (
    <BaseLayout>
      <Left>
        <div className={styles.root}>
          <div className={styles.header}>
            <div className={styles.exploreTitle} onClick={() => router.back()}>
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
          <RelayPoolManager groups={groups} setGroups={setGroups} />
        </div>
      </Left>
    </BaseLayout>
  );
}

export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale, ['common'])),
  },
});
