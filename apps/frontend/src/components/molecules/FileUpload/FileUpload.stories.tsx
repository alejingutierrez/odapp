import type { Meta, StoryObj } from '@storybook/react'
import React, { useState } from 'react'
import type { UploadFile } from 'antd'

import { FileUpload } from './FileUpload'

const meta: Meta<typeof FileUpload> = {
  title: 'Molecules/FileUpload',
  component: FileUpload,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A file upload component with drag and drop support, file preview, progress tracking, and validation. Supports multiple file types, size limits, and custom configurations.',
      },

    },
  },
  tags: ['autodocs'],
  argTypes: {
    maxFiles: { control: { type: 'number', min: 1, max: 20 } },
    maxSize: { control: { type: 'number', min: 1, max: 100 } },
    showPreview: { control: 'boolean' },
    showProgress: { control: 'boolean' },
    dragAndDrop: { control: 'boolean' },
    disabled: { control: 'boolean' },
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
type Story = StoryObj<typeof FileUpload>

const sampleFiles: UploadFile[] = [
  {
    uid: '1',
    name: 'document.pdf',
    status: 'done',
    size: 1024000,
    type: 'application/pdf',
  },
  {
    uid: '2',
    name: 'image.jpg',
    status: 'done',
    size: 2048000,
    type: 'image/jpeg',
    url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=300&fit=crop',
    thumbUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=300&fit=crop',
  },
  {
    uid: '3',
    name: 'spreadsheet.xlsx',
    status: 'uploading',
    size: 512000,
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    percent: 65,
  },
]

const imageFiles: UploadFile[] = [
  {
    uid: '1',
    name: 'product-1.jpg',
    status: 'done',
    size: 1024000,
    type: 'image/jpeg',
    url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=300&fit=crop',
    thumbUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=300&fit=crop',
  },
  {
    uid: '2',
    name: 'product-2.jpg',
    status: 'done',
    size: 1536000,
    type: 'image/jpeg',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop',
    thumbUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop',
  },
]

const uploadingFiles: UploadFile[] = [
  {
    uid: '1',
    name: 'large-file.zip',
    status: 'uploading',
    size: 52428800,
    type: 'application/zip',
    percent: 25,
  },
  {
    uid: '2',
    name: 'document.docx',
    status: 'uploading',
    size: 2048000,
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    percent: 75,
  },
]

export const Default: Story = {
  args: {
    maxFiles: 5,
    maxSize: 10,
  },
}

export const WithFiles: Story = {
  args: {
    value: sampleFiles,
    maxFiles: 5,
    maxSize: 10,
  },
}

export const ImagesOnly: Story = {
  args: {
    value: imageFiles,
    acceptedTypes: ['image/*'],
    maxFiles: 10,
    maxSize: 5,
  },
}

export const SingleFile: Story = {
  args: {
    maxFiles: 1,
    maxSize: 50,
  },
}

export const MultipleFiles: Story = {
  args: {
    maxFiles: 10,
    maxSize: 5,
  },
}

export const LargeFiles: Story = {
  args: {
    maxFiles: 3,
    maxSize: 100,
  },
}

export const WithoutDragAndDrop: Story = {
  args: {
    dragAndDrop: false,
    maxFiles: 5,
    maxSize: 10,
  },
}

export const WithoutPreview: Story = {
  args: {
    showPreview: false,
    maxFiles: 5,
    maxSize: 10,
  },
}

export const WithoutProgress: Story = {
  args: {
    showProgress: false,
    value: uploadingFiles,
    maxFiles: 5,
    maxSize: 10,
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
    maxFiles: 5,
    maxSize: 10,
  },
}

export const CustomAcceptedTypes: Story = {
  args: {
    acceptedTypes: ['.pdf', '.doc', '.docx', '.txt'],
    maxFiles: 5,
    maxSize: 10,
  },
}

export const ImagesAndDocuments: Story = {
  args: {
    acceptedTypes: ['image/*', '.pdf', '.doc', '.docx'],
    maxFiles: 8,
    maxSize: 15,
  },
}

export const WithUploadingFiles: Story = {
  args: {
    value: uploadingFiles,
    maxFiles: 5,
    maxSize: 100,
  },
}

export const Interactive: Story = {
  render: (args) => {
    const [files, setFiles] = useState<UploadFile[]>(args.value || [])

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <FileUpload
          {...args}
          value={files}
          onChange={setFiles}
        />
        <div style={{ fontSize: '14px', color: '#666' }}>
          <div>Files uploaded: {files.length}</div>
          <div>Total size: {files.reduce((acc, file) => acc + (file.size || 0), 0).toLocaleString()} bytes</div>
        </div>
      </div>
    )
  },
  args: {
    maxFiles: 5,
    maxSize: 10,
  },
}

export const ComplexExample: Story = {
  render: (args) => {
    const [files, setFiles] = useState<UploadFile[]>(args.value || [])

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <FileUpload
          {...args}
          value={files}
          onChange={setFiles}
        />
        <div style={{ fontSize: '14px', color: '#666' }}>
          <div>Files: {files.length}/{args.maxFiles}</div>
          <div>Types: {files.map(f => f.type).join(', ') || 'None'}</div>
          <div>Uploading: {files.filter(f => f.status === 'uploading').length}</div>
          <div>Done: {files.filter(f => f.status === 'done').length}</div>
        </div>
      </div>
    )
  },
  args: {
    maxFiles: 8,
    maxSize: 20,
    acceptedTypes: ['image/*', '.pdf', '.doc', '.docx', '.xlsx'],
  },
}

export const MinimalConfiguration: Story = {
  args: {
    maxFiles: 1,
    maxSize: 5,
    showPreview: false,
    showProgress: false,
    dragAndDrop: false,
  },
}

export const HighLimits: Story = {
  args: {
    maxFiles: 20,
    maxSize: 500,
    acceptedTypes: ['*/*'],
  },
}

export const DocumentOnly: Story = {
  args: {
    acceptedTypes: ['.pdf', '.doc', '.docx', '.txt', '.rtf'],
    maxFiles: 5,
    maxSize: 25,
  },
}

export const VideoFiles: Story = {
  args: {
    acceptedTypes: ['video/*'],
    maxFiles: 3,
    maxSize: 100,
  },
}

export const AudioFiles: Story = {
  args: {
    acceptedTypes: ['audio/*'],
    maxFiles: 10,
    maxSize: 50,
  },
}
