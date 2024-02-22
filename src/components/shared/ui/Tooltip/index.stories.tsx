import type { Meta, StoryObj } from '@storybook/react';
import Tooltip from '.';

const meta: Meta<typeof Tooltip> = {
  component: Tooltip,
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

export const Primary: Story = {
  render: () => (
    <div className="max-w-xs flex flex-col gap-3 justify-center">
      <Tooltip placement="top" title="this is a tooltip">
        <div className="w-full text-center">hover it</div>
      </Tooltip>
    </div>
  ),
};
