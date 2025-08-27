import type { Meta, StoryObj } from '@storybook/react'
import {
  FolderOutlined,
  ShoppingOutlined,
  UserOutlined,
  SettingOutlined,
} from '@ant-design/icons'

import { BreadcrumbNav } from './BreadcrumbNav'
import type { BreadcrumbItem } from './BreadcrumbNav'

const meta: Meta<typeof BreadcrumbNav> = {
  title: 'Molecules/BreadcrumbNav',
  component: BreadcrumbNav,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A navigation breadcrumb component that displays the current page hierarchy with optional home link, icons, and overflow handling for long paths.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    maxItems: { control: { type: 'number', min: 3, max: 10 } },
    showHome: { control: 'boolean' },
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
type Story = StoryObj<typeof BreadcrumbNav>

const basicItems: BreadcrumbItem[] = [
  { key: 'products', title: 'Products', href: '/products' },
  { key: 'clothing', title: 'Clothing', href: '/products/clothing' },
  { key: 'tshirts', title: 'T-Shirts', href: '/products/clothing/tshirts' },
]

const itemsWithIcons: BreadcrumbItem[] = [
  {
    key: 'products',
    title: 'Products',
    icon: <ShoppingOutlined />,
    href: '/products',
  },
  {
    key: 'clothing',
    title: 'Clothing',
    icon: <FolderOutlined />,
    href: '/products/clothing',
  },
  {
    key: 'tshirts',
    title: 'T-Shirts',
    icon: <ShoppingOutlined />,
    href: '/products/clothing/tshirts',
  },
]

const longPathItems: BreadcrumbItem[] = [
  { key: 'dashboard', title: 'Dashboard', href: '/dashboard' },
  { key: 'products', title: 'Products', href: '/dashboard/products' },
  { key: 'clothing', title: 'Clothing', href: '/dashboard/products/clothing' },
  { key: 'mens', title: "Men's", href: '/dashboard/products/clothing/mens' },
  {
    key: 'tshirts',
    title: 'T-Shirts',
    href: '/dashboard/products/clothing/mens/tshirts',
  },
  {
    key: 'casual',
    title: 'Casual',
    href: '/dashboard/products/clothing/mens/tshirts/casual',
  },
  {
    key: 'cotton',
    title: 'Cotton',
    href: '/dashboard/products/clothing/mens/tshirts/casual/cotton',
  },
]

const settingsItems: BreadcrumbItem[] = [
  {
    key: 'settings',
    title: 'Settings',
    icon: <SettingOutlined />,
    href: '/settings',
  },
  {
    key: 'account',
    title: 'Account',
    icon: <UserOutlined />,
    href: '/settings/account',
  },
  { key: 'profile', title: 'Profile', href: '/settings/account/profile' },
]

const itemsWithActions: BreadcrumbItem[] = [
  {
    key: 'products',
    title: 'Products',
    onClick: () => console.log('Products clicked'),
  },
  {
    key: 'clothing',
    title: 'Clothing',
    onClick: () => console.log('Clothing clicked'),
  },
  {
    key: 'tshirts',
    title: 'T-Shirts',
    onClick: () => console.log('T-Shirts clicked'),
  },
]

const itemsWithDisabled: BreadcrumbItem[] = [
  { key: 'products', title: 'Products', href: '/products' },
  {
    key: 'clothing',
    title: 'Clothing',
    href: '/products/clothing',
    disabled: true,
  },
  { key: 'tshirts', title: 'T-Shirts', href: '/products/clothing/tshirts' },
]

export const Default: Story = {
  args: {
    items: basicItems,
  },
}

export const WithIcons: Story = {
  args: {
    items: itemsWithIcons,
  },
}

export const WithoutHome: Story = {
  args: {
    items: basicItems,
    showHome: false,
  },
}

export const LongPath: Story = {
  args: {
    items: longPathItems,
    maxItems: 5,
  },
}

export const CustomMaxItems: Story = {
  args: {
    items: longPathItems,
    maxItems: 3,
  },
}

export const SettingsNavigation: Story = {
  args: {
    items: settingsItems,
  },
}

export const WithActions: Story = {
  args: {
    items: itemsWithActions,
  },
}

export const WithDisabledItems: Story = {
  args: {
    items: itemsWithDisabled,
  },
}

export const CustomSeparator: Story = {
  args: {
    items: basicItems,
    separator: '>',
  },
}

export const CustomHomeHref: Story = {
  args: {
    items: basicItems,
    homeHref: '/dashboard',
  },
}

export const MinimalPath: Story = {
  args: {
    items: [{ key: 'products', title: 'Products', href: '/products' }],
  },
}

export const SingleItem: Story = {
  args: {
    items: [{ key: 'current', title: 'Current Page' }],
    showHome: false,
  },
}

export const WithCustomHomeClick: Story = {
  args: {
    items: basicItems,
    onHomeClick: () => console.log('Home clicked'),
  },
}

export const ComplexExample: Story = {
  args: {
    items: [
      {
        key: 'dashboard',
        title: 'Dashboard',
        icon: <UserOutlined />,
        href: '/dashboard',
      },
      {
        key: 'ecommerce',
        title: 'E-commerce',
        icon: <ShoppingOutlined />,
        href: '/dashboard/ecommerce',
      },
      {
        key: 'products',
        title: 'Products',
        icon: <FolderOutlined />,
        href: '/dashboard/ecommerce/products',
      },
      {
        key: 'clothing',
        title: 'Clothing',
        href: '/dashboard/ecommerce/products/clothing',
      },
      {
        key: 'tshirts',
        title: 'T-Shirts',
        href: '/dashboard/ecommerce/products/clothing/tshirts',
      },
      {
        key: 'edit',
        title: 'Edit Product',
        href: '/dashboard/ecommerce/products/clothing/tshirts/edit',
      },
    ],
    maxItems: 4,
  },
}

export const OverflowExample: Story = {
  args: {
    items: [
      { key: 'level1', title: 'Level 1', href: '/level1' },
      { key: 'level2', title: 'Level 2', href: '/level1/level2' },
      { key: 'level3', title: 'Level 3', href: '/level1/level2/level3' },
      { key: 'level4', title: 'Level 4', href: '/level1/level2/level3/level4' },
      {
        key: 'level5',
        title: 'Level 5',
        href: '/level1/level2/level3/level4/level5',
      },
      {
        key: 'level6',
        title: 'Level 6',
        href: '/level1/level2/level3/level4/level5/level6',
      },
      {
        key: 'level7',
        title: 'Level 7',
        href: '/level1/level2/level3/level4/level5/level6/level7',
      },
    ],
    maxItems: 4,
  },
}
