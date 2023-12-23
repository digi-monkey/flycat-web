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
          <Dropdown.Label />
          <Dropdown.Item />
          {props.arrow && <Dropdown.Arrow />}
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  );
}
