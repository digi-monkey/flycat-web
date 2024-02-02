import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '.';

const meta: Meta<typeof Button> = {
  component: Button,
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  render: () => (
    <div className="flex gap-3">
      <Button variant="default">Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
};

export const Large: Story = {
  render: () => (
    <div className="flex gap-3">
      <Button variant="default" size="lg">
        Default
      </Button>
      <Button variant="secondary" size="lg">
        Secondary
      </Button>
      <Button variant="link" size="lg">
        Link
      </Button>
    </div>
  ),
};

export const Small: Story = {
  render: () => (
    <div className="flex gap-3">
      <Button variant="default" size="sm">
        Default
      </Button>
      <Button variant="secondary" size="sm">
        Secondary
      </Button>
      <Button variant="link" size="sm">
        Link
      </Button>
    </div>
  ),
};
