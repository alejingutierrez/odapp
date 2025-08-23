import type { Meta, StoryObj } from '@storybook/react'
import { PlusOutlined, EditOutlined } from '@ant-design/icons'
import { Button } from './Button'

const meta: Meta<typeof Button> = {
  title: 'Atoms/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A customizable button component built on top of Ant Design with additional variants and styling options.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger', 'ghost', 'link', 'text'],
      description: 'Button variant style',
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: 'Button size',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Make button full width',
    },
    loading: {
      control: 'boolean',
      description: 'Show loading state',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable button',
    },
    iconPosition: {
      control: 'select',
      options: ['start', 'end'],
      description: 'Icon position relative to text',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button',
  },
}

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Button',
  },
}

export const Danger: Story = {
  args: {
    variant: 'danger',
    children: 'Danger Button',
  },
}

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Ghost Button',
  },
}

export const Link: Story = {
  args: {
    variant: 'link',
    children: 'Link Button',
  },
}

export const Text: Story = {
  args: {
    variant: 'text',
    children: 'Text Button',
  },
}

export const WithIcon: Story = {
  args: {
    variant: 'primary',
    children: 'Add Item',
    icon: <PlusOutlined />,
  },
}

export const IconEnd: Story = {
  args: {
    variant: 'secondary',
    children: 'Edit Item',
    icon: <EditOutlined />,
    iconPosition: 'end',
  },
}

export const Loading: Story = {
  args: {
    variant: 'primary',
    children: 'Loading Button',
    loading: true,
  },
}

export const Disabled: Story = {
  args: {
    variant: 'primary',
    children: 'Disabled Button',
    disabled: true,
  },
}

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
      <Button variant='primary' size='small'>
        Small
      </Button>
      <Button variant='primary' size='middle'>
        Middle
      </Button>
      <Button variant='primary' size='large'>
        Large
      </Button>
    </div>
  ),
}

export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
      <Button variant='primary'>Primary</Button>
      <Button variant='secondary'>Secondary</Button>
      <Button variant='danger'>Danger</Button>
      <Button variant='ghost'>Ghost</Button>
      <Button variant='link'>Link</Button>
      <Button variant='text'>Text</Button>
    </div>
  ),
}

export const FullWidth: Story = {
  args: {
    variant: 'primary',
    children: 'Full Width Button',
    fullWidth: true,
  },
}
