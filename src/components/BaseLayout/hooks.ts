import { UserMap } from 'core/nostr/type';
import { useMatchPad } from 'hooks/useMediaQuery';
import { useCallWorker } from 'hooks/useWorker';
import { CallRelayType } from 'core/worker/type';
import { useEffect, useState } from 'react';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { deserializeMetadata } from 'core/nostr/content';
import {
  WellKnownEventKind,
  EventSetMetadataContent
} from 'core/nostr/type';
import { Event } from 'core/nostr/Event';
import { isEmptyStr } from 'utils/validator';

export function useUserInfo () {
  const myPublicKey = useReadonlyMyPublicKey();
  const { worker, newConn } = useCallWorker();
  const [userMap, setUserMap] = useState<UserMap>(new Map());

  useEffect(() => {
    if (newConn.length === 0) return;

    if (!isEmptyStr(myPublicKey) && userMap.get(myPublicKey) == null) {
      worker
        ?.subMetadata([myPublicKey], undefined, {
          type: CallRelayType.batch,
          data: newConn,
        })
        ?.iterating({ cb: (event: Event, relayUrl?: string) => {
          switch (event.kind) {
            case WellKnownEventKind.set_metadata:
              const metadata: EventSetMetadataContent = deserializeMetadata(
                event.content,
              );
              setUserMap(prev => {
                const newMap = new Map(prev);
                const oldData = newMap.get(event.pubkey);
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
              break;
      
            default:
              break;
          }
        }
      });
    }
  }, [newConn]);

  return {
    userMap
  };
}
