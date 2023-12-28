import type { Meta, StoryObj } from '@storybook/react';
import { Cascader } from '.';

const meta: Meta<typeof Cascader> = {
  component: Cascader,
};

export default meta;
type Story = StoryObj<typeof Cascader>;

const options = [
  [
    {
      label: 'NIP Relay List',
      value: 'NIPRelayList',
      group: 'Global',
    },
    {
      label: 'Default Group',
      value: 'DefaultGroup',
      group: 'Global',
    },
  ],
  [
    {
      label: 'Single Relay',
      value: 'SingleRelay',
      children: [
        {
          value: 'relay.nostr.band',
        },
        {
          value: 'relay.snort.social',
        },
      ],
    },
    {
      label: 'Relay Script',
      value: 'script',
      disabled: true,
    },
  ],
];

export const Primary: Story = {
  render: () => (
    <div className="max-w-screen-sm">
      <Cascader options={options} defaultValue={['DefaultGroup']} />
    </div>
  ),
};
