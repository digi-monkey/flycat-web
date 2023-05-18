import { UserMap } from 'service/type';
import { isEmptyStr } from 'service/helper';
import { useMatchPad } from 'hooks/useMediaQuery';
import { useCallWorker } from 'hooks/useWorker';
import { CallRelayType } from 'service/worker/type';
import { useEffect, useState } from 'react';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import {
  Event,
  WellKnownEventKind,
  EventSetMetadataContent,
  deserializeMetadata,
} from 'service/api';

export function useUserInfo () {
  const myPublicKey = useReadonlyMyPublicKey();
  const { worker, newConn } = useCallWorker();
  const [userMap, setUserMap] = useState<UserMap>(new Map());


  useEffect(() => {
    if (newConn.length === 0) return;

    if (!isEmptyStr(myPublicKey) && userMap.get(myPublicKey) == null) {
      worker
        ?.subMetadata([myPublicKey], undefined, undefined, {
          type: CallRelayType.batch,
          data: newConn,
        })
        ?.iterating({ cb: (event: Event, relayUrl?: string) => {
          console.log('cb success');
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
