import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { BaseLayout, Left } from 'components/BaseLayout';
import { useDefaultGroup } from './hooks/useDefaultGroup';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { useRelayGroupState } from './hooks/useLoadRelayGroup';
import Link from 'next/link';
import RelayGroup from './RelayGroup';

export interface RelayMenuProp {
  showRelayPool: boolean;
  setShowRelayPool: any;
}

export default function RelayManager() {
  const myPublicKey = useReadonlyMyPublicKey();
  const defaultGroup = useDefaultGroup();
  const [groups, setGroups] = useRelayGroupState(myPublicKey, defaultGroup);

  console.log(groups);

  return (
    <BaseLayout>
      <Left>
        <div className="flex flex-col h-full min-h-[calc(100vh-64px)]">
          <div className="flex justify-between px-5 py-4">
            <span className="subheader1-bold">Relays</span>
            <Link
              href="/relay-manager/explore"
              className="text-text-link no-underline"
            >
              Explore 500+ relays
            </Link>
          </div>
          <RelayGroup groups={groups} />
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
