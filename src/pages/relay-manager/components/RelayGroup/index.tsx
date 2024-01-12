import { Button } from 'components/shared/ui/Button';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { useMemo, useRef, useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import { useRelayGroupsQuery } from '../../hooks/useRelayGroupsQuery';
import { useRelayGroupManager } from '../../hooks/useRelayManagerContext';
import CreateGroupModal, { CreateGroupModalRef } from './create-group';
import GroupItem from './group';
import RelayTable from './table';

export default function RelayGroup() {
  const myPublicKey = useReadonlyMyPublicKey();
  const groupManager = useRelayGroupManager(myPublicKey);
  const { data: relayGroups = {}, refetch } = useRelayGroupsQuery(myPublicKey);
  const createModalRef = useRef<CreateGroupModalRef>(null);

  const [selectedGroupId, setSelectedGroupId] = useState<string>('default');
  const activeGroup = useMemo(
    () => relayGroups?.[selectedGroupId],
    [relayGroups, selectedGroupId],
  );

  const onCreateNewGroup = (name: string) => {
    groupManager.setGroup(name, []);
    refetch();
    createModalRef.current?.close();
  };

  return (
    <div className="flex-grow grid grid-cols-4 border-0 border-t border-border-01 border-solid">
      <div className="h-full col-span-1 bg-surface-01">
        <div className="h-full flex flex-col justify-between">
          <div className="flex-1 overflow-scroll">
            <div className="label text-text-secondary px-5 py-2 flex items-center">
              My Groups
            </div>
            <div>
              {Object.keys(relayGroups).map(groupId => (
                <GroupItem
                  key={groupId}
                  groupId={groupId}
                  selectedGroupId={selectedGroupId}
                  setSelectedGroupId={setSelectedGroupId}
                />
              ))}
            </div>
          </div>
          <div className="border-0 border-t border-border-01 border-solid h-12">
            <CreateGroupModal ref={createModalRef} onConfirm={onCreateNewGroup}>
              <Button
                variant="link"
                className="flex items-center gap-2 h-full hover:no-underline cursor-pointer"
              >
                <FiPlus className="text-text-link" />
                <span className="text-text-link">Create New Group</span>
              </Button>
            </CreateGroupModal>
          </div>
        </div>
      </div>
      <div className="col-span-3 bg-surface-02 px-5 py-2">
        <div className="label-bold text-text-primary capitalize pb-2">
          {selectedGroupId}{' '}
          {activeGroup?.length ? `(${activeGroup?.length ?? 0})` : ''}
        </div>
        <RelayTable groupId={selectedGroupId} />
      </div>
    </div>
  );
}
