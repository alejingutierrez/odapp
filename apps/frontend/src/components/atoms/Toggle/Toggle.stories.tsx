import type { Meta, StoryObj } from '@storybook/react'
import { Toggle } from './Toggle'

const meta: Meta<typeof Toggle> = {
  title: 'Atoms/Toggle',
  component: Toggle,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['small', 'default'],
    },
    disabled: {
      control: 'boolean',
    },
    loading: {
      control: 'boolean',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {},
}

export const WithLabels: Story = {
  args: {
    onLabel: 'ON',
    offLabel: 'OFF',
  },
}

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <label>Small</label>
        <Toggle size='small' />
      </div>
      <div>
        <label>Default</label>
        <Toggle />
      </div>
    </div>
  ),
}

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <label>Normal</label>
        <Toggle />
      </div>
      <div>
        <label>Checked</label>
        <Toggle defaultChecked />
      </div>
      <div>
        <label>Disabled</label>
        <Toggle disabled />
      </div>
      <div>
        <label>Loading</label>
        <Toggle loading />
      </div>
    </div>
  ),
}

export const Interactive: Story = {
  args: {
    onLabel: '✓',
    offLabel: '✗',
  },
}
