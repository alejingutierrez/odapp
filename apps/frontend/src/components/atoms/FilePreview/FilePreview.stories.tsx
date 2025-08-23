import type { Meta, StoryObj } from '@storybook/react'

import { FilePreview } from './FilePreview'

const meta: Meta<typeof FilePreview> = {
  title: 'Atoms/FilePreview',
  component: FilePreview,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    showMetadata: {
      control: 'boolean',
    },
    showDownload: {
      control: 'boolean',
    },
    showDelete: {
      control: 'boolean',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

const pdfFile = {
  name: 'document.pdf',
  type: 'application/pdf',
  size: 1024000,
}

const imageFile = {
  name: 'photo.jpg',
  type: 'image/jpeg',
  size: 2048000,
}

const docFile = {
  name: 'report.docx',
  type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  size: 512000,
}

export const Default: Story = {
  args: {
    file: pdfFile,
  },
}

export const WithSize: Story = {
  args: {
    file: pdfFile,
    showMetadata: true,
  },
}

export const FileTypes: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        width: '300px',
      }}
    >
      <FilePreview file={pdfFile} showMetadata />
      <FilePreview file={imageFile} showMetadata />
      <FilePreview file={docFile} showMetadata />
      <FilePreview
        file={{
          name: 'spreadsheet.xlsx',
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          size: 768000,
        }}
        showMetadata
      />
    </div>
  ),
}

export const WithActions: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        width: '300px',
      }}
    >
      <FilePreview file={pdfFile} showMetadata showDownload />
      <FilePreview file={imageFile} showMetadata showDelete />
      <FilePreview file={docFile} showMetadata showDownload showDelete />
    </div>
  ),
}

export const Interactive: Story = {
  args: {
    file: pdfFile,
    showMetadata: true,
    showDownload: true,
    showDelete: true,
  },
}
