import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'

import { FilterChip } from './FilterChip'

const meta: Meta<typeof FilterChip> = {
  title: 'Molecules/FilterChip',
  component: FilterChip,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A filter chip component that displays selected filters with optional remove functionality. Used for showing active filters in search and filtering interfaces.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    color: {
      control: { type: 'select' },
      options: ['blue', 'green', 'red', 'orange', 'purple', 'cyan', 'magenta', 'volcano', 'gold', 'lime'],
    },
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
type Story = StoryObj<typeof FilterChip>

export const Default: Story = {
  args: {
    label: 'Category: Electronics',
  },
}

export const WithRemove: Story = {
  args: {
    label: 'Category: Electronics',
    onRemove: () => console.log('Filter removed'),
  },
}

export const Blue: Story = {
  args: {
    label: 'Price: $50-$100',
    color: 'blue',
    onRemove: () => console.log('Filter removed'),
  },
}

export const Green: Story = {
  args: {
    label: 'In Stock',
    color: 'green',
    onRemove: () => console.log('Filter removed'),
  },
}

export const Red: Story = {
  args: {
    label: 'Sale Items',
    color: 'red',
    onRemove: () => console.log('Filter removed'),
  },
}

export const Orange: Story = {
  args: {
    label: 'Brand: Nike',
    color: 'orange',
    onRemove: () => console.log('Filter removed'),
  },
}

export const Purple: Story = {
  args: {
    label: 'Size: Large',
    color: 'purple',
    onRemove: () => console.log('Filter removed'),
  },
}

export const WithoutRemove: Story = {
  args: {
    label: 'Featured Products',
    color: 'gold',
  },
}

export const LongLabel: Story = {
  args: {
    label: 'Very long filter label that might wrap to multiple lines',
    color: 'cyan',
    onRemove: () => console.log('Filter removed'),
  },
}

export const ShortLabel: Story = {
  args: {
    label: 'New',
    color: 'green',
    onRemove: () => console.log('Filter removed'),
  },
}

export const MultipleChips: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      <FilterChip 
        label="Category: Electronics" 
        color="blue" 
        onRemove={() => console.log('Electronics removed')} 
      />
      <FilterChip 
        label="Price: $50-$100" 
        color="green" 
        onRemove={() => console.log('Price removed')} 
      />
      <FilterChip 
        label="Brand: Apple" 
        color="orange" 
        onRemove={() => console.log('Brand removed')} 
      />
      <FilterChip 
        label="In Stock" 
        color="purple" 
        onRemove={() => console.log('Stock removed')} 
      />
      <FilterChip 
        label="Sale Items" 
        color="red" 
        onRemove={() => console.log('Sale removed')} 
      />
    </div>
  ),
}

export const AllColors: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      <FilterChip label="Blue" color="blue" onRemove={() => console.log('removed')} />
      <FilterChip label="Green" color="green" onRemove={() => console.log('removed')} />
      <FilterChip label="Red" color="red" onRemove={() => console.log('removed')} />
      <FilterChip label="Orange" color="orange" onRemove={() => console.log('removed')} />
      <FilterChip label="Purple" color="purple" onRemove={() => console.log('removed')} />
      <FilterChip label="Cyan" color="cyan" onRemove={() => console.log('removed')} />
      <FilterChip label="Magenta" color="magenta" onRemove={() => console.log('removed')} />
      <FilterChip label="Volcano" color="volcano" onRemove={() => console.log('removed')} />
      <FilterChip label="Gold" color="gold" onRemove={() => console.log('removed')} />
      <FilterChip label="Lime" color="lime" onRemove={() => console.log('removed')} />
    </div>
  ),
}

export const ProductFilters: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      <FilterChip 
        label="Category: Clothing" 
        color="blue" 
        onRemove={() => console.log('Category removed')} 
      />
      <FilterChip 
        label="Size: M" 
        color="green" 
        onRemove={() => console.log('Size removed')} 
      />
      <FilterChip 
        label="Color: Blue" 
        color="cyan" 
        onRemove={() => console.log('Color removed')} 
      />
      <FilterChip 
        label="Price: Under $50" 
        color="orange" 
        onRemove={() => console.log('Price removed')} 
      />
      <FilterChip 
        label="Brand: Nike" 
        color="purple" 
        onRemove={() => console.log('Brand removed')} 
      />
      <FilterChip 
        label="Free Shipping" 
        color="gold" 
        onRemove={() => console.log('Shipping removed')} 
      />
    </div>
  ),
}

export const SearchFilters: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      <FilterChip 
        label="Date: Last 7 days" 
        color="blue" 
        onRemove={() => console.log('Date removed')} 
      />
      <FilterChip 
        label="Status: Active" 
        color="green" 
        onRemove={() => console.log('Status removed')} 
      />
      <FilterChip 
        label="Type: User" 
        color="orange" 
        onRemove={() => console.log('Type removed')} 
      />
      <FilterChip 
        label="Verified" 
        color="purple" 
        onRemove={() => console.log('Verified removed')} 
      />
    </div>
  ),
}

export const Interactive: Story = {
  render: () => {
    const [filters, setFilters] = React.useState([
      { id: '1', label: 'Category: Electronics', color: 'blue' },
      { id: '2', label: 'Price: $50-$100', color: 'green' },
      { id: '3', label: 'Brand: Apple', color: 'orange' },
    ])

    const removeFilter = (id: string) => {
      setFilters(filters.filter(f => f.id !== id))
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {filters.map(filter => (
            <FilterChip
              key={filter.id}
              label={filter.label}
              color={filter.color}
              onRemove={() => removeFilter(filter.id)}
            />
          ))}
        </div>
        <div style={{ fontSize: '14px', color: '#666' }}>
          Active filters: {filters.length}
        </div>
      </div>
    )
  },
}
