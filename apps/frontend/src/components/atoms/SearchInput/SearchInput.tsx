import React from 'react'
import { Input } from 'antd'
import './SearchInput.css'

const { Search } = Input

export interface SearchInputProps {
  /** Current search value */
  value?: string
  /** Change handler */
  onChange?: (value: string) => void
  /** Search handler */
  onSearch?: (value: string) => void
  /** Placeholder text */
  placeholder?: string
  /** Component size */
  size?: 'small' | 'middle' | 'large'
  /** Whether component is disabled */
  disabled?: boolean
  /** Loading state */
  loading?: boolean
  /** Allow clear */
  allowClear?: boolean
  /** Enter button type */
  enterButton?: boolean | React.ReactNode
  /** Search button text */
  searchButtonText?: string
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value = '',
  onChange,
  onSearch,
  placeholder = 'Search...',
  size = 'middle',
  disabled = false,
  loading = false,
  allowClear = true,
  enterButton = true,
  _searchButtonText = 'Search',
}) => {
  const handleSearch = (searchValue: string) => {
    if (onSearch) {
      onSearch(searchValue)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(e.target.value)
    }
  }

  return (
    <div className='oda-search-input'>
      <Search
        value={value}
        placeholder={placeholder}
        size={size}
        disabled={disabled}
        loading={loading}
        allowClear={allowClear}
        enterButton={enterButton}
        onSearch={handleSearch}
        onChange={handleChange}
        className='oda-search-input__component'
      />
    </div>
  )
}

SearchInput.displayName = 'SearchInput'
