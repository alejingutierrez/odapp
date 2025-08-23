import type { Meta, StoryObj } from '@storybook/react'
import { FabricSwatch } from './FabricSwatch'

const meta: Meta<typeof FabricSwatch> = {
  title: 'Atoms/FabricSwatch',
  component: FabricSwatch,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    name: {
      control: 'text',
      description: 'Name of the fabric',
    },

    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
    selected: {
      control: 'boolean',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    name: 'Cotton',
    composition: [{ material: 'Cotton', percentage: 100 }],
  },
}

export const FabricTypes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
      <FabricSwatch name='Cotton' composition={[{ material: 'Cotton', percentage: 100 }]} />
      <FabricSwatch name='Silk' composition={[{ material: 'Silk', percentage: 100 }]} />
      <FabricSwatch name='Wool' composition={[{ material: 'Wool', percentage: 100 }]} />
      <FabricSwatch name='Linen' composition={[{ material: 'Linen', percentage: 100 }]} />
      <FabricSwatch name='Polyester' composition={[{ material: 'Polyester', percentage: 100 }]} />
      <FabricSwatch name='Denim' composition={[{ material: 'Cotton', percentage: 98 }, { material: 'Elastane', percentage: 2 }]} />
    </div>
  ),
}

export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
      <FabricSwatch name='Cotton' composition={[{ material: 'Cotton', percentage: 100 }]} />
      <FabricSwatch name='Silk' composition={[{ material: 'Silk', percentage: 100 }]} />
      <FabricSwatch name='Wool' composition={[{ material: 'Wool', percentage: 100 }]} />
      <FabricSwatch name='Linen' composition={[{ material: 'Linen', percentage: 100 }]} />
      <FabricSwatch name='Polyester' composition={[{ material: 'Polyester', percentage: 100 }]} />
    </div>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      <FabricSwatch name='Cotton' composition={[{ material: 'Cotton', percentage: 100 }]} size='small' />
      <FabricSwatch name='Cotton' composition={[{ material: 'Cotton', percentage: 100 }]} size='medium' />
      <FabricSwatch name='Cotton' composition={[{ material: 'Cotton', percentage: 100 }]} size='large' />
    </div>
  ),
}

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
      <FabricSwatch name='Cotton' composition={[{ material: 'Cotton', percentage: 100 }]} />
      <FabricSwatch name='Cotton' composition={[{ material: 'Cotton', percentage: 100 }]} selected />
      <FabricSwatch name='Cotton' composition={[{ material: 'Cotton', percentage: 100 }]} disabled />
    </div>
  ),
}

export const Interactive: Story = {
  args: {
    name: 'Premium Cotton',
    composition: [{ material: 'Cotton', percentage: 100 }],
    size: 'medium',
  },
}
