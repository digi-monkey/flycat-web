import { Button } from 'components/shared/ui/Button';
import { Input } from 'components/shared/ui/Input';
import { Tabs, TabsList, TabsTrigger } from 'components/shared/ui/Tabs';
import { useToast } from 'components/shared/ui/Toast/use-toast';
import { newRelay } from 'core/relay/util';
import { useRelayGroupsQuery } from 'hooks/relay/useRelayGroupsQuery';
import { useRelayGroupManager } from 'hooks/relay/useRelayManagerContext';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import useCreateNewGroupMutation from 'pages/relay-manager/hooks/useCreateNewGroupMutation';
import { useCallback, useMemo, useRef, useState } from 'react';
import { FaPlus } from 'react-icons/fa6';
import CreateGroupModal, { CreateGroupModalRef } from '../CreateGroupModal';
import GroupItem from './group';
import RelayTable from './table';

const relayUrlRegex = /^(wss?:\/\/).*$/;

export default function RelayGroup() {
  const { toast } = useToast();
  const myPublicKey = useReadonlyMyPublicKey();
  const { data: relayGroups = {}, refetch: refetchGroups } =
    useRelayGroupsQuery(myPublicKey);
  const createModalRef = useRef<CreateGroupModalRef>(null);
  const createMutation = useCreateNewGroupMutation();
  const [newRelayWss, setNewRelayWss] = useState<string>('');
  const relayGroupManager = useRelayGroupManager(myPublicKey);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('default');
  const activeGroup = useMemo(
    () => relayGroups?.[selectedGroupId],
    [relayGroups, selectedGroupId],
  );

  const handleCreateNewGroup = (name: string) => {
    createMutation.mutate(name);
    createModalRef.current?.close();
  };

  const handleAddNewRelay = useCallback(
    (wss: string) => {
      if (!wss || !relayUrlRegex.test(wss)) {
        toast({
          title: 'Invalid Relay URL',
          status: 'error',
        });
        setNewRelayWss('');
        return;
      }
      relayGroupManager.addRelayToGroup(selectedGroupId, newRelay(wss));
      setNewRelayWss('');
      refetchGroups();
    },
    [relayGroupManager, selectedGroupId, refetchGroups, toast],
  );

  return (
    <div className="h-full flex flex-col">
      <div className="md:hidden">
        <Tabs value={selectedGroupId} onValueChange={setSelectedGroupId}>
          <TabsList>
            {Object.values(relayGroups).map(group => (
              <TabsTrigger key={group.id} value={group.id}>
                {group.title}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
      <div className="flex-1 flex-grow grid grid-cols-3 md:grid-cols-4 border-0 border-t border-border-01 border-solid">
        <div className="hidden md:block md:col-span-1 bg-surface-01">
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
              <CreateGroupModal
                ref={createModalRef}
                onConfirm={handleCreateNewGroup}
              >
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
          <div className="w-full flex justify-between py-3 px-4 items-center box-border">
            <div className="label-bold text-text-primary capitalize">
              {activeGroup?.title ?? ''}{' '}
              {activeGroup?.relays.length
                ? `(${activeGroup?.relays.length ?? 0})`
                : ''}
            </div>
            <div className="relative">
              <Input
                className="pr-[50px] width-[200px]"
                placeholder="wss://"
                value={newRelayWss}
                onChange={(e: React.FormEvent<HTMLButtonElement>) =>
                  setNewRelayWss(e.currentTarget.value)
                }
              />
              <Button
                variant="link"
                className="absolute right-0 top-0 py-1 px-3"
                onClick={() => handleAddNewRelay(newRelayWss)}
              >
                Add
              </Button>
            </div>
          </div>
          <RelayTable key={selectedGroupId} groupId={selectedGroupId} />
        </div>
      </div>
    </div>
  );
}
