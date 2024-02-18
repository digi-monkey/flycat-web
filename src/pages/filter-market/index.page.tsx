import { BaseLayout, Left } from 'components/BaseLayout';
import Icon from 'components/Icon';
import PageTitle from 'components/PageTitle';
import { useCallWorker } from 'hooks/useWorker';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useRouter } from 'next/router';
import { useNoscriptFilterOptions } from './hook/useFilterNoscripts';
import * as Avatar from '@radix-ui/react-avatar';
import { useFilterOptionSetting } from './hook/useFilterOptionSetting';
import { Button } from 'components/shared/ui/Button';
import dynamic from 'next/dynamic';
import { useCallback, useMemo } from 'react';
import { PublicKey } from 'core/nostr/type';
import { useProfiles } from 'hooks/useProfiles';
import Link from 'next/link';
import DynamicScriptComponent from './script';

export function FilterMarket() {
  const router = useRouter();
  const { worker } = useCallWorker();
  const filterOpts = useNoscriptFilterOptions({ worker });
  const filterOtpSetting = useFilterOptionSetting();

  const filterUsers = useMemo(() => {
    return filterOpts.map(f => f.pubkey);
  }, [filterOpts]);

  const { data: profiles = [] } = useProfiles(filterUsers);
  const getProfile = useCallback(
    (pk: PublicKey) => {
      return profiles.find(profile => profile.pubkey === pk);
    },
    [profiles],
  );

  return (
    <BaseLayout>
      <Left>
        <PageTitle
          title={'Filter Market'}
          icon={
            <Icon
              onClick={() => router.back()}
              width={24}
              height={24}
              type="icon-arrow-left"
            />
          }
        />

        <div className="flex flex-wrap sm:flex-row flex-col flex-start gap-0.5 space-y-1 px-6">
          {filterOpts.map(filterOpt => {
            const disabled = filterOtpSetting.isAdded(filterOpt);
            const userName =
              getProfile(filterOpt.pubkey)?.name ||
              filterOpt.pubkey.slice(0, 7);
            return (
              <div
                className="flex flex-col justify-between rounded-lg border border-gray-300 border-solid lg:w-[240px] sm:w-auto px-4 py-2 bg-neutral-100"
                key={filterOpt.eventId}
              >
                <div className="flex justify-center flex-col text-center">
                  <div className="font-poppins font-semibold text-base leading-6 capitalize">
                    {filterOpt.title}
                  </div>
                </div>

                <div className="font-noto w-full text-gray-400 mt-3">
                  {filterOpt.description}&nbsp; v
                  <span className="text-sm px-1 py-0.5 bg-gray-300 rounded-md text-neutral-100">
                    {filterOpt.version}
                  </span>
                  &nbsp;
                  {filterOpt.source_code && (
                    <Link
                      href={filterOpt.source_code}
                      target="_blank"
                      className="text-sm px-1 py-0.5 bg-blue-300 rounded-md text-neutral-100"
                    >
                      source-code
                    </Link>
                  )}
                </div>

                <div className="w-full flex justify-between mt-5">
                  <div className="flex justify-center items-center gap-0.5">
                    <Avatar.Root className="flex justify-center items-center w-8 h-8 bg-gray-200 rounded-full overflow-hidden m-auto">
                      <Avatar.Image
                        src={getProfile(filterOpt.pubkey)?.picture}
                        alt={filterOpt.title}
                        className="w-full h-full"
                        sizes=""
                      />
                      <Avatar.Fallback className="text-lg font-medium uppercase text-gray-400">
                        {userName.slice(0, 2)}
                      </Avatar.Fallback>
                    </Avatar.Root>
                    <div className="text-sm text-gray-400">{userName}</div>
                  </div>

                  <Button
                    disabled={disabled}
                    onClick={() => filterOtpSetting.addOpt(filterOpt)}
                  >
                    add
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="font-semibold text-base leading-6 font-poppins mt-8 mb-2 px-6">
          My filter-options
        </div>
        <div className="flex flex-wrap flex-start gap-1 space-y-1 px-6">
          {filterOtpSetting.getOpts().map(opt => (
            <div
              className="w-full flex justify-between items-center gap-1 flex-row rounded-lg border border-gray-300 border-solid px-4 py-2"
              key={opt.title}
            >
              <div>
                {opt.title}@{opt.pubkey.slice(0, 7)}
              </div>
              <Button
                variant={'secondary'}
                onClick={() => filterOtpSetting.deleteOpt(opt)}
              >
                delete
              </Button>
            </div>
          ))}
        </div>
        <DynamicScriptComponent />
      </Left>
    </BaseLayout>
  );
}

export default dynamic(() => Promise.resolve(FilterMarket), {
  ssr: false,
});

export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale, ['common'])),
  },
});
