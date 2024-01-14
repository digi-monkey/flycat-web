import { useEffect, useState } from 'react';
import { Spin } from 'antd';
import { BaseLayout, Left, Right } from 'components/BaseLayout';
import { seedRelays } from 'core/relay/pool/seed';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useCallWorker } from 'hooks/useWorker';
import { useLiveQuery } from 'dexie-react-hooks';
import { dbQuery } from 'core/db';
import { Filter, WellKnownEventKind } from 'core/nostr/type';
import { DbEvent } from 'core/db/schema';
import { validateFilter } from 'components/TimelineRender/util';
import { useRouter } from 'next/router';

import Icon from 'components/Icon';
import PageTitle from 'components/PageTitle';
import PostItems from 'components/PostItems';

export function HashTags() {
  const router = useRouter();
  const { tag } = router.query as { tag: string };

  const [isQuerying, setIsQuerying] = useState<boolean>(false);
  const { worker } = useCallWorker();

  const queryFilter: Filter = {
    '#t': [tag],
    kinds: [WellKnownEventKind.text_note, WellKnownEventKind.long_form],
    limit: 50,
  };
  const queryOnLocalDB = async () => {
    setIsQuerying(true);
    let result: DbEvent[] = [];
    if (!queryFilter || (queryFilter && !validateFilter(queryFilter))) {
      return result;
    }
    result = await dbQuery.matchFilterRelay(queryFilter, []);
    setIsQuerying(false);
    return result;
  };

  const events = useLiveQuery(queryOnLocalDB, [tag], [] as DbEvent[]);

  useEffect(() => {
    if (!worker) return;
    if (tag == null || tag.length === 0) return;

    worker.subFilter({ filter: queryFilter });
  }, [tag, worker]);

  return (
    <BaseLayout>
      <Left>
        <PageTitle
          title={`HashTag #${tag}`}
          icon={
            <Icon
              onClick={() => router.back()}
              width={24}
              height={24}
              type="icon-arrow-left"
            />
          }
        />
        <div>{isQuerying && <Spin />}</div>
        <PostItems msgList={events} worker={worker!} />
      </Left>
      <Right></Right>
    </BaseLayout>
  );
}

export default HashTags;

export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale, ['common'])),
  },
});

export const getStaticPaths = () => ({ paths: [], fallback: true });
