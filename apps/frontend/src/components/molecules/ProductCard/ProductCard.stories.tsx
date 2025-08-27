/* eslint-disable no-console */
import type { Meta, StoryObj } from '@storybook/react'

import { ProductCard } from './ProductCard'

const meta: Meta<typeof ProductCard> = {
  title: 'Molecules/ProductCard',
  component: ProductCard,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A product card displaying product information, images, pricing, and actions.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onEdit: { action: 'edit clicked' },
    onDelete: { action: 'delete clicked' },
    onView: { action: 'view clicked' },
    onAddToCart: { action: 'add to cart clicked' },
    onToggleFavorite: { action: 'favorite toggled' },
  },
  }

export default meta
type Story = StoryObj<typeof ProductCard>

const sampleProduct = {
  id: '1',
  name: 'Premium Cotton T-Shirt',
  description:
    'Comfortable and stylish cotton t-shirt perfect for everyday wear.',
  images: [
    {
      id: '1',
      url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=300&fit=crop',
      alt: 'Premium Cotton T-Shirt',
      position: 0,
    },
  ],
  variants: [
    {
      id: '1',
      size: 'S',
      color: 'Blue',
      material: 'Cotton',
      price: 29.99,
      compareAtPrice: 39.99,
      sku: 'TSH-001-S-BLU',
      inventory: 15,
    },
    {
      id: '2',
      size: 'M',
      color: 'Blue',
      material: 'Cotton',
      price: 29.99,
      compareAtPrice: 39.99,
      sku: 'TSH-001-M-BLU',
      inventory: 8,
    },
    {
      id: '3',
      size: 'L',
      color: 'Red',
      material: 'Cotton',
      price: 32.99,
      sku: 'TSH-001-L-RED',
      inventory: 3,
    },
  ],
  status: 'active' as const,
  category: 'T-Shirts',
  tags: ['cotton', 'casual', 'summer'],
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-20T14:30:00Z',
}

export const Default: Story = {
  args: {
    product: sampleProduct,
    onEdit: (product) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('Edit product:', product)
      }
    },
    onDelete: (id) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('Delete product:', id)
      }
    },
    onView: (id) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('View product:', id)
      }
    },
  },
  }

export const WithAllActions: Story = {
  args: {
    product: sampleProduct,
    onEdit: (product) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('Edit product:', product)
      }
    },
    onDelete: (id) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('Delete product:', id)
      }
    },
    onView: (id) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('View product:', id)
      }
    },
    onAddToCart: (id) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('Add to cart:', id)
      }
    },
    onToggleFavorite: (id) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('Toggle favorite:', id)
      }
    },
  },
  }

export const Compact: Story = {
  args: {
    product: sampleProduct,
    compact: true,
    onEdit: (product) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('Edit product:', product)
      }
    },
    onView: (id) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('View product:', id)
      }
    },
  },
  }

export const WithInventory: Story = {
  args: {
    product: sampleProduct,
    showInventory: true,
    onEdit: (product) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('Edit product:', product)
      }
    },
    onView: (id) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('View product:', id)
      }
    },
  },
  }

export const OutOfStock: Story = {
  args: {
    product: {
      ...sampleProduct,
      variants: sampleProduct.variants.map((v) => ({ ...v, inventory: 0 })),
    },
    showInventory: true,
    onView: (id) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('View product:', id)
      }
    },
  },
  }

export const Loading: Story = {
  args: {
    product: sampleProduct,
    loading: true,
  },
  }

export const DraftStatus: Story = {
  args: {
    product: {
      ...sampleProduct,
      status: 'draft' as const,
    },
    onEdit: (product) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('Edit product:', product)
      }
    },
    onView: (id) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('View product:', id)
      }
    },
  },
  }
