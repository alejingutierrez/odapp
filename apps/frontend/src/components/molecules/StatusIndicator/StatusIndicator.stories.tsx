import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'

import { StatusIndicator } from './StatusIndicator'
import type { StatusType } from './StatusIndicator'

const meta: Meta<typeof StatusIndicator> = {
  title: 'Molecules/StatusIndicator',
  component: StatusIndicator,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A status indicator component that displays various status types with icons, dots, and animations. Perfect for showing process states, order statuses, and system notifications.',
      },

    },
  },
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: { type: 'select' },
      options: ['success', 'processing', 'warning', 'error', 'default', 'pending', 'cancelled', 'draft'],
    },
    showIcon: { control: 'boolean' },
    showDot: { control: 'boolean' },
    animated: { control: 'boolean' },
    size: {
      control: { type: 'select' },
      options: ['small', 'default', 'large'],
    },
  },
  decorators: [
    (Story) => (
      <div style={{ padding: '20px', maxWidth: '600px' }}>
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof StatusIndicator>

export const Success: Story = {
  args: {
    status: 'success',
  },
}

export const Processing: Story = {
  args: {
    status: 'processing',
  },
}

export const Warning: Story = {
  args: {
    status: 'warning',
  },
}

export const Error: Story = {
  args: {
    status: 'error',
  },
}

export const Pending: Story = {
  args: {
    status: 'pending',
  },
}

export const Cancelled: Story = {
  args: {
    status: 'cancelled',
  },
}

export const Draft: Story = {
  args: {
    status: 'draft',
  },
}

export const Default: Story = {
  args: {
    status: 'default',
  },
}

export const WithCustomText: Story = {
  args: {
    status: 'success',
    text: 'Order Completed',
  },
}

export const WithTooltip: Story = {
  args: {
    status: 'processing',
    text: 'Processing Payment',
    tooltip: 'Payment is being processed by the bank',
  },
}

export const WithoutIcon: Story = {
  args: {
    status: 'success',
    showIcon: false,
  },
}

export const WithDot: Story = {
  args: {
    status: 'success',
    showDot: true,
  },
}

export const Animated: Story = {
  args: {
    status: 'processing',
    animated: true,
  },
}

export const SmallSize: Story = {
  args: {
    status: 'success',
    size: 'small',
  },
}

export const LargeSize: Story = {
  args: {
    status: 'success',
    size: 'large',
  },
}

export const AllStatuses: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
      <StatusIndicator status="success" text="Success" />
      <StatusIndicator status="processing" text="Processing" />
      <StatusIndicator status="warning" text="Warning" />
      <StatusIndicator status="error" text="Error" />
      <StatusIndicator status="pending" text="Pending" />
      <StatusIndicator status="cancelled" text="Cancelled" />
      <StatusIndicator status="draft" text="Draft" />
      <StatusIndicator status="default" text="Unknown" />
    </div>
  ),
}

export const AllStatusesWithDots: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
      <StatusIndicator status="success" text="Success" showDot={true} />
      <StatusIndicator status="processing" text="Processing" showDot={true} />
      <StatusIndicator status="warning" text="Warning" showDot={true} />
      <StatusIndicator status="error" text="Error" showDot={true} />
      <StatusIndicator status="pending" text="Pending" showDot={true} />
      <StatusIndicator status="cancelled" text="Cancelled" showDot={true} />
      <StatusIndicator status="draft" text="Draft" showDot={true} />
      <StatusIndicator status="default" text="Unknown" showDot={true} />
    </div>
  ),
}

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <StatusIndicator status="success" text="Success" size="small" />
      <StatusIndicator status="success" text="Success" size="default" />
      <StatusIndicator status="success" text="Success" size="large" />
    </div>
  ),
}

export const OrderStatuses: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <StatusIndicator 
        status="processing" 
        text="Order Processing" 
        tooltip="Your order is being prepared for shipment"
      />
      <StatusIndicator 
        status="success" 
        text="Order Shipped" 
        tooltip="Your order has been shipped and is on its way"
      />
      <StatusIndicator 
        status="pending" 
        text="Payment Pending" 
        tooltip="Waiting for payment confirmation"
      />
      <StatusIndicator 
        status="error" 
        text="Order Failed" 
        tooltip="There was an issue processing your order"
      />
      <StatusIndicator 
        status="cancelled" 
        text="Order Cancelled" 
        tooltip="This order has been cancelled"
      />
    </div>
  ),
}

export const SystemStatuses: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <StatusIndicator 
        status="success" 
        text="System Online" 
        tooltip="All systems are running normally"
      />
      <StatusIndicator 
        status="warning" 
        text="System Warning" 
        tooltip="Some systems are experiencing issues"
      />
      <StatusIndicator 
        status="error" 
        text="System Error" 
        tooltip="Critical system failure detected"
      />
      <StatusIndicator 
        status="processing" 
        text="System Maintenance" 
        tooltip="System is under maintenance"
        animated={true}
      />
    </div>
  ),
}

export const MinimalConfiguration: Story = {
  args: {
    status: 'success',
    showIcon: false,
    showDot: false,
  },
}

export const ComplexExample: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <h4>Order Status</h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          <StatusIndicator status="processing" text="Processing" animated={true} />
          <StatusIndicator status="success" text="Shipped" />
          <StatusIndicator status="pending" text="Payment Pending" />
          <StatusIndicator status="cancelled" text="Cancelled" />
        </div>
      </div>
      
      <div>
        <h4>System Status</h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          <StatusIndicator status="success" text="Online" />
          <StatusIndicator status="warning" text="Warning" />
          <StatusIndicator status="error" text="Offline" />
          <StatusIndicator status="processing" text="Maintenance" animated={true} />
        </div>
      </div>
      
      <div>
        <h4>Document Status</h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          <StatusIndicator status="success" text="Approved" />
          <StatusIndicator status="pending" text="Under Review" />
          <StatusIndicator status="draft" text="Draft" />
          <StatusIndicator status="error" text="Rejected" />
        </div>
      </div>
    </div>
  ),
}
