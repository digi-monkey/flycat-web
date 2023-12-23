import * as Dropdown from '@radix-ui/react-dropdown-menu';
import { PropsWithChildren } from 'react';

export type DropdownMenuProps = PropsWithChildren<{
  arrow?: boolean;
}>;

export function DropdownMenu(props: DropdownMenuProps) {
  const { children } = props;
  return (
    <Dropdown.Root>
      <Dropdown.Trigger asChild>{children}</Dropdown.Trigger>
      <Dropdown.Portal>
        <Dropdown.Content>
          <Dropdown.Item className="DropdownMenuItem">
            New Tab <div className="RightSlot">⌘+T</div>
          </Dropdown.Item>
          <Dropdown.Item className="DropdownMenuItem">
            New Window <div className="RightSlot">⌘+N</div>
          </Dropdown.Item>
          <Dropdown.Item className="DropdownMenuItem" disabled>
            New Private Window <div className="RightSlot">⇧+⌘+N</div>
          </Dropdown.Item>
          {props.arrow && <Dropdown.Arrow />}
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  );
}
