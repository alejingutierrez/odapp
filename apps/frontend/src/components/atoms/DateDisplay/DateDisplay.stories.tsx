import type { Meta, StoryObj } from '@storybook/react'
import { DateDisplay } from './DateDisplay'

const meta: Meta<typeof DateDisplay> = {
  title: 'Atoms/DateDisplay',
  component: DateDisplay,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    format: {
      control: 'select',
      options: ['short', 'medium', 'long', 'relative', 'time', 'datetime'],
    },
    showIcon: {
      control: 'boolean',
    },
    showTooltip: {
      control: 'boolean',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

const sampleDate = new Date('2024-03-15T14:30:00')

export const Default: Story = {
  args: {
    date: sampleDate,
  },
}

export const AllFormats: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <DateDisplay date={sampleDate} format='short' />
      <DateDisplay date={sampleDate} format='medium' />
      <DateDisplay date={sampleDate} format='long' />
      <DateDisplay date={sampleDate} format='time' />
      <DateDisplay date={sampleDate} format='datetime' />
      <DateDisplay date={new Date()} format='relative' />
    </div>
  ),
}

export const WithIcon: Story = {
  args: {
    date: sampleDate,
    showIcon: true,
  },
}

export const RelativeDates: Story = {
  render: () => {
    const today = new Date()
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <DateDisplay date={today} format='relative' />
        <DateDisplay date={yesterday} format='relative' />
        <DateDisplay date={tomorrow} format='relative' />
        <DateDisplay date={weekAgo} format='relative' />
      </div>
    )
  },
}

export const WithoutTooltip: Story = {
  args: {
    date: sampleDate,
    showTooltip: false,
  },
}
