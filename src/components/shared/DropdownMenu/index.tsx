import * as Dropdown from '@radix-ui/react-dropdown-menu';
import { PropsWithChildren, useCallback, useMemo } from 'react';
import { cn } from 'utils/classnames';
import { DropdownMenuItem, DropdownMenuItemType } from './type';
import { v4 as uuidv4 } from 'uuid';
import Icon from 'components/Icon';

export type DropdownMenuProps = PropsWithChildren<{
  items: DropdownMenuItem[];
  onSelect?: (item: DropdownMenuItemType) => void;
  sideOffset?: number;
}>;

export function DropdownMenu(props: DropdownMenuProps) {
  const { sideOffset, children, items = [], onSelect } = props;
  const uuid = useMemo(() => uuidv4(), []);

  const renderMenuItems = useCallback(
    (items: DropdownMenuItem[]) => {
      return items.map((item, index) => {
        if (item.type === 'divider') {
          return <Dropdown.Separator key={`${uuid}_divider_${index}`} />;
        }
        if (item.type === 'group') {
          return (
            <Dropdown.Group key={`${uuid}_group_${index}`}>
              <Dropdown.Label className="px-2 py-1 label text-gray-600 text-xs">
                {item.label}
              </Dropdown.Label>
              {renderMenuItems(item.children)}
            </Dropdown.Group>
          );
        }
        return (
          <Dropdown.Item
            key={`${uuid}_item_${index}`}
            className="flex items-center py-1 px-2 h-8 gap-2 hover:outline-none hover:bg-conditional-hover01 cursor-pointer"
            onSelect={() => onSelect?.(item)}
          >
            {item.icon && (
              <Icon
                type={item.icon}
                className="w-[18px] h-[18px] fill-text-primary"
              />
            )}
            <span className="label">{item.label}</span>
          </Dropdown.Item>
        );
      });
    },
    [uuid, onSelect],
  );

  return (
    <Dropdown.Root>
      <Dropdown.Trigger asChild>{children}</Dropdown.Trigger>
      <Dropdown.Portal>
        <Dropdown.Content
          sideOffset={sideOffset}
          className={cn(
            'py-0.5 bg-surface-02 border border-solid border-border-01 rounded-lg overflow-hidden',
            'min-w-[var(--radix-dropdown-menu-trigger-width)] w-fit',
          )}
        >
          {renderMenuItems(items)}
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  );
}
