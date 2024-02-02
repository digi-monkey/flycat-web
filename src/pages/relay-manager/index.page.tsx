import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { BaseLayout, Left } from 'components/BaseLayout';
import Link from 'next/link';
import RelayGroup from './components/RelayGroup';
import FindAutoRelayButton from './components/FindAutoRelayButton';
import CreateNewGroupButton from './components/CreateNewGroupButton';

export interface RelayMenuProp {
  showRelayPool: boolean;
  setShowRelayPool: any;
}

export default function RelayManager() {
  return (
    <BaseLayout>
      <Left>
        <div className="flex flex-col h-[calc(100vh-64px)]">
          <div className="flex justify-between px-5 py-4">
            <span className="subheader1-bold">Relays</span>
            <Link
              href="/relay-manager/explore"
              className="text-text-link no-underline"
            >
              Explore 500+ relays
            </Link>
          </div>
          <div className="flex px-4 py-3 items-center gap-3 w-full overflow-x-scroll box-border">
            <div className="md:hidden">
              <CreateNewGroupButton />
            </div>
            <FindAutoRelayButton />
          </div>
          <RelayGroup />
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
