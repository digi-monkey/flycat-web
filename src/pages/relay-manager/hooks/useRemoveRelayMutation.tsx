import { Relay } from 'core/relay/type';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { useMutation } from 'react-query';
import { useRelayGroupsQuery } from './useRelayGroupsQuery';
import { useRelayGroupManager } from './useRelayManagerContext';
import { useRelaysQuery } from './useRelaysQuery';

export default function useRemoveRelayMutation(groupId: string) {
  const myPublicKey = useReadonlyMyPublicKey();
  const groupManager = useRelayGroupManager(myPublicKey);
  const { refetch: refetchRelays } = useRelaysQuery(myPublicKey, groupId);
  const { refetch: refetchRelayGroups } = useRelayGroupsQuery(myPublicKey);

  const removeRelayGroup = async (relays: Relay[]) => {
    const deleteRelays = relays ?? groupManager.getGroupById(groupId) ?? [];
    for (const relay of deleteRelays) {
      groupManager.delRelayInGroup(groupId, relay);
      refetchRelayGroups();
      refetchRelays();
    }
  };

  const mutation = useMutation(removeRelayGroup);
  return mutation;
}
