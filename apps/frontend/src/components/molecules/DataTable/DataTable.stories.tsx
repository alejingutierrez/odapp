import type { Meta, StoryObj } from '@storybook/react'
import React, { useState } from 'react'

import { DataTable } from './DataTable'
import type { DataTableColumn } from './DataTable'

const meta: Meta<typeof DataTable> = {
  title: 'Molecules/DataTable',
  component: DataTable,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A comprehensive data table component with search, filtering, sorting, and export capabilities. Built on top of Ant Design Table with additional features for data management.',
      },

    },
  },
  tags: ['autodocs'],
  argTypes: {
    onSearch: { action: 'search' },
    onFilter: { action: 'filter' },
    onRefresh: { action: 'refresh' },
    onExport: { action: 'export' },
    onSelectionChange: { action: 'selection change' },
  },
  decorators: [
    (Story) => (
      <div style={{ padding: '20px', maxWidth: '1200px' }}>
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof DataTable>

// Sample data for stories
const sampleData = [
  {
    id: '1',
    name: 'Premium Cotton T-Shirt',
    category: 'T-Shirts',
    price: 29.99,
    inventory: 150,
    status: 'active',
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    name: 'Denim Jeans',
    category: 'Pants',
    price: 79.99,
    inventory: 75,
    status: 'active',
    createdAt: '2024-01-10',
  },
  {
    id: '3',
    name: 'Wool Sweater',
    category: 'Sweaters',
    price: 89.99,
    inventory: 25,
    status: 'draft',
    createdAt: '2024-01-20',
  },
  {
    id: '4',
    name: 'Leather Jacket',
    category: 'Outerwear',
    price: 199.99,
    inventory: 10,
    status: 'active',
    createdAt: '2024-01-05',
  },
  {
    id: '5',
    name: 'Summer Dress',
    category: 'Dresses',
    price: 59.99,
    inventory: 45,
    status: 'active',
    createdAt: '2024-01-12',
  },
]

const baseColumns: DataTableColumn[] = [
  {
    title: 'ID',
    dataIndex: 'id',
    key: 'id',
    width: 80,
    sortable: true,
  },
  {
    title: 'Name',
    dataIndex: 'name',
    key: 'name',
    sortable: true,
    searchable: true,
    filterable: true,
  },
  {
    title: 'Category',
    dataIndex: 'category',
    key: 'category',
    sortable: true,
    filterable: true,
  },
  {
    title: 'Price',
    dataIndex: 'price',
    key: 'price',
    sortable: true,
    render: (price: number) => `$${price.toFixed(2)}`,
  },
  {
    title: 'Inventory',
    dataIndex: 'inventory',
    key: 'inventory',
    sortable: true,
    render: (inventory: number) => (
      <span style={{ color: inventory < 20 ? '#ff4d4f' : '#52c41a' }}>
        {inventory}
      </span>
    ),
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    sortable: true,
    filterable: true,
    render: (status: string) => (
      <span
        style={{
          padding: '2px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          backgroundColor: status === 'active' ? '#f6ffed' : '#fff2e8',
          color: status === 'active' ? '#52c41a' : '#fa8c16',
        }}
      >
        {status}
      </span>
    ),
  },
  {
    title: 'Created',
    dataIndex: 'createdAt',
    key: 'createdAt',
    sortable: true,
  },
]

export const Default: Story = {
  args: {
    columns: baseColumns,
    data: sampleData,
    searchable: true,
    filterable: true,
    refreshable: true,
    exportable: false,
    selectable: false,
    searchPlaceholder: 'Search products...',
    emptyText: 'No products found',
  },
}

export const WithSelection: Story = {
  args: {
    columns: baseColumns,
    data: sampleData,
    searchable: true,
    filterable: true,
    refreshable: true,
    exportable: true,
    selectable: true,
    searchPlaceholder: 'Search products...',
    emptyText: 'No products found',
  },
}

export const WithExport: Story = {
  args: {
    columns: baseColumns,
    data: sampleData,
    searchable: true,
    filterable: true,
    refreshable: true,
    exportable: true,
    selectable: false,
    searchPlaceholder: 'Search products...',
    emptyText: 'No products found',
  },
}

export const Compact: Story = {
  args: {
    columns: baseColumns,
    data: sampleData,
    searchable: true,
    filterable: false,
    refreshable: true,
    exportable: false,
    selectable: false,
    size: 'small',
    bordered: true,
    searchPlaceholder: 'Search products...',
    emptyText: 'No products found',
  },
}

export const Loading: Story = {
  args: {
    columns: baseColumns,
    data: [],
    loading: true,
    searchable: true,
    filterable: true,
    refreshable: true,
    exportable: false,
    selectable: false,
    searchPlaceholder: 'Search products...',
    emptyText: 'No products found',
  },
}

export const Empty: Story = {
  args: {
    columns: baseColumns,
    data: [],
    loading: false,
    searchable: true,
    filterable: true,
    refreshable: true,
    exportable: false,
    selectable: false,
    searchPlaceholder: 'Search products...',
    emptyText: 'No products available. Add your first product to get started.',
  },
}

export const Minimal: Story = {
  args: {
    columns: baseColumns.slice(0, 3), // Only ID, Name, Price
    data: sampleData,
    searchable: false,
    filterable: false,
    refreshable: false,
    exportable: false,
    selectable: false,
    emptyText: 'No products found',
  },
}

export const WithPagination: Story = {
  args: {
    columns: baseColumns,
    data: sampleData,
    searchable: true,
    filterable: true,
    refreshable: true,
    exportable: true,
    selectable: true,
    searchPlaceholder: 'Search products...',
    emptyText: 'No products found',
    pagination: {
      pageSize: 3,
      showSizeChanger: true,
      showQuickJumper: true,
      showTotal: (total, range) =>
        `${range[0]}-${range[1]} of ${total} items`,
    },
  },
}

// Interactive story with state management
export const Interactive: Story = {
  render: (args) => {
    const [data, setData] = useState(sampleData)
    const [loading, setLoading] = useState(false)

    const handleRefresh = () => {
      setLoading(true)
      setTimeout(() => {
        setData([...sampleData])
        setLoading(false)
      }, 1000)
    }

    const handleSearch = (searchTerm: string) => {
      if (!searchTerm) {
        setData(sampleData)
        return
      }
      
      const filtered = sampleData.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setData(filtered)
    }

    const handleFilter = (filters: Record<string, unknown>) => {
      let filtered = sampleData
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          filtered = filtered.filter(item => 
            String(item[key as keyof typeof item]).toLowerCase().includes(String(value).toLowerCase())
          )
        }
      })
      
      setData(filtered)
    }

    return (
      <DataTable
        {...args}
        data={data}
        loading={loading}
        onRefresh={handleRefresh}
        onSearch={handleSearch}
        onFilter={handleFilter}
      />
    )
  },
  args: {
    columns: baseColumns,
    data: sampleData,
    searchable: true,
    filterable: true,
    refreshable: true,
    exportable: true,
    selectable: true,
    searchPlaceholder: 'Search products...',
    emptyText: 'No products found',
  },
}
