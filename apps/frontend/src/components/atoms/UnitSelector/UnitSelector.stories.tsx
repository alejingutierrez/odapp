import type { Meta, StoryObj } from '@storybook/react'

import { UnitSelector } from './UnitSelector'
import type { Unit } from './UnitSelector'

const meta: Meta<typeof UnitSelector> = {
  title: 'Atoms/UnitSelector',
  component: UnitSelector,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['small', 'middle', 'large'],
    },
    category: {
      control: { type: 'select' },
      options: ['weight', 'length', 'area', 'volume', 'quantity', 'all'],
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

// Create proper Unit objects
const weightUnits: Unit[] = [
  { code: 'kg', name: 'Kilogram', symbol: 'kg', category: 'weight' },
  { code: 'g', name: 'Gram', symbol: 'g', category: 'weight' },
  { code: 'lb', name: 'Pound', symbol: 'lb', category: 'weight' },
  { code: 'oz', name: 'Ounce', symbol: 'oz', category: 'weight' },
]

const lengthUnits: Unit[] = [
  { code: 'm', name: 'Meter', symbol: 'm', category: 'length' },
  { code: 'cm', name: 'Centimeter', symbol: 'cm', category: 'length' },
  { code: 'mm', name: 'Millimeter', symbol: 'mm', category: 'length' },
  { code: 'in', name: 'Inch', symbol: 'in', category: 'length' },
  { code: 'ft', name: 'Foot', symbol: 'ft', category: 'length' },
]

const volumeUnits: Unit[] = [
  { code: 'L', name: 'Liter', symbol: 'L', category: 'volume' },
  { code: 'mL', name: 'Milliliter', symbol: 'mL', category: 'volume' },
  { code: 'gal', name: 'Gallon', symbol: 'gal', category: 'volume' },
  { code: 'qt', name: 'Quart', symbol: 'qt', category: 'volume' },
  { code: 'pt', name: 'Pint', symbol: 'pt', category: 'volume' },
]

export const Default: Story = {
  args: {
    units: weightUnits,
    placeholder: 'Select unit',
  },
}

export const WithValue: Story = {
  args: {
    units: weightUnits,
    value: 'kg',
  },
}

export const DifferentUnitTypes: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        width: '200px',
      }}
    >
      <div>
        <label>Weight Units</label>
        <UnitSelector units={weightUnits} placeholder='Weight' />
      </div>
      <div>
        <label>Length Units</label>
        <UnitSelector units={lengthUnits} placeholder='Length' />
      </div>
      <div>
        <label>Volume Units</label>
        <UnitSelector units={volumeUnits} placeholder='Volume' />
      </div>
    </div>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        width: '200px',
      }}
    >
      <div>
        <label>Small</label>
        <UnitSelector units={weightUnits} size='small' value='kg' />
      </div>
      <div>
        <label>Middle (Default)</label>
        <UnitSelector units={weightUnits} size='middle' value='kg' />
      </div>
      <div>
        <label>Large</label>
        <UnitSelector units={weightUnits} size='large' value='kg' />
      </div>
    </div>
  ),
}

export const States: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        width: '200px',
      }}
    >
      <div>
        <label>Normal</label>
        <UnitSelector units={weightUnits} placeholder='Select unit' />
      </div>
      <div>
        <label>With Value</label>
        <UnitSelector units={weightUnits} value='kg' />
      </div>
      <div>
        <label>Disabled</label>
        <UnitSelector units={weightUnits} disabled value='kg' />
      </div>
    </div>
  ),
}

export const Interactive: Story = {
  args: {
    units: weightUnits,
    placeholder: 'Choose unit',
  },
}
