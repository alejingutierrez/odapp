import type { Meta, StoryObj } from '@storybook/react'

import { TrendIndicator } from './TrendIndicator'

const meta: Meta<typeof TrendIndicator> = {
  title: 'Atoms/TrendIndicator',
  component: TrendIndicator,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    score: {
      control: 'number',
    },

    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },

  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    title: 'Sample Trend',
    score: 75,
    direction: 'up',
  },
}

export const TrendTypes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <TrendIndicator title='Positive Growth' score={85} direction='up' />
      <TrendIndicator title='Negative Trend' score={35} direction='down' />
      <TrendIndicator title='No Change' score={50} direction='stable' />
    </div>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <label>Small</label>
        <TrendIndicator title='Sample Trend' score={75} direction='up' size='small' />
      </div>
      <div>
        <label>Medium (Default)</label>
        <TrendIndicator title='Sample Trend' score={75} direction='up' size='medium' />
      </div>
      <div>
        <label>Large</label>
        <TrendIndicator title='Sample Trend' score={75} direction='up' size='large' />
      </div>
    </div>
  ),
}

export const WithLabels: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <TrendIndicator title='Revenue Growth' score={85} direction='up' />
      <TrendIndicator title='Customer Churn' score={25} direction='down' />
      <TrendIndicator title='Conversion Rate' score={95} direction='up' />
    </div>
  ),
}

export const Precision: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <TrendIndicator title='High Score Trend' score={95} direction='up' />
      <TrendIndicator title='Medium Score Trend' score={65} direction='up' />
      <TrendIndicator title='Low Score Trend' score={35} direction='down' />
    </div>
  ),
}

export const Interactive: Story = {
  args: {
    title: 'Monthly Growth',
    score: 78,
    direction: 'up',
    size: 'medium',
  },
}
