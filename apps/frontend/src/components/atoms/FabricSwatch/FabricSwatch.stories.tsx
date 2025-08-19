import type { Meta, StoryObj } from '@storybook/react';
import { FabricSwatch } from './FabricSwatch';

const meta: Meta<typeof FabricSwatch> = {
  title: 'Atoms/FabricSwatch',
  component: FabricSwatch,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    fabric: {
      control: 'text',
      description: 'Name of the fabric',
    },
    variant: {
      control: 'select',
      options: ['default', 'primary', 'success', 'warning', 'error'],
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
    selected: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    fabric: 'Cotton',
  },
};

export const FabricTypes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
      <FabricSwatch fabric="Cotton" />
      <FabricSwatch fabric="Silk" />
      <FabricSwatch fabric="Wool" />
      <FabricSwatch fabric="Linen" />
      <FabricSwatch fabric="Polyester" />
      <FabricSwatch fabric="Denim" />
    </div>
  ),
};

export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
      <FabricSwatch fabric="Cotton" variant="default" />
      <FabricSwatch fabric="Silk" variant="primary" />
      <FabricSwatch fabric="Wool" variant="success" />
      <FabricSwatch fabric="Linen" variant="warning" />
      <FabricSwatch fabric="Polyester" variant="error" />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      <FabricSwatch fabric="Cotton" size="small" />
      <FabricSwatch fabric="Cotton" size="medium" />
      <FabricSwatch fabric="Cotton" size="large" />
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
      <FabricSwatch fabric="Cotton" />
      <FabricSwatch fabric="Cotton" selected />
      <FabricSwatch fabric="Cotton" disabled />
    </div>
  ),
};

export const Interactive: Story = {
  args: {
    fabric: 'Premium Cotton',
    variant: 'primary',
    size: 'medium',
  },
};
