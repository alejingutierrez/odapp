import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import {
  EditOutlined,
  EyeOutlined,
  DeleteOutlined,
  DownloadOutlined,
  ShareAltOutlined,
  StarOutlined,
  HeartOutlined,
  SettingOutlined,
  ExportOutlined,
  PlusOutlined,
  SaveOutlined,
  CloseOutlined,
} from '@ant-design/icons'

import { ActionButtonGroup } from './ActionButtonGroup'
import type { ActionButton } from './ActionButtonGroup'

const meta: Meta<typeof ActionButtonGroup> = {
  title: 'Molecules/ActionButtonGroup',
  component: ActionButtonGroup,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A flexible action button group component that displays multiple action buttons with overflow handling through a dropdown menu. Supports different sizes, directions, and button types.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['small', 'middle', 'large'],
    },
    direction: {
      control: { type: 'select' },
      options: ['horizontal', 'vertical'],
    },
    maxVisible: { control: { type: 'number', min: 1, max: 10 } },
    split: { control: 'boolean' },
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
type Story = StoryObj<typeof ActionButtonGroup>

const basicActions: ActionButton[] = [
  {
    key: 'edit',
    label: 'Edit',
    icon: <EditOutlined />,
    onClick: () => console.log('Edit clicked'),
  },
  {
    key: 'view',
    label: 'View',
    icon: <EyeOutlined />,
    onClick: () => console.log('View clicked'),
  },
  {
    key: 'delete',
    label: 'Delete',
    icon: <DeleteOutlined />,
    danger: true,
    onClick: () => console.log('Delete clicked'),
  },
]

const manyActions: ActionButton[] = [
  {
    key: 'edit',
    label: 'Edit',
    icon: <EditOutlined />,
    onClick: () => console.log('Edit clicked'),
  },
  {
    key: 'view',
    label: 'View',
    icon: <EyeOutlined />,
    onClick: () => console.log('View clicked'),
  },
  {
    key: 'download',
    label: 'Download',
    icon: <DownloadOutlined />,
    onClick: () => console.log('Download clicked'),
  },
  {
    key: 'share',
    label: 'Share',
    icon: <ShareAltOutlined />,
    onClick: () => console.log('Share clicked'),
  },
  {
    key: 'favorite',
    label: 'Favorite',
    icon: <StarOutlined />,
    onClick: () => console.log('Favorite clicked'),
  },
  {
    key: 'like',
    label: 'Like',
    icon: <HeartOutlined />,
    onClick: () => console.log('Like clicked'),
  },
  {
    key: 'settings',
    label: 'Settings',
    icon: <SettingOutlined />,
    onClick: () => console.log('Settings clicked'),
  },
  {
    key: 'export',
    label: 'Export',
    icon: <ExportOutlined />,
    onClick: () => console.log('Export clicked'),
  },
]

const mixedActions: ActionButton[] = [
  {
    key: 'edit',
    label: 'Edit',
    icon: <EditOutlined />,
    type: 'primary',
    onClick: () => console.log('Edit clicked'),
  },
  {
    key: 'view',
    label: 'View',
    icon: <EyeOutlined />,
    type: 'default',
    onClick: () => console.log('View clicked'),
  },
  {
    key: 'download',
    label: 'Download',
    icon: <DownloadOutlined />,
    type: 'default',
    onClick: () => console.log('Download clicked'),
  },
  {
    key: 'delete',
    label: 'Delete',
    icon: <DeleteOutlined />,
    type: 'primary',
    danger: true,
    onClick: () => console.log('Delete clicked'),
  },
]

const formActions: ActionButton[] = [
  {
    key: 'save',
    label: 'Save',
    icon: <SaveOutlined />,
    type: 'primary',
    onClick: () => console.log('Save clicked'),
  },
  {
    key: 'cancel',
    label: 'Cancel',
    icon: <CloseOutlined />,
    onClick: () => console.log('Cancel clicked'),
  },
]

const createActions: ActionButton[] = [
  {
    key: 'create',
    label: 'Create New',
    icon: <PlusOutlined />,
    type: 'primary',
    onClick: () => console.log('Create clicked'),
  },
]

export const Default: Story = {
  args: {
    actions: basicActions,
  },
}

export const WithOverflow: Story = {
  args: {
    actions: manyActions,
    maxVisible: 3,
  },
}

export const SmallSize: Story = {
  args: {
    actions: basicActions,
    size: 'small',
  },
}

export const LargeSize: Story = {
  args: {
    actions: basicActions,
    size: 'large',
  },
}

export const VerticalDirection: Story = {
  args: {
    actions: basicActions,
    direction: 'vertical',
  },
}

export const WithSplit: Story = {
  args: {
    actions: basicActions,
    split: true,
  },
}

export const MixedButtonTypes: Story = {
  args: {
    actions: mixedActions,
  },
}

export const ManyActionsWithOverflow: Story = {
  args: {
    actions: manyActions,
    maxVisible: 2,
  },
}

export const CustomMaxVisible: Story = {
  args: {
    actions: manyActions,
    maxVisible: 4,
  },
}

export const VerticalWithSplit: Story = {
  args: {
    actions: basicActions,
    direction: 'vertical',
    split: true,
  },
}

export const SingleAction: Story = {
  args: {
    actions: [basicActions[0]],
  },
}

export const TwoActions: Story = {
  args: {
    actions: basicActions.slice(0, 2),
  },
}

export const AllPrimary: Story = {
  args: {
    actions: basicActions.map(action => ({ ...action, type: 'primary' as const })),
  },
}

export const AllDanger: Story = {
  args: {
    actions: basicActions.map(action => ({ ...action, danger: true })),
  },
}

export const TextButtons: Story = {
  args: {
    actions: basicActions.map(action => ({ ...action, type: 'text' as const })),
  },
}

export const LinkButtons: Story = {
  args: {
    actions: basicActions.map(action => ({ ...action, type: 'link' as const })),
  },
}

export const ComplexExample: Story = {
  args: {
    actions: [
      {
        key: 'import',
        label: 'Import',
        icon: <DownloadOutlined />,
        type: 'primary',
        onClick: () => console.log('Import clicked'),
      },
      {
        key: 'export',
        label: 'Export',
        icon: <ExportOutlined />,
        type: 'default',
        onClick: () => console.log('Export clicked'),
      },
      {
        key: 'edit',
        label: 'Edit',
        icon: <EditOutlined />,
        type: 'dashed',
        onClick: () => console.log('Edit clicked'),
      },
      {
        key: 'view',
        label: 'View',
        icon: <EyeOutlined />,
        type: 'link',
        onClick: () => console.log('View clicked'),
      },
      {
        key: 'share',
        label: 'Share',
        icon: <ShareAltOutlined />,
        type: 'text',
        onClick: () => console.log('Share clicked'),
      },
      {
        key: 'delete',
        label: 'Delete',
        icon: <DeleteOutlined />,
        danger: true,
        onClick: () => console.log('Delete clicked'),
      },
    ],
    maxVisible: 3,
    split: true,
  },
}
