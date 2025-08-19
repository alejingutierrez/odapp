import type { Meta, StoryObj } from '@storybook/react';
import { TrendIndicator } from './TrendIndicator';

const meta: Meta<typeof TrendIndicator> = {
  title: 'Atoms/TrendIndicator',
  component: TrendIndicator,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: 'number',
    },
    precision: {
      control: 'number',
      min: 0,
      max: 4,
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
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
    value: 15.5,
  },
};

export const TrendTypes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <TrendIndicator value={25.3} label="Positive Growth" />
      <TrendIndicator value={-12.8} label="Negative Trend" />
      <TrendIndicator value={0} label="No Change" />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <label>Small</label>
        <TrendIndicator value={15.5} size="small" />
      </div>
      <div>
        <label>Medium (Default)</label>
        <TrendIndicator value={15.5} size="medium" />
      </div>
      <div>
        <label>Large</label>
        <TrendIndicator value={15.5} size="large" />
      </div>
    </div>
  ),
};

export const WithLabels: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <TrendIndicator value={23.5} label="Revenue Growth" />
      <TrendIndicator value={-8.2} label="Customer Churn" />
      <TrendIndicator value={45.7} label="Conversion Rate" />
    </div>
  ),
};

export const Precision: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <TrendIndicator value={15.123456} precision={0} label="No decimals" />
      <TrendIndicator value={15.123456} precision={2} label="2 decimals" />
      <TrendIndicator value={15.123456} precision={4} label="4 decimals" />
    </div>
  ),
};

export const Interactive: Story = {
  args: {
    value: 18.7,
    label: 'Monthly Growth',
    size: 'medium',
    precision: 1,
  },
};
