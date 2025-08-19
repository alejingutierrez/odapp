import type { Meta, StoryObj } from '@storybook/react';
import { CurrencyDisplay } from './CurrencyDisplay';

const meta: Meta<typeof CurrencyDisplay> = {
  title: 'Atoms/CurrencyDisplay',
  component: CurrencyDisplay,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    amount: {
      control: 'number',
    },
    currency: {
      control: 'select',
      options: ['USD', 'EUR', 'GBP', 'JPY', 'MXN'],
    },
    variant: {
      control: 'select',
      options: ['default', 'compact', 'large'],
    },
    theme: {
      control: 'select',
      options: ['default', 'success', 'danger', 'warning'],
    },
    colorize: {
      control: 'boolean',
    },
    showSymbol: {
      control: 'boolean',
    },
    showIcon: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    amount: 1234.56,
  },
};

export const DifferentCurrencies: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <CurrencyDisplay amount={1234.56} currency="USD" />
      <CurrencyDisplay amount={1234.56} currency="EUR" />
      <CurrencyDisplay amount={1234.56} currency="GBP" />
      <CurrencyDisplay amount={1234.56} currency="JPY" />
      <CurrencyDisplay amount={1234.56} currency="MXN" />
    </div>
  ),
};

export const WithColorization: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <CurrencyDisplay amount={1234.56} colorize />
      <CurrencyDisplay amount={-567.89} colorize />
      <CurrencyDisplay amount={0} colorize />
    </div>
  ),
};

export const WithoutSymbol: Story = {
  args: {
    amount: 1234.56,
    showSymbol: false,
  },
};

export const CustomPrecision: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <CurrencyDisplay amount={1234.5678} precision={0} />
      <CurrencyDisplay amount={1234.5678} precision={2} />
      <CurrencyDisplay amount={1234.5678} precision={4} />
    </div>
  ),
};

export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h4>Default Variant</h4>
        <CurrencyDisplay amount={1234.56} variant="default" />
      </div>
      <div>
        <h4>Compact Variant</h4>
        <CurrencyDisplay amount={1234.56} variant="compact" />
      </div>
      <div>
        <h4>Large Variant</h4>
        <CurrencyDisplay amount={1234.56} variant="large" />
      </div>
    </div>
  ),
};

export const Themes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h4>Default Theme</h4>
        <CurrencyDisplay amount={1234.56} theme="default" />
      </div>
      <div>
        <h4>Success Theme</h4>
        <CurrencyDisplay amount={1234.56} theme="success" />
      </div>
      <div>
        <h4>Danger Theme</h4>
        <CurrencyDisplay amount={-1234.56} theme="danger" />
      </div>
      <div>
        <h4>Warning Theme</h4>
        <CurrencyDisplay amount={1234.56} theme="warning" />
      </div>
    </div>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h4>USD with Icon</h4>
        <CurrencyDisplay amount={1234.56} currency="USD" showIcon />
      </div>
      <div>
        <h4>EUR with Icon</h4>
        <CurrencyDisplay amount={1234.56} currency="EUR" showIcon />
      </div>
      <div>
        <h4>GBP with Icon</h4>
        <CurrencyDisplay amount={1234.56} currency="GBP" showIcon />
      </div>
    </div>
  ),
};

export const Showcase: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, padding: 16 }}>
      <div style={{ textAlign: 'center' }}>
        <h4>Large Success</h4>
        <CurrencyDisplay amount={15420.75} variant="large" theme="success" showIcon />
      </div>
      <div style={{ textAlign: 'center' }}>
        <h4>Default Warning</h4>
        <CurrencyDisplay amount={-892.30} theme="warning" showIcon />
      </div>
      <div style={{ textAlign: 'center' }}>
        <h4>Compact EUR</h4>
        <CurrencyDisplay amount={2567.89} variant="compact" currency="EUR" showIcon />
      </div>
    </div>
  ),
};