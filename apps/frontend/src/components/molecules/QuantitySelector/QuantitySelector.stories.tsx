import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'

import { QuantitySelector } from './QuantitySelector'

const meta: Meta<typeof QuantitySelector> = {
  title: 'Molecules/QuantitySelector',
  component: QuantitySelector,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A quantity selector component with increment/decrement controls and input field. Supports different sizes, ranges, steps, and validation.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['small', 'middle', 'large'],
    },
    showControls: { control: 'boolean' },
    showLabel: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ padding: '20px', maxWidth: '400px' }}>
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof QuantitySelector>

export const Default: Story = {
  args: {
    value: 1,
    min: 1,
    max: 100,
  },
  }

export const WithLabel: Story = {
  args: {
    value: 1,
    min: 1,
    max: 100,
    showLabel: true,
    label: 'Quantity',
  },
  }

export const SmallSize: Story = {
  args: {
    value: 1,
    min: 1,
    max: 100,
    size: 'small',
  },
  }

export const LargeSize: Story = {
  args: {
    value: 1,
    min: 1,
    max: 100,
    size: 'large',
  },
  }

export const WithoutControls: Story = {
  args: {
    value: 1,
    min: 1,
    max: 100,
    showControls: false,
  },
  }

export const Disabled: Story = {
  args: {
    value: 5,
    min: 1,
    max: 100,
    disabled: true,
  },
  }

export const WithStep: Story = {
  args: {
    value: 2,
    min: 0,
    max: 100,
    step: 2,
  },
  }

export const DecimalStep: Story = {
  args: {
    value: 1.5,
    min: 0,
    max: 10,
    step: 0.5,
    precision: 1,
  },
  }

export const HighValue: Story = {
  args: {
    value: 50,
    min: 1,
    max: 1000,
  },
  }

export const ZeroMinimum: Story = {
  args: {
    value: 0,
    min: 0,
    max: 100,
  },
  }

export const CustomRange: Story = {
  args: {
    value: 5,
    min: 5,
    max: 20,
  },
  }

export const WithAddons: Story = {
  args: {
    value: 1,
    min: 1,
    max: 100,
    showControls: false,
    addonBefore: 'Qty:',
    addonAfter: 'items',
  },
  }

export const CustomFormatter: Story = {
  args: {
    value: 1,
    min: 1,
    max: 100,
    showControls: false,
    formatter: (value) => `${value} units`,
    parser: (displayValue) => {
      const parsed = displayValue?.replace(' units', '')
      return parsed ? parseInt(parsed, 10) : 1
    },
  },
  }

export const Interactive: Story = {
  render: (args) => {
    const [value, setValue] = useState(args.value || 1)

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <QuantitySelector
          {...args}
          value={value}
          onChange={setValue}
        />
        <div style={{ fontSize: '14px', color: '#666' }}>
          Current value: {value}
        </div>
      </div>
    )
  },
  tags: ['autodocs'],
  args: {
    min: 1,
    max: 100,
  },
  }

export const ComplexExample: Story = {
  render: (args) => {
    const [value, setValue] = useState(args.value || 1)

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <QuantitySelector
          {...args}
          value={value}
          onChange={setValue}
        />
        <div style={{ fontSize: '14px', color: '#666' }}>
          <div>Value: {value}</div>
          <div>Min: {args.min}</div>
          <div>Max: {args.max}</div>
          <div>Step: {args.step}</div>
          <div>Can increment: {value < (args.max || 999999) ? 'Yes' : 'No'}</div>
          <div>Can decrement: {value > (args.min || 1) ? 'Yes' : 'No'}</div>
        </div>
      </div>
    )
  },
  tags: ['autodocs'],
  args: {
    min: 1,
    max: 50,
    step: 5,
  },
  }

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <QuantitySelector value={1} size="small" />
      <QuantitySelector value={1} size="middle" />
      <QuantitySelector value={1} size="large" />
    </div>
  ),
}

export const DifferentRanges: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <QuantitySelector value={1} min={1} max={10} />
      <QuantitySelector value={5} min={0} max={20} />
      <QuantitySelector value={100} min={50} max={200} />
    </div>
  ),
}

export const WithSteps: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <QuantitySelector value={2} min={0} max={10} step={2} />
      <QuantitySelector value={1.5} min={0} max={5} step={0.5} precision={1} />
      <QuantitySelector value={10} min={0} max={100} step={10} />
    </div>
  ),
}

export const EdgeCases: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <QuantitySelector value={0} min={0} max={10} />
      <QuantitySelector value={10} min={0} max={10} />
      <QuantitySelector value={1} min={1} max={1} />
    </div>
  ),
}
