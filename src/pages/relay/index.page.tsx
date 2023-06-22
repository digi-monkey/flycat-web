import { useTranslation } from 'next-i18next';
import { useState } from 'react';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { BaseLayout, Left } from 'components/BaseLayout';
import { RelayPoolManager } from './RelayPool';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { RelayGroup } from './RelyaGroup';
import "./index.module.scss";

export interface RelayMenuProp {
  showRelayPool: boolean;
  setShowRelayPool: any;
}

export const RelayMenu: React.FC<RelayMenuProp> = ({
  showRelayPool,
  setShowRelayPool,
}) => {
  return showRelayPool ? (
    <div
      style={{ marginBottom: '20px' }}
      onClick={() => setShowRelayPool(false)}
    >
      <span>
        <ArrowLeftOutlined />{' '}
      </span>
      <span> Browser all relays</span>
    </div>
  ) : (
    <div style={{ marginBottom: '20px' }}>
      <span>Relays</span>
      <span style={{ float: 'right' }}>
        {' '}
        <span onClick={() => setShowRelayPool(true)}>
          Explore 500+ relays
        </span>{' '}
      </span>
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
