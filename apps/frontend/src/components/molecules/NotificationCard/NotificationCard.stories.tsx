import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'

import { NotificationCard } from './NotificationCard'
import type { NotificationAction } from './NotificationCard'

const meta: Meta<typeof NotificationCard> = {
  title: 'Molecules/NotificationCard',
  component: NotificationCard,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A notification card component that displays different types of notifications (success, info, warning, error) with customizable actions, timestamps, and close functionality.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: { type: 'select' },
      options: ['success', 'info', 'warning', 'error'],
    },
    onClose: { action: 'close clicked' },
  },
  decorators: [
    (Story) => (
      <div style={{ padding: '20px', maxWidth: '500px' }}>
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof NotificationCard>

const sampleActions: NotificationAction[] = [
  {
    label: 'View Details',
    onClick: () => console.log('View details clicked'),
    type: 'primary',
  },
  {
    label: 'Dismiss',
    onClick: () => console.log('Dismiss clicked'),
    type: 'link',
  },
]

const sampleTimestamp = new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago

export const Success: Story = {
  args: {
    type: 'success',
    title: 'Order Completed Successfully',
    message: 'Your order #12345 has been processed and will be shipped within 24 hours. You will receive a confirmation email shortly.',
    timestamp: sampleTimestamp,
    actions: sampleActions,
    closable: true,
  },
}

export const Info: Story = {
  args: {
    type: 'info',
    title: 'System Maintenance',
    message: 'We will be performing scheduled maintenance on Sunday, January 15th from 2:00 AM to 4:00 AM EST. During this time, some features may be temporarily unavailable.',
    timestamp: sampleTimestamp,
    actions: [
      {
        label: 'Learn More',
        onClick: () => console.log('Learn more clicked'),
        type: 'link',
      },
    ],
    closable: true,
  },
}

export const Warning: Story = {
  args: {
    type: 'warning',
    title: 'Low Inventory Alert',
    message: 'The following products are running low on inventory: Premium Cotton T-Shirt (Size M), Denim Jeans (Size L). Please restock soon to avoid stockouts.',
    timestamp: sampleTimestamp,
    actions: [
      {
        label: 'Restock Now',
        onClick: () => console.log('Restock clicked'),
        type: 'primary',
      },
      {
        label: 'Remind Later',
        onClick: () => console.log('Remind later clicked'),
        type: 'default',
      },
    ],
    closable: true,
  },
}

export const Error: Story = {
  args: {
    type: 'error',
    title: 'Payment Failed',
    message: 'We were unable to process your payment for order #12345. Please check your payment information and try again, or contact customer support if the problem persists.',
    timestamp: sampleTimestamp,
    actions: [
      {
        label: 'Retry Payment',
        onClick: () => console.log('Retry payment clicked'),
        type: 'primary',
      },
      {
        label: 'Contact Support',
        onClick: () => console.log('Contact support clicked'),
        type: 'link',
      },
    ],
    closable: true,
  },
}

export const Simple: Story = {
  args: {
    type: 'info',
    title: 'Welcome to our platform!',
    message: 'Thank you for joining us. We\'re excited to have you on board.',
    closable: true,
  },
}

export const WithLongMessage: Story = {
  args: {
    type: 'warning',
    title: 'Important Update Required',
    message: 'This is a very long message that demonstrates how the notification card handles text overflow. The message will be truncated after two lines and can be expanded by clicking on it. This ensures that the notification doesn\'t take up too much space while still allowing users to read the full content when needed.',
    timestamp: sampleTimestamp,
    actions: [
      {
        label: 'Update Now',
        onClick: () => console.log('Update clicked'),
        type: 'primary',
      },
    ],
    closable: true,
  },
}

export const WithoutActions: Story = {
  args: {
    type: 'success',
    title: 'Settings Saved',
    message: 'Your account settings have been updated successfully.',
    timestamp: sampleTimestamp,
    closable: true,
  },
}

export const WithoutClose: Story = {
  args: {
    type: 'info',
    title: 'System Notification',
    message: 'This notification cannot be dismissed and will remain visible until the system removes it.',
    timestamp: sampleTimestamp,
    actions: [
      {
        label: 'Acknowledge',
        onClick: () => console.log('Acknowledge clicked'),
        type: 'primary',
      },
    ],
    closable: false,
  },
}

export const RecentTimestamp: Story = {
  args: {
    type: 'success',
    title: 'Profile Updated',
    message: 'Your profile information has been updated successfully.',
    timestamp: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
    closable: true,
  },
}

export const OldTimestamp: Story = {
  args: {
    type: 'info',
    title: 'Last Login',
    message: 'You last logged in to your account.',
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    closable: true,
  },
}

export const MultipleActions: Story = {
  args: {
    type: 'warning',
    title: 'Security Alert',
    message: 'We detected unusual activity on your account. Please review and take action if necessary.',
    timestamp: sampleTimestamp,
    actions: [
      {
        label: 'Review Activity',
        onClick: () => console.log('Review activity clicked'),
        type: 'primary',
      },
      {
        label: 'Change Password',
        onClick: () => console.log('Change password clicked'),
        type: 'default',
      },
      {
        label: 'Contact Support',
        onClick: () => console.log('Contact support clicked'),
        type: 'link',
      },
    ],
    closable: true,
  },
}

export const TitleOnly: Story = {
  args: {
    type: 'info',
    title: 'Quick notification without message',
    closable: true,
  },
}
