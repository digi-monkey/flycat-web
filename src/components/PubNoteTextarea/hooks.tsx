import { useEffect, useState } from 'react';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { deserializeMetadata } from 'core/nostr/content';
import { Filter, Naddr } from 'core/nostr/type';
import styles from './index.module.scss';
import { CallWorker } from 'core/worker/caller';
import { CommunityMetadata, Nip172 } from 'core/nip/172';
import { contactQuery, dbQuery, profileQuery } from 'core/db';
import { parsePubKeyFromTags } from 'pages/helper';

export interface IMentions {
  key: string;
  value: string;
  label: React.ReactNode;
}

export function useSetMentions(
  setMentionsValue: React.Dispatch<React.SetStateAction<IMentions[]>>,
) {
  const myPublicKey = useReadonlyMyPublicKey();
  const getContactToSetMentions = async () => {
    const contact = await contactQuery.getContactByPubkey(myPublicKey);
    if (contact) {
      const followings = parsePubKeyFromTags(contact.tags);
      const profiles = (await profileQuery.getBatchProfiles(followings)).map(
        e => {
          return {
            pk: e.pubkey,
            ...deserializeMetadata(e.content),
          };
        },
      );
      const mentions = profiles.map(user => {
        const name = user.name || user.display_name || '...';
        const mention: IMentions = {
          key: user.pk,
          value: name,
          label: (
            <div className={styles.mentions}>
              <img src={user?.picture} alt="picture" />
              <span>{name}</span>
            </div>
          ),
        };
        return mention;
      });
      setMentionsValue(mentions);
    }
  };
  useEffect(() => {
    getContactToSetMentions();
  }, [myPublicKey]);
}

export function useLoadCommunities({
  worker,
  newConn,
}: {
  worker?: CallWorker;
  newConn: string[];
}) {
  const [communities, setCommunities] = useState<Map<Naddr, CommunityMetadata>>(
    new Map(),
  );

  const queryCommunity = async (filter: Filter) => {
    const events = await dbQuery.matchFilterRelay(filter, []);
    if (events.length === 0) {
      return worker?.subFilter({ filter });
    }

    events
      .filter(e => e.kind === Nip172.metadata_kind)
      .map(event => {
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
      });
  };

  useEffect(() => {
    if (!worker) return;

    const filter = Nip172.communitiesFilter();
    queryCommunity(filter);
  }, [worker]);

  return communities;
}
