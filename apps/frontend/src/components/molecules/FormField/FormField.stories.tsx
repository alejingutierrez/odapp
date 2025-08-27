import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { Input, Select, DatePicker, Switch } from 'antd'

import { FormField } from './FormField'

const meta: Meta<typeof FormField> = {
  title: 'Molecules/FormField',
  component: FormField,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A form field wrapper component that provides consistent styling, validation states, help text, and tooltips for form inputs. Built on top of Ant Design Form.Item with additional features.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    validateStatus: {
      control: { type: 'select' },
      options: ['success', 'warning', 'error', 'validating'],
    },
    layout: {
      control: { type: 'select' },
      options: ['vertical', 'horizontal'],
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
type Story = StoryObj<typeof FormField>

export const Default: Story = {
  args: {
    label: 'Product Name',
    children: <Input placeholder='Enter product name' />,
  },
}

export const Required: Story = {
  args: {
    label: 'Product Name',
    required: true,
    children: <Input placeholder='Enter product name' />,
  },
}

export const WithHelp: Story = {
  args: {
    label: 'Product Description',
    help: 'Provide a detailed description of your product to help customers understand its features and benefits.',
    children: (
      <Input.TextArea placeholder='Enter product description' rows={3} />
    ),
  },
}

export const WithTooltip: Story = {
  args: {
    label: 'SKU',
    tooltip: 'Stock Keeping Unit - a unique identifier for your product',
    children: <Input placeholder='Enter SKU' />,
  },
}

export const Success: Story = {
  args: {
    label: 'Email Address',
    validateStatus: 'success',
    help: 'Email address is valid and available',
    children: <Input placeholder='Enter email address' />,
  },
}

export const Warning: Story = {
  args: {
    label: 'Password',
    validateStatus: 'warning',
    warning: 'Password strength is weak. Consider using a stronger password.',
    children: <Input.Password placeholder='Enter password' />,
  },
}

export const Error: Story = {
  args: {
    label: 'Username',
    validateStatus: 'error',
    error: 'Username is already taken. Please choose a different username.',
    children: <Input placeholder='Enter username' />,
  },
}

export const Validating: Story = {
  args: {
    label: 'Email Address',
    validateStatus: 'validating',
    help: 'Checking email availability...',
    children: <Input placeholder='Enter email address' />,
  },
}

export const WithSelect: Story = {
  args: {
    label: 'Category',
    required: true,
    help: 'Select the category that best describes your product',
    children: (
      <Select placeholder='Select category'>
        <Select.Option value='clothing'>Clothing</Select.Option>
        <Select.Option value='electronics'>Electronics</Select.Option>
        <Select.Option value='home'>Home & Garden</Select.Option>
        <Select.Option value='sports'>Sports & Outdoors</Select.Option>
      </Select>
    ),
  },
}

export const WithDatePicker: Story = {
  args: {
    label: 'Release Date',
    tooltip: 'When will this product be available for purchase?',
    children: (
      <DatePicker placeholder='Select release date' style={{ width: '100%' }} />
    ),
  },
}

export const WithSwitch: Story = {
  args: {
    label: 'Active Status',
    help: 'Enable this to make the product visible to customers',
    children: <Switch />,
  },
}

export const HorizontalLayout: Story = {
  args: {
    label: 'Product Name',
    layout: 'horizontal',
    labelCol: { span: 6 },
    wrapperCol: { span: 18 },
    children: <Input placeholder='Enter product name' />,
  },
}

export const CompactHorizontal: Story = {
  args: {
    label: 'Price',
    layout: 'horizontal',
    labelCol: { span: 4 },
    wrapperCol: { span: 20 },
    tooltip: 'Enter the price in USD',
    children: <Input placeholder='0.00' prefix='$' />,
  },
}

export const MultipleErrors: Story = {
  args: {
    label: 'Product URL',
    validateStatus: 'error',
    error:
      'URL is invalid. Please enter a valid URL starting with http:// or https://',
    help: 'This URL will be used for SEO purposes',
    children: <Input placeholder='https://example.com/product' />,
  },
}

export const ComplexExample: Story = {
  args: {
    label: 'Product Variants',
    required: true,
    tooltip: 'Configure different options for your product (size, color, etc.)',
    help: 'Add variants to offer different options to your customers',
    validateStatus: 'warning',
    warning: 'Consider adding more variants to increase sales opportunities',
    children: (
      <Select mode='multiple' placeholder='Select variants'>
        <Select.Option value='size-s'>Size: S</Select.Option>
        <Select.Option value='size-m'>Size: M</Select.Option>
        <Select.Option value='size-l'>Size: L</Select.Option>
        <Select.Option value='color-red'>Color: Red</Select.Option>
        <Select.Option value='color-blue'>Color: Blue</Select.Option>
        <Select.Option value='color-green'>Color: Green</Select.Option>
      </Select>
    ),
  },
}

export const NoLabel: Story = {
  args: {
    children: <Input placeholder='Enter text without label' />,
  },
}

export const WithFeedback: Story = {
  args: {
    label: 'Password',
    required: true,
    hasFeedback: true,
    validateStatus: 'success',
    help: 'Password meets all requirements',
    children: <Input.Password placeholder='Enter password' />,
  },
}
