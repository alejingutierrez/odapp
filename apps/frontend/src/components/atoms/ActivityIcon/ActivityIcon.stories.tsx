import type { Meta, StoryObj } from '@storybook/react'
import { Space } from 'antd'

import { ActivityIcon } from './ActivityIcon'

const meta: Meta<typeof ActivityIcon> = {
  title: 'Atoms/ActivityIcon',
  component: ActivityIcon,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Icons for different activity types like calls, emails, meetings, and interaction indicators for CRM systems.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: [
        'call',
        'email',
        'meeting',
        'message',
        'chat',
        'visit',
        'purchase',
        'order',
        'return',
        'refund',
        'note',
        'task',
        'appointment',
        'reminder',
        'like',
        'share',
        'view',
        'comment',
        'review',
        'edit',
        'delete',
        'create',
        'update',
        'download',
        'upload',
        'export',
        'import',
        'login',
        'logout',
        'register',
        'settings',
        'support',
        'feedback',
        'complaint',
        'inquiry',
      ],
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
    variant: {
      control: 'select',
      options: ['default', 'primary', 'success', 'warning', 'error', 'info'],
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    type: 'call',
    tooltip: 'Phone call',
  },
}

export const CommunicationActivities: Story = {
  render: () => (
    <Space wrap size='large'>
      <ActivityIcon type='call' tooltip='Phone call' />
      <ActivityIcon type='email' tooltip='Email' />
      <ActivityIcon type='meeting' tooltip='Video meeting' />
      <ActivityIcon type='message' tooltip='Message' />
      <ActivityIcon type='chat' tooltip='Live chat' />
    </Space>
  ),
}

export const CustomerActivities: Story = {
  render: () => (
    <Space wrap size='large'>
      <ActivityIcon type='visit' tooltip='Customer visit' />
      <ActivityIcon type='purchase' tooltip='Purchase' />
      <ActivityIcon type='order' tooltip='Order placed' />
      <ActivityIcon type='return' tooltip='Return request' />
      <ActivityIcon type='refund' tooltip='Refund processed' />
    </Space>
  ),
}

export const TaskActivities: Story = {
  render: () => (
    <Space wrap size='large'>
      <ActivityIcon type='note' tooltip='Note added' />
      <ActivityIcon type='task' tooltip='Task created' />
      <ActivityIcon type='appointment' tooltip='Appointment scheduled' />
      <ActivityIcon type='reminder' tooltip='Reminder set' />
    </Space>
  ),
}

export const SocialActivities: Story = {
  render: () => (
    <Space wrap size='large'>
      <ActivityIcon type='like' tooltip='Liked' />
      <ActivityIcon type='share' tooltip='Shared' />
      <ActivityIcon type='view' tooltip='Viewed' />
      <ActivityIcon type='comment' tooltip='Commented' />
      <ActivityIcon type='review' tooltip='Reviewed' />
    </Space>
  ),
}

export const Sizes: Story = {
  render: () => (
    <Space wrap align='center' size='large'>
      <ActivityIcon type='call' size='small' tooltip='Small' />
      <ActivityIcon type='call' size='medium' tooltip='Medium' />
      <ActivityIcon type='call' size='large' tooltip='Large' />
      <ActivityIcon type='call' size={32} tooltip='Custom size (32px)' />
    </Space>
  ),
}

export const Variants: Story = {
  render: () => (
    <Space wrap size='large'>
      <ActivityIcon type='call' variant='default' tooltip='Default' />
      <ActivityIcon type='call' variant='primary' tooltip='Primary' />
      <ActivityIcon type='call' variant='success' tooltip='Success' />
      <ActivityIcon type='call' variant='warning' tooltip='Warning' />
      <ActivityIcon type='call' variant='error' tooltip='Error' />
      <ActivityIcon type='call' variant='info' tooltip='Info' />
    </Space>
  ),
}

export const WithBackground: Story = {
  render: () => (
    <Space wrap size='large'>
      <ActivityIcon type='call' showBackground tooltip='Call with background' />
      <ActivityIcon
        type='email'
        showBackground
        tooltip='Email with background'
      />
      <ActivityIcon
        type='meeting'
        showBackground
        tooltip='Meeting with background'
      />
      <ActivityIcon
        type='purchase'
        showBackground
        tooltip='Purchase with background'
      />
      <ActivityIcon type='like' showBackground tooltip='Like with background' />
    </Space>
  ),
}

export const States: Story = {
  render: () => (
    <Space wrap size='large'>
      <ActivityIcon type='call' tooltip='Normal' />
      <ActivityIcon type='call' active tooltip='Active' />
      <ActivityIcon type='call' disabled tooltip='Disabled' />
      <ActivityIcon
        type='call'
        showBackground
        active
        tooltip='Active with background'
      />
    </Space>
  ),
}

export const Interactive: Story = {
  render: () => (
    <Space wrap size='large'>
      <ActivityIcon
        type='call'
        onClick={() => alert('Call clicked!')}
        tooltip='Click to call'
      />
      <ActivityIcon
        type='email'
        onClick={() => alert('Email clicked!')}
        tooltip='Click to email'
      />
      <ActivityIcon
        type='meeting'
        showBackground
        onClick={() => alert('Meeting clicked!')}
        tooltip='Click to schedule meeting'
      />
    </Space>
  ),
}

export const CustomColors: Story = {
  render: () => (
    <Space wrap size='large'>
      <ActivityIcon type='call' color='#ff6b6b' tooltip='Custom red' />
      <ActivityIcon type='email' color='#4ecdc4' tooltip='Custom teal' />
      <ActivityIcon type='meeting' color='#45b7d1' tooltip='Custom blue' />
      <ActivityIcon
        type='purchase'
        color='#96ceb4'
        backgroundColor='#f0f8f0'
        showBackground
        tooltip='Custom colors with background'
      />
    </Space>
  ),
}

export const CRMTimeline: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <ActivityIcon type='call' showBackground />
        <span>Customer called about product inquiry</span>
        <span style={{ marginLeft: 'auto', color: '#666', fontSize: '12px' }}>
          2 hours ago
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <ActivityIcon type='email' showBackground />
        <span>Sent product catalog via email</span>
        <span style={{ marginLeft: 'auto', color: '#666', fontSize: '12px' }}>
          1 hour ago
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <ActivityIcon type='meeting' showBackground />
        <span>Scheduled demo meeting</span>
        <span style={{ marginLeft: 'auto', color: '#666', fontSize: '12px' }}>
          30 minutes ago
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <ActivityIcon type='purchase' showBackground />
        <span>Customer placed order #12345</span>
        <span style={{ marginLeft: 'auto', color: '#666', fontSize: '12px' }}>
          Just now
        </span>
      </div>
    </div>
  ),
}
