import {
  DownOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
} from '@ant-design/icons'
import type { Meta, StoryObj } from '@storybook/react'
import { Dropdown, type MenuProps } from 'antd'

import { Button } from '../Button/Button'

const meta: Meta<typeof Dropdown> = {
  title: 'Atoms/Dropdown',
  component: Dropdown,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    placement: {
      control: 'select',
      options: [
        'bottomLeft',
        'bottomCenter',
        'bottomRight',
        'topLeft',
        'topCenter',
        'topRight',
      ],
    },
    trigger: {
      control: 'select',
      options: ['hover', 'click', 'contextMenu'],
    },
    disabled: {
      control: 'boolean',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

const menuItems: MenuProps['items'] = [
  {
    key: '1',
    label: 'Profile',
    icon: <UserOutlined />,
  },
  {
    key: '2',
    label: 'Settings',
    icon: <SettingOutlined />,
  },
  {
    type: 'divider',
  },
  {
    key: '3',
    label: 'Logout',
    icon: <LogoutOutlined />,
    danger: true,
  },
]

export const Default: Story = {
  args: {
    menu: { items: menuItems },
    children: (
      <Button>
        Actions <DownOutlined />
      </Button>
    ),
  },
}

export const HoverTrigger: Story = {
  args: {
    menu: { items: menuItems },
    trigger: ['hover'],
    children: (
      <Button>
        Hover me <DownOutlined />
      </Button>
    ),
  },
}

export const Placements: Story = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '16px',
        padding: '50px',
      }}
    >
      <Dropdown menu={{ items: menuItems }} placement='topLeft'>
        <Button>Top Left</Button>
      </Dropdown>
      <Dropdown menu={{ items: menuItems }} placement='topCenter'>
        <Button>Top Center</Button>
      </Dropdown>
      <Dropdown menu={{ items: menuItems }} placement='topRight'>
        <Button>Top Right</Button>
      </Dropdown>
      <Dropdown menu={{ items: menuItems }} placement='bottomLeft'>
        <Button>Bottom Left</Button>
      </Dropdown>
      <Dropdown menu={{ items: menuItems }} placement='bottomCenter'>
        <Button>Bottom Center</Button>
      </Dropdown>
      <Dropdown menu={{ items: menuItems }} placement='bottomRight'>
        <Button>Bottom Right</Button>
      </Dropdown>
    </div>
  ),
}

export const WithSubmenus: Story = {
  args: {
    menu: {
      items: [
        {
          key: '1',
          label: 'Navigation',
          children: [
            { key: '1-1', label: 'Dashboard' },
            { key: '1-2', label: 'Projects' },
            { key: '1-3', label: 'Tasks' },
          ],
        },
        {
          key: '2',
          label: 'Account',
          children: [
            { key: '2-1', label: 'Profile' },
            { key: '2-2', label: 'Settings' },
            { key: '2-3', label: 'Billing' },
          ],
        },
      ],
    },
    children: (
      <Button>
        Menu with Submenus <DownOutlined />
      </Button>
    ),
  },
}

export const Disabled: Story = {
  args: {
    menu: { items: menuItems },
    disabled: true,
    children: (
      <Button disabled>
        Disabled Dropdown <DownOutlined />
      </Button>
    ),
  },
}
