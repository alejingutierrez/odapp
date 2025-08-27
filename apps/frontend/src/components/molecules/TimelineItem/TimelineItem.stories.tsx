import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { Timeline } from 'antd'

import { TimelineItem } from './TimelineItem'
import type { TimelineItemData } from './TimelineItem'

const meta: Meta<typeof TimelineItem> = {
  title: 'Molecules/TimelineItem',
  component: TimelineItem,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A timeline item component that displays chronological events with icons, user information, timestamps, and metadata. Perfect for order tracking, activity feeds, and event histories.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    showAvatar: { control: 'boolean' },
    showTags: { control: 'boolean' },
    showMetadata: { control: 'boolean' },
    compact: { control: 'boolean' },
  },
  decorators: [
    (Story) => (
      <div style={{ padding: '20px', maxWidth: '600px' }}>
        <Timeline>
          <Story />
        </Timeline>
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof TimelineItem>

const orderCreatedItem: TimelineItemData = {
  id: '1',
  type: 'order-created',
  title: 'Order Created',
  description: 'New order #12345 has been created by the customer.',
  timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
  user: {
    name: 'John Doe',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face',
  },
  tags: ['order', 'new'],
  status: 'success',
}

const orderConfirmedItem: TimelineItemData = {
  id: '2',
  type: 'order-confirmed',
  title: 'Order Confirmed',
  description: 'Order has been confirmed and payment received. Preparing for shipment.',
  timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
  user: {
    name: 'Sarah Wilson',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face',
  },
  tags: ['confirmed', 'payment'],
  status: 'success',
}

const orderShippedItem: TimelineItemData = {
  id: '3',
  type: 'order-shipped',
  title: 'Order Shipped',
  description: 'Order has been shipped via Express Delivery. Tracking number: TRK123456789.',
  timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
  user: {
    name: 'Mike Johnson',
  },
  tags: ['shipped', 'tracking'],
  status: 'processing',
  metadata: {
    'Tracking Number': 'TRK123456789',
    'Carrier': 'Express Delivery',
    'Estimated Delivery': '2-3 business days',
  },
}

const orderDeliveredItem: TimelineItemData = {
  id: '4',
  type: 'order-delivered',
  title: 'Order Delivered',
  description: 'Order has been successfully delivered to the customer.',
  timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
  user: {
    name: 'Delivery Service',
  },
  tags: ['delivered', 'completed'],
  status: 'success',
}

const orderCancelledItem: TimelineItemData = {
  id: '5',
  type: 'order-cancelled',
  title: 'Order Cancelled',
  description: 'Order was cancelled due to payment issues.',
  timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
  user: {
    name: 'System',
  },
  tags: ['cancelled', 'payment-failed'],
  status: 'error',
}

const paymentReceivedItem: TimelineItemData = {
  id: '6',
  type: 'payment-received',
  title: 'Payment Received',
  description: 'Payment of $299.99 has been successfully processed.',
  timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1), // 1 hour ago
  user: {
    name: 'Payment Gateway',
  },
  tags: ['payment', 'success'],
  status: 'success',
  metadata: {
    'Amount': '$299.99',
    'Method': 'Credit Card',
    'Transaction ID': 'TXN789012345',
  },
}

const inventoryUpdatedItem: TimelineItemData = {
  id: '7',
  type: 'inventory-updated',
  title: 'Inventory Updated',
  description: 'Product stock levels have been updated after recent sales.',
  timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
  user: {
    name: 'Inventory System',
  },
  tags: ['inventory', 'update'],
  status: 'processing',
  metadata: {
    'Products Updated': '15',
    'Stock Changes': '+50 units',
  },
}

const customerRegisteredItem: TimelineItemData = {
  id: '8',
  type: 'customer-registered',
  title: 'New Customer Registered',
  description: 'A new customer has registered on the platform.',
  timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
  user: {
    name: 'Jane Smith',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=face',
  },
  tags: ['customer', 'registration'],
  status: 'success',
}

const productCreatedItem: TimelineItemData = {
  id: '9',
  type: 'product-created',
  title: 'New Product Added',
  description: 'A new product has been added to the catalog.',
  timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
  user: {
    name: 'Product Manager',
  },
  tags: ['product', 'catalog'],
  status: 'success',
  metadata: {
    'Product ID': 'PROD-001',
    'Category': 'Electronics',
    'Price': '$199.99',
  },
}

const syncCompletedItem: TimelineItemData = {
  id: '10',
  type: 'sync-completed',
  title: 'Data Sync Completed',
  description: 'Synchronization with external systems has been completed successfully.',
  timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
  user: {
    name: 'Sync Service',
  },
  tags: ['sync', 'completed'],
  status: 'success',
  metadata: {
    'Records Synced': '1,234',
    'Duration': '2m 30s',
    'Status': 'Success',
  },
}

export const Default: Story = {
  args: {
    item: orderCreatedItem,
  },
}

export const OrderConfirmed: Story = {
  args: {
    item: orderConfirmedItem,
  },
}

export const OrderShipped: Story = {
  args: {
    item: orderShippedItem,
  },
}

export const OrderDelivered: Story = {
  args: {
    item: orderDeliveredItem,
  },
}

export const OrderCancelled: Story = {
  args: {
    item: orderCancelledItem,
  },
}

export const PaymentReceived: Story = {
  args: {
    item: paymentReceivedItem,
  },
}

export const InventoryUpdated: Story = {
  args: {
    item: inventoryUpdatedItem,
  },
}

export const CustomerRegistered: Story = {
  args: {
    item: customerRegisteredItem,
  },
}

export const ProductCreated: Story = {
  args: {
    item: productCreatedItem,
  },
}

export const SyncCompleted: Story = {
  args: {
    item: syncCompletedItem,
  },
}

export const WithoutAvatar: Story = {
  args: {
    item: orderCreatedItem,
    showAvatar: false,
  },
}

export const WithoutTags: Story = {
  args: {
    item: orderCreatedItem,
    showTags: false,
  },
}

export const WithMetadata: Story = {
  args: {
    item: orderShippedItem,
    showMetadata: true,
  },
}

export const Compact: Story = {
  args: {
    item: orderCreatedItem,
    compact: true,
  },
}

export const AllTypes: Story = {
  render: () => (
    <Timeline>
      <TimelineItem item={orderCreatedItem} />
      <TimelineItem item={orderConfirmedItem} />
      <TimelineItem item={orderShippedItem} />
      <TimelineItem item={orderDeliveredItem} />
      <TimelineItem item={paymentReceivedItem} />
      <TimelineItem item={inventoryUpdatedItem} />
      <TimelineItem item={customerRegisteredItem} />
      <TimelineItem item={productCreatedItem} />
      <TimelineItem item={syncCompletedItem} />
    </Timeline>
  ),
}

export const OrderTimeline: Story = {
  render: () => (
    <Timeline>
      <TimelineItem item={orderCreatedItem} />
      <TimelineItem item={orderConfirmedItem} />
      <TimelineItem item={orderShippedItem} showMetadata={true} />
      <TimelineItem item={orderDeliveredItem} />
    </Timeline>
  ),
}

export const CompactTimeline: Story = {
  render: () => (
    <Timeline>
      <TimelineItem item={orderCreatedItem} compact={true} />
      <TimelineItem item={orderConfirmedItem} compact={true} />
      <TimelineItem item={orderShippedItem} compact={true} />
      <TimelineItem item={orderDeliveredItem} compact={true} />
    </Timeline>
  ),
}

export const WithMetadataTimeline: Story = {
  render: () => (
    <Timeline>
      <TimelineItem item={orderShippedItem} showMetadata={true} />
      <TimelineItem item={paymentReceivedItem} showMetadata={true} />
      <TimelineItem item={inventoryUpdatedItem} showMetadata={true} />
      <TimelineItem item={productCreatedItem} showMetadata={true} />
      <TimelineItem item={syncCompletedItem} showMetadata={true} />
    </Timeline>
  ),
}

export const ComplexExample: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <h4>Order Processing Timeline</h4>
        <Timeline>
          <TimelineItem item={orderCreatedItem} />
          <TimelineItem item={paymentReceivedItem} showMetadata={true} />
          <TimelineItem item={orderConfirmedItem} />
          <TimelineItem item={orderShippedItem} showMetadata={true} />
          <TimelineItem item={orderDeliveredItem} />
        </Timeline>
      </div>
      
      <div>
        <h4>System Activity</h4>
        <Timeline>
          <TimelineItem item={customerRegisteredItem} />
          <TimelineItem item={productCreatedItem} showMetadata={true} />
          <TimelineItem item={inventoryUpdatedItem} showMetadata={true} />
          <TimelineItem item={syncCompletedItem} showMetadata={true} />
        </Timeline>
      </div>
    </div>
  ),
}
