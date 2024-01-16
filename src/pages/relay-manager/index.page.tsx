import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { BaseLayout, Left } from 'components/BaseLayout';
import Link from 'next/link';
import RelayGroup from './components/RelayGroup';
import GetNIP65RelayButton from './components/GetNip65RelayButton';
import FindAutoRelayButton from './components/FindAutoRelayButton';

export interface RelayMenuProp {
  showRelayPool: boolean;
  setShowRelayPool: any;
}

export default function RelayManager() {
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
          <div className="flex px-4 pb-3 items-center gap-3">
            <GetNIP65RelayButton />
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
