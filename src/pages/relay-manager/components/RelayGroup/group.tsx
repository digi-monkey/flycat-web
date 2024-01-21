import { RelayGroup } from 'core/relay/group/type';
import { useRelayGroupsQuery } from 'hooks/relay/useRelayGroupsQuery';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { FaRegFolder } from 'react-icons/fa6';
import { cn } from 'utils/classnames';

export type GroupItemProps = {
  group: RelayGroup;
  selectedGroupId: string;
  setSelectedGroupId: (groupId: string) => void;
};

export default function GroupItem(props: GroupItemProps) {
  const myPublicKey = useReadonlyMyPublicKey();
  const { group, selectedGroupId, setSelectedGroupId } = props;
  const { data: relayGroups = {} } = useRelayGroupsQuery(myPublicKey);

  return (
    <div
      className={cn(
        'flex items-center gap-2 h-9 px-5 pr-4 py-2 cursor-pointer group',
        {
          'hover:bg-conditional-hover01': group.id !== selectedGroupId,
          'selected bg-conditional-selected02': group.id === selectedGroupId,
        },
      )}
      onClick={() => setSelectedGroupId(group.id)}
    >
      <FaRegFolder className="h-4 w-4 text-text-secondary" />
      <div className="w-full flex items-center">
        <span className="flex-1 line-clamp-1 label text-text-primary selected:font-semibold">
          {group.title} ({relayGroups[group.id]?.relays?.length ?? 0})
        </span>
      </div>
    </div>
  );
}
