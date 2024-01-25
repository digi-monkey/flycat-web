import { useMutation } from '@tanstack/react-query';
import { useToast } from 'components/shared/ui/Toast/use-toast';
import { RelayGroup } from 'core/relay/group/type';
import { useRelayGroupManager } from 'hooks/relay/useRelayManagerContext';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';

export default function useUploadRelayGroupMutation() {
  const { toast } = useToast();
  const myPublicKey = useReadonlyMyPublicKey();
  const groupManager = useRelayGroupManager(myPublicKey);
  const mutations = useMutation({
    mutationFn: async (group: RelayGroup) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      try {
        await groupManager.syncRelayGroup(group.id);
        toast({
          title: 'Relay group uploaded',
          status: 'success',
        });
      } catch (e) {
        console.log(e);
        toast({
          title: `Relay group upload failed: ${(e as Error).message}`,
          status: 'error',
        });
      }
    },
  });

  return mutations;
}
