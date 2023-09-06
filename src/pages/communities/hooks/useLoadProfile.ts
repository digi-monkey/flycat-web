import { CommunityMetadata, Nip172 } from 'core/nip/172';
import { Naddr } from 'core/nostr/type';
import { CallWorker } from 'core/worker/caller';
import { createCallRelay } from 'core/worker/util';
import { useEffect } from 'react';

export function useLoadModeratorProfiles({
  worker,
  newConn,
  communities,
}: {
  worker?: CallWorker;
  newConn: string[];
  communities: Map<Naddr, CommunityMetadata>;
}) {
  useEffect(() => {
    if (!worker) return;

    const callRelay = createCallRelay(newConn);
    const pks = Array.from(communities.keys())
      .map(k => [
        communities.get(k)?.creator,
        ...(communities.get(k)?.moderators || []),
      ])
      .flat() as string[];
    worker
      .subMetadata(pks, undefined, callRelay)
  }, [newConn, worker, communities]);
}
