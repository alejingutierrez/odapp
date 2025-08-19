import type { Meta, StoryObj } from '@storybook/react';
import { UnitSelector } from './UnitSelector';

const meta: Meta<typeof UnitSelector> = {
  title: 'Atoms/UnitSelector',
  component: UnitSelector,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
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

const weightUnits = ['kg', 'g', 'lb', 'oz'];
const lengthUnits = ['m', 'cm', 'mm', 'in', 'ft'];
const volumeUnits = ['L', 'mL', 'gal', 'qt', 'pt'];

export const Default: Story = {
  args: {
    units: weightUnits,
    placeholder: 'Select unit',
  },
};

export const WithValue: Story = {
  args: {
    units: weightUnits,
    value: 'kg',
  },
};

export const DifferentUnitTypes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '200px' }}>
      <div>
        <label>Weight Units</label>
        <UnitSelector units={weightUnits} placeholder="Weight" />
      </div>
      <div>
        <label>Length Units</label>
        <UnitSelector units={lengthUnits} placeholder="Length" />
      </div>
      <div>
        <label>Volume Units</label>
        <UnitSelector units={volumeUnits} placeholder="Volume" />
      </div>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '200px' }}>
      <div>
        <label>Small</label>
        <UnitSelector units={weightUnits} size="small" value="kg" />
      </div>
      <div>
        <label>Middle (Default)</label>
        <UnitSelector units={weightUnits} size="middle" value="kg" />
      </div>
      <div>
        <label>Large</label>
        <UnitSelector units={weightUnits} size="large" value="kg" />
      </div>
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '200px' }}>
      <div>
        <label>Normal</label>
        <UnitSelector units={weightUnits} placeholder="Select unit" />
      </div>
      <div>
        <label>With Value</label>
        <UnitSelector units={weightUnits} value="kg" />
      </div>
      <div>
        <label>Disabled</label>
        <UnitSelector units={weightUnits} disabled value="kg" />
      </div>
    </div>
  ),
};

export const Interactive: Story = {
  args: {
    units: weightUnits,
    placeholder: 'Choose unit',
    size: 'middle',
  },
};
