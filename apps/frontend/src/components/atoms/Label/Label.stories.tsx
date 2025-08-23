import type { Meta, StoryObj } from '@storybook/react'
import { Label } from './Label'

const meta: Meta<typeof Label> = {
  title: 'Atoms/Label',
  component: Label,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Label component for form fields and content labeling with various sizes, weights, and colors.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    children: {
      control: 'text',
      description: 'Label text content',
    },
    htmlFor: {
      control: 'text',
      description: 'ID of the form element this label is for',
    },
    required: {
      control: 'boolean',
      description: 'Whether to show required indicator',
    },
    size: {
      control: { type: 'select' },
      options: ['small', 'medium', 'large'],
      description: 'Size of the label text',
    },
    weight: {
      control: { type: 'select' },
      options: ['normal', 'medium', 'semibold', 'bold'],
      description: 'Font weight of the label',
    },
    color: {
      control: { type: 'select' },
      options: ['default', 'secondary', 'success', 'warning', 'error'],
      description: 'Color variant of the label',
    },
  },
}

export default meta
type Story = StoryObj<typeof Label>

// Basic Stories
export const Default: Story = {
  args: {
    children: 'Default Label',
  },
}

export const Required: Story = {
  args: {
    children: 'Required Field',
    required: true,
  },
}

export const WithHtmlFor: Story = {
  render: () => (
    <div>
      <Label htmlFor='email-input'>Email Address</Label>
      <br />
      <input
        id='email-input'
        type='email'
        placeholder='Enter your email'
        style={{ marginTop: '8px', padding: '8px' }}
      />
    </div>
  ),
}

// Size Stories
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Label size='small'>Small Label</Label>
      <Label size='medium'>Medium Label (Default)</Label>
      <Label size='large'>Large Label</Label>
    </div>
  ),
}

// Weight Stories
export const Weights: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Label weight='normal'>Normal Weight</Label>
      <Label weight='medium'>Medium Weight (Default)</Label>
      <Label weight='semibold'>Semibold Weight</Label>
      <Label weight='bold'>Bold Weight</Label>
    </div>
  ),
}

// Color Stories
export const Colors: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Label color='default'>Default Color</Label>
      <Label color='secondary'>Secondary Color</Label>
      <Label color='success'>Success Color</Label>
      <Label color='warning'>Warning Color</Label>
      <Label color='error'>Error Color</Label>
    </div>
  ),
}

// Required Indicator Variations
export const RequiredVariations: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Label required>Required Field</Label>
      <Label required color='error'>
        Required Error Field
      </Label>
      <Label required size='large' weight='bold'>
        Large Required Field
      </Label>
      <Label required size='small' color='secondary'>
        Small Required Field
      </Label>
    </div>
  ),
}

// Form Field Examples
export const FormFieldExamples: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        maxWidth: '300px',
      }}
    >
      <div>
        <Label htmlFor='username' required>
          Username
        </Label>
        <input
          id='username'
          type='text'
          placeholder='Enter username'
          style={{
            marginTop: '4px',
            padding: '8px',
            width: '100%',
            border: '1px solid #d9d9d9',
            borderRadius: '4px',
          }}
        />
      </div>

      <div>
        <Label htmlFor='email' required color='default'>
          Email Address
        </Label>
        <input
          id='email'
          type='email'
          placeholder='Enter email'
          style={{
            marginTop: '4px',
            padding: '8px',
            width: '100%',
            border: '1px solid #d9d9d9',
            borderRadius: '4px',
          }}
        />
      </div>

      <div>
        <Label htmlFor='password' required>
          Password
        </Label>
        <input
          id='password'
          type='password'
          placeholder='Enter password'
          style={{
            marginTop: '4px',
            padding: '8px',
            width: '100%',
            border: '1px solid #d9d9d9',
            borderRadius: '4px',
          }}
        />
      </div>

      <div>
        <Label htmlFor='bio' size='small' color='secondary'>
          Bio (Optional)
        </Label>
        <textarea
          id='bio'
          placeholder='Tell us about yourself...'
          rows={3}
          style={{
            marginTop: '4px',
            padding: '8px',
            width: '100%',
            border: '1px solid #d9d9d9',
            borderRadius: '4px',
            resize: 'vertical',
          }}
        />
      </div>
    </div>
  ),
}

// Status Labels
export const StatusLabels: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <Label color='success' weight='semibold'>
          ✓ Valid Field
        </Label>
        <div style={{ fontSize: '12px', color: '#52c41a', marginTop: '4px' }}>
          This field is correctly filled
        </div>
      </div>

      <div>
        <Label color='warning' weight='semibold'>
          ⚠ Warning Field
        </Label>
        <div style={{ fontSize: '12px', color: '#faad14', marginTop: '4px' }}>
          Please review this field
        </div>
      </div>

      <div>
        <Label color='error' weight='semibold'>
          ✗ Error Field
        </Label>
        <div style={{ fontSize: '12px', color: '#ff4d4f', marginTop: '4px' }}>
          This field has an error
        </div>
      </div>
    </div>
  ),
}

// Size and Weight Combinations
export const SizeWeightCombinations: Story = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        textAlign: 'center',
      }}
    >
      <div>
        <div style={{ fontSize: '12px', marginBottom: '8px', color: '#666' }}>
          Small
        </div>
        <Label size='small' weight='normal'>
          Normal
        </Label>
        <br />
        <Label size='small' weight='medium'>
          Medium
        </Label>
        <br />
        <Label size='small' weight='semibold'>
          Semibold
        </Label>
        <br />
        <Label size='small' weight='bold'>
          Bold
        </Label>
      </div>

      <div>
        <div style={{ fontSize: '12px', marginBottom: '8px', color: '#666' }}>
          Medium
        </div>
        <Label size='medium' weight='normal'>
          Normal
        </Label>
        <br />
        <Label size='medium' weight='medium'>
          Medium
        </Label>
        <br />
        <Label size='medium' weight='semibold'>
          Semibold
        </Label>
        <br />
        <Label size='medium' weight='bold'>
          Bold
        </Label>
      </div>

      <div>
        <div style={{ fontSize: '12px', marginBottom: '8px', color: '#666' }}>
          Large
        </div>
        <Label size='large' weight='normal'>
          Normal
        </Label>
        <br />
        <Label size='large' weight='medium'>
          Medium
        </Label>
        <br />
        <Label size='large' weight='semibold'>
          Semibold
        </Label>
        <br />
        <Label size='large' weight='bold'>
          Bold
        </Label>
      </div>
    </div>
  ),
}

// Accessibility Example
export const AccessibilityExample: Story = {
  render: () => (
    <div style={{ maxWidth: '400px' }}>
      <h3>Accessible Form</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <Label htmlFor='accessible-name' required>
            Full Name
          </Label>
          <input
            id='accessible-name'
            type='text'
            placeholder='Enter your full name'
            aria-required='true'
            style={{
              marginTop: '4px',
              padding: '8px',
              width: '100%',
              border: '1px solid #d9d9d9',
              borderRadius: '4px',
            }}
          />
        </div>

        <div>
          <Label htmlFor='accessible-email' required>
            Email
          </Label>
          <input
            id='accessible-email'
            type='email'
            placeholder='Enter your email'
            aria-required='true'
            aria-describedby='email-help'
            style={{
              marginTop: '4px',
              padding: '8px',
              width: '100%',
              border: '1px solid #d9d9d9',
              borderRadius: '4px',
            }}
          />
          <div
            id='email-help'
            style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}
          >
            We'll never share your email with anyone else.
          </div>
        </div>
      </div>
    </div>
  ),
}

// Interactive Example
export const Interactive: Story = {
  args: {
    children: 'Interactive Label',
    required: false,
    size: 'medium',
    weight: 'medium',
    color: 'default',
  },
}
