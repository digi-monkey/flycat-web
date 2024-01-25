import { Button } from 'components/shared/ui/Button';
import { useRef } from 'react';
import useCreateNewGroupMutation from '../hooks/useCreateNewGroupMutation';
import CreateGroupModal, { CreateGroupModalRef } from './CreateGroupModal';

export default function CreateNewGroupButton() {
  const createModalRef = useRef<CreateGroupModalRef>(null);
  const createMutation = useCreateNewGroupMutation();

  return (
    <CreateGroupModal
      onConfirm={(name: string) => {
        createMutation.mutate(name);
        createModalRef.current?.close();
      }}
    >
      <Button>Create New Group</Button>
    </CreateGroupModal>
  );
}
