import type { Meta, StoryObj } from '@storybook/react'
import { Space } from 'antd'
import { TaxRateDisplay } from './TaxRateDisplay'

const meta: Meta<typeof TaxRateDisplay> = {
  title: 'Atoms/TaxRateDisplay',
  component: TaxRateDisplay,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A component for displaying tax rates with percentage formatting and breakdown tooltips for ERP systems.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'compact', 'detailed', 'badge'],
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
    currency: {
      control: 'text',
    },
    region: {
      control: 'text',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    rate: 8.25,
    amount: 16.50,
    currency: '$',
  },
}

export const Variants: Story = {
  render: () => (
    <Space direction="vertical" size="large">
      <div>
        <h4>Default</h4>
        <TaxRateDisplay rate={8.25} amount={16.50} />
      </div>
      <div>
        <h4>Compact</h4>
        <TaxRateDisplay rate={8.25} amount={16.50} variant="compact" label="Tax" />
      </div>
      <div>
        <h4>Detailed</h4>
        <TaxRateDisplay 
          rate={8.25} 
          amount={16.50} 
          variant="detailed" 
          label="Sales Tax"
          region="CA, USA"
          inclusive
        />
      </div>
      <div>
        <h4>Badge</h4>
        <TaxRateDisplay rate={8.25} variant="badge" />
      </div>
    </Space>
  ),
}

export const WithBreakdown: Story = {
  args: {
    rate: 10.25,
    amount: 20.50,
    breakdown: [
      { name: 'Federal Tax', rate: 5.0, amount: 10.00, type: 'federal' },
      { name: 'State Tax', rate: 3.0, amount: 6.00, type: 'state' },
      { name: 'Local Tax', rate: 2.25, amount: 4.50, type: 'local' },
    ],
    region: 'New York, USA',
    showBreakdown: true,
  },
}

export const TaxExempt: Story = {
  render: () => (
    <Space wrap>
      <TaxRateDisplay 
        rate={0} 
        exempt 
        exemptReason="Non-profit organization" 
      />
      <TaxRateDisplay 
        rate={0} 
        exempt 
        exemptReason="Resale certificate" 
        variant="compact"
        label="Tax Status"
      />
      <TaxRateDisplay 
        rate={0} 
        exempt 
        variant="badge"
      />
    </Space>
  ),
}

export const Sizes: Story = {
  render: () => (
    <Space wrap align="center">
      <TaxRateDisplay rate={8.25} amount={16.50} size="small" />
      <TaxRateDisplay rate={8.25} amount={16.50} size="medium" />
      <TaxRateDisplay rate={8.25} amount={16.50} size="large" />
    </Space>
  ),
}

export const InternationalTaxes: Story = {
  render: () => (
    <Space direction="vertical" size="middle">
      <TaxRateDisplay 
        rate={20.0} 
        amount={40.00} 
        currency="£"
        label="VAT"
        region="United Kingdom"
        breakdown={[
          { name: 'Value Added Tax', rate: 20.0, amount: 40.00, type: 'vat' }
        ]}
        inclusive
      />
      <TaxRateDisplay 
        rate={19.0} 
        amount={38.00} 
        currency="€"
        label="MwSt"
        region="Germany"
        breakdown={[
          { name: 'Mehrwertsteuer', rate: 19.0, amount: 38.00, type: 'vat' }
        ]}
      />
      <TaxRateDisplay 
        rate={10.0} 
        amount={20.00} 
        currency="¥"
        label="GST"
        region="Japan"
        breakdown={[
          { name: 'Goods and Services Tax', rate: 10.0, amount: 20.00, type: 'gst' }
        ]}
      />
    </Space>
  ),
}

export const Interactive: Story = {
  render: () => (
    <Space wrap>
      <TaxRateDisplay 
        rate={8.25} 
        amount={16.50} 
        onClick={() => alert('Tax details clicked!')}
        label="Clickable Tax"
      />
      <TaxRateDisplay 
        rate={10.0} 
        amount={20.00} 
        variant="detailed"
        onClick={() => alert('Detailed tax clicked!')}
        label="Sales Tax"
        region="California"
      />
    </Space>
  ),
}