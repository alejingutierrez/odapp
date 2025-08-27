import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'

import { MaterialTagMolecule } from './MaterialTagMolecule'
import type { MaterialInfo } from './MaterialTagMolecule'

const meta: Meta<typeof MaterialTagMolecule> = {
  title: 'Molecules/MaterialTagMolecule',
  component: MaterialTagMolecule,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A comprehensive material tag component that displays material information with texture preview, sustainability indicators, and detailed modal information. Perfect for e-commerce product pages and material catalogs.',
      },

    },
  },
  tags: ['autodocs'],
  argTypes: {
    showTexture: { control: 'boolean' },
    showSustainability: { control: 'boolean' },
    showCareInfo: { control: 'boolean' },
    interactive: { control: 'boolean' },
    size: {
      control: { type: 'select' },
      options: ['small', 'default', 'large'],
    },
  },
  decorators: [
    (Story) => (
      <div style={{ padding: '20px', maxWidth: '600px' }}>
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof MaterialTagMolecule>

const cottonMaterial: MaterialInfo = {
  name: 'Organic Cotton',
  composition: '100% Organic Cotton',
  texture: 'soft',
  careInstructions: [
    'Machine wash cold',
    'Tumble dry low',
    'Iron on low heat if needed',
    'Do not bleach',
  ],
  sustainability: {
    score: 85,
    recyclable: true,
    organic: true,
    certifications: ['GOTS', 'OEKO-TEX'],
  },
  properties: {
    breathable: true,
    waterResistant: false,
    stretchable: false,
    wrinkleResistant: false,
  },
}

const polyesterMaterial: MaterialInfo = {
  name: 'Recycled Polyester',
  composition: '100% Recycled Polyester',
  texture: 'smooth',
  careInstructions: [
    'Machine wash cold',
    'Hang to dry',
    'Do not iron',
    'Do not bleach',
  ],
  sustainability: {
    score: 75,
    recyclable: true,
    organic: false,
    certifications: ['GRS', 'OEKO-TEX'],
  },
  properties: {
    breathable: false,
    waterResistant: true,
    stretchable: true,
    wrinkleResistant: true,
  },
}

const woolMaterial: MaterialInfo = {
  name: 'Merino Wool',
  composition: '100% Merino Wool',
  texture: 'fuzzy',
  careInstructions: [
    'Hand wash cold',
    'Lay flat to dry',
    'Do not wring',
    'Store in cool, dry place',
  ],
  sustainability: {
    score: 70,
    recyclable: true,
    organic: true,
    certifications: ['GOTS', 'RWS'],
  },
  properties: {
    breathable: true,
    waterResistant: true,
    stretchable: false,
    wrinkleResistant: true,
  },
}

const silkMaterial: MaterialInfo = {
  name: 'Silk',
  composition: '100% Mulberry Silk',
  texture: 'silky',
  careInstructions: [
    'Dry clean only',
    'Do not machine wash',
    'Iron on low heat',
    'Store in breathable bag',
  ],
  sustainability: {
    score: 60,
    recyclable: false,
    organic: false,
    certifications: ['OEKO-TEX'],
  },
  properties: {
    breathable: true,
    waterResistant: false,
    stretchable: false,
    wrinkleResistant: false,
  },
}

const denimMaterial: MaterialInfo = {
  name: 'Denim',
  composition: '98% Cotton, 2% Elastane',
  texture: 'coarse',
  careInstructions: [
    'Machine wash cold',
    'Turn inside out',
    'Hang to dry',
    'Iron on medium heat',
  ],
  sustainability: {
    score: 45,
    recyclable: true,
    organic: false,
    certifications: ['OEKO-TEX'],
  },
  properties: {
    breathable: true,
    waterResistant: false,
    stretchable: true,
    wrinkleResistant: true,
  },
}

export const Default: Story = {
  args: {
    material: cottonMaterial,
  },
}

export const RecycledPolyester: Story = {
  args: {
    material: polyesterMaterial,
  },
}

export const MerinoWool: Story = {
  args: {
    material: woolMaterial,
  },
}

export const Silk: Story = {
  args: {
    material: silkMaterial,
  },
}

export const Denim: Story = {
  args: {
    material: denimMaterial,
  },
}

export const SmallSize: Story = {
  args: {
    material: cottonMaterial,
    size: 'small',
  },
}

export const LargeSize: Story = {
  args: {
    material: cottonMaterial,
    size: 'large',
  },
}

export const WithoutTexture: Story = {
  args: {
    material: cottonMaterial,
    showTexture: false,
  },
}

export const WithoutSustainability: Story = {
  args: {
    material: cottonMaterial,
    showSustainability: false,
  },
}

export const WithoutCareInfo: Story = {
  args: {
    material: cottonMaterial,
    showCareInfo: false,
  },
}

export const NonInteractive: Story = {
  args: {
    material: cottonMaterial,
    interactive: false,
  },
}

export const AllTextures: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      <MaterialTagMolecule
        material={{
          ...cottonMaterial,
          texture: 'smooth',
        }}
      />
      <MaterialTagMolecule
        material={{
          ...cottonMaterial,
          texture: 'rough',
        }}
      />
      <MaterialTagMolecule
        material={{
          ...cottonMaterial,
          texture: 'soft',
        }}
      />
      <MaterialTagMolecule
        material={{
          ...cottonMaterial,
          texture: 'coarse',
        }}
      />
      <MaterialTagMolecule
        material={{
          ...cottonMaterial,
          texture: 'silky',
        }}
      />
      <MaterialTagMolecule
        material={{
          ...cottonMaterial,
          texture: 'fuzzy',
        }}
      />
    </div>
  ),
}

export const DifferentSustainabilityScores: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      <MaterialTagMolecule
        material={{
          ...cottonMaterial,
          sustainability: { ...cottonMaterial.sustainability, score: 95 },
        }}
      />
      <MaterialTagMolecule
        material={{
          ...cottonMaterial,
          sustainability: { ...cottonMaterial.sustainability, score: 75 },
        }}
      />
      <MaterialTagMolecule
        material={{
          ...cottonMaterial,
          sustainability: { ...cottonMaterial.sustainability, score: 55 },
        }}
      />
      <MaterialTagMolecule
        material={{
          ...cottonMaterial,
          sustainability: { ...cottonMaterial.sustainability, score: 35 },
        }}
      />
    </div>
  ),
}

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <MaterialTagMolecule material={cottonMaterial} size="small" />
      <MaterialTagMolecule material={cottonMaterial} size="default" />
      <MaterialTagMolecule material={cottonMaterial} size="large" />
    </div>
  ),
}

export const MinimalConfiguration: Story = {
  args: {
    material: cottonMaterial,
    showTexture: false,
    showSustainability: false,
    showCareInfo: false,
    interactive: false,
  },
}

export const ComplexExample: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        <MaterialTagMolecule material={cottonMaterial} />
        <MaterialTagMolecule material={polyesterMaterial} />
        <MaterialTagMolecule material={woolMaterial} />
        <MaterialTagMolecule material={silkMaterial} />
        <MaterialTagMolecule material={denimMaterial} />
      </div>
      <div style={{ fontSize: '14px', color: '#666' }}>
        <div>Click on any material tag to view detailed information</div>
        <div>Green icons indicate organic and recyclable materials</div>
        <div>Numbers show sustainability scores (0-100)</div>
      </div>
    </div>
  ),
}
