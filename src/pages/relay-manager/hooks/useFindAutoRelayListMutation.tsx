import { useToast } from 'components/shared/ui/Toast/use-toast';
import { AUTO_RECOMMEND_LIST } from 'constants/relay';
import { OneTimeWebSocketClient } from 'core/api/onetime';
import { RelayPool } from 'core/relay/pool';
import { useRelayGroupsQuery } from 'hooks/relay/useRelayGroupsQuery';
import { useRelayGroupManager } from 'hooks/relay/useRelayManagerContext';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { useMutation } from 'react-query';

export default function useFindAutoRelayListMutation() {
  const myPublicKey = useReadonlyMyPublicKey();
  const groupManager = useRelayGroupManager(myPublicKey);
  const { refetch: refetchGroups } = useRelayGroupsQuery(myPublicKey);
  const { toast } = useToast();

  const findRelays = async () => {
    if (!groupManager) return;

    toast({
      title: 'start picking auto relays..',
      status: 'loading',
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
          status: 'loading',
        });
      },
    );
    if (pickRelays.length > 0) {
      await groupManager.setGroup(
        AUTO_RECOMMEND_LIST,
        pickRelays.map(r => {
          return { url: r, read: true, write: true };
        }),
      );
      refetchGroups();
    }
    toast({
      title: 'finish picking auto relays, Auto-Recommend-List created!',
      status: 'success',
    });
  };

  const mutation = useMutation(findRelays);
  return mutation;
}
