import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'

import { MultiSelect } from './MultiSelect'
import type { SelectOption } from './MultiSelect'

const meta: Meta<typeof MultiSelect> = {
  title: 'Molecules/MultiSelect',
  component: MultiSelect,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'An enhanced multi-select component with search functionality, select all/clear all actions, grouped options, and customizable tag display. Built on top of Ant Design Select with additional features.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['small', 'middle', 'large'],
    },
    searchable: { control: 'boolean' },
    showSelectAll: { control: 'boolean' },
    showClearAll: { control: 'boolean' },
    disabled: { control: 'boolean' },
    loading: { control: 'boolean' },
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
type Story = StoryObj<typeof MultiSelect>

const basicOptions: SelectOption[] = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'orange', label: 'Orange' },
  { value: 'grape', label: 'Grape' },
  { value: 'strawberry', label: 'Strawberry' },
  { value: 'blueberry', label: 'Blueberry' },
  { value: 'raspberry', label: 'Raspberry' },
  { value: 'blackberry', label: 'Blackberry' },
]

const categoryOptions: SelectOption[] = [
  { value: 'tshirts', label: 'T-Shirts', group: 'Clothing' },
  { value: 'jeans', label: 'Jeans', group: 'Clothing' },
  { value: 'sweaters', label: 'Sweaters', group: 'Clothing' },
  { value: 'dresses', label: 'Dresses', group: 'Clothing' },
  { value: 'nike', label: 'Nike', group: 'Brands' },
  { value: 'adidas', label: 'Adidas', group: 'Brands' },
  { value: 'puma', label: 'Puma', group: 'Brands' },
  { value: 'under-armour', label: 'Under Armour', group: 'Brands' },
  { value: 'red', label: 'Red', group: 'Colors' },
  { value: 'blue', label: 'Blue', group: 'Colors' },
  { value: 'green', label: 'Green', group: 'Colors' },
  { value: 'black', label: 'Black', group: 'Colors' },
  { value: 'white', label: 'White', group: 'Colors' },
]

const sizeOptions: SelectOption[] = [
  { value: 'xs', label: 'XS' },
  { value: 's', label: 'S' },
  { value: 'm', label: 'M' },
  { value: 'l', label: 'L' },
  { value: 'xl', label: 'XL' },
  { value: 'xxl', label: 'XXL' },
  { value: 'xxxl', label: 'XXXL' },
]

const disabledOptions: SelectOption[] = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2', disabled: true },
  { value: 'option3', label: 'Option 3' },
  { value: 'option4', label: 'Option 4', disabled: true },
  { value: 'option5', label: 'Option 5' },
]

export const Default: Story = {
  args: {
    options: basicOptions,
    placeholder: 'Select fruits...',
  },
  }

export const WithPreselectedValues: Story = {
  args: {
    options: basicOptions,
    value: ['apple', 'banana'],
    placeholder: 'Select fruits...',
  },
  }

export const GroupedOptions: Story = {
  args: {
    options: categoryOptions,
    placeholder: 'Select categories...',
  },
  }

export const WithSearch: Story = {
  args: {
    options: basicOptions,
    searchable: true,
    placeholder: 'Search and select fruits...',
  },
  }

export const WithoutSearch: Story = {
  args: {
    options: basicOptions,
    searchable: false,
    placeholder: 'Select fruits...',
  },
  }

export const WithoutSelectAll: Story = {
  args: {
    options: basicOptions,
    showSelectAll: false,
    placeholder: 'Select fruits...',
  },
  }

export const WithoutClearAll: Story = {
  args: {
    options: basicOptions,
    showClearAll: false,
    placeholder: 'Select fruits...',
  },
  }

export const SmallSize: Story = {
  args: {
    options: sizeOptions,
    size: 'small',
    placeholder: 'Select sizes...',
  },
  }

export const LargeSize: Story = {
  args: {
    options: sizeOptions,
    size: 'large',
    placeholder: 'Select sizes...',
  },
  }

export const Disabled: Story = {
  args: {
    options: basicOptions,
    disabled: true,
    placeholder: 'Select fruits...',
  },
  }

export const Loading: Story = {
  args: {
    options: basicOptions,
    loading: true,
    placeholder: 'Loading options...',
  },
  }

export const WithDisabledOptions: Story = {
  args: {
    options: disabledOptions,
    placeholder: 'Select options...',
  },
  }

export const LimitedTagCount: Story = {
  args: {
    options: basicOptions,
    maxTagCount: 2,
    value: ['apple', 'banana', 'orange', 'grape'],
    placeholder: 'Select fruits...',
  },
  }

export const CustomPlaceholder: Story = {
  args: {
    options: categoryOptions,
    placeholder: 'Choose your favorite categories...',
  },
  }

export const MinimalConfiguration: Story = {
  args: {
    options: basicOptions.slice(0, 3),
    searchable: false,
    showSelectAll: false,
    showClearAll: false,
    placeholder: 'Select...',
  },
  }

const InteractiveComponent = (args: any) => {
  const [selectedValues, setSelectedValues] = useState<(string | number)[]>([])

  return (
    <MultiSelect
      {...args}
      value={selectedValues}
      onChange={setSelectedValues}
    />
  )
}

export const Interactive: Story = {
  render: InteractiveComponent,
  tags: ['autodocs'],
  args: {
    options: basicOptions,
    placeholder: 'Select fruits...',
  },
}

const ComplexExampleComponent = (args: any) => {
  const [selectedValues, setSelectedValues] = useState<(string | number)[]>([])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <MultiSelect
        {...args}
        value={selectedValues}
        onChange={setSelectedValues}
      />
      <div style={{ fontSize: '14px', color: '#666' }}>
        Selected: {selectedValues.length > 0 ? selectedValues.join(', ') : 'None'}
      </div>
    </div>
  )
}

export const ComplexExample: Story = {
  render: ComplexExampleComponent,
  tags: ['autodocs'],
  args: {
    options: categoryOptions,
    placeholder: 'Select categories...',
    maxTagCount: 3,
  },
  }
