import { BaseLayout, Left, Right } from 'components/layout/BaseLayout';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'react-i18next';
import { Select } from 'antd';
import { useCallWorker } from 'hooks/useWorker';
import { useState } from 'react';
import { UserMap } from 'service/type';
import { useBookmarkListFeed } from './hooks/useBookmarkListFeed';
import { Msgs } from 'components/layout/msg/Msg';
import { FilterOptions } from './filterOptions';

const Bookmark = () => {
  const { t } = useTranslation();

  const { worker, newConn } = useCallWorker();
  const [userMap, setUserMap] = useState<UserMap>(new Map());
  const [selectedValue, setSelectedValue] = useState<string>(
    FilterOptions[0].value,
  );

  const handleSelectChange = (value: string) => {
    setSelectedValue(value);
  };

  const feed = useBookmarkListFeed({ worker, newConn, userMap, setUserMap });

  const renderContent = () => {
    const allowKinds: number[] = FilterOptions.filter(
      opt => opt.value === selectedValue,
    ).map(opt => opt.kinds)[0];
    return Msgs(
      feed.filter(f => allowKinds.includes(f.kind)),
      worker!,
      userMap,
      [],
    );
  };

  return (
    <BaseLayout>
      <Left>
        <div>
          <div style={{ fontWeight: 'bold' }}>Bookmark</div>
          <div>
            <Select
              style={{ width: '200px' }}
              defaultValue={FilterOptions[0].value}
              options={FilterOptions}
              value={selectedValue}
              onChange={handleSelectChange}
            />
          </div>
        </div>
        <div>{renderContent()}</div>
      </Left>
      <Right>right</Right>
    </BaseLayout>
  );
};

export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale, ['common'])),
  },
});

export default Bookmark;
