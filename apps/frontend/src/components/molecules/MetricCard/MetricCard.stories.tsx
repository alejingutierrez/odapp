import {
  DollarOutlined,
  ShoppingOutlined,
  UserOutlined,
  RiseOutlined,
} from '@ant-design/icons'
import type { Meta, StoryObj } from '@storybook/react'

import { MetricCard } from './MetricCard'

const meta: Meta<typeof MetricCard> = {
  title: 'Molecules/MetricCard',
  component: MetricCard,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A metric card for displaying KPIs with trends, progress, and comparisons.',
      },
    },
  },
  argTypes: {
    onClick: { action: 'card clicked' },
    size: {
      control: { type: 'select' },
      options: ['small', 'default', 'large'],
    },
    color: {
      control: { type: 'select' },
      options: ['primary', 'success', 'warning', 'error', 'default'],
    },
  },
}

export default meta
type Story = StoryObj<typeof MetricCard>

export const Revenue: Story = {
  args: {
    title: 'Total Revenue',
    value: '$124,563',
    subtitle: 'This month',
    icon: <DollarOutlined />,
    trend: {
      value: 12.5,
      period: 'last month',
      isPositive: true,
    },
    color: 'success',
  },
}

export const Orders: Story = {
  args: {
    title: 'Total Orders',
    value: 1247,
    subtitle: 'This week',
    icon: <ShoppingOutlined />,
    trend: {
      value: -3.2,
      period: 'last week',
      isPositive: false,
    },
    color: 'primary',
  },
}

export const Customers: Story = {
  args: {
    title: 'Active Customers',
    value: 8924,
    subtitle: 'Registered users',
    icon: <UserOutlined />,
    trend: {
      value: 8.7,
      period: 'last month',
      isPositive: true,
    },
    color: 'default',
  },
}

export const WithProgress: Story = {
  args: {
    title: 'Sales Target',
    value: '$89,432',
    subtitle: 'of $120,000 goal',
    icon: <RiseOutlined />,
    progress: {
      percent: 74.5,
      status: 'active',
    },
    color: 'warning',
  },
}

export const Small: Story = {
  args: {
    title: 'Conversion Rate',
    value: '3.24%',
    icon: <RiseOutlined />,
    trend: {
      value: 0.8,
      period: 'yesterday',
    },
    size: 'small',
    color: 'success',
  },
}

export const Large: Story = {
  args: {
    title: 'Monthly Revenue',
    value: '$1,234,567',
    subtitle: 'January 2024',
    icon: <DollarOutlined />,
    trend: {
      value: 23.4,
      period: 'last month',
      isPositive: true,
    },
    progress: {
      percent: 89,
      status: 'success',
    },
    size: 'large',
    color: 'primary',
  },
}

export const Loading: Story = {
  args: {
    title: 'Loading Metric',
    value: '---',
    icon: <DollarOutlined />,
    loading: true,
  },
}

export const Clickable: Story = {
  args: {
    title: 'Click Me',
    value: '$45,678',
    subtitle: 'Interactive card',
    icon: <DollarOutlined />,
    onClick: () => {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('Metric card clicked!')
      }
    },
    color: 'primary',
  },
}

export const Error: Story = {
  args: {
    title: 'Failed Orders',
    value: 23,
    subtitle: 'Requires attention',
    icon: <ShoppingOutlined />,
    trend: {
      value: 15.2,
      period: 'yesterday',
      isPositive: false,
    },
    color: 'error',
  },
}
