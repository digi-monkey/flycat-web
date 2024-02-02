import { Button } from 'components/shared/ui/Button';
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
import {
  forwardRef,
  PropsWithChildren,
  useState,
  useImperativeHandle,
} from 'react';

export type CreateGroupModalProps = PropsWithChildren<{
  onConfirm: (name: string) => void;
}>;

export type CreateGroupModalRef = {
  open: () => void;
  close: () => void;
};

const CreateGroupModal: React.ForwardRefRenderFunction<
  CreateGroupModalRef,
  CreateGroupModalProps
> = ({ children, onConfirm }, ref) => {
  const [opened, setOpened] = useState(false);
  const [groupName, setGroupName] = useState('');

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
          <DialogTitle>Create New Relay Group</DialogTitle>
          <DialogDescription>
            Enter a name for your new group. You can add relays to this group.
          </DialogDescription>
        </DialogHeader>
        <Input
          placeholder="Relay Group Name"
          value={groupName}
          onChange={e => setGroupName((e.target as any).value)}
        />
        <DialogFooter>
          <Button variant="link" onClick={() => setOpened(false)}>
            Cancel
          </Button>
          <Button variant="default" onClick={() => onConfirm?.(groupName)}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default forwardRef(CreateGroupModal);
