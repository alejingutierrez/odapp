import type { Meta, StoryObj } from '@storybook/react';
import { RangeSlider } from './RangeSlider';

const meta: Meta<typeof RangeSlider> = {
  title: 'Atoms/RangeSlider',
  component: RangeSlider,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    min: {
      control: 'number',
    },
    max: {
      control: 'number',
    },
    step: {
      control: 'number',
    },
    disabled: {
      control: 'boolean',
    },
    range: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    value: [20, 80],
  },
};

export const Range: Story = {
  args: {
    range: true,
    value: [20, 80],
  },
};

export const WithMarks: Story = {
  args: {
    marks: {
      0: '0°C',
      26: '26°C',
      37: '37°C',
      100: '100°C',
    },
    value: [26, 37],
  },
};

export const WithStep: Story = {
  args: {
    step: 10,
    value: [30, 70],
    marks: {
      0: '0',
      10: '10',
      20: '20',
      30: '30',
      40: '40',
      50: '50',
      60: '60',
      70: '70',
      80: '80',
      90: '90',
      100: '100',
    },
  },
};

export const PriceRange: Story = {
  render: () => (
    <div style={{ width: '300px', padding: '20px' }}>
      <h4>Price Range</h4>
      <RangeSlider
        range
        min={0}
        max={1000}
        value={[100, 500]}
        marks={{
          0: '$0',
          250: '$250',
          500: '$500',
          750: '$750',
          1000: '$1000',
        }}
      />
    </div>
  ),
};

export const Disabled: Story = {
  args: {
    disabled: true,
    value: [30, 70],
  },
};

export const WithInputs: Story = {
  args: {
    value: [25, 75],
    showInputs: true,
    showLabels: true,
  },
};

export const WithRangeInfo: Story = {
  args: {
    value: [20, 80],
    showRange: true,
    showLabels: true,
  },
};

export const WithFormatter: Story = {
  args: {
    value: [100, 500],
    min: 0,
    max: 1000,
    formatter: (value: number) => `$${value}`,
    parser: (value: string) => parseFloat(value.replace('$', '')),
    prefix: '$',
  },
};
