import { BaseLayout, Left, Right } from 'components/BaseLayout';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'react-i18next';
import { useCallWorker } from 'hooks/useWorker';
import { useLoadCommunities } from './hooks/useLoadCommunities';
import { Event } from 'core/nostr/Event';
import { useEffect, useMemo, useState } from 'react';
import { CommunityMetadata, Nip172 } from 'core/nip/172';
import { EventTags, Naddr, WellKnownEventKind } from 'core/nostr/type';
import { Input, List } from 'antd';
import { useLoadModeratorProfiles } from './hooks/useLoadProfile';

import PageTitle from 'components/PageTitle';
import styles from './index.module.scss';
import Icon from 'components/Icon';
import { useMyPublicKey } from 'hooks/useMyPublicKey';
import { useRouter } from 'next/router';
import { getContactEvent } from 'core/worker/util';
import { isValidPublicKey } from 'utils/validator';
import { contactQuery, dbQuery } from 'core/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { TimelineTabs } from 'components/TimelineTabs';
import { defaultCommTimelineFilters } from 'core/timeline-filter';
import Avatar from 'components/shared/ui/Avatar';

const Explore = () => {
  const { t } = useTranslation();
  const myPublicKey = useMyPublicKey();
  const router = useRouter();
  const { worker, newConn } = useCallWorker();

  const [myContactEvent, setMyContactEvent] = useState<Event>();
  const [communities, setCommunities] = useState<Map<Naddr, CommunityMetadata>>(
    new Map(),
  );
  const [searchName, setSearchName] = useState<string>();

  useEffect(() => {
    if (!worker) return;
    if (!isValidPublicKey(myPublicKey)) return;

    getContactEvent({ worker, pk: myPublicKey });
  }, [worker, myPublicKey, newConn]);

  useEffect(() => {
    if (isValidPublicKey(myPublicKey)) {
      contactQuery.getContactByPubkey(myPublicKey).then(e => {
        if (e) {
          setMyContactEvent(e);
        }
      });
    }
  }, [myPublicKey]);

  const filterOptions = useMemo(() => {
    return defaultCommTimelineFilters.map(f => {
      if (f.key === 'all-tribes') {
        return f;
      }
      if (f.key === 'following-tribes') {
        const addrs = myContactEvent?.tags
          .filter(
            t =>
              t[0] === EventTags.A &&
              (t[1] as string).startsWith(
                `${WellKnownEventKind.community_metadata}:`,
              ),
          )
          .map(t => t[1] as Naddr);

        if (addrs && addrs.length > 0 && f.filter) {
          f.filter['#a'] = addrs;
        } else {
          f.filter = undefined;
        }

        return f;
      }
      return f;
    });
  }, [defaultCommTimelineFilters, myContactEvent]);

  useLiveQuery(async () => {
    const filter = Nip172.communitiesFilter();
    filter.limit = 500;
    const relayUrls = worker?.relays.map(r => r.url) || [];
    if (relayUrls.length === 0) return;
    const events = await dbQuery.matchFilterRelay(filter, relayUrls);
    console.log('query comm:', filter, relayUrls, events);
    const map = new Map();
    for (const event of events) {
      const metadata = Nip172.parseCommunityMetadata(event);
      const addr = Nip172.communityAddr({
        identifier: metadata.id,
        author: metadata.creator,
      });
      map.set(addr, metadata);
    }
    setCommunities(map);
  }, [worker?.relayGroupId]);

  useLoadCommunities({ worker, newConn });
  useLoadModeratorProfiles({ worker, newConn, communities });

  const commCardListData = useMemo(
    () =>
      Array.from(communities.keys())
        .filter(k =>
          searchName
            ? k.toLowerCase().includes(searchName.toLowerCase())
            : true,
        )
        .map(k => communities.get(k))
        .filter(v => v != null) as CommunityMetadata[],
    [communities],
  );

  return (
    <BaseLayout>
      <Left>
        <PageTitle title={'Communities'} />
        <div className={styles.explorePanel}>
          <div className={styles.searchGroup}>
            <Input
              placeholder="community name"
              prefix={<Icon type="icon-search" />}
              onChange={e => setSearchName(e.target.value)}
            />
            <Icon
              onClick={() => router.push('/communities/n/list')}
              className={styles.commList}
              type="icon-rule-mode"
            />
          </div>

          <div className={styles.posts}>
            <List
              pagination={{
                responsive: true,
                simple: true,
                defaultCurrent: 1,
                total: commCardListData.length,
              }}
              grid={{
                gutter: 16,
                xs: 5,
                sm: 5,
                md: 5,
                lg: 5,
                xl: 5,
                xxl: 5,
              }}
              dataSource={commCardListData}
              renderItem={item => (
                <List.Item>
                  <div
                    className={styles.commCardListItem}
                    onClick={() =>
                      router.push(
                        `/communities/n/` +
                          Nip172.communityAddr({
                            identifier: item.id,
                            author: item.creator,
                          }),
                      )
                    }
                  >
                    <Avatar src={item.image} fallback={item.id.slice(0, 2)} />
                    <div className={styles.name}>
                      {item?.id?.length > 0 ? item?.id : 'unnamed'}
                    </div>
                  </div>
                </List.Item>
              )}
            />
          </div>
        </div>
        <TimelineTabs filterOptions={filterOptions} worker={worker} />
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

export default Explore;
