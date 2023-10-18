import { RootState } from 'store/configureStore';
import { seedRelays } from "core/relay/pool/seed";
import { useSelector } from "react-redux";
import { useCallWorker } from "hooks/useWorker";
import { CallRelayType } from "core/worker/type";
import { useEffect, useState } from "react";
import { useReadonlyMyPublicKey } from "hooks/useMyPublicKey";
import { deserializeMetadata } from 'core/nostr/content';
import {
  EventContactListPTag,
  EventSetMetadataContent,
  EventTags,
  Naddr,
  PublicKey,
  UserMap,
  WellKnownEventKind
} from 'core/nostr/type';
import { Event } from 'core/nostr/Event';
import styles from './index.module.scss';
import { CallWorker } from 'core/worker/caller';
import { createCallRelay } from 'core/worker/util';
import { CommunityMetadata, Nip172 } from 'core/nip/172';

export interface IMentions {
  key: string,
  value: string,
  label: React.ReactNode
}

export function useLoadContacts({
  worker,
  newConn,
}: {
  worker?: CallWorker;
  newConn: string[];
}) {
  const myPublicKey = useReadonlyMyPublicKey();
  const isLoggedIn = useSelector((state: RootState) => state.loginReducer.isLoggedIn);

  const [userMap, setUserMap] = useState<UserMap>(new Map());
  const [userContactList, setUserContactList] = useState<{ keys: PublicKey[]; created_at: number }>({ keys: [], created_at: 0 });

  function handleEvent(event: Event, relayUrl?: string) {
    if (event.kind === WellKnownEventKind.set_metadata) {
      const metadata: EventSetMetadataContent = deserializeMetadata(event.content);
      setUserMap(prev => {
        const newMap = new Map(prev);
        const oldData = newMap.get(event.pubkey);
        if (oldData && oldData.created_at > event.created_at) return newMap;

        newMap.set(event.pubkey, {
          ...metadata,
          ...{ created_at: event.created_at },
        });

        return newMap;
      });
    }

    if (event.kind === WellKnownEventKind.contact_list) {
      if (event.pubkey === myPublicKey) {
        setUserContactList(prev => {
          if (prev && prev?.created_at >= event.created_at) return prev;

          const keys = (
            event.tags.filter(
              t => t[0] === EventTags.P,
            ) as EventContactListPTag[]
          ).map(t => t[1]);

          return {
            keys,
            created_at: event.created_at,
          };
        });
      }
    }
  }

  useEffect(() => {
    const pks = userContactList?.keys || [];
    if (isLoggedIn && myPublicKey.length > 0) pks.push(myPublicKey);
    if (pks.length === 0) return;

    worker
      ?.subMetaDataAndContactList(pks, undefined, {
        type: CallRelayType.batch,
        data: newConn,
      })
      ?.iterating({ cb: handleEvent });
  }, [newConn, myPublicKey]);

  return { userMap, userContactList };
}

export function useSetMentions(
  setMentionsValue: React.Dispatch<React.SetStateAction<IMentions[]>>,
  userMap: UserMap
) {
  const myPublicKey = useReadonlyMyPublicKey();

  // todo: this render too many times, maybe just set value before user typing
  useEffect(() => {
    if (userMap.size === 0) return;

    setMentionsValue([]);
    const mentions = Array.from(userMap.entries())?.filter(u => u[0] !== myPublicKey).reduce((result, [pk, user]) => {
      const name = user.name || user.display_name || "...";
      result.push({
        key: pk,
        value: name,
        label: <div className={styles.mentions}>
          <img src={user?.picture} alt="picture" />
          <span>{name}</span>
        </div>
      });
      return result;
    }, [] as IMentions[]);
    if (mentions.length > 0)
      setMentionsValue(mentions);
  }, [userMap.size]);
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

  const handleEvent = (event: Event, relayUrl?: string) => {
    switch (event.kind) {
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

  useEffect(() => {
    if (!worker) return;

    const callRelay = createCallRelay(newConn);
    const filter = Nip172.communitiesFilter();
    worker.subFilter({ filter, callRelay }).iterating({ cb: handleEvent });
  }, [newConn, worker]);

  return communities;
}
