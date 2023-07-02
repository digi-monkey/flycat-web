import { BaseLayout, Left, Right } from 'components/BaseLayout';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'react-i18next';
import { Empty, Select } from 'antd';
import { useCallWorker } from 'hooks/useWorker';
import { useState } from 'react';
import { EventMap, UserMap } from 'core/nostr/type';
import { useBookmarkListFeed } from './hooks/useBookmarkListFeed';
import { FilterOptions } from './filterOptions';
import PostItems from 'components/PostItems';
import { useLastReplyEvent } from './hooks/useLastReplyEvent';
import PageTitle from 'components/PageTitle';
import styles from "./index.module.scss";

const Bookmark = () => {
  const { t } = useTranslation();

  const { worker, newConn } = useCallWorker();
  const [userMap, setUserMap] = useState<UserMap>(new Map());
  const [eventMap, setEventMap] = useState<EventMap>(new Map());
  const [selectedValue, setSelectedValue] = useState<string>(
    FilterOptions[0].value,
  );

  const handleSelectChange = (value: string) => {
    setSelectedValue(value);
  };

  const feed = useBookmarkListFeed({ worker, newConn, userMap, setUserMap, setEventMap });
  useLastReplyEvent({msgList: feed, worker, userMap, setUserMap, setEventMap});

  const renderContent = () => {
    const allowKinds: number[] = FilterOptions.filter(
      opt => opt.value === selectedValue,
    ).map(opt => opt.kinds)[0];

    const selectFeed = feed.filter(f => allowKinds.includes(f.kind));
    return (
      selectFeed.length > 0 ?
      <PostItems
        msgList={selectFeed}
        worker={worker!}
        userMap={userMap}
        eventMap={eventMap}
        relays={[]}
      /> : <Empty />
    );
  };

  return (
    <BaseLayout>
      <Left>
        <div>
          <PageTitle title='Bookmark' />
          <div className={styles.selectBox}>
            <Select
              defaultValue={FilterOptions[0].value}
              options={FilterOptions}
              value={selectedValue}
              onChange={handleSelectChange}
              className={styles.select}
            />
          </div>
        </div>
        <div>{renderContent()}</div>
      </Left>
      <Right></Right>
    </BaseLayout>
  );
};

export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale, ['common'])),
  },
});

export default Bookmark;
