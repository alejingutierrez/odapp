import {
  SearchOutlined,
  FilterOutlined,
  ClearOutlined,
} from '@ant-design/icons'
import { Input, Button, Badge, Space } from 'antd'
import React, { useState, useEffect, useCallback } from 'react'

import { useDebounce } from '../../../hooks/useDebounce'
import { Spinner } from '../../atoms'
import './SearchBox.css'

export interface SearchBoxProps {
  placeholder?: string
  value?: string
  onSearch: (value: string) => void
  onFilter?: () => void
  onClear?: () => void
  loading?: boolean
  disabled?: boolean
  allowClear?: boolean
  showFilterButton?: boolean
  filterCount?: number
  size?: 'small' | 'middle' | 'large'
  className?: string
  debounceMs?: number
}

export const SearchBox: React.FC<SearchBoxProps> = ({
  placeholder = 'Search...',
  value = '',
  onSearch,
  onFilter,
  onClear,
  loading = false,
  disabled = false,
  allowClear = true,
  showFilterButton = false,
  filterCount = 0,
  size = 'middle',
  className = '',
  debounceMs = 300,
}) => {
  const [searchValue, setSearchValue] = useState(value)
  const debouncedSearch = useDebounce(searchValue, debounceMs)

  useEffect(() => {
    setSearchValue(value)
  }, [value])

  useEffect(() => {
    if (debouncedSearch !== value) {
      onSearch(debouncedSearch)
    }
  }, [debouncedSearch, onSearch, value])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchValue(e.target.value)
    },
    []
  )

  const handleClear = useCallback(() => {
    setSearchValue('')
    onSearch('')
    onClear?.()
  }, [onSearch, onClear])

  const handlePressEnter = useCallback(() => {
    onSearch(searchValue)
  }, [onSearch, searchValue])

  const suffix = (
    <Space size='small'>
      {loading && <Spinner size='sm' />}
      {allowClear && searchValue && (
        <Button
          type='text'
          size='small'
          icon={<ClearOutlined />}
          onClick={handleClear}
          className='search-box__clear-btn'
        />
      )}
    </Space>
  )

  return (
    <div className={`search-box ${className}`}>
      <Input
        placeholder={placeholder}
        value={searchValue}
        onChange={handleInputChange}
        onPressEnter={handlePressEnter}
        prefix={<SearchOutlined />}
        suffix={suffix}
        size={size}
        disabled={disabled}
        className='search-box__input'
      />
      {showFilterButton && (
        <Badge count={filterCount > 0 ? filterCount : 0} showZero={false}>
          <Button
            icon={<FilterOutlined />}
            onClick={onFilter}
            size={size}
            disabled={disabled}
            className='search-box__filter-btn'
          >
            Filters
          </Button>
        </Badge>
      )}
    </div>
  )
}

export default SearchBox
