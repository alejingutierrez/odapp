import { InfoCircleOutlined } from '@ant-design/icons'
import type { Meta, StoryObj } from '@storybook/react'
import { Button } from 'antd'

import { Tooltip } from './Tooltip'

const meta: Meta<typeof Tooltip> = {
  title: 'Atoms/Tooltip',
  component: Tooltip,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A flexible tooltip component with positioning, delay, and rich content support for ERP/CRM/CDP systems.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    placement: {
      control: 'select',
      options: [
        'top',
        'topLeft',
        'topRight',
        'bottom',
        'bottomLeft',
        'bottomRight',
        'left',
        'leftTop',
        'leftBottom',
        'right',
        'rightTop',
        'rightBottom',
      ],
    },
    variant: {
      control: 'select',
      options: ['default', 'info', 'warning', 'error', 'success'],
    },
    showDelay: {
      control: { type: 'number', min: 0, max: 2000, step: 100 },
    },
    hideDelay: {
      control: { type: 'number', min: 0, max: 2000, step: 100 },
    },
    maxWidth: {
      control: { type: 'number', min: 100, max: 500, step: 50 },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    content: 'This is a helpful tooltip',
    children: <Button>Hover me</Button>,
  },
}

export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
      <Tooltip content='Default tooltip' variant='default'>
        <Button>Default</Button>
      </Tooltip>
      <Tooltip content='Information tooltip' variant='info'>
        <Button type='primary'>Info</Button>
      </Tooltip>
      <Tooltip content='Warning tooltip' variant='warning'>
        <Button style={{ backgroundColor: '#faad14', borderColor: '#faad14' }}>
          Warning
        </Button>
      </Tooltip>
      <Tooltip content='Error tooltip' variant='error'>
        <Button danger>Error</Button>
      </Tooltip>
      <Tooltip content='Success tooltip' variant='success'>
        <Button style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}>
          Success
        </Button>
      </Tooltip>
    </div>
  ),
}

export const RichContent: Story = {
  args: {
    content: (
      <div>
        <h4>Product Information</h4>
        <p>This product is currently in stock with the following details:</p>
        <ul>
          <li>Available: 150 units</li>
          <li>Price: $29.99</li>
          <li>Category: Fashion</li>
        </ul>
      </div>
    ),
    richContent: true,
    maxWidth: 350,
    children: <Button icon={<InfoCircleOutlined />}>Product Details</Button>,
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
        justifyItems: 'center',
      }}
    >
      <Tooltip content='Top Left' placement='topLeft'>
        <Button>TL</Button>
      </Tooltip>
      <Tooltip content='Top' placement='top'>
        <Button>Top</Button>
      </Tooltip>
      <Tooltip content='Top Right' placement='topRight'>
        <Button>TR</Button>
      </Tooltip>

      <Tooltip content='Left' placement='left'>
        <Button>Left</Button>
      </Tooltip>
      <Button disabled>Center</Button>
      <Tooltip content='Right' placement='right'>
        <Button>Right</Button>
      </Tooltip>

      <Tooltip content='Bottom Left' placement='bottomLeft'>
        <Button>BL</Button>
      </Tooltip>
      <Tooltip content='Bottom' placement='bottom'>
        <Button>Bottom</Button>
      </Tooltip>
      <Tooltip content='Bottom Right' placement='bottomRight'>
        <Button>BR</Button>
      </Tooltip>
    </div>
  ),
}

export const WithDelay: Story = {
  args: {
    content: 'This tooltip appears after 500ms delay',
    showDelay: 500,
    hideDelay: 200,
    children: <Button>Hover with delay</Button>,
  },
}

export const NoArrow: Story = {
  args: {
    content: 'Tooltip without arrow',
    arrow: false,
    children: <Button>No Arrow</Button>,
  },
}
