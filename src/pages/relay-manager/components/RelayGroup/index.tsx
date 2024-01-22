import { Button } from 'components/shared/ui/Button';
import { useRelayGroupsQuery } from 'hooks/relay/useRelayGroupsQuery';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import useCreateNewGroupMutation from 'pages/relay-manager/hooks/useCreateNewGroupMutation';
import { useMemo, useRef, useState } from 'react';
import { FaPlus } from 'react-icons/fa6';
import CreateGroupModal, { CreateGroupModalRef } from '../CreateGroupModal';
import GroupItem from './group';
import RelayTable from './table';

export default function RelayGroup() {
  const myPublicKey = useReadonlyMyPublicKey();
  const { data: relayGroups = {} } = useRelayGroupsQuery(myPublicKey);
  const createModalRef = useRef<CreateGroupModalRef>(null);
  const createMutation = useCreateNewGroupMutation();

  const [selectedGroupId, setSelectedGroupId] = useState<string>('default');
  const activeGroup = useMemo(
    () => relayGroups?.[selectedGroupId],
    [relayGroups, selectedGroupId],
  );

  const onCreateNewGroup = (name: string) => {
    createMutation.mutate(name);
    createModalRef.current?.close();
  };

  return (
    <div className="flex-grow grid grid-cols-4 border-0 border-t border-border-01 border-solid">
      <div className="col-span-1 bg-surface-01">
        <div className="h-full flex flex-col justify-between">
          <div className="flex-1 overflow-scroll">
            <div className="label text-text-secondary px-5 py-2 flex items-center">
              My Groups
            </div>
            <div>
              {Object.values(relayGroups).map(group => (
                <GroupItem
                  key={group.id}
                  group={group}
                  selectedGroupId={selectedGroupId}
                  setSelectedGroupId={setSelectedGroupId}
                />
              ))}
            </div>
          </div>
          <div className="border-0 border-t border-border-01 border-solid h-12 box-border">
            <CreateGroupModal ref={createModalRef} onConfirm={onCreateNewGroup}>
              <Button
                variant="link"
                className="flex items-center gap-2 h-full hover:no-underline cursor-pointer"
              >
                <FaPlus className="text-text-link" />
                <span className="text-text-link">Create New Group</span>
              </Button>
            </CreateGroupModal>
          </div>
        </div>
      </div>
      <div className="col-span-3 bg-surface-02">
        <div className="label-bold text-text-primary capitalize px-5 py-2">
          {activeGroup?.title ?? ''}{' '}
          {activeGroup?.relays.length
            ? `(${activeGroup?.relays.length ?? 0})`
            : ''}
        </div>
        <RelayTable key={selectedGroupId} groupId={selectedGroupId} />
      </div>
    </div>
  );
}
