import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'components/shared/ui/DropdownMenu';
import { useRelayGroupsQuery } from 'hooks/relay/useRelayGroupsQuery';
import { useRelayGroupManager } from 'hooks/relay/useRelayManagerContext';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { MouseEvent } from 'react';
import { FaRegFolder, FaEllipsisVertical } from 'react-icons/fa6';
import { cn } from 'utils/classnames';

export type GroupItemProps = {
  groupId: string;
  selectedGroupId: string;
  setSelectedGroupId: (groupId: string) => void;
};

export default function GroupItem(props: GroupItemProps) {
  const myPublicKey = useReadonlyMyPublicKey();
  const groupManager = useRelayGroupManager(myPublicKey);
  const { groupId, selectedGroupId, setSelectedGroupId } = props;
  const { data: relayGroups = {}, refetch } = useRelayGroupsQuery(myPublicKey);

  const onDeleteGroup = async (e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    await groupManager.removeGroup(groupId);
    if (selectedGroupId === groupId) {
      setSelectedGroupId('default');
    }
    refetch();
  };

  return (
    <div
      className={cn(
        'flex items-center gap-2 h-9 px-5 pr-4 py-2 cursor-pointer group',
        {
          'hover:bg-conditional-hover01': groupId !== selectedGroupId,
          'selected bg-conditional-selected02': groupId === selectedGroupId,
        },
      )}
      onClick={() => setSelectedGroupId(groupId)}
    >
      <FaRegFolder className="h-4 w-4 text-text-secondary" />
      <div className="w-full flex justify-between items-center">
        <span className="flex-1 line-clamp-1 label text-text-primary selected:font-semibold capitalize">
          {groupId} ({relayGroups[groupId]?.length})
        </span>
        <div className="flex items-center relative">
          <DropdownMenu>
            <DropdownMenuTrigger>
              <FaEllipsisVertical className="w-[18px] h-[18px] text-text-secondary" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                className="text-functional-danger"
                onClick={onDeleteGroup}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
