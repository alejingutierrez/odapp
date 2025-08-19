import type { Meta, StoryObj } from '@storybook/react'
import { Space } from 'antd'
import { TagOutlined, UserOutlined, StarOutlined } from '@ant-design/icons'
import { Chip } from './Chip'

const meta: Meta<typeof Chip> = {
  title: 'Atoms/Chip',
  component: Chip,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A versatile chip component for tags, filters, and removable items with various styles for fashion ERP systems.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'primary', 'secondary', 'success', 'warning', 'error', 'info'],
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
    context: {
      control: 'select',
      options: ['filter', 'tag', 'status', 'category'],
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    label: 'Fashion Tag',
  },
}

export const Variants: Story = {
  render: () => (
    <Space wrap>
      <Chip label="Default" variant="default" />
      <Chip label="Primary" variant="primary" />
      <Chip label="Secondary" variant="secondary" />
      <Chip label="Success" variant="success" />
      <Chip label="Warning" variant="warning" />
      <Chip label="Error" variant="error" />
      <Chip label="Info" variant="info" />
    </Space>
  ),
}

export const Sizes: Story = {
  render: () => (
    <Space wrap align="center">
      <Chip label="Small" size="small" variant="primary" />
      <Chip label="Medium" size="medium" variant="primary" />
      <Chip label="Large" size="large" variant="primary" />
    </Space>
  ),
}

export const WithIcons: Story = {
  render: () => (
    <Space wrap>
      <Chip label="Tagged" icon={<TagOutlined />} variant="primary" />
      <Chip label="User" icon={<UserOutlined />} variant="secondary" />
      <Chip label="Featured" icon={<StarOutlined />} variant="warning" />
    </Space>
  ),
}

export const Removable: Story = {
  render: () => (
    <Space wrap>
      <Chip 
        label="Removable Tag" 
        removable 
        variant="primary"
        onRemove={() => console.log('Removed!')}
      />
      <Chip 
        label="With Icon" 
        icon={<TagOutlined />}
        removable 
        variant="success"
        onRemove={() => console.log('Removed with icon!')}
      />
    </Space>
  ),
}

export const Clickable: Story = {
  render: () => (
    <Space wrap>
      <Chip 
        label="Clickable" 
        variant="primary"
        onClick={() => console.log('Clicked!')}
      />
      <Chip 
        label="Selected" 
        variant="primary"
        selected
        onClick={() => console.log('Selected clicked!')}
      />
    </Space>
  ),
}

export const Contexts: Story = {
  render: () => (
    <Space wrap>
      <Chip label="Filter Chip" context="filter" variant="primary" />
      <Chip label="Tag Chip" context="tag" variant="secondary" />
      <Chip label="Active Status" context="status" variant="success" />
      <Chip label="Category" context="category" variant="info" />
    </Space>
  ),
}

export const States: Story = {
  render: () => (
    <Space wrap>
      <Chip label="Normal" variant="primary" />
      <Chip label="Selected" variant="primary" selected />
      <Chip label="Disabled" variant="primary" disabled />
      <Chip 
        label="Disabled Removable" 
        variant="primary" 
        disabled 
        removable 
        onRemove={() => console.log('Should not fire')}
      />
    </Space>
  ),
}

export const FashionFilters: Story = {
  render: () => (
    <div style={{ maxWidth: '400px' }}>
      <h4>Fashion Filters</h4>
      <Space wrap>
        <Chip label="Dresses" context="filter" variant="primary" removable />
        <Chip label="Size M" context="filter" variant="secondary" removable />
        <Chip label="Red" context="filter" variant="error" removable />
        <Chip label="Cotton" context="filter" variant="success" removable />
        <Chip label="Summer 2024" context="filter" variant="warning" removable />
        <Chip label="Designer" context="filter" variant="info" removable />
      </Space>
    </div>
  ),
}