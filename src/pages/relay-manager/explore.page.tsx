import { BaseLayout, Left } from 'components/BaseLayout';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useRouter } from 'next/router';
import { FaSearch } from 'react-icons/fa';
import { FaArrowLeft } from 'react-icons/fa6';
import RelayPool from './components/RelayPool';
import { useState } from 'react';
import { Input } from 'components/shared/ui/Input';

export default function RelayExplorePage() {
  const router = useRouter();
  const [keyword, setKeyword] = useState<string>();

  return (
    <BaseLayout>
      <Left>
        <div className="flex flex-col h-full min-h-[calc(100vh-64px)]">
          <div className="flex justify-between px-5 py-4">
            <div
              className="flex items-center gap-1 cursor-pointer"
              onClick={() => {
                router.push('/relay-manager');
              }}
            >
              <FaArrowLeft className="h-4 w-4" />
              <span className="subheader1-bold text-lg">Browse all relays</span>
            </div>
            <div className="w-[200px] bg-surface-02 border border-border-01 border-solid flex items-center gap-1 px-3 py-2 rounded-full">
              <FaSearch className="h-4 w-4 text-text-secondary" />
              <Input
                className="flex-1 border-none outline-none body text-md"
                placeholder="Search Relay..."
                value={keyword}
                onChange={e => setKeyword(e.currentTarget.value)}
              />
            </div>
          </div>
          <RelayPool keyword={keyword} />
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
