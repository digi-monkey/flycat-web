import { useTranslation } from 'next-i18next';
import { useState } from 'react';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { BaseLayout, Left } from 'components/BaseLayout';
import { RelayPoolManager } from './RelayPool';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { RelayGroup } from './RelyaGroup';
import styles from './index.module.scss';
import Icon from 'components/Icon';

export interface RelayMenuProp {
  showRelayPool: boolean;
  setShowRelayPool: any;
}

export const RelayMenu: React.FC<RelayMenuProp> = ({
  showRelayPool,
  setShowRelayPool,
}) => {
  return showRelayPool ? (
    <div className={styles.header} onClick={() => setShowRelayPool(false)}>
        <Icon type="icon-arrow-left" className={styles.icon} />
        <div className={styles.title}>Browse all relays</div>
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

  const [showRelayPool, setShowRelayPool] = useState(false);

  return (
    <BaseLayout>
      <Left>
        <RelayMenu
          setShowRelayPool={setShowRelayPool}
          showRelayPool={showRelayPool}
        />
        {!showRelayPool && <RelayGroup />}
        {showRelayPool && <RelayPoolManager />}
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
