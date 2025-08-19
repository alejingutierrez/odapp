import React, { useState, useEffect, useRef } from 'react'
import { Input, AutoComplete, Tag, Dropdown, Menu, Button } from 'antd'
import {
  SearchOutlined,
  CloseOutlined,
  HistoryOutlined,
  FilterOutlined,
  ClearOutlined,
} from '@ant-design/icons'
import './SearchInput.css'

const { Option, OptGroup } = AutoComplete

export interface SearchSuggestion {
  value: string
  label: string
  category?: string
  count?: number
  type?: 'suggestion' | 'recent' | 'popular'
}

export interface SearchFilter {
  key: string
  label: string
  value: string | number | boolean
  active: boolean
}

export interface SearchInputProps {
  /** Current search value */
  value?: string
  /** Change handler */
  onChange?: (value: string) => void
  /** Search handler */
  onSearch?: (value: string, filters?: SearchFilter[]) => void
  /** Placeholder text */
  placeholder?: string
  /** Whether to show autocomplete */
  showAutocomplete?: boolean
  /** Autocomplete suggestions */
  suggestions?: SearchSuggestion[]
  /** Whether to show recent searches */
  showRecentSearches?: boolean
  /** Recent searches list */
  recentSearches?: string[]
  /** Maximum recent searches to show */
  maxRecentSearches?: number
  /** Whether to show search filters */
  showFilters?: boolean
  /** Available filters */
  filters?: SearchFilter[]
  /** Filter change handler */
  onFiltersChange?: (filters: SearchFilter[]) => void
  /** Whether to show clear button */
  showClear?: boolean
  /** Component size */
  size?: 'small' | 'medium' | 'large'
  /** Whether component is disabled */
  disabled?: boolean
  /** Whether to show search button */
  showSearchButton?: boolean
  /** Search button text */
  searchButtonText?: string
  /** Debounce delay in ms */
  debounceDelay?: number
  /** Loading state */
  loading?: boolean
  /** Custom search icon */
  searchIcon?: React.ReactNode
  /** Allow enter to search */
  allowEnterSearch?: boolean
  /** Minimum characters to trigger search */
  minSearchLength?: number
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value = '',
  onChange,
  onSearch,
  placeholder = 'Search...',
  showAutocomplete = true,
  suggestions = [],
  showRecentSearches = true,
  recentSearches = [],
  maxRecentSearches = 5,
  showFilters = false,
  filters = [],
  onFiltersChange,
  showClear = true,
  size = 'medium',
  disabled = false,
  showSearchButton = false,
  searchButtonText = 'Search',
  debounceDelay = 300,
  loading = false,
  searchIcon = <SearchOutlined />,
  allowEnterSearch = true,
  minSearchLength = 0,
}) => {
  const [internalValue, setInternalValue] = useState(value)
  const [isOpen, setIsOpen] = useState(false)
  const [activeFilters, setActiveFilters] = useState<SearchFilter[]>(filters)
  const debounceRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    setInternalValue(value)
  }, [value])

  useEffect(() => {
    setActiveFilters(filters)
  }, [filters])

  const searchClasses = [
    'oda-search-input',
    `oda-search-input--${size}`,
    showFilters && 'oda-search-input--with-filters',
    disabled && 'oda-search-input--disabled',
  ]
    .filter(Boolean)
    .join(' ')

  const handleInputChange = (val: string) => {
    setInternalValue(val)

    if (onChange) {
      onChange(val)
    }

    // Debounced search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      if (val.length >= minSearchLength && onSearch) {
        onSearch(val, activeFilters)
      }
    }, debounceDelay)
  }

  const handleSearch = (searchValue?: string) => {
    const searchTerm = searchValue || internalValue
    if (searchTerm.length >= minSearchLength && onSearch) {
      onSearch(searchTerm, activeFilters)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && allowEnterSearch) {
      handleSearch()
    }
  }

  const handleClear = () => {
    setInternalValue('')
    if (onChange) {
      onChange('')
    }
    if (onSearch) {
      onSearch('', activeFilters)
    }
  }

  const handleFilterChange = (filter: SearchFilter) => {
    const updatedFilters = activeFilters.map((f) =>
      f.key === filter.key ? { ...f, active: !f.active } : f
    )
    setActiveFilters(updatedFilters)

    if (onFiltersChange) {
      onFiltersChange(updatedFilters)
    }

    // Trigger search with new filters
    if (internalValue.length >= minSearchLength && onSearch) {
      onSearch(internalValue, updatedFilters)
    }
  }

  const clearAllFilters = () => {
    const clearedFilters = activeFilters.map((f) => ({ ...f, active: false }))
    setActiveFilters(clearedFilters)

    if (onFiltersChange) {
      onFiltersChange(clearedFilters)
    }

    if (internalValue.length >= minSearchLength && onSearch) {
      onSearch(internalValue, clearedFilters)
    }
  }

  const getActiveFilterCount = () => {
    return activeFilters.filter((f) => f.active).length
  }

  const renderSuggestions = () => {
    const options: React.ReactNode[] = []

    // Recent searches
    if (showRecentSearches && recentSearches.length > 0) {
      const recentOptions = recentSearches
        .slice(0, maxRecentSearches)
        .filter((search) =>
          search.toLowerCase().includes(internalValue.toLowerCase())
        )
        .map((search) => (
          <Option key={`recent-${search}`} value={search}>
            <div className='oda-search-input__suggestion'>
              <HistoryOutlined className='oda-search-input__suggestion-icon' />
              <span>{search}</span>
              <span className='oda-search-input__suggestion-type'>Recent</span>
            </div>
          </Option>
        ))

      if (recentOptions.length > 0) {
        options.push(
          <OptGroup key='recent' label='Recent Searches'>
            {recentOptions}
          </OptGroup>
        )
      }
    }

    // Grouped suggestions
    if (suggestions.length > 0) {
      const groupedSuggestions = suggestions.reduce(
        (groups, suggestion) => {
          const category = suggestion.category || 'Suggestions'
          if (!groups[category]) {
            groups[category] = []
          }
          groups[category].push(suggestion)
          return groups
        },
        {} as Record<string, SearchSuggestion[]>
      )

      Object.entries(groupedSuggestions).forEach(([category, items]) => {
        const categoryOptions = items.map((suggestion) => (
          <Option key={suggestion.value} value={suggestion.value}>
            <div className='oda-search-input__suggestion'>
              <span>{suggestion.label}</span>
              {suggestion.count && (
                <span className='oda-search-input__suggestion-count'>
                  {suggestion.count}
                </span>
              )}
            </div>
          </Option>
        ))

        options.push(
          <OptGroup key={category} label={category}>
            {categoryOptions}
          </OptGroup>
        )
      })
    }

    return options
  }

  const renderFiltersDropdown = () => {
    if (!showFilters || activeFilters.length === 0) return null

    const menu = (
      <Menu className='oda-search-input__filters-menu'>
        <Menu.Item
          key='header'
          disabled
          className='oda-search-input__filters-header'
        >
          <div className='oda-search-input__filters-title'>
            <FilterOutlined /> Filters
            {getActiveFilterCount() > 0 && (
              <Button
                type='link'
                size='small'
                icon={<ClearOutlined />}
                onClick={clearAllFilters}
                className='oda-search-input__clear-filters'
              >
                Clear All
              </Button>
            )}
          </div>
        </Menu.Item>
        <Menu.Divider />
        {activeFilters.map((filter) => (
          <Menu.Item
            key={filter.key}
            onClick={() => handleFilterChange(filter)}
            className='oda-search-input__filter-item'
          >
            <div className='oda-search-input__filter-content'>
              <span>{filter.label}</span>
              {filter.active && (
                <Tag size='small' color='blue'>
                  Active
                </Tag>
              )}
            </div>
          </Menu.Item>
        ))}
      </Menu>
    )

    return (
      <Dropdown overlay={menu} trigger={['click']} placement='bottomRight'>
        <Button
          icon={<FilterOutlined />}
          size={size === 'large' ? 'middle' : size}
          className='oda-search-input__filters-button'
        >
          {getActiveFilterCount() > 0 && (
            <span className='oda-search-input__filter-count'>
              {getActiveFilterCount()}
            </span>
          )}
        </Button>
      </Dropdown>
    )
  }

  const renderActiveFilters = () => {
    const active = activeFilters.filter((f) => f.active)
    if (active.length === 0) return null

    return (
      <div className='oda-search-input__active-filters'>
        {active.map((filter) => (
          <Tag
            key={filter.key}
            closable
            onClose={() => handleFilterChange(filter)}
            color='blue'
            size='small'
          >
            {filter.label}
          </Tag>
        ))}
      </div>
    )
  }

  const suffix = (
    <div className='oda-search-input__suffix'>
      {loading && <div className='oda-search-input__loading' />}
      {showClear && internalValue && !loading && (
        <CloseOutlined
          className='oda-search-input__clear'
          onClick={handleClear}
        />
      )}
      {renderFiltersDropdown()}
      {showSearchButton && (
        <Button
          type='primary'
          icon={searchIcon}
          size={size === 'large' ? 'middle' : size}
          onClick={() => handleSearch()}
          disabled={disabled || internalValue.length < minSearchLength}
          className='oda-search-input__search-button'
        >
          {searchButtonText}
        </Button>
      )}
    </div>
  )

  return (
    <div className={searchClasses}>
      <div className='oda-search-input__input-wrapper'>
        {showAutocomplete ? (
          <AutoComplete
            value={internalValue}
            onChange={handleInputChange}
            onSelect={handleSearch}
            options={renderSuggestions()}
            open={
              isOpen && (suggestions.length > 0 || recentSearches.length > 0)
            }
            onDropdownVisibleChange={setIsOpen}
            dropdownClassName='oda-search-input__dropdown'
          >
            <Input
              placeholder={placeholder}
              prefix={!showSearchButton ? searchIcon : undefined}
              suffix={suffix}
              size={size === 'large' ? 'middle' : size}
              disabled={disabled}
              onKeyPress={handleKeyPress}
              className='oda-search-input__input'
            />
          </AutoComplete>
        ) : (
          <Input
            value={internalValue}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={placeholder}
            prefix={!showSearchButton ? searchIcon : undefined}
            suffix={suffix}
            size={size === 'large' ? 'middle' : size}
            disabled={disabled}
            onKeyPress={handleKeyPress}
            className='oda-search-input__input'
          />
        )}
      </div>
      {renderActiveFilters()}
    </div>
  )
}

SearchInput.displayName = 'SearchInput'
