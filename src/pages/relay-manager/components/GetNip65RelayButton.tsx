import { Event } from 'core/nostr/Event';
import { Button } from 'components/shared/ui/Button';
import { useToast } from 'components/shared/ui/Toast/use-toast';
import { NIP_65_RELAY_LIST } from 'constants/relay';
import { Nip65 } from 'core/nip/65';
import { createCallRelay } from 'core/worker/util';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { useCallWorker } from 'hooks/useWorker';
import { useCallback } from 'react';
import { useMutation } from 'react-query';
import { useRelayGroupsQuery } from '../hooks/useRelayGroupsQuery';
import { useRelayGroupManager } from '../hooks/useRelayManagerContext';

export default function GetNIP65RelayButton() {
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
      groupManager.setGroup(NIP_65_RELAY_LIST, Nip65.toRelays(event));
      refetchGroups();
      toast({
        title: `Find Nip-65 Relay list! Check your relay group named: ${NIP_65_RELAY_LIST}`,
        type: 'success',
        closeable: false,
      });
      return;
    }

    toast({
      title: `Can not find your Nip-65 Relay list across the network, please select different relays and try again`,
      type: 'error',
      closeable: false,
    });
  }, [groupManager, myPublicKey, newConn, worker, toast, refetchGroups]);

  const mutation = useMutation(getNip65Group);

  return (
    <Button variant="secondary" onClick={() => mutation.mutate()}>
      Get NIP-65 Relay List
    </Button>
  );
}
