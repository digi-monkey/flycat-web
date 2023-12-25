import type { Meta, StoryObj } from '@storybook/react';
import { BadgeDot, Badge } from '.';

const meta: Meta<typeof Badge> = {
  component: Badge,
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Primary: Story = {
  render: () => (
    <div className="max-w-screen-sm">
      <Badge className="w-fit">
        Badge
        <BadgeDot />
      </Badge>
    </div>
  ),
};
