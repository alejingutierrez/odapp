import { MailOutlined, BellOutlined } from '@ant-design/icons'
import type { Meta, StoryObj } from '@storybook/react'

import { Avatar } from '../Avatar/Avatar'
import { Button } from '../Button/Button'

import { Badge, StatusBadge, CountBadge } from './Badge'

const meta: Meta<typeof Badge> = {
  title: 'Atoms/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Badge component for displaying status indicators, counts, and notifications with various styles and variants.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'primary', 'success', 'warning', 'error', 'info'],
      description: 'Visual variant of the badge',
    },
    size: {
      control: { type: 'select' },
      options: ['small', 'medium', 'large'],
      description: 'Size of the badge',
    },
    count: {
      control: 'number',
      description: 'Number to display in the badge',
    },
    dot: {
      control: 'boolean',
      description: 'Whether to show as a dot instead of count',
    },
    showZero: {
      control: 'boolean',
      description: 'Whether to show badge when count is zero',
    },
  },
}

export default meta
type Story = StoryObj<typeof Badge>

// Basic Stories
export const Default: Story = {
  args: {
    count: 5,
    children: <Avatar name='User' />,
  },
}

export const Dot: Story = {
  args: {
    dot: true,
    children: <Avatar name='User' />,
  },
}

export const WithText: Story = {
  args: {
    count: 'New',
    children: <Button>Messages</Button>,
  },
}

// Variant Stories
export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
      <Badge variant='default' count={1}>
        <Avatar name='Default' />
      </Badge>
      <Badge variant='primary' count={2}>
        <Avatar name='Primary' />
      </Badge>
      <Badge variant='success' count={3}>
        <Avatar name='Success' />
      </Badge>
      <Badge variant='warning' count={4}>
        <Avatar name='Warning' />
      </Badge>
      <Badge variant='error' count={5}>
        <Avatar name='Error' />
      </Badge>
      <Badge variant='info' count={6}>
        <Avatar name='Info' />
      </Badge>
    </div>
  ),
}

// Size Stories
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
      <Badge size='small' count={99}>
        <Avatar size='small' name='Small' />
      </Badge>
      <Badge size='medium' count={99}>
        <Avatar size='default' name='Medium' />
      </Badge>
      <Badge size='large' count={99}>
        <Avatar size='large' name='Large' />
      </Badge>
    </div>
  ),
}

// Dot Variants
export const DotVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
      <Badge variant='default' dot>
        <Avatar name='Default' />
      </Badge>
      <Badge variant='primary' dot>
        <Avatar name='Primary' />
      </Badge>
      <Badge variant='success' dot>
        <Avatar name='Success' />
      </Badge>
      <Badge variant='warning' dot>
        <Avatar name='Warning' />
      </Badge>
      <Badge variant='error' dot>
        <Avatar name='Error' />
      </Badge>
    </div>
  ),
}

// Count Examples
export const CountExamples: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
      <Badge count={0} showZero>
        <Avatar name='Zero' />
      </Badge>
      <Badge count={1}>
        <Avatar name='One' />
      </Badge>
      <Badge count={99}>
        <Avatar name='99' />
      </Badge>
      <Badge count={100}>
        <Avatar name='100+' />
      </Badge>
      <Badge count={1000} overflowCount={999}>
        <Avatar name='999+' />
      </Badge>
    </div>
  ),
}

// Status Badge Stories
export const StatusBadges: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <StatusBadge status='active' text='Active' />
        <StatusBadge status='inactive' text='Inactive' />
        <StatusBadge status='pending' text='Pending' />
      </div>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <StatusBadge status='success' text='Success' />
        <StatusBadge status='warning' text='Warning' />
        <StatusBadge status='error' text='Error' />
      </div>
    </div>
  ),
}

// Count Badge Stories
export const CountBadges: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      <CountBadge count={5} variant='primary' />
      <CountBadge count={23} variant='success' />
      <CountBadge count={99} variant='warning' />
      <CountBadge count={100} variant='error' max={99} />
    </div>
  ),
}

// With Icons
export const WithIcons: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
      <Badge count={5} variant='primary'>
        <MailOutlined style={{ fontSize: '24px' }} />
      </Badge>
      <Badge count={12} variant='error'>
        <BellOutlined style={{ fontSize: '24px' }} />
      </Badge>
      <Badge dot variant='success'>
        <MailOutlined style={{ fontSize: '24px' }} />
      </Badge>
    </div>
  ),
}

// Standalone Badges
export const Standalone: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      <Badge count={25} />
      <Badge count='Hot' variant='error' />
      <Badge count='New' variant='primary' />
      <Badge dot variant='success' />
    </div>
  ),
}

// Interactive Example
export const Interactive: Story = {
  args: {
    count: 42,
    variant: 'primary',
    size: 'medium',
    children: <Button>Notifications</Button>,
  },
}

// Edge Cases
export const EdgeCases: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <Badge count={0}>
          <Avatar name='Hidden Zero' />
        </Badge>
        <Badge count={0} showZero>
          <Avatar name='Shown Zero' />
        </Badge>
        <Badge count={-1}>
          <Avatar name='Negative' />
        </Badge>
      </div>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <Badge count='Very Long Text'>
          <Avatar name='Long Text' />
        </Badge>
        <Badge count={99999} overflowCount={9999}>
          <Avatar name='Overflow' />
        </Badge>
      </div>
    </div>
  ),
}
