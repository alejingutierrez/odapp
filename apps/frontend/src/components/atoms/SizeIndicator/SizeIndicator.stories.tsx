import type { Meta, StoryObj } from '@storybook/react'

import { SizeIndicator, SizeChart, SizeGuide } from './SizeIndicator'

const meta: Meta<typeof SizeIndicator> = {
  title: 'Atoms/SizeIndicator',
  component: SizeIndicator,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A size indicator component for fashion applications, allowing users to select clothing sizes.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'text',
      description: 'The size value (XS, S, M, L, XL, etc.)',
    },
    variant: {
      control: 'select',
      options: ['default', 'compact', 'detailed'],
      description: 'Display variant',
    },
    shape: {
      control: 'select',
      options: ['square', 'circle', 'rounded'],
      description: 'Shape of the indicator',
    },
    selected: {
      control: 'boolean',
      description: 'Whether the size is selected',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the size is disabled',
    },
    available: {
      control: 'boolean',
      description: 'Whether the size is available',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    size: 'M',
    label: 'Medium',
  },
}

export const Selected: Story = {
  args: {
    size: 'L',
    label: 'Large',
    selected: true,
  },
}

export const Unavailable: Story = {
  args: {
    size: 'XL',
    label: 'Extra Large',
    available: false,
  },
}

export const Disabled: Story = {
  args: {
    size: 'S',
    label: 'Small',
    disabled: true,
  },
}

export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
      <SizeIndicator size='M' variant='default' label='Default' />
      <SizeIndicator size='M' variant='compact' label='Compact' />
      <SizeIndicator size='M' variant='detailed' label='Detailed' />
    </div>
  ),
}

export const Shapes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
      <SizeIndicator size='M' shape='square' label='Square' />
      <SizeIndicator size='M' shape='circle' label='Circle' />
      <SizeIndicator size='M' shape='rounded' label='Rounded' />
    </div>
  ),
}

const clothingSizes = [
  { size: 'XS', label: 'Extra Small', available: true },
  { size: 'S', label: 'Small', available: true },
  { size: 'M', label: 'Medium', available: true },
  { size: 'L', label: 'Large', available: false },
  { size: 'XL', label: 'Extra Large', available: true },
  { size: 'XXL', label: 'Double Extra Large', available: false },
]

export const SizeChartExample: Story = {
  render: () => (
    <SizeChart
      sizes={clothingSizes}
      selectedSize='M'
      onSizeSelect={(size) => console.log('Selected size:', size)}
    />
  ),
}

const sizeGuideData = [
  {
    size: 'XS',
    label: 'Extra Small',
    measurements: { chest: 86, waist: 70, hips: 92, length: 60 },
  },
  {
    size: 'S',
    label: 'Small',
    measurements: { chest: 90, waist: 74, hips: 96, length: 62 },
  },
  {
    size: 'M',
    label: 'Medium',
    measurements: { chest: 94, waist: 78, hips: 100, length: 64 },
  },
  {
    size: 'L',
    label: 'Large',
    measurements: { chest: 98, waist: 82, hips: 104, length: 66 },
  },
  {
    size: 'XL',
    label: 'Extra Large',
    measurements: { chest: 102, waist: 86, hips: 108, length: 68 },
  },
]

export const SizeGuideExample: Story = {
  render: () => (
    <div style={{ width: '100%', maxWidth: '600px' }}>
      <SizeGuide sizes={sizeGuideData} unit='cm' />
    </div>
  ),
}
