import { Nip23 } from 'service/nip/23';
import { useEffect } from "react";
import { useCallWorker } from "hooks/useWorker";
import { CallRelay, CallRelayType } from 'service/worker/type';
import { Event, EventSetMetadataContent, WellKnownEventKind, deserializeMetadata } from 'service/api';

function handleEvent(setUserMap, setArticles) {
  return function handleEvent(event: Event, relayUrl?: string) {
    switch (event.kind) {
      case WellKnownEventKind.set_metadata:
        const metadata: EventSetMetadataContent = deserializeMetadata(
          event.content,
        );
        setUserMap(prev => {
          const newMap = new Map(prev);
          const oldData = newMap.get(event.pubkey) as {created_at: number};
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
  
      case WellKnownEventKind.long_form:
        const article = Nip23.toArticle(event);
        setArticles(prev => {
          if (prev.map(p => p.eventId).includes(event.id)) return prev;
  
          const index = prev.findIndex(p => p.id === article.id);
          if (index !== -1) {
            const old = prev[index];
            if (old.updated_at >= article.updated_at) {
              return prev;
            } else {
              return prev.map((p, id) => {
                if (id === index) return article;
                return p;
              });
            }
          }
  
          // only add un-duplicated and replyTo msg
          const newItems = [...prev, article];
          // sort by timestamp in asc
          const sortedItems = newItems.sort((a, b) =>
            a.updated_at >= b.updated_at ? -1 : 1,
          );
          return sortedItems;
        });
        break;
  
      default:
        break;
    }
  }
}

export function useWorker(publicKey, isLoggedIn, myPublicKey, setUserMap, setArticles) {
  const { worker, newConn } = useCallWorker();
  
  useEffect(() => {
    // todo: validate publicKey
    if (publicKey && publicKey.length === 0) return;
    if (newConn.length === 0) return;
  
    const pks = [publicKey];
    if (isLoggedIn && myPublicKey.length > 0) pks.push(myPublicKey);
  
    const callRelay: CallRelay = {
      type: CallRelayType.batch,
      data: newConn,
    };
    worker
      ?.subMetadata(pks, undefined, undefined, callRelay)
      ?.iterating({ cb: handleEvent(setUserMap, setArticles) });
    worker
      ?.subNip23Posts({ pks: [publicKey ], callRelay })
      ?.iterating({ cb: handleEvent(setUserMap, setArticles) });
  }, [newConn]);
}