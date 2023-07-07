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
  Naddr,
  UserMap,
  WellKnownEventKind,
} from 'core/nostr/type';
import { Divider, Input, Tabs } from 'antd';
import { Community } from './community/community';
import { deserializeMetadata } from 'core/nostr/content';
import { useLoadProfiles } from './hooks/useLoadProfile';

import PageTitle from 'components/PageTitle';
import styles from './index.module.scss';

const { Search } = Input;

const Explore = () => {
  const { t } = useTranslation();

  const { worker, newConn } = useCallWorker();

  const [userMap, setUserMap] = useState<UserMap>(new Map());
  const [eventMap, setEventMap] = useState<EventMap>(new Map());
  const [communities, setCommunities] = useState<Map<Naddr, CommunityMetadata>>(
    new Map(),
  );
  const [selectedCommunityId, setSelectedCommunityId] = useState<Naddr>();
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

  useEffect(()=>{
    if(communities.size > 0 && !selectedCommunityId){
      setSelectedCommunityId(Array.from(communities.keys())[0]);
    }
  }, [communities]);

  useLoadCommunities({ worker, newConn, handleEvent });
  useLoadProfiles({ worker, handleEvent, newConn, communities });
  return (
    <BaseLayout>
      <Left>
        <PageTitle title={'Explore'} />
        {selectedCommunityId && (
          <Community
            worker={worker}
            setEventMap={setEventMap}
            setUserMap={setUserMap}
            userMap={userMap}
            eventMap={eventMap}
            community={communities.get(selectedCommunityId)!}
          />
        )}
      </Left>
      <Right>
        <div className={styles.rightPanel}>
          <Search
            size="large"
            placeholder="search community name"
            onSearch={value => setSearchName(value)}
          />
          <Divider orientation="left">Communities</Divider>
          <div className={styles.communityTab}>
            <Tabs
              tabPosition="left"
              activeKey={selectedCommunityId}
              onChange={naddr => {console.log("changed!", naddr);setSelectedCommunityId(naddr)}}
              items={
                searchName
                  ? Array.from(communities.keys())
                      .filter(a => a.includes(searchName))
                      .map(naddr => {
                        const community = communities.get(naddr)!;
                        return {
                          label: community.id,
                          key: naddr,
                        };
                      })
                  : Array.from(communities.keys()).map(naddr => {
                      const community = communities.get(naddr)!;
                      return {
                        label: community.id,
                        key: naddr,
                      };
                    })
              }
            />
          </div>
        </div>
      </Right>
    </BaseLayout>
  );
};

export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale, ['common'])),
  },
});

export default Explore;
