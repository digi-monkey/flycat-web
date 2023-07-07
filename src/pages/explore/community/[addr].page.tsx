import { BaseLayout, Left, Right } from 'components/BaseLayout';
import {
  EventMap,
  EventSetMetadataContent,
  Naddr,
  UserMap,
  WellKnownEventKind,
} from 'core/nostr/type';
import { Event } from 'core/nostr/Event';
import { useCallWorker } from 'hooks/useWorker';
import { useRouter } from 'next/router';
import { Community } from './community';
import { CommunityMetadata, Nip172 } from 'core/nip/172';
import { deserializeMetadata } from 'core/nostr/content';
import { useEffect, useState } from 'react';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { createCallRelay } from 'core/worker/util';

type UserParams = {
  addr: Naddr;
};

export default function NaddrCommunity() {
  const router = useRouter();
  const query = router.query as UserParams;
  const naddr = decodeURIComponent(query.addr);

  const { worker, newConn } = useCallWorker();
  const [userMap, setUserMap] = useState<UserMap>(new Map());
  const [eventMap, setEventMap] = useState<EventMap>(new Map());
  const [community, setCommunity] = useState<CommunityMetadata>();

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
        console.log(event, addr, naddr);
        if (addr === naddr) {
          console.log('data!');
          setCommunity(metadata);
        }
        break;

      default:
        break;
    }
  };

  useEffect(() => {
    if (!worker) return;

    const result = Nip172.parseCommunityAddr(naddr);
    const callRelay = createCallRelay(newConn);
    const filter = Nip172.communityByPkAndIdFilter(
      result.identifier,
      result.author,
    );
    worker.subFilter({ filter, callRelay }).iterating({ cb: handleEvent });
  }, [worker, newConn, naddr]);

  return (
    <BaseLayout>
      <Left>
        {community && (
          <Community
            worker={worker}
            setEventMap={setEventMap}
            setUserMap={setUserMap}
            userMap={userMap}
            eventMap={eventMap}
            community={community}
          />
        )}
      </Left>
      <Right></Right>
    </BaseLayout>
  );
}

export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale, ['common'])),
  },
});

export const getStaticPaths = () => ({ paths: [], fallback: true });
