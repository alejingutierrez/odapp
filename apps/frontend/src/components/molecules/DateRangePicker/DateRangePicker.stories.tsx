import type { Meta, StoryObj } from '@storybook/react'
import React, { useState } from 'react'
import dayjs from 'dayjs'

import { DateRangePicker } from './DateRangePicker'
import type { DateRange } from './DateRangePicker'

const meta: Meta<typeof DateRangePicker> = {
  title: 'Molecules/DateRangePicker',
  component: DateRangePicker,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A comprehensive date range picker component with preset options, time selection, and visual feedback. Built on top of Ant Design DatePicker with enhanced features for date range selection.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['small', 'middle', 'large'],
    },
    showPresets: { control: 'boolean' },
    showTime: { control: 'boolean' },
    disabled: { control: 'boolean' },
    allowClear: { control: 'boolean' },
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
type Story = StoryObj<typeof DateRangePicker>

const sampleRange: DateRange = {
  start: dayjs().subtract(7, 'day'),
  end: dayjs(),
}

const longRange: DateRange = {
  start: dayjs().subtract(30, 'day'),
  end: dayjs(),
}

const pastRange: DateRange = {
  start: dayjs().subtract(90, 'day'),
  end: dayjs().subtract(30, 'day'),
}

export const Default: Story = {
  args: {
    placeholder: ['Start date', 'End date'],
  },
}

export const WithPreselectedValue: Story = {
  args: {
    value: sampleRange,
    placeholder: ['Start date', 'End date'],
  },
}

export const WithoutPresets: Story = {
  args: {
    showPresets: false,
    placeholder: ['Start date', 'End date'],
  },
}

export const WithTime: Story = {
  args: {
    showTime: true,
    format: 'YYYY-MM-DD HH:mm:ss',
    placeholder: ['Start date & time', 'End date & time'],
  },
}

export const SmallSize: Story = {
  args: {
    size: 'small',
    placeholder: ['Start date', 'End date'],
  },
}

export const LargeSize: Story = {
  args: {
    size: 'large',
    placeholder: ['Start date', 'End date'],
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
    value: sampleRange,
    placeholder: ['Start date', 'End date'],
  },
}

export const WithoutClear: Story = {
  args: {
    allowClear: false,
    value: sampleRange,
    placeholder: ['Start date', 'End date'],
  },
}

export const CustomFormat: Story = {
  args: {
    format: 'MM/DD/YYYY',
    placeholder: ['Start date', 'End date'],
  },
}

export const LongRange: Story = {
  args: {
    value: longRange,
    placeholder: ['Start date', 'End date'],
  },
}

export const PastRange: Story = {
  args: {
    value: pastRange,
    placeholder: ['Start date', 'End date'],
  },
}

export const CustomPlaceholder: Story = {
  args: {
    placeholder: ['From date', 'To date'],
  },
}

export const MinimalConfiguration: Story = {
  args: {
    showPresets: false,
    allowClear: false,
    placeholder: ['Start', 'End'],
  },
}

export const Interactive: Story = {
  render: (args) => {
    const [value, setValue] = useState<DateRange | undefined>(args.value)

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <DateRangePicker
          {...args}
          value={value}
          onChange={setValue}
        />
        <div style={{ fontSize: '14px', color: '#666' }}>
          Selected: {value?.start?.format('YYYY-MM-DD')} to {value?.end?.format('YYYY-MM-DD')}
        </div>
      </div>
    )
  },
  args: {
    placeholder: ['Start date', 'End date'],
  },
}

export const ComplexExample: Story = {
  render: (args) => {
    const [value, setValue] = useState<DateRange | undefined>(args.value)

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <DateRangePicker
          {...args}
          value={value}
          onChange={setValue}
        />
        <div style={{ fontSize: '14px', color: '#666' }}>
          {value?.start && value?.end ? (
            <>
              <div>Start: {value.start.format('YYYY-MM-DD HH:mm:ss')}</div>
              <div>End: {value.end.format('YYYY-MM-DD HH:mm:ss')}</div>
              <div>Duration: {value.end.diff(value.start, 'day') + 1} days</div>
            </>
          ) : (
            'No date range selected'
          )}
        </div>
      </div>
    )
  },
  args: {
    showTime: true,
    format: 'YYYY-MM-DD HH:mm:ss',
    placeholder: ['Start date & time', 'End date & time'],
  },
}

export const WithTimeAndPresets: Story = {
  args: {
    showTime: true,
    showPresets: true,
    format: 'YYYY-MM-DD HH:mm:ss',
    placeholder: ['Start date & time', 'End date & time'],
  },
}

export const EmptyState: Story = {
  args: {
    value: { start: null, end: null },
    placeholder: ['Start date', 'End date'],
  },
}
