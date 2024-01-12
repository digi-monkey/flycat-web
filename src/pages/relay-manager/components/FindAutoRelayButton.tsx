import { Modal, Divider } from 'antd';
import { Button } from 'components/shared/ui/Button';
import { useToast } from 'components/shared/ui/Toast/use-toast';
import { AUTO_RECOMMEND_LIST } from 'constants/relay';
import { OneTimeWebSocketClient } from 'core/api/onetime';
import { RelayPool } from 'core/relay/pool';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { useMutation } from 'react-query';
import { useRelayGroupsQuery } from '../hooks/useRelayGroupsQuery';
import { useRelayGroupManager } from '../hooks/useRelayManagerContext';

export default function FindAutoRelayButton() {
  const myPublicKey = useReadonlyMyPublicKey();
  const groupManager = useRelayGroupManager(myPublicKey);
  const { refetch: refetchGroups } = useRelayGroupsQuery(myPublicKey);
  const { toast } = useToast();

  const findRelays = async () => {
    if (!groupManager) return;

    toast({
      title: 'start picking auto relays..',
      type: 'loading',
      duration: 60000,
    });
    const relayPool = new RelayPool();
    const relays = relayPool.seeds;
    const contactList =
      (await OneTimeWebSocketClient.fetchContactList({
        pubkey: myPublicKey,
        relays,
      })) || [];

    const pickRelays = await relayPool.getAutoRelay(
      relays,
      contactList,
      myPublicKey,
      (restCount: number) => {
        toast({
          title: `${restCount} relays left to check..`,
          type: 'loading',
        });
      },
    );
    if (pickRelays.length > 0) {
      groupManager.setGroup(
        AUTO_RECOMMEND_LIST,
        pickRelays.map(r => {
          return { url: r, read: true, write: true };
        }),
      );
      refetchGroups();
    }
    toast({
      title: 'finish picking auto relays, Auto-Recommend-List created!',
      type: 'success',
    });
  };

  const mutation = useMutation(findRelays);

  return (
    <Button variant="secondary" onClick={() => mutation.mutate()}>
      Find Auto Relay List For Me
    </Button>
  );
}
