import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { useMutation } from 'react-query';
import { useRelayGroupsQuery } from './useRelayGroupsQuery';
import { useRelayGroupManager } from './useRelayManagerContext';

export default function useCreateNewGroupMutation() {
  const myPublicKey = useReadonlyMyPublicKey();
  const groupManager = useRelayGroupManager(myPublicKey);
  const { refetch: refetchRelayGroups } = useRelayGroupsQuery(myPublicKey);

  const mutation = useMutation(async (name: string) => {
    groupManager.setGroup(name, []);
    refetchRelayGroups();
  });

  return mutation;
}
