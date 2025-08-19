import type { Meta, StoryObj } from '@storybook/react';
import { IconButton } from './IconButton';
import { 
  EditOutlined, 
  DeleteOutlined, 
  PlusOutlined, 
  SearchOutlined,
  SettingOutlined,
  HeartOutlined,
  ShareAltOutlined,
  DownloadOutlined
} from '@ant-design/icons';

const meta: Meta<typeof IconButton> = {
  title: 'Atoms/IconButton',
  component: IconButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['small', 'middle', 'large'],
    },
    variant: {
      control: 'select',
      options: ['primary', 'default', 'dashed', 'text', 'link'],
    },
    circular: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    icon: <EditOutlined />,
    tooltip: 'Edit',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <IconButton icon={<EditOutlined />} variant="primary" tooltip="Primary" />
      <IconButton icon={<EditOutlined />} variant="default" tooltip="Default" />
      <IconButton icon={<EditOutlined />} variant="dashed" tooltip="Dashed" />
      <IconButton icon={<EditOutlined />} variant="text" tooltip="Text" />
      <IconButton icon={<EditOutlined />} variant="link" tooltip="Link" />
    </div>
  ),
};

export const DifferentSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <IconButton icon={<EditOutlined />} size="small" tooltip="Small" />
      <IconButton icon={<EditOutlined />} size="middle" tooltip="Middle" />
      <IconButton icon={<EditOutlined />} size="large" tooltip="Large" />
    </div>
  ),
};

export const Circular: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <IconButton icon={<PlusOutlined />} circular variant="primary" tooltip="Add" />
      <IconButton icon={<SearchOutlined />} circular tooltip="Search" />
      <IconButton icon={<SettingOutlined />} circular variant="text" tooltip="Settings" />
    </div>
  ),
};

export const CommonActions: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <IconButton icon={<EditOutlined />} tooltip="Edit" />
      <IconButton icon={<DeleteOutlined />} tooltip="Delete" variant="text" />
      <IconButton icon={<PlusOutlined />} tooltip="Add" variant="primary" />
      <IconButton icon={<SearchOutlined />} tooltip="Search" />
      <IconButton icon={<DownloadOutlined />} tooltip="Download" />
      <IconButton icon={<ShareAltOutlined />} tooltip="Share" />
      <IconButton icon={<HeartOutlined />} tooltip="Like" variant="text" />
    </div>
  ),
};

export const Disabled: Story = {
  args: {
    icon: <EditOutlined />,
    tooltip: 'Edit (disabled)',
    disabled: true,
  },
};

export const Loading: Story = {
  args: {
    icon: <EditOutlined />,
    tooltip: 'Loading...',
    loading: true,
  },
};