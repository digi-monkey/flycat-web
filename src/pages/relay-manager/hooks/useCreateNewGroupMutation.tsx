import { useRelayGroupsQuery } from 'hooks/relay/useRelayGroupsQuery';
import { useRelayGroupManager } from 'hooks/relay/useRelayManagerContext';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { v4 as uuidv4 } from 'uuid';
import { useMutation } from '@tanstack/react-query';

export default function useCreateNewGroupMutation() {
  const myPublicKey = useReadonlyMyPublicKey();
  const groupManager = useRelayGroupManager(myPublicKey);
  const { refetch: refetchRelayGroups } = useRelayGroupsQuery(myPublicKey);

  const mutation = useMutation({
    mutationFn: async (name: string) => {
      const id = uuidv4();
      await groupManager.setGroup(id, {
        id,
        title: name,
        relays: [],
        timestamp: 0,
      });
      refetchRelayGroups();
    },
  });

  return mutation;
}
