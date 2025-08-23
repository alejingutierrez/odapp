import type { Meta, StoryObj } from '@storybook/react'
import { MetricCard } from './MetricCard'
import {
  DollarOutlined,
  UserOutlined,
  ShoppingCartOutlined,
  EyeOutlined,
} from '@ant-design/icons'

const meta: Meta<typeof MetricCard> = {
  title: 'Atoms/MetricCard',
  component: MetricCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    trend: {
      control: 'select',
      options: ['up', 'down', 'neutral'],
    },
    size: {
      control: 'select',
      options: ['small', 'default'],
    },
    bordered: {
      control: 'boolean',
    },
    loading: {
      control: 'boolean',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    title: 'Total Revenue',
    value: 125430,
    prefix: <DollarOutlined />,
  },
}

export const WithTrend: Story = {
  args: {
    title: 'Monthly Sales',
    value: 45230,
    trend: 'up',
    trendValue: '+12.5%',
    prefix: <DollarOutlined />,
  },
}

export const Dashboard: Story = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 16,
        width: 600,
      }}
    >
      <MetricCard
        title='Total Revenue'
        value={125430}
        trend='up'
        trendValue='+8.2%'
        prefix={<DollarOutlined />}
      />
      <MetricCard
        title='Active Users'
        value={2847}
        trend='up'
        trendValue='+15.3%'
        prefix={<UserOutlined />}
      />
      <MetricCard
        title='Orders'
        value={1234}
        trend='down'
        trendValue='-2.1%'
        prefix={<ShoppingCartOutlined />}
      />
      <MetricCard
        title='Page Views'
        value={98765}
        trend='up'
        trendValue='+5.7%'
        prefix={<EyeOutlined />}
      />
    </div>
  ),
}

export const DifferentSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 16 }}>
      <MetricCard
        title='Small Card'
        value={1234}
        size='small'
        trend='up'
        trendValue='+5%'
      />
      <MetricCard
        title='Default Card'
        value={5678}
        size='default'
        trend='down'
        trendValue='-2%'
      />
    </div>
  ),
}

export const WithPrecision: Story = {
  args: {
    title: 'Conversion Rate',
    value: 12.3456,
    precision: 2,
    suffix: '%',
    trend: 'up',
    trendValue: '+0.5%',
  },
}

export const Loading: Story = {
  args: {
    title: 'Loading Data',
    value: 0,
    loading: true,
  },
}

export const Clickable: Story = {
  args: {
    title: 'Clickable Metric',
    value: 9876,
    trend: 'up',
    trendValue: '+3.2%',
    onClick: () => alert('Metric clicked!'),
  },
}

export const WithoutBorder: Story = {
  args: {
    title: 'Borderless',
    value: 5432,
    bordered: false,
    trend: 'neutral',
    trendValue: '0%',
  },
}
