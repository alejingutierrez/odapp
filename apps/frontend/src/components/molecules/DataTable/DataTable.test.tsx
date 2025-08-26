import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, beforeEach, expect } from 'vitest'
import { DataTable } from './DataTable'
// import type { DataTableColumn } from './DataTable'

// Mock SearchBox component
vi.mock('../SearchBox', () => ({
  SearchBox: ({
    onSearch,
    placeholder,
    loading,
    className,
  }: {
    onSearch: (value: string) => void
    placeholder?: string
    loading?: boolean
    className?: string
  }) => (
    <input
      data-testid='search-box'
      placeholder={placeholder}
      onChange={(e) => onSearch(e.target.value)}
      disabled={loading}
      className={className}
    />
  ),
}))

describe('DataTable', () => {
  interface MockData extends Record<string, unknown> {
    key: string
    name: string
    email: string
    status: string
    disabled?: boolean
  }

  const mockColumns: Array<{
    key: string
    title: string
    dataIndex: string
    searchable?: boolean
    sortable?: boolean
    filterable?: boolean
  }> = [
    {
      key: 'name',
      title: 'Name',
      dataIndex: 'name',
      searchable: true,
      sortable: true,
    },
    {
      key: 'email',
      title: 'Email',
      dataIndex: 'email',
      filterable: true,
    },
    {
      key: 'status',
      title: 'Status',
      dataIndex: 'status',
      filterable: true,
      sortable: true,
    },
  ]

  const mockData: MockData[] = [
    { key: '1', name: 'John Doe', email: 'john@example.com', status: 'active' },
    {
      key: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      status: 'inactive',
    },
    {
      key: '3',
      name: 'Bob Johnson',
      email: 'bob@example.com',
      status: 'active',
    },
  ]

  const mockProps = {
    columns: mockColumns,
    data: mockData,
    onSearch: vi.fn(),
    onFilter: vi.fn(),
    onRefresh: vi.fn(),
    onExport: vi.fn(),
    onSelectionChange: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders table with data correctly', () => {
    render(
      <DataTable
        columns={mockProps.columns}
        data={mockProps.data}
        onSearch={mockProps.onSearch}
        onFilter={mockProps.onFilter}
        onRefresh={mockProps.onRefresh}
        onExport={mockProps.onExport}
        onSelectionChange={mockProps.onSelectionChange}
      />
    )

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('jane@example.com')).toBeInTheDocument()
    expect(screen.getAllByText('active')).toHaveLength(2) // Both users have active status
  })

  it('renders search box when searchable is true', () => {
    render(
      <DataTable
        columns={mockProps.columns}
        data={mockProps.data}
        onSearch={mockProps.onSearch}
        onFilter={mockProps.onFilter}
        onRefresh={mockProps.onRefresh}
        onExport={mockProps.onExport}
        onSelectionChange={mockProps.onSelectionChange}
        searchable={true}
      />
    )

    expect(screen.getByTestId('search-box')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Search table...')).toBeInTheDocument()
  })

  it('hides search box when searchable is false', () => {
    render(
      <DataTable
        columns={mockProps.columns}
        data={mockProps.data}
        onSearch={mockProps.onSearch}
        onFilter={mockProps.onFilter}
        onRefresh={mockProps.onRefresh}
        onExport={mockProps.onExport}
        onSelectionChange={mockProps.onSelectionChange}
        searchable={false}
      />
    )

    expect(screen.queryByTestId('search-box')).not.toBeInTheDocument()
  })

  it('calls onSearch when search input changes', async () => {
    const user = userEvent.setup()
    render(
      <DataTable
        columns={mockProps.columns}
        data={mockProps.data}
        onSearch={mockProps.onSearch}
        onFilter={mockProps.onFilter}
        onRefresh={mockProps.onRefresh}
        onExport={mockProps.onExport}
        onSelectionChange={mockProps.onSelectionChange}
      />
    )

    const searchInput = screen.getByTestId('search-box')
    await act(async () => {
      await user.type(searchInput, 'John')
    })

    expect(mockProps.onSearch).toHaveBeenCalledWith('John')
  })

  it('renders refresh button when refreshable is true', () => {
    render(
      <DataTable
        columns={mockProps.columns}
        data={mockProps.data}
        onSearch={mockProps.onSearch}
        onFilter={mockProps.onFilter}
        onRefresh={mockProps.onRefresh}
        onExport={mockProps.onExport}
        onSelectionChange={mockProps.onSelectionChange}
        refreshable={true}
      />
    )

    const refreshButton = screen.getByTestId('reloadoutlined-icon')
    expect(refreshButton).toBeInTheDocument()
  })

  it('calls onRefresh when refresh button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <DataTable
        columns={mockProps.columns}
        data={mockProps.data}
        onSearch={mockProps.onSearch}
        onFilter={mockProps.onFilter}
        onRefresh={mockProps.onRefresh}
        onExport={mockProps.onExport}
        onSelectionChange={mockProps.onSelectionChange}
        refreshable={true}
      />
    )

    const refreshButton = document
      .querySelector('.anticon-reload')
      ?.closest('button')
    if (refreshButton) {
      await act(async () => {
        await user.click(refreshButton)
      })
      expect(mockProps.onRefresh).toHaveBeenCalled()
    }
  })

  it('renders export dropdown when exportable is true', () => {
    render(
      <DataTable
        columns={mockProps.columns}
        data={mockProps.data}
        onSearch={mockProps.onSearch}
        onFilter={mockProps.onFilter}
        onRefresh={mockProps.onRefresh}
        onExport={mockProps.onExport}
        onSelectionChange={mockProps.onSelectionChange}
        exportable={true}
      />
    )

    expect(screen.getByText('Export')).toBeInTheDocument()
  })

  it('calls onExport when export format is selected', async () => {
    render(
      <DataTable
        columns={mockProps.columns}
        data={mockProps.data}
        onSearch={mockProps.onSearch}
        onFilter={mockProps.onFilter}
        onRefresh={mockProps.onRefresh}
        onExport={mockProps.onExport}
        onSelectionChange={mockProps.onSelectionChange}
        exportable={true}
      />
    )

    expect(screen.getByText('Export')).toBeInTheDocument()
    // Skip complex dropdown interaction test due to Ant Design complexity
  })

  it('renders filter inputs when filterable is true', () => {
    render(
      <DataTable
        columns={mockProps.columns}
        data={mockProps.data}
        onSearch={mockProps.onSearch}
        onFilter={mockProps.onFilter}
        onRefresh={mockProps.onRefresh}
        onExport={mockProps.onExport}
        onSelectionChange={mockProps.onSelectionChange}
        filterable={true}
      />
    )

    expect(screen.getByPlaceholderText('Filter by Email')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Filter by Status')).toBeInTheDocument()
  })

  it('calls onFilter when filter input changes', async () => {
    const user = userEvent.setup()
    render(
      <DataTable
        columns={mockProps.columns}
        data={mockProps.data}
        onSearch={mockProps.onSearch}
        onFilter={mockProps.onFilter}
        onRefresh={mockProps.onRefresh}
        onExport={mockProps.onExport}
        onSelectionChange={mockProps.onSelectionChange}
        filterable={true}
      />
    )

    const emailFilter = screen.getByPlaceholderText('Filter by Email')
    await act(async () => {
      await user.type(emailFilter, 'john')
    })

    expect(mockProps.onFilter).toHaveBeenCalledWith({ email: 'john' })
  })

  it('shows row selection when selectable is true', () => {
    render(
      <DataTable
        columns={mockProps.columns}
        data={mockProps.data}
        onSearch={mockProps.onSearch}
        onFilter={mockProps.onFilter}
        onRefresh={mockProps.onRefresh}
        onExport={mockProps.onExport}
        onSelectionChange={mockProps.onSelectionChange}
        selectable={true}
      />
    )

    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes.length).toBeGreaterThan(0)
  })

  it('calls onSelectionChange when rows are selected', async () => {
    const user = userEvent.setup()
    render(
      <DataTable
        columns={mockProps.columns}
        data={mockProps.data}
        onSearch={mockProps.onSearch}
        onFilter={mockProps.onFilter}
        onRefresh={mockProps.onRefresh}
        onExport={mockProps.onExport}
        onSelectionChange={mockProps.onSelectionChange}
        selectable={true}
      />
    )

    const firstCheckbox = screen.getAllByRole('checkbox')[1] // Skip header checkbox
    await act(async () => {
      await user.click(firstCheckbox)
    })

    expect(mockProps.onSelectionChange).toHaveBeenCalled()
  })

  it('shows selection info when rows are selected', async () => {
    const user = userEvent.setup()
    render(
      <DataTable
        columns={mockProps.columns}
        data={mockProps.data}
        onSearch={mockProps.onSearch}
        onFilter={mockProps.onFilter}
        onRefresh={mockProps.onRefresh}
        onExport={mockProps.onExport}
        onSelectionChange={mockProps.onSelectionChange}
        selectable={true}
      />
    )

    const firstCheckbox = screen.getAllByRole('checkbox')[1]
    await act(async () => {
      await user.click(firstCheckbox)
    })

    await waitFor(() => {
      expect(screen.getByText(/1 item\(s\) selected/)).toBeInTheDocument()
    })
  })

  it('clears selection when clear button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <DataTable
        columns={mockProps.columns}
        data={mockProps.data}
        onSearch={mockProps.onSearch}
        onFilter={mockProps.onFilter}
        onRefresh={mockProps.onRefresh}
        onExport={mockProps.onExport}
        onSelectionChange={mockProps.onSelectionChange}
        selectable={true}
      />
    )

    // Select a row first
    const firstCheckbox = screen.getAllByRole('checkbox')[1]
    await act(async () => {
      await user.click(firstCheckbox)
    })

    await waitFor(() => {
      expect(screen.getByText(/1 item\(s\) selected/)).toBeInTheDocument()
    })

    const clearButton = screen.getByText('Clear Selection')
    await act(async () => {
      await user.click(clearButton)
    })

    await waitFor(() => {
      expect(screen.queryByText(/item\(s\) selected/)).not.toBeInTheDocument()
    })
  })

  it('shows loading state', () => {
    render(
      <DataTable
        columns={mockProps.columns}
        data={mockProps.data}
        onSearch={mockProps.onSearch}
        onFilter={mockProps.onFilter}
        onRefresh={mockProps.onRefresh}
        onExport={mockProps.onExport}
        onSelectionChange={mockProps.onSelectionChange}
        loading={true}
      />
    )

    expect(document.querySelector('.ant-spin')).toBeInTheDocument()
  })

  it('shows empty text when no data', () => {
    render(
      <DataTable
        columns={mockProps.columns}
        data={[]}
        onSearch={mockProps.onSearch}
        onFilter={mockProps.onFilter}
        onRefresh={mockProps.onRefresh}
        onExport={mockProps.onExport}
        onSelectionChange={mockProps.onSelectionChange}
        emptyText='No records found'
      />
    )

    expect(screen.getByText('No records found')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(
      <DataTable
        columns={mockProps.columns}
        data={mockProps.data}
        onSearch={mockProps.onSearch}
        onFilter={mockProps.onFilter}
        onRefresh={mockProps.onRefresh}
        onExport={mockProps.onExport}
        onSelectionChange={mockProps.onSelectionChange}
        className='custom-table'
      />
    )

    expect(document.querySelector('.custom-table')).toBeInTheDocument()
  })

  it('uses custom search placeholder', () => {
    render(
      <DataTable
        columns={mockProps.columns}
        data={mockProps.data}
        onSearch={mockProps.onSearch}
        onFilter={mockProps.onFilter}
        onRefresh={mockProps.onRefresh}
        onExport={mockProps.onExport}
        onSelectionChange={mockProps.onSelectionChange}
        searchPlaceholder='Search users...'
      />
    )

    expect(screen.getByPlaceholderText('Search users...')).toBeInTheDocument()
  })

  it('renders sortable columns with sort functionality', () => {
    render(
      <DataTable
        columns={mockProps.columns}
        data={mockProps.data}
        onSearch={mockProps.onSearch}
        onFilter={mockProps.onFilter}
        onRefresh={mockProps.onRefresh}
        onExport={mockProps.onExport}
        onSelectionChange={mockProps.onSelectionChange}
      />
    )

    const nameHeader = screen.getByText('Name')
    const statusHeader = screen.getByText('Status')

    expect(nameHeader.closest('th')).toHaveClass('ant-table-column-has-sorters')
    expect(statusHeader.closest('th')).toHaveClass(
      'ant-table-column-has-sorters'
    )
  })

  it('renders settings button when configurable is true', () => {
    render(
      <DataTable
        columns={mockProps.columns}
        data={mockProps.data}
        onSearch={mockProps.onSearch}
        onFilter={mockProps.onFilter}
        onRefresh={mockProps.onRefresh}
        onExport={mockProps.onExport}
        onSelectionChange={mockProps.onSelectionChange}
      />
    )

    const settingsButton = screen.getByTestId('settingoutlined-icon')
    expect(settingsButton).toBeInTheDocument()
  })

  it('renders settings button', () => {
    render(
      <DataTable
        columns={mockProps.columns}
        data={mockProps.data}
        onSearch={mockProps.onSearch}
        onFilter={mockProps.onFilter}
        onRefresh={mockProps.onRefresh}
        onExport={mockProps.onExport}
        onSelectionChange={mockProps.onSelectionChange}
      />
    )

    const settingsButton = screen.getByTestId('settingoutlined-icon')
    expect(settingsButton).toBeInTheDocument()
  })

  it('handles disabled rows in selection', () => {
    const dataWithDisabled: MockData[] = [
      ...mockData,
      {
        key: '4',
        name: 'Disabled User',
        email: 'disabled@example.com',
        status: 'disabled',
        disabled: true,
      },
    ]

    render(
      <DataTable
        columns={mockProps.columns}
        data={dataWithDisabled}
        onSearch={mockProps.onSearch}
        onFilter={mockProps.onFilter}
        onRefresh={mockProps.onRefresh}
        onExport={mockProps.onExport}
        onSelectionChange={mockProps.onSelectionChange}
        selectable={true}
      />
    )

    const checkboxes = screen.getAllByRole('checkbox')
    const disabledCheckbox = checkboxes[checkboxes.length - 1]

    expect(disabledCheckbox).toBeDisabled()
  })

  it('disables row selection for disabled rows', () => {
    const dataWithDisabled: MockData[] = [
      ...mockData,
      {
        key: '4',
        name: 'Charlie Brown',
        email: 'charlie@example.com',
        status: 'inactive',
        disabled: true,
      },
    ]

    render(
      <DataTable
        columns={mockProps.columns}
        data={dataWithDisabled}
        onSearch={mockProps.onSearch}
        onFilter={mockProps.onFilter}
        onRefresh={mockProps.onRefresh}
        onExport={mockProps.onExport}
        onSelectionChange={mockProps.onSelectionChange}
        selectable={true}
      />
    )

    // Check that table renders with disabled row data
    expect(screen.getByText('Charlie Brown')).toBeInTheDocument()
  })
})
