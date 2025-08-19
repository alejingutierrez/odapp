import React from 'react'
import { Pagination, Select, Space, Typography } from 'antd'
import './PaginationControls.css'

export interface PaginationControlsProps {
  current: number
  total: number
  pageSize: number
  pageSizeOptions?: number[]
  showSizeChanger?: boolean
  showQuickJumper?: boolean
  showTotal?: boolean
  showLessItems?: boolean
  onChange?: (page: number, pageSize: number) => void
  onShowSizeChange?: (current: number, size: number) => void
  disabled?: boolean
  size?: 'small' | 'default'
  className?: string
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  current,
  total,
  pageSize,
  pageSizeOptions = [10, 20, 50, 100],
  showSizeChanger = true,
  showQuickJumper = false,
  showTotal = true,
  showLessItems = false,
  onChange,
  onShowSizeChange,
  disabled = false,
  size = 'default',
  className = '',
}) => {
  const startItem = (current - 1) * pageSize + 1
  const endItem = Math.min(current * pageSize, total)

  const handleChange = (page: number, newPageSize?: number) => {
    onChange?.(page, newPageSize || pageSize)
  }

  const handleShowSizeChange = (newCurrent: number, newSize: number) => {
    onShowSizeChange?.(newCurrent, newSize)
    onChange?.(newCurrent, newSize)
  }

  const renderTotal = (totalCount: number, range: [number, number]) => (
    <Typography.Text type='secondary' className='pagination-controls__total'>
      Showing {range[0]}-{range[1]} of {totalCount.toLocaleString()} items
    </Typography.Text>
  )

  const renderPageSizeSelector = () => {
    if (!showSizeChanger) return null

    return (
      <Space size='small' className='pagination-controls__size-selector'>
        <Typography.Text type='secondary'>Show:</Typography.Text>
        <Select
          value={pageSize}
          onChange={(value) => handleShowSizeChange(1, value)}
          size={size}
          disabled={disabled}
          className='pagination-controls__size-select'
        >
          {pageSizeOptions.map((option) => (
            <Select.Option key={option} value={option}>
              {option}
            </Select.Option>
          ))}
        </Select>
        <Typography.Text type='secondary'>per page</Typography.Text>
      </Space>
    )
  }

  if (total === 0) {
    return (
      <div
        className={`pagination-controls pagination-controls--empty ${className}`}
      >
        <Typography.Text type='secondary'>No items to display</Typography.Text>
      </div>
    )
  }

  return (
    <div className={`pagination-controls ${className}`}>
      <div className='pagination-controls__info'>
        {showTotal && (
          <Typography.Text
            type='secondary'
            className='pagination-controls__summary'
          >
            Showing {startItem.toLocaleString()}-{endItem.toLocaleString()} of{' '}
            {total.toLocaleString()} items
          </Typography.Text>
        )}
        {renderPageSizeSelector()}
      </div>

      <Pagination
        current={current}
        total={total}
        pageSize={pageSize}
        showSizeChanger={false} // We handle this separately
        showQuickJumper={showQuickJumper}
        showTotal={showTotal ? renderTotal : false}
        showLessItems={showLessItems}
        onChange={handleChange}
        disabled={disabled}
        size={size}
        className='pagination-controls__pagination'
      />
    </div>
  )
}

export default PaginationControls
