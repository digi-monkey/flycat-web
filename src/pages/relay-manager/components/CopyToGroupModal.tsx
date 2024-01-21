import { Button } from 'components/shared/ui/Button';
import Checkbox from 'components/shared/ui/Checkbox';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter,
} from 'components/shared/ui/Dialog';
import { Input } from 'components/shared/ui/Input';
import { Relay } from 'core/relay/type';
import { useRelayGroupsQuery } from 'hooks/relay/useRelayGroupsQuery';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import useCreateNewGroupMutation from 'pages/relay-manager/hooks/useCreateNewGroupMutation';
import {
  forwardRef,
  PropsWithChildren,
  useState,
  useImperativeHandle,
} from 'react';

export type CopyToGroupModalProps = PropsWithChildren<{
  currentGroupId?: string;
  relays: Relay[];
  onConfirm: (groupIds: string[], duplicate: boolean) => void;
  duplicate?: boolean;
}>;

export type CopyToGroupModalRef = {
  open: () => void;
  close: () => void;
};

const CopyToGroupModal: React.ForwardRefRenderFunction<
  CopyToGroupModalRef,
  CopyToGroupModalProps
> = (props, ref) => {
  const {
    children,
    onConfirm,
    relays,
    currentGroupId,
    duplicate = true,
  } = props;
  const myPublicKey = useReadonlyMyPublicKey();
  const createMutation = useCreateNewGroupMutation();
  const { data: relayGroups = {}, refetch: refetchGroups } =
    useRelayGroupsQuery(myPublicKey);
  const [opened, setOpened] = useState(false);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);

  useImperativeHandle(
    ref,
    () => {
      return {
        open: () => setOpened(true),
        close: () => setOpened(false),
      };
    },
    [setOpened],
  );

  return (
    <Dialog open={opened} onOpenChange={setOpened}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {duplicate ? 'Copy' : 'Move'} {relays.length} relay
            {relays.length > 1 ? 's' : ''} to
          </DialogTitle>
          <DialogDescription>
            Select the groups that you want to {duplicate ? 'copy' : 'move'} to
          </DialogDescription>
        </DialogHeader>
        {Object.values(relayGroups).map(group => {
          return (
            <div className="flex items-center gap-x-3 py-1" key={group.id}>
              <Checkbox
                id={group.id}
                checked={
                  group.id === currentGroupId ||
                  selectedGroupIds.includes(group.id)
                }
                disabled={group.id === currentGroupId}
                onCheckedChange={value => {
                  if (value) {
                    setSelectedGroupIds([...selectedGroupIds, group.id]);
                  } else {
                    setSelectedGroupIds(
                      selectedGroupIds.filter(g => g !== group.id),
                    );
                  }
                }}
              />
              <div className="flex-1 flex justify-between items-center">
                <label htmlFor={group.id} className="text-text-primary label">
                  {group.title}
                </label>
                <span className="text-text-secondary label">
                  {group.relays.length}
                </span>
              </div>
            </div>
          );
        })}
        <Input
          placeholder="+ Create new group"
          className="mb-2"
          onKeyDown={e => {
            if (e.key === 'Enter') {
              const newGroupId = e.currentTarget.value;
              if (newGroupId) {
                createMutation.mutate(newGroupId);
                setSelectedGroupIds([...selectedGroupIds, newGroupId]);
                refetchGroups();
              }
              e.currentTarget.value = '';
            }
          }}
        />
        <DialogFooter>
          <Button
            variant="default"
            onClick={() => onConfirm?.(selectedGroupIds, !!duplicate)}
            disabled={selectedGroupIds.length === 0}
          >
            {duplicate ? 'Copy' : 'Move'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default forwardRef(CopyToGroupModal);
