import type { Meta, StoryObj } from '@storybook/react'
import { Input, TextArea, PasswordInput, SearchInput } from './Input'
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  SearchOutlined,
} from '@ant-design/icons'

const meta: Meta<typeof Input> = {
  title: 'Atoms/Input',
  component: Input,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Input component for text entry with labels, validation states, and various input types.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'Label text for the input',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
    },
    error: {
      control: 'text',
      description: 'Error message to display',
    },
    helperText: {
      control: 'text',
      description: 'Helper text to display below input',
    },
    required: {
      control: 'boolean',
      description: 'Whether the field is required',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the input is disabled',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Whether the input takes full width',
    },
    variant: {
      control: { type: 'select' },
      options: ['outlined', 'filled', 'borderless'],
      description: 'Visual variant of the input',
    },
    size: {
      control: { type: 'select' },
      options: ['small', 'middle', 'large'],
      description: 'Size of the input',
    },
  },
}

export default meta
type Story = StoryObj<typeof Input>

// Basic Stories
export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
}

export const WithLabel: Story = {
  args: {
    label: 'Username',
    placeholder: 'Enter your username',
  },
}

export const Required: Story = {
  args: {
    label: 'Email Address',
    placeholder: 'Enter your email',
    required: true,
  },
}

export const WithHelperText: Story = {
  args: {
    label: 'Password',
    placeholder: 'Enter password',
    helperText: 'Password must be at least 8 characters long',
    type: 'password',
  },
}

export const WithError: Story = {
  args: {
    label: 'Email',
    placeholder: 'Enter your email',
    error: 'Please enter a valid email address',
    value: 'invalid-email',
  },
}

// Variant Stories
export const Variants: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        maxWidth: '300px',
      }}
    >
      <Input
        label='Outlined (Default)'
        variant='outlined'
        placeholder='Outlined input'
      />
      <Input label='Filled' variant='filled' placeholder='Filled input' />
      <Input
        label='Borderless'
        variant='borderless'
        placeholder='Borderless input'
      />
    </div>
  ),
}

// Size Stories
export const Sizes: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        maxWidth: '300px',
      }}
    >
      <Input label='Small' size='small' placeholder='Small input' />
      <Input
        label='Medium (Default)'
        size='middle'
        placeholder='Medium input'
      />
      <Input label='Large' size='large' placeholder='Large input' />
    </div>
  ),
}

// State Stories
export const States: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        maxWidth: '300px',
      }}
    >
      <Input label='Normal' placeholder='Normal state' />
      <Input label='Focused' placeholder='Focused state' autoFocus />
      <Input label='Disabled' placeholder='Disabled state' disabled />
      <Input
        label='Read Only'
        placeholder='Read only state'
        readOnly
        value='Read only value'
      />
    </div>
  ),
}

// With Icons
export const WithIcons: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        maxWidth: '300px',
      }}
    >
      <Input
        label='Username'
        placeholder='Enter username'
        prefix={<UserOutlined />}
      />
      <Input
        label='Email'
        placeholder='Enter email'
        prefix={<MailOutlined />}
        suffix='@company.com'
      />
      <Input
        label='Search'
        placeholder='Search...'
        prefix={<SearchOutlined />}
      />
    </div>
  ),
}

// Validation States
export const ValidationStates: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        maxWidth: '300px',
      }}
    >
      <Input
        label='Valid Input'
        placeholder='Valid input'
        value='valid@email.com'
        helperText='This email is available'
      />
      <Input
        label='Invalid Input'
        placeholder='Invalid input'
        value='invalid-email'
        error='Please enter a valid email address'
      />
      <Input
        label='Required Field'
        placeholder='Required field'
        required
        error='This field is required'
      />
    </div>
  ),
}

// TextArea Stories
export const TextAreaExamples: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        maxWidth: '400px',
      }}
    >
      <TextArea
        label='Description'
        placeholder='Enter description...'
        rows={4}
      />
      <TextArea
        label='Auto-resize TextArea'
        placeholder='This textarea will auto-resize...'
        autoSize
      />
      <TextArea
        label='Comments'
        placeholder='Enter your comments...'
        rows={3}
        helperText='Maximum 500 characters'
      />
    </div>
  ),
}

// Password Input Stories
export const PasswordExamples: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        maxWidth: '300px',
      }}
    >
      <PasswordInput
        label='Password'
        placeholder='Enter password'
        prefix={<LockOutlined />}
      />
      <PasswordInput
        label='Confirm Password'
        placeholder='Confirm password'
        helperText='Passwords must match'
      />
      <PasswordInput
        label='Current Password'
        placeholder='Enter current password'
        error='Incorrect password'
      />
    </div>
  ),
}

// Search Input Stories
export const SearchExamples: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        maxWidth: '300px',
      }}
    >
      <SearchInput
        label='Search Products'
        placeholder='Search for products...'
        onSearch={(value: string) => console.log('Searching for:', value)}
      />
      <SearchInput
        placeholder='Quick search...'
        size='large'
        onSearch={(value: string) => console.log('Quick search:', value)}
      />
    </div>
  ),
}

// Form Layout Example
export const FormLayout: Story = {
  render: () => (
    <div style={{ maxWidth: '400px' }}>
      <h3>User Registration</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Input label='First Name' placeholder='Enter first name' required />
        <Input label='Last Name' placeholder='Enter last name' required />
        <Input
          label='Email Address'
          placeholder='Enter email'
          type='email'
          required
          prefix={<MailOutlined />}
        />
        <PasswordInput
          label='Password'
          placeholder='Create password'
          required
          helperText='Must be at least 8 characters with numbers and symbols'
        />
        <PasswordInput
          label='Confirm Password'
          placeholder='Confirm password'
          required
        />
        <TextArea
          label='Bio (Optional)'
          placeholder='Tell us about yourself...'
          rows={3}
          helperText='Maximum 200 characters'
        />
      </div>
    </div>
  ),
}

// Full Width Examples
export const FullWidth: Story = {
  render: () => (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Input
          label='Full Width Input'
          placeholder='This input takes full width'
          fullWidth
        />
        <Input
          label='Regular Width Input'
          placeholder='This input has default width'
        />
      </div>
    </div>
  ),
}

// Interactive Example
export const Interactive: Story = {
  args: {
    label: 'Interactive Input',
    placeholder: 'Type something...',
    helperText: 'This is a helper text',
    required: false,
    fullWidth: false,
    variant: 'outlined',
    size: 'middle',
  },
}
