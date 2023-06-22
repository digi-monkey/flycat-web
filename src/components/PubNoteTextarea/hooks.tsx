import { RootState } from 'store/configureStore';
import { seedRelays } from "service/relay/pool/seed";
import { useSelector } from "react-redux";
import { useCallWorker } from "hooks/useWorker";
import { CallRelayType } from "service/worker/type";
import { useEffect, useState } from "react";
import { useReadonlyMyPublicKey } from "hooks/useMyPublicKey";
import { deserializeMetadata } from 'service/nostr/content';
import {
  EventContactListPTag,
  EventSetMetadataContent,
  EventTags,
  PublicKey,
  UserMap,
  WellKnownEventKind
} from 'service/nostr/type';
import { Event } from 'service/nostr/Event';
import styles from './index.module.scss';

export interface IMentions {
  key: string,
  value: string,
  label: React.ReactNode
}

export function useLoadContacts() {
  const { worker, newConn, wsConnectStatus } = useCallWorker();
  const myPublicKey = useReadonlyMyPublicKey();
  const isLoggedIn = useSelector((state: RootState) => state.loginReducer.isLoggedIn);
  
  const [userMap, setUserMap] = useState<UserMap>(new Map());
  const [userContactList, setUserContactList] = useState<{ keys: PublicKey[]; created_at: number }>({ keys:[], created_at: 0 });

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
      ?.subMetaDataAndContactList(pks, undefined, undefined, {
        type: CallRelayType.batch,
        data: newConn || Array.from(wsConnectStatus.keys()),
      })
      ?.iterating({ cb: handleEvent });
  }, [newConn, myPublicKey]);

  return {userMap, userContactList};
}

export function useSetMentions(
  setMentionsValue: React.Dispatch<React.SetStateAction<IMentions[]>>,
  userMap: UserMap
) {
  const myPublicKey = useReadonlyMyPublicKey();

  useEffect(() => {
    setMentionsValue([]);
    const mentions = Array.from(userMap.entries()).filter(u => u[0] !== myPublicKey).reduce((result, [pk, user]) => {
      result.push({
        key: pk,
        value: user.name,
        label: <div className={styles.mentions}>
          <img src={user.picture} alt="picture" />
          <span>{user.name}</span>
        </div>
      });
      return result;
    }, [] as IMentions[]);
    setMentionsValue(mentions);
  }, [userMap]);
}

export function useSetRelays(setRelays: React.Dispatch<React.SetStateAction<string[]>>) {
  const isLoggedIn = useSelector((state: RootState) => state.loginReducer.isLoggedIn);
  const myPublicKey = useReadonlyMyPublicKey();
  const myCustomRelay = useSelector((state: RootState) => state.relayReducer);

  useEffect(() => {
    let relays = seedRelays;
    if (isLoggedIn === true) {
      relays = relays
        .concat(...(myCustomRelay[myPublicKey] ?? []))
        .filter((item, index, self) => self.indexOf(item) === index);
    }

    relays = relays.filter((elem, index, self) => index === self.indexOf(elem));
    setRelays(relays);
  }, [myPublicKey, myCustomRelay]);
}
