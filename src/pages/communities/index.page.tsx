import { BaseLayout, Left, Right } from 'components/BaseLayout';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'react-i18next';
import { useCallWorker } from 'hooks/useWorker';
import { useLoadCommunities } from './hooks/useLoadCommunities';
import { Event } from 'core/nostr/Event';
import { ReactNode, useEffect, useState } from 'react';
import { CommunityMetadata, Nip172 } from 'core/nip/172';
import { EventTags, Filter, Naddr, WellKnownEventKind } from 'core/nostr/type';
import { Avatar, Input, List, Tabs } from 'antd';
import { useLoadModeratorProfiles } from './hooks/useLoadProfile';

import PageTitle from 'components/PageTitle';
import styles from './index.module.scss';
import Icon from 'components/Icon';
import { useMyPublicKey } from 'hooks/useMyPublicKey';
import { useRouter } from 'next/router';
import { getContactEvent } from 'core/worker/util';
import { isValidPublicKey } from 'utils/validator';
import { contactQuery, dbQuery } from 'core/db';
import { MsgFeed, MsgSubProp } from 'components/MsgFeed';
import { useLiveQuery } from 'dexie-react-hooks';

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
  const [selectTabKey, setSelectTabKey] = useState<string>('All Tribes');
  const [msgSubProp, setMsgSubProp] = useState<MsgSubProp>({});

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

  const onMsgFeedChanged = () => {
    if (selectTabKey == null) return console.debug('unknown tab key');

    let msgFilter: Filter | null = null;
    let isValidEvent: ((event: Event) => boolean) | undefined;
    const emptyDataReactNode: ReactNode | null = null;

    if (selectTabKey === 'All Tribes') {
      const addrs = Array.from(communities.keys());
      if (addrs.length === 0) return;

      msgFilter = {
        kinds: [Nip172.approval_kind],
        '#a': addrs,
        limit: 50,
      };
      isValidEvent = (event: Event) => {
        return event.kind === Nip172.approval_kind;
      };
    }

    if (selectTabKey === 'Following') {
      const addrs = myContactEvent?.tags
        .filter(
          t =>
            t[0] === EventTags.A &&
            (t[1] as string).startsWith(
              `${WellKnownEventKind.community_metadata}:`,
            ),
        )
        .map(t => t[1] as Naddr);
      console.log('following: ', addrs);
      if (!addrs || addrs.length === 0) {
        return;
      }
      msgFilter = {
        kinds: [Nip172.approval_kind],
        '#a': addrs,
        limit: 50,
      };
      isValidEvent = (event: Event) => {
        return event.kind === Nip172.approval_kind;
      };
    }

    if (msgFilter == null) return console.debug('unknown filter');

    console.log(
      'start sub msg.. !!!msgFilter: ',
      msgFilter,
      selectTabKey,
      isValidEvent,
    );

    const msgSubProp: MsgSubProp = {
      msgFilter,
      isValidEvent,
      emptyDataReactNode,
    };
    setMsgSubProp(msgSubProp);
  };

  useEffect(() => {
    onMsgFeedChanged();
  }, [myContactEvent, selectTabKey, communities.size]);

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

  useEffect(() => {
    if (communities.size > 0 && worker) {
      const addrs = Array.from(communities.keys());
      const filter: Filter = {
        kinds: [Nip172.approval_kind],
        '#a': addrs,
        limit: 50,
      };
      worker.subFilter({
        filter,
      });
    }
  }, [communities, worker]);

  useEffect(() => {
    if (
      selectTabKey === 'Following' &&
      isValidPublicKey(myPublicKey) &&
      worker &&
      myContactEvent
    ) {
      const addrs = myContactEvent.tags
        .filter(
          t =>
            t[0] === EventTags.A &&
            (t[1] as string).startsWith(
              `${WellKnownEventKind.community_metadata}:`,
            ),
        )
        .map(t => t[1] as Naddr);
      const filter: Filter = {
        kinds: [Nip172.approval_kind],
        '#a': addrs,
        limit: 50,
      };
      worker.subFilter({
        filter,
      });
      console.log('sub following comm:', filter);
    }
  }, [myContactEvent, myPublicKey, worker, selectTabKey]);

  useLoadCommunities({ worker, newConn });
  useLoadModeratorProfiles({ worker, newConn, communities });

  const tabsItems = ['All Tribes', 'Following'].map(name => {
    return {
      key: name,
      label: name,
    };
  });

  const commCardListData = Array.from(communities.keys())
    .filter(k =>
      searchName ? k.toLowerCase().includes(searchName.toLowerCase()) : true,
    )
    .map(k => communities.get(k))
    .filter(v => v != null) as CommunityMetadata[];

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
                    <Avatar size={'small'} src={item.image} />
                    <div className={styles.name}>
                      {item?.id?.length > 0 ? item?.id : 'unnamed'}
                    </div>
                  </div>
                </List.Item>
              )}
            />

            <Tabs
              items={tabsItems}
              defaultValue={selectTabKey}
              activeKey={selectTabKey}
              onChange={val => setSelectTabKey(val)}
            />
          </div>
        </div>
        <MsgFeed msgSubProp={msgSubProp} worker={worker} />
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
