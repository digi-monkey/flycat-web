import { Nip172 } from 'core/nip/172';
import { CallWorker } from 'core/worker/caller';
import { createCallRelay } from 'core/worker/util';
import { useEffect } from 'react';

export function useLoadCommunities({
  worker,
  newConn,
}: {
  worker?: CallWorker;
  newConn: string[];
}) {
  useEffect(() => {
    if (!worker) return;

    const callRelay = createCallRelay(newConn);
    const filter = Nip172.communitiesFilter();
    worker.subFilter({ filter, callRelay });
  }, [newConn, worker]);
}
