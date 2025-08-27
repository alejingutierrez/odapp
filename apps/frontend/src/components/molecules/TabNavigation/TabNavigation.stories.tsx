import type { Meta, StoryObj } from '@storybook/react'
import React, { useState } from 'react'
import {
  HomeOutlined,
  UserOutlined,
  SettingOutlined,
  FileTextOutlined,
  ShoppingOutlined,
  BarChartOutlined,
  BellOutlined,
  HeartOutlined,
} from '@ant-design/icons'
import { Typography, Card, List, Avatar, Button, Space } from 'antd'

import { TabNavigation } from './TabNavigation'
import type { TabItem } from './TabNavigation'

const meta: Meta<typeof TabNavigation> = {
  title: 'Molecules/TabNavigation',
  component: TabNavigation,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A tab navigation component that provides organized content navigation with support for icons, badges, tooltips, and different tab types. Perfect for organizing complex content into logical sections.',
      },

    },
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: { type: 'select' },
      options: ['line', 'card', 'editable-card'],
    },
    size: {
      control: { type: 'select' },
      options: ['small', 'middle', 'large'],
    },
    position: {
      control: { type: 'select' },
      options: ['top', 'bottom', 'left', 'right'],
    },
    centered: { control: 'boolean' },
    animated: { control: 'boolean' },
    destroyOnHidden: { control: 'boolean' },
  },
  decorators: [
    (Story) => (
      <div style={{ padding: '20px', maxWidth: '800px' }}>
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof TabNavigation>

const basicItems: TabItem[] = [
  {
    key: 'home',
    label: 'Home',
    icon: <HomeOutlined />,
    content: (
      <div style={{ padding: '20px' }}>
        <Typography.Title level={3}>Welcome to Dashboard</Typography.Title>
        <Typography.Paragraph>
          This is the home tab content. Here you can see an overview of your application.
        </Typography.Paragraph>
      </div>
    ),
  },
  {
    key: 'profile',
    label: 'Profile',
    icon: <UserOutlined />,
    content: (
      <div style={{ padding: '20px' }}>
        <Typography.Title level={3}>User Profile</Typography.Title>
        <Typography.Paragraph>
          Manage your profile settings and personal information here.
        </Typography.Paragraph>
      </div>
    ),
  },
  {
    key: 'settings',
    label: 'Settings',
    icon: <SettingOutlined />,
    content: (
      <div style={{ padding: '20px' }}>
        <Typography.Title level={3}>Application Settings</Typography.Title>
        <Typography.Paragraph>
          Configure your application preferences and system settings.
        </Typography.Paragraph>
      </div>
    ),
  },
]

const itemsWithBadges: TabItem[] = [
  {
    key: 'orders',
    label: 'Orders',
    icon: <ShoppingOutlined />,
    badge: 5,
    content: (
      <div style={{ padding: '20px' }}>
        <Typography.Title level={3}>Recent Orders</Typography.Title>
        <List
          dataSource={[
            { id: '1', title: 'Order #12345', status: 'Processing' },
            { id: '2', title: 'Order #12346', status: 'Shipped' },
            { id: '3', title: 'Order #12347', status: 'Delivered' },
          ]}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                title={item.title}
                description={`Status: ${item.status}`}
              />
            </List.Item>
          )}
        />
      </div>
    ),
  },
  {
    key: 'analytics',
    label: 'Analytics',
    icon: <BarChartOutlined />,
    badge: 'New',
    content: (
      <div style={{ padding: '20px' }}>
        <Typography.Title level={3}>Analytics Dashboard</Typography.Title>
        <Typography.Paragraph>
          View detailed analytics and performance metrics.
        </Typography.Paragraph>
      </div>
    ),
  },
  {
    key: 'notifications',
    label: 'Notifications',
    icon: <BellOutlined />,
    badge: 12,
    content: (
      <div style={{ padding: '20px' }}>
        <Typography.Title level={3}>Notifications</Typography.Title>
        <List
          dataSource={[
            { id: '1', title: 'New order received', time: '2 minutes ago' },
            { id: '2', title: 'Payment processed', time: '1 hour ago' },
            { id: '3', title: 'System update', time: '3 hours ago' },
          ]}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                title={item.title}
                description={item.time}
              />
            </List.Item>
          )}
        />
      </div>
    ),
  },
]

const itemsWithTooltips: TabItem[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: <HomeOutlined />,
    tooltip: 'Main dashboard with overview metrics',
    content: (
      <div style={{ padding: '20px' }}>
        <Typography.Title level={3}>Dashboard Overview</Typography.Title>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <Card title="Total Sales" size="small">
            <Typography.Title level={2}>$12,345</Typography.Title>
          </Card>
          <Card title="Orders" size="small">
            <Typography.Title level={2}>156</Typography.Title>
          </Card>
          <Card title="Customers" size="small">
            <Typography.Title level={2}>89</Typography.Title>
          </Card>
        </div>
      </div>
    ),
  },
  {
    key: 'favorites',
    label: 'Favorites',
    icon: <HeartOutlined />,
    tooltip: 'Your saved and favorite items',
    content: (
      <div style={{ padding: '20px' }}>
        <Typography.Title level={3}>Favorite Items</Typography.Title>
        <Typography.Paragraph>
          View and manage your favorite products and items.
        </Typography.Paragraph>
      </div>
    ),
  },
]

const editableItems: TabItem[] = [
  {
    key: 'tab1',
    label: 'Tab 1',
    closable: true,
    content: (
      <div style={{ padding: '20px' }}>
        <Typography.Title level={3}>Editable Tab 1</Typography.Title>
        <Typography.Paragraph>
          This tab can be closed. Try clicking the X button.
        </Typography.Paragraph>
      </div>
    ),
  },
  {
    key: 'tab2',
    label: 'Tab 2',
    closable: true,
    content: (
      <div style={{ padding: '20px' }}>
        <Typography.Title level={3}>Editable Tab 2</Typography.Title>
        <Typography.Paragraph>
          Another closable tab for demonstration.
        </Typography.Paragraph>
      </div>
    ),
  },
]

export const Default: Story = {
  args: {
    items: basicItems,
  },
}

export const WithBadges: Story = {
  args: {
    items: itemsWithBadges,
  },
}

export const WithTooltips: Story = {
  args: {
    items: itemsWithTooltips,
  },
}

export const CardType: Story = {
  args: {
    items: basicItems,
    type: 'card',
  },
}

export const EditableCards: Story = {
  args: {
    items: editableItems,
    type: 'editable-card',
  },
}

export const SmallSize: Story = {
  args: {
    items: basicItems,
    size: 'small',
  },
}

export const LargeSize: Story = {
  args: {
    items: basicItems,
    size: 'large',
  },
}

export const Centered: Story = {
  args: {
    items: basicItems,
    centered: true,
  },
}

export const LeftPosition: Story = {
  args: {
    items: basicItems,
    position: 'left',
  },
}

export const RightPosition: Story = {
  args: {
    items: basicItems,
    position: 'right',
  },
}

export const BottomPosition: Story = {
  args: {
    items: basicItems,
    position: 'bottom',
  },
}

export const WithoutAnimation: Story = {
  args: {
    items: basicItems,
    animated: false,
  },
}

export const DestroyOnHidden: Story = {
  args: {
    items: basicItems,
    destroyOnHidden: true,
  },
}

export const DisabledTab: Story = {
  args: {
    items: [
      ...basicItems,
      {
        key: 'disabled',
        label: 'Disabled',
        icon: <SettingOutlined />,
        disabled: true,
        content: (
          <div style={{ padding: '20px' }}>
            <Typography.Title level={3}>Disabled Tab</Typography.Title>
            <Typography.Paragraph>
              This tab is disabled and cannot be accessed.
            </Typography.Paragraph>
          </div>
        ),
      },
    ],
  },
}

export const Interactive: Story = {
  render: (args) => {
    const [activeKey, setActiveKey] = useState('home')
    const [items, setItems] = useState(editableItems)

    const handleChange = (key: string) => {
      setActiveKey(key)
      console.log('Active tab changed to:', key)
    }

    const handleEdit = (targetKey: React.MouseEvent | React.KeyboardEvent | string, action: 'add' | 'remove') => {
      if (action === 'remove') {
        const newItems = items.filter(item => item.key !== targetKey)
        setItems(newItems)
        if (activeKey === targetKey) {
          setActiveKey(newItems[0]?.key || '')
        }
      } else if (action === 'add') {
        const newKey = `tab${items.length + 1}`
        const newItem: TabItem = {
          key: newKey,
          label: `New Tab ${items.length + 1}`,
          closable: true,
          content: (
            <div style={{ padding: '20px' }}>
              <Typography.Title level={3}>New Tab {items.length + 1}</Typography.Title>
              <Typography.Paragraph>
                This is a dynamically added tab.
              </Typography.Paragraph>
            </div>
          ),
        }
        setItems([...items, newItem])
        setActiveKey(newKey)
      }
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <TabNavigation
          {...args}
          items={items}
          activeKey={activeKey}
          onChange={handleChange}
          onEdit={handleEdit}
          type="editable-card"
        />
        <div style={{ fontSize: '14px', color: '#666' }}>
          <div>Active tab: {activeKey}</div>
          <div>Total tabs: {items.length}</div>
          <div>Click the + button to add a new tab, or X to remove tabs</div>
        </div>
      </div>
    )
  },
}

export const ComplexExample: Story = {
  render: () => {
    const [activeKey, setActiveKey] = useState('dashboard')

    const complexItems: TabItem[] = [
      {
        key: 'dashboard',
        label: 'Dashboard',
        icon: <HomeOutlined />,
        badge: 3,
        tooltip: 'Main dashboard with key metrics',
        content: (
          <div style={{ padding: '20px' }}>
            <Typography.Title level={3}>Dashboard Overview</Typography.Title>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              <Card title="Revenue" size="small">
                <Typography.Title level={2} style={{ color: '#52c41a' }}>$45,678</Typography.Title>
              </Card>
              <Card title="Orders" size="small">
                <Typography.Title level={2} style={{ color: '#1890ff' }}>234</Typography.Title>
              </Card>
              <Card title="Customers" size="small">
                <Typography.Title level={2} style={{ color: '#722ed1' }}>156</Typography.Title>
              </Card>
            </div>
            <Typography.Paragraph>
              Welcome to your dashboard. Here you can see an overview of your business metrics and recent activity.
            </Typography.Paragraph>
          </div>
        ),
      },
      {
        key: 'analytics',
        label: 'Analytics',
        icon: <BarChartOutlined />,
        badge: 'New',
        tooltip: 'Detailed analytics and reports',
        content: (
          <div style={{ padding: '20px' }}>
            <Typography.Title level={3}>Analytics & Reports</Typography.Title>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Card title="Sales Trend" size="small">
                <Typography.Paragraph>
                  Chart showing sales trend over the last 30 days
                </Typography.Paragraph>
              </Card>
              <Card title="Top Products" size="small">
                <List
                  size="small"
                  dataSource={[
                    { name: 'Product A', sales: 1234 },
                    { name: 'Product B', sales: 987 },
                    { name: 'Product C', sales: 756 },
                  ]}
                  renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta
                        title={item.name}
                        description={`${item.sales} units sold`}
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </Space>
          </div>
        ),
      },
      {
        key: 'settings',
        label: 'Settings',
        icon: <SettingOutlined />,
        tooltip: 'Application configuration',
        content: (
          <div style={{ padding: '20px' }}>
            <Typography.Title level={3}>Application Settings</Typography.Title>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Card title="General Settings" size="small">
                <Space direction="vertical">
                  <Button type="primary">Save Settings</Button>
                  <Button>Reset to Default</Button>
                </Space>
              </Card>
              <Card title="Notifications" size="small">
                <Typography.Paragraph>
                  Configure your notification preferences and alerts.
                </Typography.Paragraph>
              </Card>
            </Space>
          </div>
        ),
      },
    ]

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <TabNavigation
          items={complexItems}
          activeKey={activeKey}
          onChange={setActiveKey}
          type="card"
          size="large"
        />
        <div style={{ fontSize: '14px', color: '#666' }}>
          <div>Current tab: {activeKey}</div>
          <div>This example shows tabs with rich content, badges, and tooltips</div>
        </div>
      </div>
    )
  },
}
