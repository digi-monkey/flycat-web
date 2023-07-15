import { BaseLayout, Left, Right } from 'components/BaseLayout';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'react-i18next';
import { useCallWorker } from 'hooks/useWorker';
import { useLoadCommunities } from '../hooks/useLoadCommunities';
import { Event } from 'core/nostr/Event';
import { useEffect, useState } from 'react';
import { CommunityMetadata, Nip172 } from 'core/nip/172';
import {
  EventSetMetadataContent,
  EventTags,
  Naddr,
  UserMap,
  WellKnownEventKind,
} from 'core/nostr/type';
import { Button, Divider, Input, List, Tabs } from 'antd';
import { deserializeMetadata } from 'core/nostr/content';
import { useLoadProfiles } from '../hooks/useLoadProfile';

import PageTitle from 'components/PageTitle';
import styles from '../index.module.scss';
import { SearchOutlined } from '@ant-design/icons';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { updateMyContactEvent } from 'core/worker/util';

const Explore = () => {
  const { t } = useTranslation();

  const myPublicKey = useReadonlyMyPublicKey();
  const { worker, newConn } = useCallWorker();

  const [userMap, setUserMap] = useState<UserMap>(new Map());
  const [myContactEvent, setMyContactEvent] = useState<Event>();
  const [communities, setCommunities] = useState<Map<Naddr, CommunityMetadata>>(
    new Map(),
  );
  const [searchName, setSearchName] = useState<string>();

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

      default:
        break;
    }
  };

  useLoadCommunities({ worker, newConn, handleEvent });
  useLoadProfiles({ worker, handleEvent, newConn, communities });

  useEffect(() => {
    if (!worker) return;
    if (myPublicKey.length === 0) return;
    updateMyContactEvent({ worker, pk: myPublicKey, setMyContactEvent });
  }, [worker, myPublicKey]);

  const myFollowingCommunity = myContactEvent?.tags
    .filter(
      t =>
        t[0] === EventTags.A &&
        typeof t[1] === 'string' &&
        t[1].startsWith(`${WellKnownEventKind.community_metadata}`),
    )
    .map(t => t[1] as Naddr);

  return (
    <BaseLayout>
      <Left>
        <PageTitle title={'Communities'} />

        <div className={styles.communitySearchPanel}>
          <Input
            size="large"
            addonBefore={<SearchOutlined />}
            placeholder="Search community name"
            onChange={e => setSearchName(e.target.value)}
          />

          <Button
            type="primary"
            size="large"
            onClick={() => window.open('/explore/community/create')}
          >
            create community 
          </Button>
        </div>

        <div className={styles.communityTab}>
          {!searchName && (
            <>
              <Divider orientation="left">My Following</Divider>
              <List
                dataSource={Array.from(communities.keys())
                  .filter(a => myFollowingCommunity?.includes(a))
                  .map(naddr => {
                    const community = communities.get(naddr)!;
                    return {
                      value: community,
                      key: naddr,
                    };
                  })}
                renderItem={item => (
                  <List.Item
                    extra={<img alt="logo" src={item.value.image} />}
                    onClick={() =>
                      window.open('/explore/community/' + item.key)
                    }
                  >
                    <List.Item.Meta
                      style={{ textOverflow: 'ellipsis' }}
                      title={<a href={item.key}>{item.value.id}</a>}
                      description={item.value.description}
                    />
                  </List.Item>
                )}
              />
              <Divider orientation="left">All Communities</Divider>
            </>
          )}

          <List
            dataSource={
              searchName
                ? Array.from(communities.keys())
                    .filter(a => a.toLocaleLowerCase().includes(searchName.toLocaleLowerCase()))
                    .map(naddr => {
                      const community = communities.get(naddr)!;
                      return {
                        value: community,
                        key: naddr,
                      };
                    })
                : Array.from(communities.keys()).map(naddr => {
                    const community = communities.get(naddr)!;
                    return {
                      value: community,
                      key: naddr,
                    };
                  })
            }
            renderItem={item => (
              <List.Item
                extra={<img alt="logo" src={item.value.image} />}
                onClick={() => window.open('/explore/community/' + item.key)}
              >
                <List.Item.Meta
                  style={{ textOverflow: 'ellipsis' }}
                  title={<a href={item.key}>{item.value.id}</a>}
                  description={item.value.description}
                />
              </List.Item>
            )}
          />
        </div>
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
