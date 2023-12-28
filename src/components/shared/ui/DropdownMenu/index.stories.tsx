/* eslint-disable no-console */
import type { Meta, StoryObj } from '@storybook/react';
import Icon from 'components/Icon';
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenu,
  DropdownMenuTrigger,
} from '.';

const meta: Meta<typeof DropdownMenu> = {
  component: DropdownMenu,
};

export default meta;
type Story = StoryObj<typeof DropdownMenu>;

const items = [
  {
    icon: 'icon-user',
    label: '1st menu item',
    value: '1',
  },
  {
    icon: 'icon-user',
    label: '2nd menu item',
    value: '2',
  },
];

export const Primary: Story = {
  render: () => (
    <div className="max-w-screen-sm">
      <DropdownMenu>
        <DropdownMenuTrigger>DropdownMenu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Group</DropdownMenuLabel>
          {items.map(item => (
            <DropdownMenuItem key={item.value}>{item.label}</DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ),
};

export const WithIcon: Story = {
  render: () => (
    <div className="max-w-screen-sm">
      <DropdownMenu>
        <DropdownMenuTrigger>DropdownMenu</DropdownMenuTrigger>
        <DropdownMenuContent>
          {items.map(item => (
            <DropdownMenuItem
              key={item.value}
              className="flex items-center gap-3"
            >
              <Icon type={item.icon} className="w-4 h-4 fill-gray-600" />
              {item.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ),
};
