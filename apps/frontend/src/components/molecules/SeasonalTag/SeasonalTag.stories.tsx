import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'

import { SeasonalTag } from './SeasonalTag'

const meta: Meta<typeof SeasonalTag> = {
  title: 'Molecules/SeasonalTag',
  component: SeasonalTag,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A seasonal tag for fashion collections with trend indicators and animations.',
      },
    },
  },
  argTypes: {
    season: {
      control: { type: 'select' },
      options: ['spring', 'summer', 'autumn', 'winter'],
    },
    trendLevel: {
      control: { type: 'select' },
      options: ['low', 'medium', 'high', 'trending'],
    },
    size: {
      control: { type: 'select' },
      options: ['small', 'default', 'large'],
    },
  },
}

export default meta
type Story = StoryObj<typeof SeasonalTag>

export const Spring: Story = {
  args: {
    season: 'spring',
    year: 2024,
    collection: 'Fresh Blooms',
  },
}

export const Summer: Story = {
  args: {
    season: 'summer',
    year: 2024,
    collection: 'Beach Vibes',
    trendLevel: 'trending',
  },
}

export const Autumn: Story = {
  args: {
    season: 'autumn',
    year: 2024,
    collection: 'Cozy Layers',
    trendLevel: 'high',
  },
}

export const Winter: Story = {
  args: {
    season: 'winter',
    year: 2024,
    collection: 'Winter Warmth',
    animated: true,
  },
}

export const WithoutYear: Story = {
  args: {
    season: 'spring',
    collection: 'Timeless Collection',
  },
}

export const WithoutCollection: Story = {
  args: {
    season: 'summer',
    year: 2024,
    trendLevel: 'trending',
  },
}

export const Trending: Story = {
  args: {
    season: 'autumn',
    year: 2024,
    collection: 'Hot Trends',
    trendLevel: 'trending',
    animated: true,
  },
}

export const Small: Story = {
  args: {
    season: 'winter',
    year: 2024,
    size: 'small',
  },
}

export const Large: Story = {
  args: {
    season: 'spring',
    year: 2024,
    collection: 'Premium Collection',
    size: 'large',
    trendLevel: 'high',
  },
}

export const AllSeasons: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <SeasonalTag season='spring' year={2024} collection='Fresh' />
      <SeasonalTag
        season='summer'
        year={2024}
        collection='Bright'
        trendLevel='trending'
      />
      <SeasonalTag
        season='autumn'
        year={2024}
        collection='Warm'
        trendLevel='high'
      />
      <SeasonalTag season='winter' year={2024} collection='Cozy' animated />
    </div>
  ),
}
