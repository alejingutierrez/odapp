import type { Meta, StoryObj } from '@storybook/react'
import React, { useState } from 'react'

import { PaginationControls } from './PaginationControls'

const meta: Meta<typeof PaginationControls> = {
  title: 'Molecules/PaginationControls',
  component: PaginationControls,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A comprehensive pagination control component that provides page navigation, page size selection, and item count display. Built on top of Ant Design Pagination with enhanced features.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['small', 'default'],
    },
    showSizeChanger: { control: 'boolean' },
    showQuickJumper: { control: 'boolean' },
    showTotal: { control: 'boolean' },
    showLessItems: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  decorators: [
    (Story) => (
      <div style={{ padding: '20px', maxWidth: '800px' }}>
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof PaginationControls>

export const Default: Story = {
  args: {
    current: 1,
    total: 150,
    pageSize: 20,
  },
}

export const FirstPage: Story = {
  args: {
    current: 1,
    total: 150,
    pageSize: 20,
  },
}

export const MiddlePage: Story = {
  args: {
    current: 5,
    total: 150,
    pageSize: 20,
  },
}

export const LastPage: Story = {
  args: {
    current: 8,
    total: 150,
    pageSize: 20,
  },
}

export const SmallSize: Story = {
  args: {
    current: 1,
    total: 150,
    pageSize: 20,
    size: 'small',
  },
}

export const WithoutSizeChanger: Story = {
  args: {
    current: 1,
    total: 150,
    pageSize: 20,
    showSizeChanger: false,
  },
}

export const WithQuickJumper: Story = {
  args: {
    current: 1,
    total: 150,
    pageSize: 20,
    showQuickJumper: true,
  },
}

export const WithoutTotal: Story = {
  args: {
    current: 1,
    total: 150,
    pageSize: 20,
    showTotal: false,
  },
}

export const ShowLessItems: Story = {
  args: {
    current: 1,
    total: 150,
    pageSize: 20,
    showLessItems: true,
  },
}

export const Disabled: Story = {
  args: {
    current: 1,
    total: 150,
    pageSize: 20,
    disabled: true,
  },
}

export const LargeDataset: Story = {
  args: {
    current: 25,
    total: 10000,
    pageSize: 50,
  },
}

export const SmallDataset: Story = {
  args: {
    current: 1,
    total: 15,
    pageSize: 20,
  },
}

export const CustomPageSizeOptions: Story = {
  args: {
    current: 1,
    total: 150,
    pageSize: 25,
    pageSizeOptions: [5, 10, 25, 50, 100],
  },
}

export const EmptyDataset: Story = {
  args: {
    current: 1,
    total: 0,
    pageSize: 20,
  },
}

export const SinglePage: Story = {
  args: {
    current: 1,
    total: 10,
    pageSize: 20,
  },
}

export const HighPageNumber: Story = {
  args: {
    current: 50,
    total: 1000,
    pageSize: 20,
  },
}

export const Interactive: Story = {
  render: (args) => {
    const [current, setCurrent] = useState(args.current || 1)
    const [pageSize, setPageSize] = useState(args.pageSize || 20)

    const handleChange = (page: number, newPageSize: number) => {
      setCurrent(page)
      setPageSize(newPageSize)
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ fontSize: '14px', color: '#666' }}>
          Current page: {current}, Page size: {pageSize}
        </div>
        <PaginationControls
          {...args}
          current={current}
          pageSize={pageSize}
          onChange={handleChange}
        />
      </div>
    )
  },
  args: {
    total: 150,
    pageSize: 20,
  },
}

export const ComplexExample: Story = {
  render: (args) => {
    const [current, setCurrent] = useState(args.current || 1)
    const [pageSize, setPageSize] = useState(args.pageSize || 20)

    const handleChange = (page: number, newPageSize: number) => {
      setCurrent(page)
      setPageSize(newPageSize)
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ fontSize: '14px', color: '#666' }}>
          Showing page {current} of {Math.ceil(args.total / pageSize)} with {pageSize} items per page
        </div>
        <PaginationControls
          {...args}
          current={current}
          pageSize={pageSize}
          onChange={handleChange}
          showQuickJumper={true}
          showLessItems={true}
        />
      </div>
    )
  },
  args: {
    total: 500,
    pageSize: 25,
    pageSizeOptions: [10, 25, 50, 100],
  },
}

export const MinimalConfiguration: Story = {
  args: {
    current: 1,
    total: 50,
    pageSize: 10,
    showSizeChanger: false,
    showTotal: false,
    showQuickJumper: false,
  },
}
