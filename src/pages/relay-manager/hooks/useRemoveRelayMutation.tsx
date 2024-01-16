import { Relay } from 'core/relay/type';
import { useRelayGroupsQuery } from 'hooks/relay/useRelayGroupsQuery';
import { useRelayGroupManager } from 'hooks/relay/useRelayManagerContext';
import { useRelaysQuery } from 'hooks/relay/useRelaysQuery';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { useMutation } from 'react-query';

export default function useRemoveRelayMutation(groupId: string) {
  const myPublicKey = useReadonlyMyPublicKey();
  const groupManager = useRelayGroupManager(myPublicKey);
  const { refetch: refetchRelays } = useRelaysQuery(myPublicKey, groupId);
  const { refetch: refetchRelayGroups } = useRelayGroupsQuery(myPublicKey);

  const removeRelayGroup = async (relays: Relay[]) => {
    const deleteRelays =
      relays ?? (await groupManager.getGroupById(groupId)) ?? [];
    await groupManager.removeRelayFromGroup(groupId, deleteRelays);
    refetchRelayGroups();
    refetchRelays();
  };

  const mutation = useMutation(removeRelayGroup);
  return mutation;
}
