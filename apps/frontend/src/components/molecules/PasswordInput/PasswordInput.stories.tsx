import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'

import { PasswordInput } from './PasswordInput'

const meta: Meta<typeof PasswordInput> = {
  title: 'Molecules/PasswordInput',
  component: PasswordInput,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A password input component with strength indicator, requirements display, and customizable validation rules. Provides visual feedback on password strength and requirements compliance.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['small', 'middle', 'large'],
    },
    showStrengthIndicator: { control: 'boolean' },
    showRequirements: { control: 'boolean' },
    disabled: { control: 'boolean' },
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
type Story = StoryObj<typeof PasswordInput>

export const Default: Story = {
  args: {
    placeholder: 'Enter your password',
  },
  }

export const WithValue: Story = {
  args: {
    value: 'MyPassword123!',
    placeholder: 'Enter your password',
  },
  }

export const SmallSize: Story = {
  args: {
    size: 'small',
    placeholder: 'Enter your password',
  },
  }

export const LargeSize: Story = {
  args: {
    size: 'large',
    placeholder: 'Enter your password',
  },
  }

export const WithoutStrengthIndicator: Story = {
  args: {
    showStrengthIndicator: false,
    placeholder: 'Enter your password',
  },
  }

export const WithoutRequirements: Story = {
  args: {
    showRequirements: false,
    placeholder: 'Enter your password',
  },
  }

export const Disabled: Story = {
  args: {
    disabled: true,
    value: 'MyPassword123!',
    placeholder: 'Enter your password',
  },
  }

export const CustomStrengthConfig: Story = {
  args: {
    strengthConfig: {
      minLength: 6,
      requireUppercase: false,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: false,
    },
    placeholder: 'Enter your password',
  },
  }

export const WeakPassword: Story = {
  args: {
    value: 'weak',
    placeholder: 'Enter your password',
  },
  }

export const FairPassword: Story = {
  args: {
    value: 'FairPass1',
    placeholder: 'Enter your password',
  },
  }

export const GoodPassword: Story = {
  args: {
    value: 'GoodPass123',
    placeholder: 'Enter your password',
  },
  }

export const StrongPassword: Story = {
  args: {
    value: 'StrongPass123!@#',
    placeholder: 'Enter your password',
  },
  }

export const MinimalRequirements: Story = {
  args: {
    strengthConfig: {
      minLength: 4,
      requireUppercase: false,
      requireLowercase: false,
      requireNumbers: false,
      requireSpecialChars: false,
    },
    placeholder: 'Enter your password',
  },
  }

export const StrictRequirements: Story = {
  args: {
    strengthConfig: {
      minLength: 12,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
    },
    placeholder: 'Enter your password',
  },
  }

export const CustomPlaceholder: Story = {
  args: {
    placeholder: 'Create a secure password',
  },
  }

const InteractiveComponent = (args: any) => {
  const [value, setValue] = useState(args.value || '')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <PasswordInput
        {...args}
        value={value}
        onChange={setValue}
      />
      <div style={{ fontSize: '14px', color: '#666' }}>
        Current value: {value || '(empty)'}
      </div>
    </div>
  )
}

export const Interactive: Story = {
  render: InteractiveComponent,
  tags: ['autodocs'],
  args: {
    placeholder: 'Enter your password',
  },
  }

const ComplexExampleComponent = (args: any) => {
  const [value, setValue] = useState(args.value || '')

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <PasswordInput
          {...args}
          value={value}
          onChange={setValue}
        />
        <div style={{ fontSize: '14px', color: '#666' }}>
          <div>Length: {value.length} characters</div>
          <div>Has uppercase: {/[A-Z]/.test(value) ? 'Yes' : 'No'}</div>
          <div>Has lowercase: {/[a-z]/.test(value) ? 'Yes' : 'No'}</div>
          <div>Has numbers: {/\d/.test(value) ? 'Yes' : 'No'}</div>
          <div>Has special chars: {/[!@#$%^&*(),.?":{}|<>]/.test(value) ? 'Yes' : 'No'}</div>
        </div>
      </div>
    )
}

export const ComplexExample: Story = {
  render: ComplexExampleComponent,
  tags: ['autodocs'],
  args: {
    placeholder: 'Enter your password',
    strengthConfig: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
    },
  },
  }

export const EmptyState: Story = {
  args: {
    value: '',
    placeholder: 'Enter your password',
  },
  }
