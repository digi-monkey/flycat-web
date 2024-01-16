import { useRelayGroupsQuery } from 'hooks/relay/useRelayGroupsQuery';
import { useRelayGroupManager } from 'hooks/relay/useRelayManagerContext';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { useMutation } from 'react-query';

export default function useCreateNewGroupMutation() {
  const myPublicKey = useReadonlyMyPublicKey();
  const groupManager = useRelayGroupManager(myPublicKey);
  const { refetch: refetchRelayGroups } = useRelayGroupsQuery(myPublicKey);

  const mutation = useMutation(async (name: string) => {
    await groupManager.setGroup(name, []);
    refetchRelayGroups();
  });

  return mutation;
}
