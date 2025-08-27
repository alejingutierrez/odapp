import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'

import { ImageUploader } from './ImageUploader'

const meta: Meta<typeof ImageUploader> = {
  title: 'Molecules/ImageUploader',
  component: ImageUploader,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'An image uploader component for uploading and managing images. Currently under development.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ padding: '20px', maxWidth: '400px' }}>
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof ImageUploader>

export const Default: Story = {
  args: {
    placeholder: 'Upload Image',
  },
}

export const CustomPlaceholder: Story = {
  args: {
    placeholder: 'Choose Product Image',
  },
}

export const LongPlaceholder: Story = {
  args: {
    placeholder: 'Upload a high-quality product image (JPG, PNG, max 5MB)',
  },
}
