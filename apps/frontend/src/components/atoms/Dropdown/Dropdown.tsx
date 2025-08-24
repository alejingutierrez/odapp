import { SearchOutlined, CheckOutlined } from '@ant-design/icons'
import { Select, SelectProps } from 'antd'
import React, { useState, useMemo } from 'react'
import './Dropdown.css'

const { Option, OptGroup } = Select

export interface DropdownOption {
  value: string | number
  label: string
  disabled?: boolean
  icon?: React.ReactNode
  description?: string
  group?: string
  data?: Record<string, unknown>
}

export interface DropdownProps
  extends Omit<
    SelectProps<string | number, DropdownOption>,
    'options' | 'children' | 'variant' | 'optionRender' | 'size'
  > {
  /** Dropdown options */
  options: DropdownOption[]
  /** Whether to show search input */
  searchable?: boolean
  /** Whether to allow multiple selection */
  multiple?: boolean
  /** Custom option renderer */
  optionRender?: (option: DropdownOption, selected: boolean) => React.ReactNode
  /** Custom selected value renderer */
  valueRender?: (option: DropdownOption) => React.ReactNode
  /** Placeholder for search input */
  searchPlaceholder?: string
  /** Whether to show option descriptions */
  showDescriptions?: boolean
  /** Whether to show option icons */
  showIcons?: boolean
  /** Maximum height of dropdown */
  maxHeight?: number
  /** Whether to show select all option (for multiple) */
  showSelectAll?: boolean
  /** Custom empty state */
  emptyText?: string
  /** Loading state */
  loading?: boolean
  /** Dropdown size */
  size?: 'small' | 'medium' | 'large'
}

export const Dropdown: React.FC<DropdownProps> = ({
  options = [],
  searchable = false,
  multiple = false,
  optionRender,
  showDescriptions = false,
  showIcons = true,
  maxHeight = 300,
  showSelectAll = false,
  emptyText = 'No options available',
  loading = false,
  size = 'medium',
  className = '',
  ...props
}) => {
  const [searchValue, setSearchValue] = useState('')

  const dropdownClasses = [
    'oda-dropdown',
    `oda-dropdown--${size}`,
    multiple && 'oda-dropdown--multiple',
    searchable && 'oda-dropdown--searchable',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  // Group options by group property
  const groupedOptions = useMemo(() => {
    const groups: Record<string, DropdownOption[]> = {}
    const ungrouped: DropdownOption[] = []

    options.forEach((option) => {
      if (option.group) {
        if (!groups[option.group]) {
          groups[option.group] = []
        }
        groups[option.group].push(option)
      } else {
        ungrouped.push(option)
      }
    })

    return { groups, ungrouped }
  }, [options])

  // Filter options based on search
  const filteredOptions = useMemo(() => {
    if (!searchValue) return options

    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(searchValue.toLowerCase()) ||
        (option.description &&
          option.description.toLowerCase().includes(searchValue.toLowerCase()))
    )
  }, [options, searchValue])

  const handleSearch = (value: string) => {
    setSearchValue(value)
  }

  const renderOption = (option: DropdownOption) => {
    const isSelected = Array.isArray(props.value)
      ? props.value.includes(option.value)
      : props.value === option.value

    if (optionRender) {
      return optionRender(option, isSelected)
    }

    return (
      <div className='oda-dropdown__option'>
        <div className='oda-dropdown__option-main'>
          {showIcons && option.icon && (
            <span className='oda-dropdown__option-icon'>{option.icon}</span>
          )}
          <span className='oda-dropdown__option-label'>{option.label}</span>
          {multiple && isSelected && (
            <CheckOutlined className='oda-dropdown__option-check' />
          )}
        </div>
        {showDescriptions && option.description && (
          <div className='oda-dropdown__option-description'>
            {option.description}
          </div>
        )}
      </div>
    )
  }

  const renderSelectAllOption = () => {
    if (!multiple || !showSelectAll) return null

    const allSelected =
      options.length > 0 &&
      options.every(
        (option) =>
          Array.isArray(props.value) && props.value.includes(option.value)
      )

    return (
      <Option
        key='__select_all__'
        value='__select_all__'
        className='oda-dropdown__select-all'
      >
        <div className='oda-dropdown__option'>
          <div className='oda-dropdown__option-main'>
            <span className='oda-dropdown__option-label'>
              {allSelected ? 'Deselect All' : 'Select All'}
            </span>
          </div>
        </div>
      </Option>
    )
  }

  const renderOptions = () => {
    const { groups, ungrouped } = groupedOptions
    const hasGroups = Object.keys(groups).length > 0

    if (!hasGroups) {
      return filteredOptions.map((option) => (
        <Option
          key={option.value}
          value={option.value}
          disabled={option.disabled}
          className='oda-dropdown__option-wrapper'
        >
          {renderOption(option)}
        </Option>
      ))
    }

    return (
      <>
        {ungrouped.length > 0 &&
          ungrouped.map((option) => (
            <Option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
              className='oda-dropdown__option-wrapper'
            >
              {renderOption(option)}
            </Option>
          ))}
        {Object.entries(groups).map(([groupName, groupOptions]) => (
          <OptGroup key={groupName} label={groupName}>
            {groupOptions
              .filter(
                (option) =>
                  !searchValue ||
                  option.label
                    .toLowerCase()
                    .includes(searchValue.toLowerCase()) ||
                  (option.description &&
                    option.description
                      .toLowerCase()
                      .includes(searchValue.toLowerCase()))
              )
              .map((option) => (
                <Option
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  className='oda-dropdown__option-wrapper'
                >
                  {renderOption(option)}
                </Option>
              ))}
          </OptGroup>
        ))}
      </>
    )
  }

  return (
    <Select
      className={dropdownClasses}
      mode={multiple ? 'multiple' : undefined}
      showSearch={searchable}
      searchValue={searchValue}
      onSearch={handleSearch}
      filterOption={false}
      notFoundContent={loading ? 'Loading...' : emptyText}
      loading={loading}
      dropdownStyle={{ maxHeight }}
      size={size === 'large' ? 'large' : size === 'small' ? 'small' : 'middle'}
      suffixIcon={searchable ? <SearchOutlined /> : undefined}
    >
      {renderSelectAllOption()}
      {renderOptions()}
    </Select>
  )
}

Dropdown.displayName = 'Dropdown'
