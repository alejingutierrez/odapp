import type { Meta, StoryObj } from '@storybook/react';
import { CurrencyInput } from './CurrencyInput';

const meta: Meta<typeof CurrencyInput> = {
  title: 'Atoms/CurrencyInput',
  component: CurrencyInput,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    currency: {
      control: 'select',
      options: ['USD', 'EUR', 'GBP', 'JPY', 'MXN'],
    },
    precision: {
      control: 'number',
      min: 0,
      max: 4,
    },
    size: {
      control: 'select',
      options: ['small', 'middle', 'large'],
    },
    disabled: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: 'Enter amount',
  },
};

export const WithValue: Story = {
  args: {
    value: 1234.56,
    currency: 'USD',
  },
};

export const DifferentCurrencies: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '200px' }}>
      <CurrencyInput currency="USD" placeholder="USD Amount" />
      <CurrencyInput currency="EUR" placeholder="EUR Amount" />
      <CurrencyInput currency="GBP" placeholder="GBP Amount" />
      <CurrencyInput currency="JPY" placeholder="JPY Amount" />
    </div>
  ),
};

export const WithPrecision: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '200px' }}>
      <div>
        <label>No decimals (precision: 0)</label>
        <CurrencyInput precision={0} placeholder="Enter whole amount" />
      </div>
      <div>
        <label>2 decimals (default)</label>
        <CurrencyInput precision={2} placeholder="Enter amount" />
      </div>
      <div>
        <label>4 decimals</label>
        <CurrencyInput precision={4} placeholder="Enter precise amount" />
      </div>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '200px' }}>
      <div>
        <label>Small</label>
        <CurrencyInput size="small" placeholder="Small input" />
      </div>
      <div>
        <label>Middle (Default)</label>
        <CurrencyInput size="middle" placeholder="Middle input" />
      </div>
      <div>
        <label>Large</label>
        <CurrencyInput size="large" placeholder="Large input" />
      </div>
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '200px' }}>
      <div>
        <label>Normal</label>
        <CurrencyInput placeholder="Normal state" />
      </div>
      <div>
        <label>Disabled</label>
        <CurrencyInput disabled placeholder="Disabled state" />
      </div>
      <div>
        <label>With Error</label>
        <CurrencyInput status="error" placeholder="Error state" />
      </div>
      <div>
        <label>With Warning</label>
        <CurrencyInput status="warning" placeholder="Warning state" />
      </div>
    </div>
  ),
};

export const Interactive: Story = {
  args: {
    currency: 'USD',
    precision: 2,
    placeholder: 'Enter amount',
    size: 'middle',
  },
};
