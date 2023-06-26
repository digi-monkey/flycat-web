import { BaseLayout, Left, Right } from 'components/BaseLayout';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'react-i18next';
import { Segmented } from 'antd';
import { useCallWorker } from 'hooks/useWorker';
import { useState } from 'react';
import { EventMap, UserMap } from 'core/nostr/type';
import { LatestFeed } from './latestFeed';
import { BestLongFormFeed } from './bestLongFormFeed';
import PageTitle from 'components/PageTitle';

import styles from './index.module.scss';

const Explore = () => {
  const { t } = useTranslation();

  const { worker, newConn } = useCallWorker();
  const [userMap, setUserMap] = useState<UserMap>(new Map());
  const [eventMap, setEventMap] = useState<EventMap>(new Map());
  const [selectedOption, setSelectedOption] = useState('Latest');

  const handleOptionChange = option => {
    setSelectedOption(option);
  };

  const renderContent = () => {
    if (selectedOption === 'Latest') {
      return (
        <LatestFeed
          worker={worker!}
          newConn={newConn}
          userMap={userMap}
          setUserMap={setUserMap}
          eventMap={eventMap}
          setEventMap={setEventMap}
        />
      );
    } else if (selectedOption === 'Hot') {
      return (
        <LatestFeed
          worker={worker!}
          newConn={newConn}
          userMap={userMap}
          setUserMap={setUserMap}
          eventMap={eventMap}
          setEventMap={setEventMap}
        />
      );
    } else if (selectedOption === 'Best long-form') {
      return (
        <BestLongFormFeed
          worker={worker!}
          newConn={newConn}
          userMap={userMap}
          setUserMap={setUserMap}
          eventMap={eventMap}
          setEventMap={setEventMap}
        />
      );
    }
  };

  return (
    <BaseLayout>
      <Left>
        <div className={styles.header}>
          <PageTitle title={'Explore'} />
          <div>
            <Segmented
              value={selectedOption}
              onChange={handleOptionChange}
              options={['Latest', 'Hot', 'Best long-form']}
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

export default Explore;
