import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'

import { ProductBadge } from './ProductBadge'

const meta: Meta<typeof ProductBadge> = {
  title: 'Molecules/ProductBadge',
  component: ProductBadge,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A product badge component that displays various product statuses like sale, new, featured, stock status, and more. Supports different sizes, positions, and animations.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: { type: 'select' },
      options: [
        'sale',
        'new',
        'featured',
        'bestseller',
        'limited',
        'out-of-stock',
        'low-stock',
        'in-stock',
        'pre-order',
        'discontinued',
      ],
    },
    size: {
      control: { type: 'select' },
      options: ['small', 'default', 'large'],
    },
    position: {
      control: { type: 'select' },
      options: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
    },
    animated: { control: 'boolean' },
  },
  decorators: [
    (Story) => (
      <div style={{ padding: '20px', maxWidth: '600px' }}>
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof ProductBadge>

export const Default: Story = {
  args: {
    type: 'sale',
    discount: 25,
  },
}

export const New: Story = {
  args: {
    type: 'new',
  },
}

export const Featured: Story = {
  args: {
    type: 'featured',
  },
}
