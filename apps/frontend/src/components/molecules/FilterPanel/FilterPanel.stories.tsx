import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { Checkbox, Slider, Select } from 'antd'

import { FilterPanel } from './FilterPanel'
import type { FilterSection } from './FilterPanel'

const meta: Meta<typeof FilterPanel> = {
  title: 'Molecules/FilterPanel',
  component: FilterPanel,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A collapsible filter panel component that organizes filters into sections with badges, search functionality, and various filter types. Perfect for e-commerce product filtering.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    collapsible: { control: 'boolean' },
    defaultCollapsed: { control: 'boolean' },
    showSearch: { control: 'boolean' },
    showClearAll: { control: 'boolean' },
    showApplyButton: { control: 'boolean' },
  },
  decorators: [
    (Story) => (
      <div style={{ padding: '20px', maxWidth: '400px' }}>
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof FilterPanel>

const categoryOptions = [
  { label: 'T-Shirts', value: 'tshirts' },
  { label: 'Jeans', value: 'jeans' },
  { label: 'Shoes', value: 'shoes' },
  { label: 'Accessories', value: 'accessories' },
]

const sizeOptions = [
  { label: 'XS', value: 'xs' },
  { label: 'S', value: 's' },
  { label: 'M', value: 'm' },
  { label: 'L', value: 'l' },
  { label: 'XL', value: 'xl' },
]

const colorOptions = [
  { label: 'Red', value: 'red' },
  { label: 'Blue', value: 'blue' },
  { label: 'Green', value: 'green' },
  { label: 'Black', value: 'black' },
  { label: 'White', value: 'white' },
]

const basicSections: FilterSection[] = [
  {
    key: 'category',
    title: 'Category',
    content: (
      <Checkbox.Group options={categoryOptions} style={{ display: 'flex', flexDirection: 'column' }} />
    ),
    badge: 2,
  },
  {
    key: 'size',
    title: 'Size',
    content: (
      <Checkbox.Group options={sizeOptions} style={{ display: 'flex', flexDirection: 'column' }} />
    ),
    badge: 3,
  },
  {
    key: 'color',
    title: 'Color',
    content: (
      <Checkbox.Group options={colorOptions} style={{ display: 'flex', flexDirection: 'column' }} />
    ),
    badge: 1,
  },
]

const advancedSections: FilterSection[] = [
  {
    key: 'category',
    title: 'Category',
    content: (
      <Checkbox.Group options={categoryOptions} style={{ display: 'flex', flexDirection: 'column' }} />
    ),
    badge: 2,
  },
  {
    key: 'price',
    title: 'Price Range',
    content: (
      <div style={{ padding: '10px 0' }}>
        <Slider
          range
          min={0}
          max={500}
          defaultValue={[20, 200]}
          marks={{
            0: '$0',
            100: '$100',
            200: '$200',
            300: '$300',
            400: '$400',
            500: '$500',
          }}
        />
      </div>
    ),
    badge: 1,
  },
  {
    key: 'size',
    title: 'Size',
    content: (
      <Checkbox.Group options={sizeOptions} style={{ display: 'flex', flexDirection: 'column' }} />
    ),
    badge: 3,
  },
  {
    key: 'color',
    title: 'Color',
    content: (
      <Checkbox.Group options={colorOptions} style={{ display: 'flex', flexDirection: 'column' }} />
    ),
    badge: 1,
  },
  {
    key: 'brand',
    title: 'Brand',
    content: (
      <Select
        mode="multiple"
        placeholder="Select brands"
        style={{ width: '100%' }}
        options={[
          { label: 'Nike', value: 'nike' },
          { label: 'Adidas', value: 'adidas' },
          { label: 'Puma', value: 'puma' },
          { label: 'Under Armour', value: 'under-armour' },
        ]}
      />
    ),
    badge: 2,
  },
]

const complexSections: FilterSection[] = [
  {
    key: 'search',
    title: 'Search',
    content: (
      <div style={{ padding: '10px 0' }}>
        <input
          type="text"
          placeholder="Search products..."
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #d9d9d9',
            borderRadius: '6px',
          }}
        />
      </div>
    ),
    badge: 0,
  },
  {
    key: 'category',
    title: 'Category',
    content: (
      <Checkbox.Group options={categoryOptions} style={{ display: 'flex', flexDirection: 'column' }} />
    ),
    badge: 2,
  },
  {
    key: 'price',
    title: 'Price Range',
    content: (
      <div style={{ padding: '10px 0' }}>
        <Slider
          range
          min={0}
          max={500}
          defaultValue={[20, 200]}
          marks={{
            0: '$0',
            100: '$100',
            200: '$200',
            300: '$300',
            400: '$400',
            500: '$500',
          }}
        />
      </div>
    ),
    badge: 1,
  },
  {
    key: 'size',
    title: 'Size',
    content: (
      <Checkbox.Group options={sizeOptions} style={{ display: 'flex', flexDirection: 'column' }} />
    ),
    badge: 3,
  },
  {
    key: 'color',
    title: 'Color',
    content: (
      <Checkbox.Group options={colorOptions} style={{ display: 'flex', flexDirection: 'column' }} />
    ),
    badge: 1,
  },
  {
    key: 'brand',
    title: 'Brand',
    content: (
      <Select
        mode="multiple"
        placeholder="Select brands"
        style={{ width: '100%' }}
        options={[
          { label: 'Nike', value: 'nike' },
          { label: 'Adidas', value: 'adidas' },
          { label: 'Puma', value: 'puma' },
          { label: 'Under Armour', value: 'under-armour' },
        ]}
      />
    ),
    badge: 2,
  },
  {
    key: 'rating',
    title: 'Rating',
    content: (
      <div style={{ padding: '10px 0' }}>
        <Checkbox.Group
          options={[
            { label: '4+ Stars', value: '4+' },
            { label: '3+ Stars', value: '3+' },
            { label: '2+ Stars', value: '2+' },
          ]}
          style={{ display: 'flex', flexDirection: 'column' }}
        />
      </div>
    ),
    badge: 1,
  },
]

export const Default: Story = {
  args: {
    title: 'Filters',
    sections: basicSections,
    onApply: (filters) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('Applied filters:', filters)
      }
    },
  },
}

export const Collapsible: Story = {
  args: {
    title: 'Product Filters',
    sections: basicSections,
    collapsible: true,
    defaultCollapsed: false,
    onApply: (filters) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('Applied filters:', filters)
      }
    },
  },
}

export const CollapsedByDefault: Story = {
  args: {
    title: 'Advanced Filters',
    sections: advancedSections,
    collapsible: true,
    defaultCollapsed: true,
    onApply: (filters) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('Applied filters:', filters)
      }
    },
  },
}

export const WithSearch: Story = {
  args: {
    title: 'Search & Filter',
    sections: complexSections,
    showSearch: true,
    onSearch: (searchTerm) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('Search term:', searchTerm)
      }
    },
    onApply: (filters) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('Applied filters:', filters)
      }
    },
  },
}

export const WithClearAll: Story = {
  args: {
    title: 'Product Filters',
    sections: basicSections,
    showClearAll: true,
    onClearAll: () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('Cleared all filters')
      }
    },
    onApply: (filters) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('Applied filters:', filters)
      }
    },
  },
}

export const WithApplyButton: Story = {
  args: {
    title: 'Advanced Filters',
    sections: advancedSections,
    showApplyButton: true,
    onApply: (filters) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('Applied filters:', filters)
      }
    },
  },
}

export const ComplexExample: Story = {
  args: {
    title: 'Complete Filter Panel',
    sections: complexSections,
    collapsible: true,
    defaultCollapsed: false,
    showSearch: true,
    showClearAll: true,
    showApplyButton: true,
    onSearch: (searchTerm) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('Search term:', searchTerm)
      }
    },
    onClearAll: () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('Cleared all filters')
      }
    },
    onApply: (filters) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('Applied filters:', filters)
      }
    },
  },
}

export const MinimalConfiguration: Story = {
  args: {
    title: 'Basic Filters',
    sections: [
      {
        key: 'category',
        title: 'Category',
        content: (
          <Checkbox.Group options={categoryOptions} style={{ display: 'flex', flexDirection: 'column' }} />
        ),
      },
    ],
  },
}

export const NoTitle: Story = {
  args: {
    sections: basicSections,
    onApply: (filters) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('Applied filters:', filters)
      }
    },
  },
}

export const Interactive: Story = {
  args: {
    title: 'Interactive Filters',
    sections: complexSections,
    collapsible: true,
    showSearch: true,
    showClearAll: true,
    showApplyButton: true,
    onSearch: (searchTerm) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('Search term:', searchTerm)
      }
    },
    onClearAll: () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('Cleared all filters')
      }
    },
    onApply: (filters) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('Applied filters:', filters)
      }
    },
  },
}
