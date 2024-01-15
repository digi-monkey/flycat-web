import { Relay } from 'core/relay/type';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { useMutation } from 'react-query';
import { useRelayGroupsQuery } from './useRelayGroupsQuery';
import { useRelayGroupManager } from './useRelayManagerContext';

export default function useCopyToGroupsMutation(currentGroupId?: string) {
  const myPublicKey = useReadonlyMyPublicKey();
  const groupManager = useRelayGroupManager(myPublicKey);
  const { refetch: refetchGroups } = useRelayGroupsQuery(myPublicKey);

  const copyTo = async ({
    groupIds,
    relays,
  }: {
    groupIds: string[];
    relays: Relay[];
  }) => {
    groupIds.forEach(groupId => {
      if (groupId === currentGroupId) {
        return;
      }
      relays.forEach(relay => {
        groupManager.addNewRelayToGroup(groupId, relay);
      });
    });
    refetchGroups();
  };

  const mutation = useMutation(copyTo);
  return mutation;
}
