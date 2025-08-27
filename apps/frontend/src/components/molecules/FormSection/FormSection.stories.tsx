import type { Meta, StoryObj } from '@storybook/react'
import { Input, Select, DatePicker, Checkbox, Space } from 'antd'

import { FormSection } from './FormSection'

const meta: Meta<typeof FormSection> = {
  title: 'Molecules/FormSection',
  component: FormSection,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A form section component that groups related form fields with optional collapsible behavior, validation summary, and visual indicators for required fields.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    collapsible: { control: 'boolean' },
    defaultExpanded: { control: 'boolean' },
    required: { control: 'boolean' },
    showValidationSummary: { control: 'boolean' },
    disabled: { control: 'boolean' },
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
type Story = StoryObj<typeof FormSection>

const basicFormContent = (
  <Space direction="vertical" style={{ width: '100%' }}>
    <Input placeholder="Enter your name" />
    <Input placeholder="Enter your email" />
    <Select placeholder="Select your country">
      <Select.Option value="us">United States</Select.Option>
      <Select.Option value="ca">Canada</Select.Option>
      <Select.Option value="uk">United Kingdom</Select.Option>
    </Select>
  </Space>
)

const productFormContent = (
  <Space direction="vertical" style={{ width: '100%' }}>
    <Input placeholder="Product name" />
    <Input.TextArea placeholder="Product description" rows={3} />
    <Input placeholder="SKU" />
    <Input placeholder="Price" prefix="$" />
  </Space>
)

const addressFormContent = (
  <Space direction="vertical" style={{ width: '100%' }}>
    <Input placeholder="Street address" />
    <Input placeholder="City" />
    <Input placeholder="State/Province" />
    <Input placeholder="ZIP/Postal code" />
    <Select placeholder="Country">
      <Select.Option value="us">United States</Select.Option>
      <Select.Option value="ca">Canada</Select.Option>
      <Select.Option value="uk">United Kingdom</Select.Option>
    </Select>
  </Space>
)

export const Default: Story = {
  args: {
    title: 'Personal Information',
    description: 'Please provide your basic contact information.',
    children: basicFormContent,
  },
}

export const Required: Story = {
  args: {
    title: 'Personal Information',
    description: 'Please provide your basic contact information.',
    required: true,
    children: basicFormContent,
  },
}

export const NotCollapsible: Story = {
  args: {
    title: 'Product Details',
    description: 'Enter the basic product information.',
    collapsible: false,
    children: productFormContent,
  },
}

export const CollapsedByDefault: Story = {
  args: {
    title: 'Advanced Settings',
    description: 'Optional advanced configuration options.',
    defaultExpanded: false,
    children: (
      <Space direction="vertical" style={{ width: '100%' }}>
        <Checkbox>Enable notifications</Checkbox>
        <Checkbox>Auto-save drafts</Checkbox>
        <DatePicker placeholder="Expiration date" style={{ width: '100%' }} />
      </Space>
    ),
  },
}

export const WithValidationErrors: Story = {
  args: {
    title: 'Address Information',
    description: 'Please provide your shipping address.',
    validation: {
      errors: 2,
      warnings: 1,
      valid: false,
    },
    children: addressFormContent,
  },
}

export const WithValidationWarnings: Story = {
  args: {
    title: 'Address Information',
    description: 'Please provide your shipping address.',
    validation: {
      errors: 0,
      warnings: 3,
      valid: true,
    },
    children: addressFormContent,
  },
}

export const WithValidationSuccess: Story = {
  args: {
    title: 'Address Information',
    description: 'Please provide your shipping address.',
    validation: {
      errors: 0,
      warnings: 0,
      valid: true,
    },
    children: addressFormContent,
  },
}

export const WithoutValidationSummary: Story = {
  args: {
    title: 'Address Information',
    description: 'Please provide your shipping address.',
    validation: {
      errors: 2,
      warnings: 1,
      valid: false,
    },
    showValidationSummary: false,
    children: addressFormContent,
  },
}

export const Disabled: Story = {
  args: {
    title: 'Personal Information',
    description: 'This section is currently disabled.',
    disabled: true,
    children: basicFormContent,
  },
}

export const LongTitle: Story = {
  args: {
    title: 'Very Long Section Title That Might Wrap to Multiple Lines',
    description: 'This is a description for a section with a very long title.',
    children: basicFormContent,
  },
}

export const LongDescription: Story = {
  args: {
    title: 'Personal Information',
    description: 'This is a very long description that provides detailed information about what should be entered in this form section. It might wrap to multiple lines and provide helpful guidance to the user.',
    children: basicFormContent,
  },
}

export const ComplexForm: Story = {
  args: {
    title: 'Product Configuration',
    description: 'Configure all product settings and options.',
    validation: {
      errors: 1,
      warnings: 2,
      valid: false,
    },
    children: (
      <Space direction="vertical" style={{ width: '100%' }}>
        <Input placeholder="Product name" />
        <Input.TextArea placeholder="Product description" rows={3} />
        <Input placeholder="SKU" />
        <Input placeholder="Price" prefix="$" />
        <Select placeholder="Category">
          <Select.Option value="electronics">Electronics</Select.Option>
          <Select.Option value="clothing">Clothing</Select.Option>
          <Select.Option value="books">Books</Select.Option>
        </Select>
        <DatePicker placeholder="Release date" style={{ width: '100%' }} />
        <Checkbox>Available for purchase</Checkbox>
        <Checkbox>Featured product</Checkbox>
      </Space>
    ),
  },
}

export const MultipleSections: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <FormSection
        title="Personal Information"
        description="Basic contact details."
        validation={{ errors: 0, warnings: 0, valid: true }}
      >
        {basicFormContent}
      </FormSection>
      
      <FormSection
        title="Address Information"
        description="Shipping and billing address."
        validation={{ errors: 2, warnings: 1, valid: false }}
      >
        {addressFormContent}
      </FormSection>
      
      <FormSection
        title="Preferences"
        description="Optional user preferences."
        defaultExpanded={false}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Checkbox>Receive marketing emails</Checkbox>
          <Checkbox>Enable notifications</Checkbox>
          <Select placeholder="Language preference">
            <Select.Option value="en">English</Select.Option>
            <Select.Option value="es">Spanish</Select.Option>
            <Select.Option value="fr">French</Select.Option>
          </Select>
        </Space>
      </FormSection>
    </div>
  ),
}

export const MinimalConfiguration: Story = {
  args: {
    title: 'Simple Section',
    children: <Input placeholder="Enter text" />,
  },
}

export const NoDescription: Story = {
  args: {
    title: 'Section Without Description',
    children: basicFormContent,
  },
}
