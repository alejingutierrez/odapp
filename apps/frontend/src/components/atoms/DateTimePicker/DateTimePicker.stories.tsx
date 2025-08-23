import type { Meta, StoryObj } from '@storybook/react'
import { DateTimePicker } from './DateTimePicker'
import dayjs from 'dayjs'

const meta: Meta<typeof DateTimePicker> = {
  title: 'Atoms/DateTimePicker',
  component: DateTimePicker,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['small', 'middle', 'large'],
    },
    disabled: {
      control: 'boolean',
    },

  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    placeholder: { date: 'Select date and time' },
  },
}

export const WithValue: Story = {
  args: {
    value: dayjs(),
    placeholder: { date: 'Select date and time' },
  },
}

export const DateOnly: Story = {
  args: {
    placeholder: { date: 'Select date' },
  },
}

export const TimeOnly: Story = {
  args: {
    timeFormat: 'HH:mm:ss',
    placeholder: { time: 'Select time' },
  },
}

export const Sizes: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        width: '250px',
      }}
    >
      <div>
        <label>Small</label>
        <DateTimePicker size='small' placeholder={{ date: 'Small picker' }} />
      </div>
      <div>
        <label>Middle (Default)</label>
        <DateTimePicker size='medium' placeholder={{ date: 'Middle picker' }} />
      </div>
      <div>
        <label>Large</label>
        <DateTimePicker size='large' placeholder={{ date: 'Large picker' }} />
      </div>
    </div>
  ),
}

export const States: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        width: '250px',
      }}
    >
      <div>
        <label>Normal</label>
        <DateTimePicker placeholder={{ date: 'Normal state' }} />
      </div>
      <div>
        <label>Disabled</label>
        <DateTimePicker disabled placeholder={{ date: 'Disabled state' }} />
      </div>
      <div>
        <label>With Error</label>
        <DateTimePicker validationError='Error message' placeholder={{ date: 'Error state' }} />
      </div>
    </div>
  ),
}

export const WithCustomFormat: Story = {
  args: {
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    placeholder: { date: 'DD/MM/YYYY', time: 'HH:mm' },
  },
}


