/* eslint-disable no-console */
import type { Meta, StoryObj } from '@storybook/react';
import { DropdownMenu } from '.';
import { DropdownMenuItem } from './type';

const meta: Meta<typeof DropdownMenu> = {
  component: DropdownMenu,
};

export default meta;
type Story = StoryObj<typeof DropdownMenu>;

const items: DropdownMenuItem[] = [
  {
    type: 'item',
    icon: 'icon-user',
    label: '1st menu item',
    value: '1',
  },
  {
    type: 'item',
    icon: 'icon-user',
    label: '2nd menu item',
    value: '2',
  },
  {
    type: 'divider',
  },
  {
    type: 'group',
    label: 'Group 1',
    children: [
      {
        type: 'item',
        icon: 'icon-user',
        label: '3rd menu item',
        value: '3',
      },
      {
        type: 'item',
        icon: 'icon-user',
        label: '4th menu item',
        value: '4',
      },
    ],
  },
];

export const Primary: Story = {
  render: () => (
    <div className="max-w-screen-sm">
      <DropdownMenu items={items} onSelect={console.log}>
        <div className="w-fit">DropdownMenu</div>
      </DropdownMenu>
    </div>
  ),
};
