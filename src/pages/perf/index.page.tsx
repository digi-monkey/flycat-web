import { Button } from 'antd';
import { BaseLayout, Left, Right } from 'components/BaseLayout';
import PostItems from 'components/PostItems';
import { dbQuery } from 'core/db';
import { DbEvent } from 'core/db/schema';
import { useCallWorker } from 'hooks/useWorker';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { HomeMsgFilter, homeMsgFilters } from 'pages/home/filter';
import { useEffect, useState } from 'react';

const Perf = () => {
  const relayUrls = [
    'wss://nostr.rocks/',
    'wss://relay.snort.social/',
    'wss://relay.damus.io/',
    'wss://relay.nostr.bg/',
    'wss://relay.nostr.info/',
    'wss://nostr.orangepill.dev/',
    'wss://nostr-pub.wellorder.net/',
    'wss://universe.nostrich.land/',
    'wss://relay.nostr.band/',
  ];
  const [selectNumber, setSelectNumber] = useState<number>(0);
  const [msg, setMsg] = useState<DbEvent[]>([]);
  const [queryTime, setQueryTime] = useState<number>(0);
  const { worker } = useCallWorker();

  const query = async (msgFilter: HomeMsgFilter) => {
    setQueryTime(0);
    setMsg([]);
    const start = performance.now();
    const events = await dbQuery.matchFilterRelay(
      msgFilter.filter,
      relayUrls,
      msgFilter.isValidEvent,
    );
    const diff = performance.now() - start;
    console.log('total query time: ', diff);
    setQueryTime(diff);
    setMsg(events);
  };

  useEffect(() => {
    const msgFilter = homeMsgFilters[selectNumber];
    query(msgFilter);
  }, [selectNumber]);

  return (
    <BaseLayout>
      <Left>
        <div>
          {homeMsgFilters.map((item, index) => (
            <Button key={index} onClick={() => setSelectNumber(index)}>
              {item.label}
            </Button>
          ))}
          <hr />
          selected {homeMsgFilters[selectNumber].label}, time:{' '}
          {queryTime.toLocaleString()} ms
          <hr />
          <PostItems msgList={msg} relays={relayUrls} worker={worker!} />
        </div>
      </Left>
      <Right></Right>
    </BaseLayout>
  );
};

export default Perf;

export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale, ['common'])),
  },
});
