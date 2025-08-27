import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'

import { PriceDisplay } from './PriceDisplay'

const meta: Meta<typeof PriceDisplay> = {
  title: 'Molecules/PriceDisplay',
  component: PriceDisplay,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A flexible price display component that shows current price, compare-at price, discounts, and tax information. Supports different currencies, locales, sizes, and layouts.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['small', 'default', 'large'],
    },
    layout: {
      control: { type: 'select' },
      options: ['horizontal', 'vertical'],
    },
    currency: {
      control: { type: 'select' },
      options: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'],
    },
  },
  decorators: [
    (Story) => (
      <div style={{ padding: '20px', maxWidth: '400px' }}>
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof PriceDisplay>

export const Default: Story = {
  args: {
    price: 29.99,
    currency: 'USD',
    locale: 'en-US',
  },
}

export const WithDiscount: Story = {
  args: {
    price: 29.99,
    compareAtPrice: 39.99,
    currency: 'USD',
    locale: 'en-US',
    showDiscount: true,
  },
}

export const LargeSize: Story = {
  args: {
    price: 199.99,
    compareAtPrice: 249.99,
    currency: 'USD',
    locale: 'en-US',
    size: 'large',
    showDiscount: true,
  },
}

export const SmallSize: Story = {
  args: {
    price: 9.99,
    compareAtPrice: 14.99,
    currency: 'USD',
    locale: 'en-US',
    size: 'small',
    showDiscount: true,
  },
}

export const VerticalLayout: Story = {
  args: {
    price: 79.99,
    compareAtPrice: 99.99,
    currency: 'USD',
    locale: 'en-US',
    layout: 'vertical',
    showDiscount: true,
  },
}

export const WithTax: Story = {
  args: {
    price: 49.99,
    compareAtPrice: 59.99,
    currency: 'USD',
    locale: 'en-US',
    showDiscount: true,
    showTax: true,
    taxRate: 8.5,
    taxIncluded: false,
  },
}

export const TaxIncluded: Story = {
  args: {
    price: 54.99,
    compareAtPrice: 64.99,
    currency: 'USD',
    locale: 'en-US',
    showDiscount: true,
    showTax: true,
    taxRate: 8.5,
    taxIncluded: true,
  },
}

export const EuroCurrency: Story = {
  args: {
    price: 24.99,
    compareAtPrice: 34.99,
    currency: 'EUR',
    locale: 'de-DE',
    showDiscount: true,
  },
}

export const BritishPound: Story = {
  args: {
    price: 19.99,
    compareAtPrice: 24.99,
    currency: 'GBP',
    locale: 'en-GB',
    showDiscount: true,
  },
}

export const CanadianDollar: Story = {
  args: {
    price: 34.99,
    compareAtPrice: 44.99,
    currency: 'CAD',
    locale: 'en-CA',
    showDiscount: true,
  },
}

export const JapaneseYen: Story = {
  args: {
    price: 2999,
    compareAtPrice: 3999,
    currency: 'JPY',
    locale: 'ja-JP',
    showDiscount: true,
  },
}

export const NoCurrency: Story = {
  args: {
    price: 29.99,
    compareAtPrice: 39.99,
    showCurrency: false,
    showDiscount: true,
  },
}

export const NoDiscount: Story = {
  args: {
    price: 29.99,
    compareAtPrice: 39.99,
    currency: 'USD',
    locale: 'en-US',
    showDiscount: false,
  },
}

export const HighValue: Story = {
  args: {
    price: 1299.99,
    compareAtPrice: 1599.99,
    currency: 'USD',
    locale: 'en-US',
    showDiscount: true,
    size: 'large',
  },
}

export const ZeroPrice: Story = {
  args: {
    price: 0,
    currency: 'USD',
    locale: 'en-US',
  },
}

export const FreeWithCompare: Story = {
  args: {
    price: 0,
    compareAtPrice: 29.99,
    currency: 'USD',
    locale: 'en-US',
    showDiscount: true,
  },
}

export const ComplexExample: Story = {
  args: {
    price: 89.99,
    compareAtPrice: 119.99,
    currency: 'USD',
    locale: 'en-US',
    showDiscount: true,
    showTax: true,
    taxRate: 7.25,
    taxIncluded: false,
    size: 'large',
    layout: 'vertical',
  },
}

export const CompactHorizontal: Story = {
  args: {
    price: 15.99,
    compareAtPrice: 19.99,
    currency: 'USD',
    locale: 'en-US',
    showDiscount: true,
    size: 'small',
    layout: 'horizontal',
  },
}

export const AustralianDollar: Story = {
  args: {
    price: 39.99,
    compareAtPrice: 49.99,
    currency: 'AUD',
    locale: 'en-AU',
    showDiscount: true,
  },
}
