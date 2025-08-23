import type { Meta, StoryObj } from '@storybook/react'

import { ProductRating } from './ProductRating'

const meta: Meta<typeof ProductRating> = {
  title: 'Molecules/ProductRating',
  component: ProductRating,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A product rating component with stars, review count, and interactive rating functionality.',
      },
    },
  },
  argTypes: {
    onChange: { action: 'rating changed' },
    size: {
      control: { type: 'select' },
      options: ['small', 'default', 'large'],
    },
  },
}

export default meta
type Story = StoryObj<typeof ProductRating>

export const Default: Story = {
  args: {
    rating: 4.2,
    reviewCount: 127,
    showCount: true,
    showValue: false,
  },
}

export const WithValue: Story = {
  args: {
    rating: 4.8,
    reviewCount: 89,
    showCount: true,
    showValue: true,
  },
}

export const Interactive: Story = {
  args: {
    rating: 3.5,
    reviewCount: 45,
    interactive: true,
    onChange: (rating) => console.log('New rating:', rating),
  },
}

export const Small: Story = {
  args: {
    rating: 4.0,
    reviewCount: 23,
    size: 'small',
  },
}

export const Large: Story = {
  args: {
    rating: 4.7,
    reviewCount: 234,
    size: 'large',
    showValue: true,
  },
}

export const NoReviews: Story = {
  args: {
    rating: 0,
    reviewCount: 0,
    showCount: true,
  },
}

export const SingleReview: Story = {
  args: {
    rating: 5.0,
    reviewCount: 1,
    showCount: true,
    showValue: true,
  },
}
