import type { Meta, StoryObj } from '@storybook/react'
import { SearchInput } from './SearchInput'

const meta: Meta<typeof SearchInput> = {
  title: 'Atoms/SearchInput',
  component: SearchInput,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['small', 'middle', 'large'],
    },
    disabled: {
      control: { type: 'boolean' },
    },
    loading: {
      control: { type: 'boolean' },
    },
    allowClear: {
      control: { type: 'boolean' },
    },
    enterButton: {
      control: { type: 'boolean' },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    placeholder: 'Search...',
  },
}

export const WithValue: Story = {
  args: {
    value: 'Search term',
    placeholder: 'Search...',
  },
}

export const Small: Story = {
  args: {
    size: 'small',
    placeholder: 'Small search...',
  },
}

export const Large: Story = {
  args: {
    size: 'large',
    placeholder: 'Large search...',
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
    placeholder: 'Disabled search...',
  },
}

export const Loading: Story = {
  args: {
    loading: true,
    placeholder: 'Loading search...',
  },
}

export const WithoutEnterButton: Story = {
  args: {
    enterButton: false,
    placeholder: 'Search without button...',
  },
}

export const WithCustomPlaceholder: Story = {
  args: {
    placeholder: 'Search for products...',
  },
}
