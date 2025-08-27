import type { Meta, StoryObj } from '@storybook/react'
import React, { useState } from 'react'
import {
  DashboardOutlined,
  ShoppingOutlined,
  UserOutlined,
  SettingOutlined,
  FileTextOutlined,
  BarChartOutlined,
  CustomerServiceOutlined,
  BellOutlined,
} from '@ant-design/icons'

import { SidebarMenuItem } from './SidebarMenuItem'
import type { SidebarMenuItemData } from './SidebarMenuItem'

const meta: Meta<typeof SidebarMenuItem> = {
  title: 'Molecules/SidebarMenuItem',
  component: SidebarMenuItem,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A sidebar menu item component that supports nested navigation, badges, icons, and collapsible behavior. Perfect for application navigation and menu systems.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    level: { control: { type: 'number', min: 0, max: 5 } },
    collapsed: { control: 'boolean' },
  },
  decorators: [
    (Story) => (
      <div style={{ padding: '20px', maxWidth: '300px', border: '1px solid #d9d9d9', borderRadius: '6px' }}>
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof SidebarMenuItem>

const dashboardItem: SidebarMenuItemData = {
  key: 'dashboard',
  label: 'Dashboard',
  icon: <DashboardOutlined />,
  onClick: () => console.log('Dashboard clicked'),
}

const productsItem: SidebarMenuItemData = {
  key: 'products',
  label: 'Products',
  icon: <ShoppingOutlined />,
  badge: 12,
  children: [
    {
      key: 'products-list',
      label: 'Product List',
      onClick: () => console.log('Product List clicked'),
    },
    {
      key: 'products-categories',
      label: 'Categories',
      badge: 5,
      onClick: () => console.log('Categories clicked'),
    },
    {
      key: 'products-inventory',
      label: 'Inventory',
      onClick: () => console.log('Inventory clicked'),
    },
  ],
}

const customersItem: SidebarMenuItemData = {
  key: 'customers',
  label: 'Customers',
  icon: <UserOutlined />,
  badge: 'New',
  children: [
    {
      key: 'customers-list',
      label: 'Customer List',
      onClick: () => console.log('Customer List clicked'),
    },
    {
      key: 'customers-groups',
      label: 'Customer Groups',
      onClick: () => console.log('Customer Groups clicked'),
    },
  ],
}

const ordersItem: SidebarMenuItemData = {
  key: 'orders',
  label: 'Orders',
  icon: <FileTextOutlined />,
  badge: 25,
  children: [
    {
      key: 'orders-pending',
      label: 'Pending Orders',
      badge: 8,
      onClick: () => console.log('Pending Orders clicked'),
    },
    {
      key: 'orders-completed',
      label: 'Completed Orders',
      onClick: () => console.log('Completed Orders clicked'),
    },
    {
      key: 'orders-cancelled',
      label: 'Cancelled Orders',
      danger: true,
      onClick: () => console.log('Cancelled Orders clicked'),
    },
  ],
}

const analyticsItem: SidebarMenuItemData = {
  key: 'analytics',
  label: 'Analytics',
  icon: <BarChartOutlined />,
  children: [
    {
      key: 'analytics-sales',
      label: 'Sales Analytics',
      onClick: () => console.log('Sales Analytics clicked'),
    },
    {
      key: 'analytics-customers',
      label: 'Customer Analytics',
      onClick: () => console.log('Customer Analytics clicked'),
    },
    {
      key: 'analytics-products',
      label: 'Product Analytics',
      onClick: () => console.log('Product Analytics clicked'),
    },
  ],
}

const settingsItem: SidebarMenuItemData = {
  key: 'settings',
  label: 'Settings',
  icon: <SettingOutlined />,
  children: [
    {
      key: 'settings-general',
      label: 'General Settings',
      onClick: () => console.log('General Settings clicked'),
    },
    {
      key: 'settings-security',
      label: 'Security',
      onClick: () => console.log('Security clicked'),
    },
    {
      key: 'settings-notifications',
      label: 'Notifications',
      onClick: () => console.log('Notifications clicked'),
    },
  ],
}

const supportItem: SidebarMenuItemData = {
  key: 'support',
  label: 'Support',
  icon: <CustomerServiceOutlined />,
  badge: 3,
  children: [
    {
      key: 'support-tickets',
      label: 'Support Tickets',
      badge: 3,
      onClick: () => console.log('Support Tickets clicked'),
    },
    {
      key: 'support-faq',
      label: 'FAQ',
      onClick: () => console.log('FAQ clicked'),
    },
  ],
}

const notificationsItem: SidebarMenuItemData = {
  key: 'notifications',
  label: 'Notifications',
  icon: <BellOutlined />,
  badge: 7,
  onClick: () => console.log('Notifications clicked'),
}

const disabledItem: SidebarMenuItemData = {
  key: 'disabled',
  label: 'Disabled Item',
  icon: <DashboardOutlined />,
  disabled: true,
  onClick: () => console.log('This should not be called'),
}

export const Default: Story = {
  args: {
    item: dashboardItem,
  },
}

export const WithBadge: Story = {
  args: {
    item: notificationsItem,
  },
}

export const WithChildren: Story = {
  args: {
    item: productsItem,
  },
}

export const NestedChildren: Story = {
  args: {
    item: ordersItem,
  },
}

export const Collapsed: Story = {
  args: {
    item: dashboardItem,
    collapsed: true,
  },
}

export const CollapsedWithTooltip: Story = {
  args: {
    item: {
      ...dashboardItem,
      tooltip: 'Dashboard - View your main dashboard',
    },
    collapsed: true,
  },
}

export const Selected: Story = {
  args: {
    item: dashboardItem,
    selectedKeys: ['dashboard'],
  },
}

export const OpenWithChildren: Story = {
  args: {
    item: productsItem,
    openKeys: ['products'],
  },
}

export const Disabled: Story = {
  args: {
    item: disabledItem,
  },
}

export const Danger: Story = {
  args: {
    item: {
      key: 'danger',
      label: 'Danger Zone',
      icon: <SettingOutlined />,
      danger: true,
      onClick: () => console.log('Danger clicked'),
    },
  },
}

export const Level2: Story = {
  args: {
    item: {
      key: 'sub-item',
      label: 'Sub Menu Item',
      level: 1,
      onClick: () => console.log('Sub item clicked'),
    },
    level: 1,
  },
}

export const Level3: Story = {
  args: {
    item: {
      key: 'sub-sub-item',
      label: 'Deep Nested Item',
      level: 2,
      onClick: () => console.log('Deep nested item clicked'),
    },
    level: 2,
  },
}

export const Interactive: Story = {
  render: (args) => {
    const [selectedKeys, setSelectedKeys] = useState<string[]>([])
    const [openKeys, setOpenKeys] = useState<string[]>([])

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <SidebarMenuItem
          {...args}
          selectedKeys={selectedKeys}
          openKeys={openKeys}
          onSelect={setSelectedKeys}
          onOpenChange={setOpenKeys}
        />
        <div style={{ fontSize: '14px', color: '#666' }}>
          <div>Selected: {selectedKeys.join(', ') || 'None'}</div>
          <div>Open: {openKeys.join(', ') || 'None'}</div>
        </div>
      </div>
    )
  },
  args: {
    item: productsItem,
  },
}

export const ComplexExample: Story = {
  render: (args) => {
    const [selectedKeys, setSelectedKeys] = useState<string[]>([])
    const [openKeys, setOpenKeys] = useState<string[]>([])

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <SidebarMenuItem
          item={dashboardItem}
          selectedKeys={selectedKeys}
          openKeys={openKeys}
          onSelect={setSelectedKeys}
          onOpenChange={setOpenKeys}
        />
        <SidebarMenuItem
          item={productsItem}
          selectedKeys={selectedKeys}
          openKeys={openKeys}
          onSelect={setSelectedKeys}
          onOpenChange={setOpenKeys}
        />
        <SidebarMenuItem
          item={customersItem}
          selectedKeys={selectedKeys}
          openKeys={openKeys}
          onSelect={setSelectedKeys}
          onOpenChange={setOpenKeys}
        />
        <SidebarMenuItem
          item={ordersItem}
          selectedKeys={selectedKeys}
          openKeys={openKeys}
          onSelect={setSelectedKeys}
          onOpenChange={setOpenKeys}
        />
        <SidebarMenuItem
          item={analyticsItem}
          selectedKeys={selectedKeys}
          openKeys={openKeys}
          onSelect={setSelectedKeys}
          onOpenChange={setOpenKeys}
        />
        <SidebarMenuItem
          item={settingsItem}
          selectedKeys={selectedKeys}
          openKeys={openKeys}
          onSelect={setSelectedKeys}
          onOpenChange={setOpenKeys}
        />
        <SidebarMenuItem
          item={supportItem}
          selectedKeys={selectedKeys}
          openKeys={openKeys}
          onSelect={setSelectedKeys}
          onOpenChange={setOpenKeys}
        />
        <SidebarMenuItem
          item={notificationsItem}
          selectedKeys={selectedKeys}
          openKeys={openKeys}
          onSelect={setSelectedKeys}
          onOpenChange={setOpenKeys}
        />
        <SidebarMenuItem
          item={disabledItem}
          selectedKeys={selectedKeys}
          openKeys={openKeys}
          onSelect={setSelectedKeys}
          onOpenChange={setOpenKeys}
        />
      </div>
    )
  },
}

export const CollapsedMenu: Story = {
  render: (args) => {
    const [selectedKeys, setSelectedKeys] = useState<string[]>([])
    const [openKeys, setOpenKeys] = useState<string[]>([])

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <SidebarMenuItem
          item={dashboardItem}
          collapsed={true}
          selectedKeys={selectedKeys}
          openKeys={openKeys}
          onSelect={setSelectedKeys}
          onOpenChange={setOpenKeys}
        />
        <SidebarMenuItem
          item={productsItem}
          collapsed={true}
          selectedKeys={selectedKeys}
          openKeys={openKeys}
          onSelect={setSelectedKeys}
          onOpenChange={setOpenKeys}
        />
        <SidebarMenuItem
          item={notificationsItem}
          collapsed={true}
          selectedKeys={selectedKeys}
          openKeys={openKeys}
          onSelect={setSelectedKeys}
          onOpenChange={setOpenKeys}
        />
      </div>
    )
  },
}
