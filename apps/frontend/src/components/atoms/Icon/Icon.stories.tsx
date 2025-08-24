/* eslint-disable no-console */
import type { Meta, StoryObj } from '@storybook/react'

import {
  Icon,
  SearchIcon,
  EditIcon,
  DeleteIcon,
  PlusIcon,
  MinusIcon,
  CloseIcon,
  CheckIcon,
  WarningIcon,
  InfoIcon,
  LoadingIcon,
} from './Icon'

const meta: Meta<typeof Icon> = {
  title: 'Atoms/Icon',
  component: Icon,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Icon component for displaying Ant Design icons with consistent sizing, colors, and interactive states.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    name: {
      control: { type: 'select' },
      options: [
        'HomeOutlined',
        'UserOutlined',
        'SettingOutlined',
        'SearchOutlined',
        'EditOutlined',
        'DeleteOutlined',
        'PlusOutlined',
        'MinusOutlined',
        'CloseOutlined',
        'CheckOutlined',
        'WarningOutlined',
        'InfoCircleOutlined',
        'LoadingOutlined',
        'HeartOutlined',
        'StarOutlined',
        'ShoppingCartOutlined',
        'MailOutlined',
        'BellOutlined',
        'DownloadOutlined',
        'UploadOutlined',
      ],
      description: 'Icon name from Ant Design icons',
    },
    size: {
      control: { type: 'select' },
      options: ['xs', 'sm', 'md', 'lg', 'xl', '2xl'],
      description: 'Size of the icon',
    },
    color: {
      control: { type: 'select' },
      options: [
        'default',
        'primary',
        'secondary',
        'success',
        'warning',
        'error',
        'white',
      ],
      description: 'Color variant of the icon',
    },
    spin: {
      control: 'boolean',
      description: 'Whether the icon should spin',
    },
    rotate: {
      control: { type: 'number', min: 0, max: 360, step: 45 },
      description: 'Rotation angle in degrees',
    },
  },
}

export default meta
type Story = StoryObj<typeof Icon>

// Basic Stories
export const Default: Story = {
  args: {
    name: 'HomeOutlined',
  },
}

export const WithClick: Story = {
  args: {
    name: 'SettingOutlined',
    onClick: () => alert('Icon clicked!'),
  },
}

// Size Stories
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <Icon name='StarOutlined' size='xs' />
      <Icon name='StarOutlined' size='sm' />
      <Icon name='StarOutlined' size='md' />
      <Icon name='StarOutlined' size='lg' />
      <Icon name='StarOutlined' size='xl' />
      <Icon name='StarOutlined' size='2xl' />
    </div>
  ),
}

// Color Stories
export const Colors: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <Icon name='HeartOutlined' color='default' size='lg' />
      <Icon name='HeartOutlined' color='primary' size='lg' />
      <Icon name='HeartOutlined' color='secondary' size='lg' />
      <Icon name='HeartOutlined' color='success' size='lg' />
      <Icon name='HeartOutlined' color='warning' size='lg' />
      <Icon name='HeartOutlined' color='error' size='lg' />
    </div>
  ),
}

// On Dark Background
export const OnDarkBackground: Story = {
  render: () => (
    <div
      style={{
        backgroundColor: '#1f2937',
        padding: '24px',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
      }}
    >
      <Icon name='HomeOutlined' color='white' size='lg' />
      <Icon name='UserOutlined' color='white' size='lg' />
      <Icon name='SettingOutlined' color='white' size='lg' />
      <Icon name='BellOutlined' color='white' size='lg' />
    </div>
  ),
}

// Interactive States
export const InteractiveStates: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <Icon
        name='EditOutlined'
        size='lg'
        onClick={() => {
          if (process.env.NODE_ENV === 'development') {
            console.log('Edit clicked')
          }
        }}
      />
      <Icon
        name='DeleteOutlined'
        size='lg'
        color='error'
        onClick={() => {
          if (process.env.NODE_ENV === 'development') {
            console.log('Delete clicked')
          }
        }}
      />
      <Icon
        name='DownloadOutlined'
        size='lg'
        color='primary'
        onClick={() => {
          if (process.env.NODE_ENV === 'development') {
            console.log('Download clicked')
          }
        }}
      />
      <Icon
        name='UploadOutlined'
        size='lg'
        color='success'
        onClick={() => {
          if (process.env.NODE_ENV === 'development') {
            console.log('Upload clicked')
          }
        }}
      />
    </div>
  ),
}

// Spinning Icons
export const SpinningIcons: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <Icon name='LoadingOutlined' spin size='lg' />
      <Icon name='SettingOutlined' spin size='lg' color='primary' />
      <Icon name='ReloadOutlined' spin size='lg' color='success' />
    </div>
  ),
}

// Rotated Icons
export const RotatedIcons: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <Icon name='ArrowUpOutlined' rotate={0} size='lg' />
      <Icon name='ArrowUpOutlined' rotate={45} size='lg' />
      <Icon name='ArrowUpOutlined' rotate={90} size='lg' />
      <Icon name='ArrowUpOutlined' rotate={135} size='lg' />
      <Icon name='ArrowUpOutlined' rotate={180} size='lg' />
      <Icon name='ArrowUpOutlined' rotate={225} size='lg' />
      <Icon name='ArrowUpOutlined' rotate={270} size='lg' />
      <Icon name='ArrowUpOutlined' rotate={315} size='lg' />
    </div>
  ),
}

// Common Icon Set
export const CommonIcons: Story = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        gap: '16px',
        alignItems: 'center',
        justifyItems: 'center',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <Icon name='HomeOutlined' size='lg' />
        <div style={{ fontSize: '12px', marginTop: '4px' }}>Home</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <Icon name='UserOutlined' size='lg' />
        <div style={{ fontSize: '12px', marginTop: '4px' }}>User</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <Icon name='SettingOutlined' size='lg' />
        <div style={{ fontSize: '12px', marginTop: '4px' }}>Settings</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <Icon name='SearchOutlined' size='lg' />
        <div style={{ fontSize: '12px', marginTop: '4px' }}>Search</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <Icon name='BellOutlined' size='lg' />
        <div style={{ fontSize: '12px', marginTop: '4px' }}>Notifications</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <Icon name='MailOutlined' size='lg' />
        <div style={{ fontSize: '12px', marginTop: '4px' }}>Mail</div>
      </div>
    </div>
  ),
}

// Predefined Icon Components
export const PredefinedIcons: Story = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '16px',
        alignItems: 'center',
        justifyItems: 'center',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <SearchIcon size='lg' />
        <div style={{ fontSize: '12px', marginTop: '4px' }}>SearchIcon</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <EditIcon size='lg' color='primary' />
        <div style={{ fontSize: '12px', marginTop: '4px' }}>EditIcon</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <DeleteIcon size='lg' color='error' />
        <div style={{ fontSize: '12px', marginTop: '4px' }}>DeleteIcon</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <PlusIcon size='lg' color='success' />
        <div style={{ fontSize: '12px', marginTop: '4px' }}>PlusIcon</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <MinusIcon size='lg' color='warning' />
        <div style={{ fontSize: '12px', marginTop: '4px' }}>MinusIcon</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <CloseIcon size='lg' />
        <div style={{ fontSize: '12px', marginTop: '4px' }}>CloseIcon</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <CheckIcon size='lg' color='success' />
        <div style={{ fontSize: '12px', marginTop: '4px' }}>CheckIcon</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <WarningIcon size='lg' color='warning' />
        <div style={{ fontSize: '12px', marginTop: '4px' }}>WarningIcon</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <InfoIcon size='lg' color='primary' />
        <div style={{ fontSize: '12px', marginTop: '4px' }}>InfoIcon</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <LoadingIcon size='lg' />
        <div style={{ fontSize: '12px', marginTop: '4px' }}>LoadingIcon</div>
      </div>
    </div>
  ),
}

// Status Icons
export const StatusIcons: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <CheckIcon color='success' size='md' />
        <span>Success state</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <WarningIcon color='warning' size='md' />
        <span>Warning state</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <CloseIcon color='error' size='md' />
        <span>Error state</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <InfoIcon color='primary' size='md' />
        <span>Info state</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <LoadingIcon color='default' size='md' />
        <span>Loading state</span>
      </div>
    </div>
  ),
}

// Interactive Example
export const Interactive: Story = {
  args: {
    name: 'StarOutlined',
    size: 'lg',
    color: 'primary',
    spin: false,
    rotate: 0,
  },
}
