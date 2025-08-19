import type { Meta, StoryObj } from '@storybook/react'
import { SizeSelector } from './SizeSelector'

const meta: Meta<typeof SizeSelector> = {
  title: 'Molecules/SizeSelector',
  component: SizeSelector,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A size selector with size charts, availability, and fit recommendations for fashion products.'
      }
    }
  },
  argTypes: {
    onChange: { action: 'size changed' },
    layout: {
      control: { type: 'select' },
      options: ['horizontal', 'grid']
    }
  }
}

export default meta
type Story = StoryObj<typeof SizeSelector>

const sampleSizes = [
  {
    value: 'XS',
    label: 'XS',
    available: true,
    measurements: { chest: 86, waist: 70, hips: 92, length: 65 },
    fitRecommendation: 'tight' as const
  },
  {
    value: 'S',
    label: 'S',
    available: true,
    measurements: { chest: 90, waist: 74, hips: 96, length: 67 },
    fitRecommendation: 'perfect' as const
  },
  {
    value: 'M',
    label: 'M',
    available: true,
    measurements: { chest: 94, waist: 78, hips: 100, length: 69 },
    fitRecommendation: 'perfect' as const
  },
  {
    value: 'L',
    label: 'L',
    available: false,
    measurements: { chest: 98, waist: 82, hips: 104, length: 71 },
    fitRecommendation: 'loose' as const
  },
  {
    value: 'XL',
    label: 'XL',
    available: true,
    measurements: { chest: 102, waist: 86, hips: 108, length: 73 },
    fitRecommendation: 'loose' as const
  }
]

export const Default: Story = {
  args: {
    sizes: sampleSizes,
    selectedSize: 'M',
    onChange: (size) => console.log('Selected size:', size)
  }
}

export const WithSizeChart: Story = {
  args: {
    sizes: sampleSizes,
    selectedSize: 'S',
    showSizeChart: true,
    showFitRecommendations: true,
    onChange: (size) => console.log('Selected size:', size)
  }
}

export const GridLayout: Story = {
  args: {
    sizes: sampleSizes,
    layout: 'grid',
    showFitRecommendations: true,
    onChange: (size) => console.log('Selected size:', size)
  }
}

export const WithoutRecommendations: Story = {
  args: {
    sizes: sampleSizes,
    showFitRecommendations: false,
    showSizeChart: false,
    onChange: (size) => console.log('Selected size:', size)
  }
}

export const LimitedAvailability: Story = {
  args: {
    sizes: sampleSizes.map(size => ({
      ...size,
      available: ['XS', 'S'].includes(size.value)
    })),
    showAvailability: true,
    onChange: (size) => console.log('Selected size:', size)
  }
}