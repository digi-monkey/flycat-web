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

export function FilterMarket() {
  const router = useRouter();
  const { worker } = useCallWorker();
  const filterOpts = useNoscriptFilterOptions({ worker });
  const filterOtpSetting = useFilterOptionSetting();

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

        <div className="flex flex-wrap flex-start gap-0.5 space-y-1 px-6">
          {filterOpts.map(filterOpt => {
            const disabled = filterOtpSetting.isAdded(filterOpt);
            return (
              <div
                className="flex flex-col justify-between rounded-lg border border-gray-300 border-solid w-[240px] px-4 py-2 bg-neutral-100"
                key={filterOpt.eventId}
              >
                <div className="flex justify-center flex-col text-center">
                  <div className="font-poppins text-lg">{filterOpt.title}</div>
                </div>

                <div className="font-noto w-full text-gray-400">
                  {filterOpt.description}
                </div>
                <div className="w-full flex justify-between mt-1">
                  <div className="flex justify-center items-center gap-0.5">
                    <Avatar.Root className="flex justify-center items-center w-8 h-8 bg-gray-200 rounded-full overflow-hidden m-auto">
                      <Avatar.Image
                        src={filterOpt?.picture}
                        alt={filterOpt.title}
                        className="w-full h-full"
                        sizes=""
                      />
                      <Avatar.Fallback className="text-lg font-medium uppercase text-gray-400">
                        {filterOpt.pubkey.slice(0, 2)}
                      </Avatar.Fallback>
                    </Avatar.Root>
                    <div className="text-sm text-gray-400">
                      {filterOpt.pubkey.slice(0, 7)}
                    </div>
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

        <div className="text-lg font-poppins mt-4 mb-2 px-6">
          My filter-options
        </div>
        <div className="flex flex-wrap flex-start gap-0.5 space-y-1 px-6">
          {filterOtpSetting.getOpts().map(opt => (
            <div
              className="flex justify-between flex-row rounded-lg border border-gray-300 border-solid w-[240px] px-4 py-2"
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
      </Left>
    </BaseLayout>
  );
}

export default FilterMarket;

export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale, ['common'])),
  },
});
