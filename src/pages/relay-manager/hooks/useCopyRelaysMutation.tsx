import { Relay } from 'core/relay/type';
import { useRelayGroupsQuery } from 'hooks/relay/useRelayGroupsQuery';
import { useRelayGroupManager } from 'hooks/relay/useRelayManagerContext';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { useMutation } from 'react-query';

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
    await Promise.all(
      groupIds.map(async groupId => {
        if (groupId === currentGroupId) {
          return;
        }
        await groupManager.addRelayToGroup(groupId, relays);
      }),
    );
    refetchGroups();
  };

  const mutation = useMutation(copyTo);
  return mutation;
}
