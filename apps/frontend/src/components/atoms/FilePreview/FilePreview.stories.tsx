import type { Meta, StoryObj } from '@storybook/react';
import { FilePreview } from './FilePreview';

const meta: Meta<typeof FilePreview> = {
  title: 'Atoms/FilePreview',
  component: FilePreview,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    showSize: {
      control: 'boolean',
    },
    downloadable: {
      control: 'boolean',
    },
    deletable: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const pdfFile = {
  name: 'document.pdf',
  type: 'application/pdf',
  size: 1024000,
};

const imageFile = {
  name: 'photo.jpg',
  type: 'image/jpeg',
  size: 2048000,
};

const docFile = {
  name: 'report.docx',
  type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  size: 512000,
};

export const Default: Story = {
  args: {
    file: pdfFile,
  },
};

export const WithSize: Story = {
  args: {
    file: pdfFile,
    showSize: true,
  },
};

export const FileTypes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '300px' }}>
      <FilePreview file={pdfFile} showSize />
      <FilePreview file={imageFile} showSize />
      <FilePreview file={docFile} showSize />
      <FilePreview file={{ name: 'spreadsheet.xlsx', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 768000 }} showSize />
    </div>
  ),
};

export const WithActions: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '300px' }}>
      <FilePreview file={pdfFile} showSize downloadable />
      <FilePreview file={imageFile} showSize deletable />
      <FilePreview file={docFile} showSize downloadable deletable />
    </div>
  ),
};

export const Interactive: Story = {
  args: {
    file: pdfFile,
    showSize: true,
    downloadable: true,
    deletable: true,
  },
};
