import React, { useState, useCallback } from 'react'
import { Table, Space, Button, Input, Select, Tooltip } from 'antd'
import { 
  SearchOutlined, 
  FilterOutlined, 
  ReloadOutlined,
  DownloadOutlined,
  SettingOutlined
} from '@ant-design/icons'
import type { ColumnsType, TableProps } from 'antd/es/table'
import { SearchBox } from '../SearchBox'
import './DataTable.css'

export interface DataTableColumn<T = any> extends Omit<ColumnsType<T>[0], 'key'> {
  key: string
  searchable?: boolean
  filterable?: boolean
  sortable?: boolean
}

export interface DataTableProps<T = any> extends Omit<TableProps<T>, 'columns'> {
  columns: DataTableColumn<T>[]
  data: T[]
  loading?: boolean
  searchable?: boolean
  filterable?: boolean
  exportable?: boolean
  refreshable?: boolean
  selectable?: boolean
  onSearch?: (searchTerm: string) => void
  onFilter?: (filters: Record<string, any>) => void
  onRefresh?: () => void
  onExport?: (format: 'csv' | 'excel' | 'pdf') => void
  onSelectionChange?: (selectedRowKeys: React.Key[], selectedRows: T[]) => void
  searchPlaceholder?: string
  emptyText?: string
  className?: string
}

export const DataTable = <T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  searchable = true,
  filterable = true,
  exportable = false,
  refreshable = true,
  selectable = false,
  onSearch,
  onFilter,
  onRefresh,
  onExport,
  onSelectionChange,
  searchPlaceholder = 'Search table...',
  emptyText = 'No data available',
  className = '',
  ...tableProps
}: DataTableProps<T>) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({})

  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value)
    onSearch?.(value)
  }, [onSearch])

  const handleFilterChange = useCallback((key: string, value: any) => {
    const newFilters = { ...activeFilters, [key]: value }
    if (!value || (Array.isArray(value) && value.length === 0)) {
      delete newFilters[key]
    }
    setActiveFilters(newFilters)
    onFilter?.(newFilters)
  }, [activeFilters, onFilter])

  const handleSelectionChange = useCallback((newSelectedRowKeys: React.Key[], selectedRows: T[]) => {
    setSelectedRowKeys(newSelectedRowKeys)
    onSelectionChange?.(newSelectedRowKeys, selectedRows)
  }, [onSelectionChange])

  const renderToolbar = () => (
    <div className="data-table__toolbar">
      <div className="data-table__toolbar-left">
        {searchable && (
          <SearchBox
            placeholder={searchPlaceholder}
            onSearch={handleSearch}
            loading={loading}
            className="data-table__search"
          />
        )}
      </div>
      
      <div className="data-table__toolbar-right">
        <Space size="small">
          {refreshable && (
            <Tooltip title="Refresh">
              <Button
                icon={<ReloadOutlined />}
                onClick={onRefresh}
                loading={loading}
              />
            </Tooltip>
          )}
          
          {exportable && (
            <Select
              placeholder="Export"
              suffixIcon={<DownloadOutlined />}
              style={{ width: 100 }}
              onSelect={(format: 'csv' | 'excel' | 'pdf') => onExport?.(format)}
              options={[
                { label: 'CSV', value: 'csv' },
                { label: 'Excel', value: 'excel' },
                { label: 'PDF', value: 'pdf' }
              ]}
            />
          )}
          
          <Tooltip title="Table Settings">
            <Button icon={<SettingOutlined />} />
          </Tooltip>
        </Space>
      </div>
    </div>
  )

  const renderFilterRow = () => {
    if (!filterable) return null

    const filterableColumns = columns.filter(col => col.filterable)
    if (filterableColumns.length === 0) return null

    return (
      <div className="data-table__filters">
        <Space wrap>
          {filterableColumns.map(column => (
            <div key={column.key} className="data-table__filter-item">
              <Input
                placeholder={`Filter by ${column.title}`}
                value={activeFilters[column.key] || ''}
                onChange={(e) => handleFilterChange(column.key, e.target.value)}
                allowClear
                size="small"
                style={{ width: 150 }}
              />
            </div>
          ))}
        </Space>
      </div>
    )
  }

  const rowSelection = selectable ? {
    selectedRowKeys,
    onChange: handleSelectionChange,
    getCheckboxProps: (record: T) => ({
      disabled: record.disabled === true,
    }),
  } : undefined

  const processedColumns = columns.map(column => ({
    ...column,
    sorter: column.sortable ? true : false,
    showSorterTooltip: column.sortable ? { title: `Sort by ${column.title}` } : false
  }))

  return (
    <div className={`data-table ${className}`}>
      {renderToolbar()}
      {renderFilterRow()}
      
      <Table<T>
        columns={processedColumns}
        dataSource={data}
        loading={loading}
        rowSelection={rowSelection}
        locale={{ emptyText }}
        scroll={{ x: 'max-content' }}
        className="data-table__table"
        {...tableProps}
      />
      
      {selectedRowKeys.length > 0 && (
        <div className="data-table__selection-info">
          <Space>
            <span>{selectedRowKeys.length} item(s) selected</span>
            <Button 
              size="small" 
              onClick={() => setSelectedRowKeys([])}
            >
              Clear Selection
            </Button>
          </Space>
        </div>
      )}
    </div>
  )
}

export default DataTable