import type { Meta, StoryObj } from '@storybook/react';
import { Cascader } from '.';

const meta: Meta<typeof Cascader> = {
  component: Cascader,
};

export default meta;
type Story = StoryObj<typeof Cascader>;

const options = [
  {
    value: 'Relay Group',
    children: [
      {
        value: 'NIP Relay List',
      },
      {
        value: 'Default Group',
      },
    ],
    group: 'Global',
  },
  {
    value: 'Single Relay',
    children: [
      {
        value: 'relay.nostr.band',
      },
      {
        value: 'relay.snort.social',
      },
    ],
    group: 'Global',
  },
  {
    value: 'Script',
    disabled: true,
    group: 'Rules',
  },
];

export const Primary: Story = {
  render: () => (
    <div className="max-w-screen-sm">
      <Cascader
        options={options}
        defaultValue={['Relay Group', 'Default Group']}
      />
    </div>
  ),
};
