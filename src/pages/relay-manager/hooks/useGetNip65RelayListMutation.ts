import { Event } from 'core/nostr/Event';
import { useToast } from 'components/shared/ui/Toast/use-toast';
import { NIP_65_RELAY_LIST } from 'constants/relay';
import { Nip65 } from 'core/nip/65';
import { createCallRelay } from 'core/worker/util';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { useCallWorker } from 'hooks/useWorker';
import { useCallback } from 'react';
import { useMutation } from 'react-query';
import { useRelayGroupsQuery } from 'hooks/relay/useRelayGroupsQuery';
import { useRelayGroupManager } from 'hooks/relay/useRelayManagerContext';
import { v4 as uuidv4 } from 'uuid';

export default function useGetNip65RelayListMutation() {
  const myPublicKey = useReadonlyMyPublicKey();
  const { worker, newConn } = useCallWorker();
  const groupManager = useRelayGroupManager(myPublicKey);
  const { refetch: refetchGroups } = useRelayGroupsQuery(myPublicKey);
  const { toast } = useToast();

  const getNip65Group = useCallback(async () => {
    if (!worker) return;
    if (!groupManager) return;

    const callRelay = createCallRelay(newConn);
    toast({
      title: 'try syncing Nip-65 Relay list from network..',
      closeable: false,
    });

    let event: Event | null = null;
    const dataStream = worker
      .subNip65RelayList({ pks: [myPublicKey], callRelay })
      .getIterator();
    for await (const data of dataStream) {
      if (!event) {
        event = data.event;
        continue;
      }

      if (event && event.created_at < data.event.created_at) {
        event = data.event;
      }
    }
    dataStream.unsubscribe();

    if (event) {
      const id = uuidv4();
      groupManager.setGroup(id, {
        id,
        title: NIP_65_RELAY_LIST,
        relays: Nip65.toRelays(event),
      });
      refetchGroups();
      toast({
        title: `Find Nip-65 Relay list! Check your relay group named: ${NIP_65_RELAY_LIST}`,
        status: 'success',
        closeable: false,
      });
      return;
    }

    toast({
      title: `Can not find your Nip-65 Relay list across the network, please select different relays and try again`,
      status: 'error',
      closeable: false,
    });
  }, [groupManager, myPublicKey, newConn, worker, toast, refetchGroups]);

  const mutation = useMutation(getNip65Group);
  return mutation;
}
