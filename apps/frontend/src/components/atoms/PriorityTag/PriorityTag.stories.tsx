import type { Meta, StoryObj } from '@storybook/react';
import { PriorityTag } from './PriorityTag';

const meta: Meta<typeof PriorityTag> = {
  title: 'Atoms/PriorityTag',
  component: PriorityTag,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    priority: {
      control: 'select',
      options: ['low', 'medium', 'high', 'urgent'],
    },
    showIcon: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    priority: 'medium',
  },
};

export const AllPriorities: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <PriorityTag priority="low" />
      <PriorityTag priority="medium" />
      <PriorityTag priority="high" />
      <PriorityTag priority="urgent" />
    </div>
  ),
};

export const WithCustomText: Story = {
  args: {
    priority: 'urgent',
    text: 'Critical Bug',
  },
};

export const WithoutIcon: Story = {
  args: {
    priority: 'high',
    showIcon: false,
  },
};