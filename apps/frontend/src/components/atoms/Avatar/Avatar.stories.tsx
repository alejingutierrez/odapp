import type { Meta, StoryObj } from '@storybook/react'
import { Avatar } from './Avatar'

const meta: Meta<typeof Avatar> = {
  title: 'Atoms/Avatar',
  component: Avatar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['small', 'default', 'large', 64],
    },
    shape: {
      control: 'select',
      options: ['circle', 'square'],
    },
    status: {
      control: 'select',
      options: ['online', 'offline', 'away', 'busy'],
    },
    showBadge: {
      control: 'boolean',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    name: 'John Doe',
  },
}

export const WithImage: Story = {
  args: {
    name: 'Jane Smith',
    src: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
  },
}

export const DifferentSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <Avatar name='John Doe' size='small' />
      <Avatar name='Jane Smith' size='default' />
      <Avatar name='Bob Wilson' size='large' />
      <Avatar name='Alice Brown' size={64} />
    </div>
  ),
}

export const DifferentShapes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <Avatar name='John Doe' shape='circle' />
      <Avatar name='Jane Smith' shape='square' />
    </div>
  ),
}

export const WithStatus: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <Avatar name='Online User' status='online' />
      <Avatar name='Away User' status='away' />
      <Avatar name='Busy User' status='busy' />
      <Avatar name='Offline User' status='offline' />
    </div>
  ),
}

export const WithBadge: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <Avatar name='User 1' showBadge badgeCount={3} />
      <Avatar name='User 2' showBadge badgeCount={99} />
      <Avatar name='User 3' showBadge badgeColor='#f50' />
    </div>
  ),
}

export const TeamAvatars: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <Avatar
        name='Sarah Johnson'
        src='https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face'
        status='online'
      />
      <Avatar name='Mike Chen' status='away' />
      <Avatar name='Lisa Rodriguez' status='busy' />
      <Avatar
        name='David Kim'
        src='https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face'
        status='online'
      />
      <Avatar name='Emma Wilson' status='offline' />
    </div>
  ),
}

export const Fallbacks: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <Avatar name='John Doe' />
      <Avatar name='J' />
      <Avatar />
      <Avatar>AB</Avatar>
    </div>
  ),
}
