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
import { Relay } from 'core/relay/type';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { useRelayGroupsQuery } from 'pages/relay-manager/hooks/useRelayGroupsQuery';
import {
  forwardRef,
  PropsWithChildren,
  useState,
  useImperativeHandle,
} from 'react';

export type CopyToGroupModalProps = PropsWithChildren<{
  currentGroupId: string;
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
  const { data: relayGroups = {} } = useRelayGroupsQuery(myPublicKey);
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
        {Object.keys(relayGroups)
          .filter(groupId => groupId !== currentGroupId)
          .map(groupId => {
            return (
              <div className="flex items-center gap-3" key={groupId}>
                <Checkbox
                  checked={selectedGroupIds.includes(groupId)}
                  onCheckedChange={value => {
                    if (value) {
                      setSelectedGroupIds([...selectedGroupIds, groupId]);
                    } else {
                      setSelectedGroupIds(
                        selectedGroupIds.filter(g => g !== groupId),
                      );
                    }
                  }}
                />
                <span>{groupId}</span>
              </div>
            );
          })}
        <DialogFooter>
          <Button variant="link" onClick={() => setOpened(false)}>
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={() => onConfirm?.(selectedGroupIds, !!duplicate)}
          >
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default forwardRef(CopyToGroupModal);
