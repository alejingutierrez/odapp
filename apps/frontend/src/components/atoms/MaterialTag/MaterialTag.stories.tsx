import type { Meta, StoryObj } from '@storybook/react';
import { MaterialTag, MaterialComposition, CareInstructions } from './MaterialTag';

const meta: Meta<typeof MaterialTag> = {
  title: 'Atoms/MaterialTag',
  component: MaterialTag,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A material tag component for fashion applications, showing fabric composition and certifications.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    material: {
      control: 'text',
      description: 'The material name',
    },
    percentage: {
      control: 'number',
      description: 'Material percentage in composition',
    },
    certification: {
      control: 'select',
      options: ['organic', 'recycled', 'sustainable', 'fair-trade', 'gots', 'oeko-tex'],
      description: 'Material certification',
    },
    variant: {
      control: 'select',
      options: ['default', 'detailed', 'compact', 'minimal'],
      description: 'Display variant',
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: 'Tag size',
    },
    showIcon: {
      control: 'boolean',
      description: 'Show certification icon',
    },
    showPercentage: {
      control: 'boolean',
      description: 'Show material percentage',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    material: 'Cotton',
    percentage: 95,
  },
};

export const WithCertification: Story = {
  args: {
    material: 'Cotton',
    percentage: 100,
    certification: 'organic',
  },
};

export const Recycled: Story = {
  args: {
    material: 'Polyester',
    percentage: 80,
    certification: 'recycled',
  },
};

export const Sustainable: Story = {
  args: {
    material: 'Bamboo',
    percentage: 70,
    certification: 'sustainable',
  },
};

export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
      <MaterialTag material="Cotton" percentage={95} variant="default" />
      <MaterialTag material="Cotton" percentage={95} variant="compact" />
      <MaterialTag material="Cotton" percentage={95} variant="minimal" />
      <MaterialTag material="Cotton" percentage={95} certification="organic" variant="detailed" />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
      <MaterialTag material="Cotton" percentage={95} size="small" />
      <MaterialTag material="Cotton" percentage={95} size="medium" />
      <MaterialTag material="Cotton" percentage={95} size="large" />
    </div>
  ),
};

export const Certifications: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <MaterialTag material="Cotton" certification="organic" />
      <MaterialTag material="Polyester" certification="recycled" />
      <MaterialTag material="Hemp" certification="sustainable" />
      <MaterialTag material="Cotton" certification="fair-trade" />
      <MaterialTag material="Cotton" certification="gots" />
      <MaterialTag material="Cotton" certification="oeko-tex" />
    </div>
  ),
};

const materialComposition = [
  { material: 'Cotton', percentage: 95, certification: 'organic' as const },
  { material: 'Elastane', percentage: 5 },
];

export const MaterialCompositionExample: Story = {
  render: () => (
    <MaterialComposition
      materials={materialComposition}
      onMaterialClick={(material) => console.log('Clicked material:', material)}
    />
  ),
};

const careInstructions = [
  { type: 'wash' as const, temperature: 30, method: 'gentle cycle' },
  { type: 'dry' as const, method: 'hang dry' },
  { type: 'iron' as const, temperature: 110, warning: false },
  { type: 'bleach' as const, warning: true },
  { type: 'dry-clean' as const, warning: false },
];

export const CareInstructionsExample: Story = {
  render: () => (
    <CareInstructions instructions={careInstructions} />
  ),
};