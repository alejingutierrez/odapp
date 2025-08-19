import type { Meta, StoryObj } from '@storybook/react';
import { StatusBadge } from './StatusBadge';

const meta: Meta<typeof StatusBadge> = {
  title: 'Atoms/StatusBadge',
  component: StatusBadge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: ['active', 'inactive', 'pending', 'error', 'warning', 'success'],
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
    status: 'active',
  },
};

export const AllStatuses: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <StatusBadge status="active" />
      <StatusBadge status="inactive" />
      <StatusBadge status="pending" />
      <StatusBadge status="error" />
      <StatusBadge status="warning" />
      <StatusBadge status="success" />
    </div>
  ),
};

export const WithCustomText: Story = {
  args: {
    status: 'pending',
    text: 'Processing Order',
  },
};

export const WithoutIcon: Story = {
  args: {
    status: 'success',
    text: 'Completed',
    showIcon: false,
  },
};