import { BaseLayout, Left, Right } from 'components/BaseLayout';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'react-i18next';
import { useCallWorker } from 'hooks/useWorker';
import { useLoadCommunities } from './hooks/useLoadCommunities';
import { Event } from 'core/nostr/Event';
import { useEffect, useState } from 'react';
import { CommunityMetadata, Nip172 } from 'core/nip/172';
import {
  EventMap,
  EventSetMetadataContent,
  EventTags,
  Filter,
  Naddr,
  UserMap,
  WellKnownEventKind,
} from 'core/nostr/type';
import { Avatar, Input, List, Tabs } from 'antd';
import { deserializeMetadata } from 'core/nostr/content';
import { useLoadProfiles } from './hooks/useLoadProfile';

import PageTitle from 'components/PageTitle';
import styles from './index.module.scss';
import Icon from 'components/Icon';
import { EventWithSeen } from 'pages/type';
import PostItems from 'components/PostItems';
import { useMyPublicKey } from 'hooks/useMyPublicKey';
import { updateMyContactEvent } from 'core/worker/util';
import { setEventWithSeenMsgList } from 'pages/helper';
import Link from 'next/link';

const Explore = () => {
  const { t } = useTranslation();
  const myPublicKey = useMyPublicKey();
  const { worker, newConn } = useCallWorker();

  const [myContactEvent, setMyContactEvent] = useState<Event>();
  const [userMap, setUserMap] = useState<UserMap>(new Map());
  const [eventMap, setEventMap] = useState<EventMap>(new Map());
  const [communities, setCommunities] = useState<Map<Naddr, CommunityMetadata>>(
    new Map(),
  );
  const [msgList, setMsgList] = useState<EventWithSeen[]>([]);
  const [followCommMsgList, setFollowCommMsgList] = useState<EventWithSeen[]>(
    [],
  );
  const [searchName, setSearchName] = useState<string>();
  const [selectTabKey, setSelectTabKey] = useState<string>('All Tribes');

  const handleEvent = (event: Event, relayUrl?: string) => {
    switch (event.kind) {
      case WellKnownEventKind.set_metadata:
        {
          const metadata: EventSetMetadataContent = deserializeMetadata(
            event.content,
          );
          setUserMap(prev => {
            const newMap = new Map(prev);
            const oldData = newMap.get(event.pubkey) as { created_at: number };
            if (oldData && oldData.created_at > event.created_at) {
              // the new data is outdated
              return newMap;
            }

            newMap.set(event.pubkey, {
              ...metadata,
              ...{ created_at: event.created_at },
            });
            return newMap;
          });
        }
        break;

      case Nip172.metadata_kind:
        const metadata = Nip172.parseCommunityMetadata(event);
        const addr = Nip172.communityAddr({
          identifier: metadata.id,
          author: metadata.creator,
        });
        setCommunities(prev => {
          const newMap = new Map(prev);
          newMap.set(addr, metadata);
          return newMap;
        });
        break;

      case Nip172.approval_kind:
        {
          const approvedEvent = Nip172.parseNoteFromApproval(event);
          if (approvedEvent) {
            setMsgList(oldArray => {
              if (!oldArray.map(e => e.id).includes(approvedEvent.id)) {
                // do not add duplicated msg

                // save event
                const newItems = [
                  ...oldArray,
                  { ...approvedEvent, ...{ seen: [relayUrl!] } },
                ];
                // sort by timestamp
                const sortedItems = newItems.sort((a, b) =>
                  a.created_at >= b.created_at ? -1 : 1,
                );
                return sortedItems;
              } else {
                const id = oldArray.findIndex(s => s.id === approvedEvent.id);
                if (id === -1) return oldArray;

                if (!oldArray[id].seen?.includes(relayUrl!)) {
                  oldArray[id].seen?.push(relayUrl!);
                }
              }
              return oldArray;
            });
          }
        }

        break;

      default:
        break;
    }
  };

  useEffect(() => {
    if (communities.size > 0 && worker) {
      const addrs = Array.from(communities.keys());
      const filter: Filter = {
        kinds: [Nip172.approval_kind],
        '#a': addrs,
        limit: 50,
      };
      worker
        .subFilter({
          filter,
        })
        .iterating({ cb: handleEvent });
    }
  }, [communities, worker]);

  useEffect(() => {
    if (!worker) return;
    if (myPublicKey.length === 0) return;

    updateMyContactEvent({worker, pk: myPublicKey, setMyContactEvent});
  }, [worker, myPublicKey, newConn]);

  useEffect(() => {
    if (
      selectTabKey === 'Following' &&
      myPublicKey.length > 0 &&
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
      worker
        .subFilter({
          filter,
        })
        .iterating({
          cb: (event, relayUrl) => {
            if (event.kind !== WellKnownEventKind.community_approval) return;
            const targetEvent = Nip172.parseNoteFromApproval(event);
            if (targetEvent)
              setEventWithSeenMsgList(
                targetEvent,
                relayUrl!,
                setFollowCommMsgList,
              );
          },
        });
    }
  }, [myContactEvent, myPublicKey, worker, selectTabKey]);

  useLoadCommunities({ worker, newConn, handleEvent });
  useLoadProfiles({ worker, handleEvent, newConn, communities });

  const tabsItems = ['All Tribes', 'Following'].map(name => {
    return {
      key: name,
      label: name,
    };
  });

  const renderContent = () => {
    if (selectTabKey === 'All Tribes') {
      return (
        <PostItems
          msgList={msgList.slice(0, 50)}
          worker={worker!}
          userMap={userMap}
          eventMap={eventMap}
          relays={worker?.relays.map(r => r.url) || []}
        />
      );
    }

    if (selectTabKey === 'Following') {
      return (
        <PostItems
          msgList={followCommMsgList.slice(0, 50)}
          worker={worker!}
          userMap={userMap}
          eventMap={eventMap}
          relays={worker?.relays.map(r => r.url) || []}
        />
      );
    }
  };

  const commCardListData = Array.from(communities.keys())
    .filter(k =>
      searchName ? k.toLowerCase().includes(searchName.toLowerCase()) : true,
    )
    .map(k => communities.get(k))
    .filter(v => v != null) as CommunityMetadata[];

  return (
    <BaseLayout>
      <Left>
        <PageTitle title={'Explore'} />
        <div className={styles.explorePanel}>
          <div className={styles.searchGroup}>
            <Input
              placeholder="community name"
              prefix={<Icon type="icon-search" />}
              onChange={e => setSearchName(e.target.value)}
            />
            <Icon onClick={()=>window.open("/explore/community/list")} className={styles.commList} type="icon-rule-mode" />
          </div>

          <div className={styles.posts}>
            <List
              pagination={{
                responsive: true,
                simple: true,
                defaultCurrent: 10,
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
                      window.open(
                        `/explore/community/` +
                          Nip172.communityAddr({
                            identifier: item.id,
                            author: item.creator,
                          }),
                      )
                    }
                  >
                    <Avatar size={'small'} src={item.image} />
                    <div className={styles.name}>
                      {item.id.length > 0 ? item.id : 'unnamed'}
                    </div>
                  </div>
                </List.Item>
              )}
            />

            <Tabs
              items={tabsItems}
              defaultValue={selectTabKey}
              onChange={val => setSelectTabKey(val)}
            />
          </div>
        </div>

        {renderContent()}
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
