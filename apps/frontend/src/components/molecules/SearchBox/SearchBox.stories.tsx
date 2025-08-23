import type { Meta, StoryObj } from '@storybook/react'

import { SearchBox } from './SearchBox'

const meta: Meta<typeof SearchBox> = {
  title: 'Molecules/SearchBox',
  component: SearchBox,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A search input with debounced search, filter button, and clear functionality.',
      },
    },
  },
  argTypes: {
    onSearch: { action: 'searched' },
    onFilter: { action: 'filter clicked' },
    onClear: { action: 'cleared' },
    debounceMs: {
      control: { type: 'number', min: 0, max: 1000, step: 100 },
    },
    size: {
      control: { type: 'select' },
      options: ['small', 'middle', 'large'],
    },
  },
}

export default meta
type Story = StoryObj<typeof SearchBox>

export const Default: Story = {
  args: {
    placeholder: 'Search products...',
    onSearch: (value) => console.log('Search:', value),
    showFilterButton: false,
  },
}

export const WithFilter: Story = {
  args: {
    placeholder: 'Search products...',
    onSearch: (value) => console.log('Search:', value),
    onFilter: () => console.log('Filter clicked'),
    showFilterButton: true,
    filterCount: 3,
  },
}

export const Loading: Story = {
  args: {
    placeholder: 'Search products...',
    onSearch: (value) => console.log('Search:', value),
    loading: true,
  },
}

export const Disabled: Story = {
  args: {
    placeholder: 'Search products...',
    onSearch: (value) => console.log('Search:', value),
    disabled: true,
  },
}

export const Small: Story = {
  args: {
    placeholder: 'Search...',
    onSearch: (value) => console.log('Search:', value),
    size: 'small',
    showFilterButton: true,
  },
}

export const Large: Story = {
  args: {
    placeholder: 'Search products...',
    onSearch: (value) => console.log('Search:', value),
    size: 'large',
    showFilterButton: true,
    filterCount: 5,
  },
}
