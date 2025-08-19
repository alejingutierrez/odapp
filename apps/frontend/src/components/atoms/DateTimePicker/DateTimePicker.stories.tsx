import type { Meta, StoryObj } from '@storybook/react';
import { DateTimePicker } from './DateTimePicker';
import dayjs from 'dayjs';

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
    showTime: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: 'Select date and time',
  },
};

export const WithValue: Story = {
  args: {
    value: dayjs(),
    placeholder: 'Select date and time',
  },
};

export const DateOnly: Story = {
  args: {
    showTime: false,
    placeholder: 'Select date',
  },
};

export const TimeOnly: Story = {
  args: {
    picker: 'time',
    placeholder: 'Select time',
  },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '250px' }}>
      <div>
        <label>Small</label>
        <DateTimePicker size="small" placeholder="Small picker" />
      </div>
      <div>
        <label>Middle (Default)</label>
        <DateTimePicker size="middle" placeholder="Middle picker" />
      </div>
      <div>
        <label>Large</label>
        <DateTimePicker size="large" placeholder="Large picker" />
      </div>
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '250px' }}>
      <div>
        <label>Normal</label>
        <DateTimePicker placeholder="Normal state" />
      </div>
      <div>
        <label>Disabled</label>
        <DateTimePicker disabled placeholder="Disabled state" />
      </div>
      <div>
        <label>With Error</label>
        <DateTimePicker status="error" placeholder="Error state" />
      </div>
    </div>
  ),
};

export const WithCustomFormat: Story = {
  args: {
    format: 'DD/MM/YYYY HH:mm',
    placeholder: 'DD/MM/YYYY HH:mm',
  },
};

export const RangePicker: Story = {
  render: () => (
    <div style={{ width: '300px' }}>
      <DateTimePicker.RangePicker placeholder={['Start date', 'End date']} />
    </div>
  ),
};
