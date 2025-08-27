import type { Meta, StoryObj } from '@storybook/react'
import React, { useState } from 'react'

import { ProductVariantSelector } from './ProductVariantSelector'

// Define the type locally to avoid circular imports
interface ProductVariant {
  id: string
  size: string
  color: string
  material: string
  price: number
  compareAtPrice?: number
  sku: string
  inventory: number
}

const meta: Meta<typeof ProductVariantSelector> = {
  title: 'Molecules/ProductVariantSelector',
  component: ProductVariantSelector,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A product variant selector component that allows users to choose different product options like size, color, and material. Supports availability checking and different layouts.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    layout: {
      control: { type: 'select' },
      options: ['horizontal', 'vertical'],
    },
    showLabels: { control: 'boolean' },
    showAvailability: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  decorators: [
    (Story) => (
      <div style={{ padding: '20px', maxWidth: '500px' }}>
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof ProductVariantSelector>

const tshirtVariants: ProductVariant[] = [
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
    color: 'Blue',
    material: 'Cotton',
    price: 29.99,
    compareAtPrice: 39.99,
    sku: 'TSH-001-L-BLU',
    inventory: 0,
  },
  {
    id: '4',
    size: 'S',
    color: 'Red',
    material: 'Cotton',
    price: 29.99,
    compareAtPrice: 39.99,
    sku: 'TSH-001-S-RED',
    inventory: 12,
  },
  {
    id: '5',
    size: 'M',
    color: 'Red',
    material: 'Cotton',
    price: 29.99,
    compareAtPrice: 39.99,
    sku: 'TSH-001-M-RED',
    inventory: 5,
  },
  {
    id: '6',
    size: 'L',
    color: 'Red',
    material: 'Cotton',
    price: 29.99,
    compareAtPrice: 39.99,
    sku: 'TSH-001-L-RED',
    inventory: 3,
  },
]

const jeansVariants: ProductVariant[] = [
  {
    id: '1',
    size: '30',
    color: 'Blue',
    material: 'Denim',
    price: 79.99,
    sku: 'JNS-001-30-BLU',
    inventory: 10,
  },
  {
    id: '2',
    size: '32',
    color: 'Blue',
    material: 'Denim',
    price: 79.99,
    sku: 'JNS-001-32-BLU',
    inventory: 15,
  },
  {
    id: '3',
    size: '34',
    color: 'Blue',
    material: 'Denim',
    price: 79.99,
    sku: 'JNS-001-34-BLU',
    inventory: 8,
  },
  {
    id: '4',
    size: '30',
    color: 'Black',
    material: 'Denim',
    price: 79.99,
    sku: 'JNS-001-30-BLK',
    inventory: 0,
  },
  {
    id: '5',
    size: '32',
    color: 'Black',
    material: 'Denim',
    price: 79.99,
    sku: 'JNS-001-32-BLK',
    inventory: 12,
  },
  {
    id: '6',
    size: '34',
    color: 'Black',
    material: 'Denim',
    price: 79.99,
    sku: 'JNS-001-34-BLK',
    inventory: 6,
  },
]

const sweaterVariants: ProductVariant[] = [
  {
    id: '1',
    size: 'S',
    color: 'Gray',
    material: 'Wool',
    price: 89.99,
    sku: 'SWT-001-S-GRY',
    inventory: 5,
  },
  {
    id: '2',
    size: 'M',
    color: 'Gray',
    material: 'Wool',
    price: 89.99,
    sku: 'SWT-001-M-GRY',
    inventory: 8,
  },
  {
    id: '3',
    size: 'L',
    color: 'Gray',
    material: 'Wool',
    price: 89.99,
    sku: 'SWT-001-L-GRY',
    inventory: 3,
  },
  {
    id: '4',
    size: 'S',
    color: 'Gray',
    material: 'Cotton',
    price: 69.99,
    sku: 'SWT-001-S-GRY-COT',
    inventory: 10,
  },
  {
    id: '5',
    size: 'M',
    color: 'Gray',
    material: 'Cotton',
    price: 69.99,
    sku: 'SWT-001-M-GRY-COT',
    inventory: 15,
  },
  {
    id: '6',
    size: 'L',
    color: 'Gray',
    material: 'Cotton',
    price: 69.99,
    sku: 'SWT-001-L-GRY-COT',
    inventory: 7,
  },
]

export const Default: Story = {
  args: {
    variants: tshirtVariants,
    selectedVariant: tshirtVariants[0],
  },
}

export const HorizontalLayout: Story = {
  args: {
    variants: tshirtVariants,
    selectedVariant: tshirtVariants[0],
    layout: 'horizontal',
  },
}

export const WithoutLabels: Story = {
  args: {
    variants: tshirtVariants,
    selectedVariant: tshirtVariants[0],
    showLabels: false,
  },
}

export const WithoutAvailability: Story = {
  args: {
    variants: tshirtVariants,
    selectedVariant: tshirtVariants[0],
    showAvailability: false,
  },
}

export const Disabled: Story = {
  args: {
    variants: tshirtVariants,
    selectedVariant: tshirtVariants[0],
    disabled: true,
  },
}

export const JeansVariants: Story = {
  args: {
    variants: jeansVariants,
    selectedVariant: jeansVariants[0],
  },
}

export const SweaterVariants: Story = {
  args: {
    variants: sweaterVariants,
    selectedVariant: sweaterVariants[0],
  },
}

export const Interactive: Story = {
  render: (args) => {
    const [selectedVariant, setSelectedVariant] = useState(args.selectedVariant || args.variants[0])

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <ProductVariantSelector
          {...args}
          selectedVariant={selectedVariant}
          onVariantChange={setSelectedVariant}
        />
        <div style={{ fontSize: '14px', color: '#666' }}>
          <div>Selected: {selectedVariant?.size} {selectedVariant?.color} {selectedVariant?.material}</div>
          <div>Price: ${selectedVariant?.price}</div>
          <div>SKU: {selectedVariant?.sku}</div>
          <div>Inventory: {selectedVariant?.inventory}</div>
        </div>
      </div>
    )
  },
  args: {
    variants: tshirtVariants,
  },
}

export const ComplexExample: Story = {
  render: (args) => {
    const [selectedVariant, setSelectedVariant] = useState(args.selectedVariant || args.variants[0])

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <ProductVariantSelector
          {...args}
          selectedVariant={selectedVariant}
          onVariantChange={setSelectedVariant}
        />
        <div style={{ fontSize: '14px', color: '#666' }}>
          <div><strong>Selected Variant:</strong></div>
          <div>Size: {selectedVariant?.size}</div>
          <div>Color: {selectedVariant?.color}</div>
          <div>Material: {selectedVariant?.material}</div>
          <div>Price: ${selectedVariant?.price}</div>
          {selectedVariant?.compareAtPrice && (
            <div>Compare at: ${selectedVariant.compareAtPrice}</div>
          )}
          <div>SKU: {selectedVariant?.sku}</div>
          <div>Available: {selectedVariant?.inventory} units</div>
        </div>
      </div>
    )
  },
  args: {
    variants: tshirtVariants,
  },
}

export const SizeOnly: Story = {
  args: {
    variants: [
      {
        id: '1',
        size: 'S',
        price: 29.99,
        sku: 'TSH-001-S',
        inventory: 15,
      },
      {
        id: '2',
        size: 'M',
        price: 29.99,
        sku: 'TSH-001-M',
        inventory: 8,
      },
      {
        id: '3',
        size: 'L',
        price: 29.99,
        sku: 'TSH-001-L',
        inventory: 0,
      },
    ],
    selectedVariant: {
      id: '1',
      size: 'S',
      price: 29.99,
      sku: 'TSH-001-S',
      inventory: 15,
    },
  },
}

export const ColorOnly: Story = {
  args: {
    variants: [
      {
        id: '1',
        color: 'Blue',
        price: 29.99,
        sku: 'TSH-001-BLU',
        inventory: 15,
      },
      {
        id: '2',
        color: 'Red',
        price: 29.99,
        sku: 'TSH-001-RED',
        inventory: 8,
      },
      {
        id: '3',
        color: 'Green',
        price: 29.99,
        sku: 'TSH-001-GRN',
        inventory: 0,
      },
    ],
    selectedVariant: {
      id: '1',
      color: 'Blue',
      price: 29.99,
      sku: 'TSH-001-BLU',
      inventory: 15,
    },
  },
}
