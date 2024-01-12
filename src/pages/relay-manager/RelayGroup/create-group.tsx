import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogProps,
} from 'components/shared/ui/Dialog';
import { PropsWithChildren } from 'react';

export default function CreateGroupModal({
  children,
  ...dialogProps
}: PropsWithChildren<DialogProps>) {
  return (
    <Dialog {...dialogProps}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Relay Group</DialogTitle>
          <DialogDescription>
            Enter a name for your new group. You can add relays to this group.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
