import type { Meta, StoryObj } from '@storybook/react';
import { PublishNotice } from '.';

const meta: Meta<typeof PublishNotice> = {
  component: PublishNotice,
};

export default meta;
type Story = StoryObj<typeof PublishNotice>;

export const Primary: Story = {
  render: () => (
    <div className="max-w-screen-sm">
      <PublishNotice
        success={['relay.snort.social', 'relay.snort.social']}
        fail={[
          {
            relay: 'relay.snort.social',
            reason: 'blocked: no active subscription',
          },
        ]}
      />
    </div>
  ),
};
