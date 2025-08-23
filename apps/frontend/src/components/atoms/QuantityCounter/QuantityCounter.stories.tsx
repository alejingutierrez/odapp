import type { Meta, StoryObj } from '@storybook/react'
import { QuantityCounter } from './QuantityCounter'

const meta: Meta<typeof QuantityCounter> = {
  title: 'Atoms/QuantityCounter',
  component: QuantityCounter,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: 'number',
    },
    min: {
      control: 'number',
    },
    max: {
      control: 'number',
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
    disabled: {
      control: 'boolean',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    value: 1,
  },
}

export const WithLimits: Story = {
  args: {
    value: 5,
    min: 1,
    max: 10,
  },
}

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <label>Small</label>
        <QuantityCounter size='small' value={1} />
      </div>
      <div>
        <label>Medium (Default)</label>
        <QuantityCounter size='medium' value={1} />
      </div>
      <div>
        <label>Large</label>
        <QuantityCounter size='large' value={1} />
      </div>
    </div>
  ),
}

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <label>Normal</label>
        <QuantityCounter value={5} />
      </div>
      <div>
        <label>At Minimum (1)</label>
        <QuantityCounter value={1} min={1} />
      </div>
      <div>
        <label>At Maximum (10)</label>
        <QuantityCounter value={10} max={10} />
      </div>
      <div>
        <label>Disabled</label>
        <QuantityCounter value={3} disabled />
      </div>
    </div>
  ),
}

export const Interactive: Story = {
  args: {
    value: 3,
    min: 1,
    max: 99,
    size: 'medium',
  },
}
