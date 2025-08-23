import type { Meta, StoryObj } from '@storybook/react'

import { ProgressIndicator } from './ProgressIndicator'

const meta: Meta<typeof ProgressIndicator> = {
  title: 'Atoms/ProgressIndicator',
  component: ProgressIndicator,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['line', 'circle', 'dashboard'],
    },
    size: {
      control: 'select',
      options: ['small', 'default', 'large'],
    },
    percent: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
    },
    animated: {
      control: 'boolean',
    },
    showLabel: {
      control: 'boolean',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    percent: 60,
  },
}

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
      <ProgressIndicator percent={75} variant='line' label='Line Progress' />
      <ProgressIndicator
        percent={60}
        variant='circle'
        label='Circle Progress'
      />
      <ProgressIndicator
        percent={45}
        variant='dashboard'
        label='Dashboard Progress'
      />
    </div>
  ),
}

export const DifferentSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <ProgressIndicator percent={75} size='small' label='Small' />
      <ProgressIndicator percent={75} size='default' label='Default' />
      <ProgressIndicator percent={75} size='large' label='Large' />
    </div>
  ),
}

export const CircleSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
      <ProgressIndicator
        percent={75}
        variant='circle'
        size='small'
        label='Small Circle'
      />
      <ProgressIndicator
        percent={75}
        variant='circle'
        size='default'
        label='Default Circle'
      />
      <ProgressIndicator
        percent={75}
        variant='circle'
        size='large'
        label='Large Circle'
      />
    </div>
  ),
}

export const WithoutLabel: Story = {
  args: {
    percent: 80,
    showLabel: false,
  },
}

export const Animated: Story = {
  args: {
    percent: 65,
    animated: true,
    label: 'Processing...',
  },
}

export const StatusColors: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <ProgressIndicator percent={30} status='exception' label='Error' />
      <ProgressIndicator percent={100} status='success' label='Success' />
      <ProgressIndicator percent={75} status='active' label='Active' />
      <ProgressIndicator percent={50} label='Normal' />
    </div>
  ),
}
