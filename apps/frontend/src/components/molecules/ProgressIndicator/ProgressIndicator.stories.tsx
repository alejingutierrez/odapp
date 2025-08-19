import type { Meta, StoryObj } from '@storybook/react'
import { ProgressIndicator } from './ProgressIndicator'

const meta: Meta<typeof ProgressIndicator> = {
  title: 'Molecules/ProgressIndicator',
  component: ProgressIndicator,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A progress indicator for loading states and completion tracking with steps support.'
      }
    }
  },
  argTypes: {
    type: {
      control: { type: 'select' },
      options: ['line', 'circle', 'dashboard']
    },
    status: {
      control: { type: 'select' },
      options: ['normal', 'success', 'exception', 'active']
    },
    size: {
      control: { type: 'select' },
      options: ['small', 'default', 'large']
    }
  }
}

export default meta
type Story = StoryObj<typeof ProgressIndicator>

export const Default: Story = {
  args: {
    percent: 65,
    title: 'Order Processing',
    subtitle: 'Your order is being prepared'
  }
}

export const WithSteps: Story = {
  args: {
    percent: 50,
    title: 'Order Progress',
    showSteps: true,
    steps: [
      { title: 'Order Placed', description: 'Order received and confirmed', status: 'finish' },
      { title: 'Processing', description: 'Preparing your items', status: 'process' },
      { title: 'Shipping', description: 'Package in transit', status: 'wait' },
      { title: 'Delivered', description: 'Package delivered', status: 'wait' }
    ]
  }
}

export const Circle: Story = {
  args: {
    percent: 75,
    type: 'circle',
    title: 'Upload Progress',
    status: 'active'
  }
}

export const Dashboard: Story = {
  args: {
    percent: 85,
    type: 'dashboard',
    title: 'Completion Rate',
    status: 'success'
  }
}

export const Success: Story = {
  args: {
    percent: 100,
    status: 'success',
    title: 'Order Complete',
    subtitle: 'Your order has been successfully processed'
  }
}

export const Error: Story = {
  args: {
    percent: 30,
    status: 'exception',
    title: 'Processing Failed',
    subtitle: 'There was an error processing your order'
  }
}

export const Small: Story = {
  args: {
    percent: 45,
    size: 'small',
    title: 'Small Progress'
  }
}

export const Large: Story = {
  args: {
    percent: 80,
    size: 'large',
    type: 'circle',
    title: 'Large Progress'
  }
}