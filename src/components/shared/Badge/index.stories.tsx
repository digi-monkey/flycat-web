import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from '.';

const meta: Meta<typeof Badge> = {
  component: Badge,
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Primary: Story = {
  render: () => (
    <div className="max-w-screen-sm">
      <Badge className="w-fit" dot>
        Badge
      </Badge>
    </div>
  ),
};
