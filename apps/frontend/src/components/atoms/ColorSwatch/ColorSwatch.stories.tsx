import type { Meta, StoryObj } from '@storybook/react'

import { ColorSwatch, ColorPalette } from './ColorSwatch'

const meta: Meta<typeof ColorSwatch> = {
  title: 'Atoms/ColorSwatch',
  component: ColorSwatch,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A color swatch component for fashion applications, allowing users to select colors with visual feedback.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    color: {
      control: 'color',
      description: 'The color value (hex, rgb, etc.)',
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
      description: 'Size of the color swatch',
    },
    selected: {
      control: 'boolean',
      description: 'Whether the swatch is selected',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the swatch is disabled',
    },
    showBorder: {
      control: 'boolean',
      description: 'Show border around swatch',
    },
    showTooltip: {
      control: 'boolean',
      description: 'Show tooltip with color name',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    color: '#0ea5e9',
    name: 'Sky Blue',
  },
}

export const Selected: Story = {
  args: {
    color: '#ef4444',
    name: 'Red',
    selected: true,
  },
}

export const Disabled: Story = {
  args: {
    color: '#22c55e',
    name: 'Green',
    disabled: true,
  },
}

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
      <ColorSwatch color='#0ea5e9' size='xs' name='XS' />
      <ColorSwatch color='#0ea5e9' size='sm' name='SM' />
      <ColorSwatch color='#0ea5e9' size='md' name='MD' />
      <ColorSwatch color='#0ea5e9' size='lg' name='LG' />
      <ColorSwatch color='#0ea5e9' size='xl' name='XL' />
    </div>
  ),
}

export const FashionColors: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <ColorSwatch color='#000000' name='Black' />
      <ColorSwatch color='#ffffff' name='White' />
      <ColorSwatch color='#ef4444' name='Red' />
      <ColorSwatch color='#3b82f6' name='Blue' />
      <ColorSwatch color='#22c55e' name='Green' />
      <ColorSwatch color='#f59e0b' name='Yellow' />
      <ColorSwatch color='#ec4899' name='Pink' />
      <ColorSwatch color='#a855f7' name='Purple' />
      <ColorSwatch color='#8b5cf6' name='Violet' />
      <ColorSwatch color='#06b6d4' name='Cyan' />
    </div>
  ),
}

const fashionPalette = [
  { color: '#000000', name: 'Black' },
  { color: '#ffffff', name: 'White' },
  { color: '#ef4444', name: 'Red' },
  { color: '#3b82f6', name: 'Blue' },
  { color: '#22c55e', name: 'Green' },
  { color: '#f59e0b', name: 'Yellow' },
  { color: '#ec4899', name: 'Pink' },
  { color: '#a855f7', name: 'Purple' },
  { color: '#8b5cf6', name: 'Violet' },
  { color: '#06b6d4', name: 'Cyan' },
  { color: '#84cc16', name: 'Lime' },
  { color: '#f97316', name: 'Orange' },
]

export const ColorPaletteExample: Story = {
  render: () => (
    <ColorPalette
      colors={fashionPalette}
      selectedColor='#ef4444'
      onColorSelect={(color) => console.log('Selected color:', color)}
    />
  ),
}
