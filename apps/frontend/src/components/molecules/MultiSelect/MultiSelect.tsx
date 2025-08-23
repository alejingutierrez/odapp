import React, { useState, useMemo } from 'react'
import { Select, Tag, Button, Space, Typography, Input } from 'antd'
import { SearchOutlined, ClearOutlined, CheckOutlined } from '@ant-design/icons'
import './MultiSelect.css'

export interface SelectOption {
  value: string | number
  label: string
  disabled?: boolean
  group?: string
}

export interface MultiSelectProps {
  options: SelectOption[]
  value?: (string | number)[]
  onChange?: (values: (string | number)[]) => void
  placeholder?: string
  searchable?: boolean
  showSelectAll?: boolean
  showClearAll?: boolean
  maxTagCount?: number
  disabled?: boolean
  loading?: boolean
  size?: 'small' | 'middle' | 'large'
  className?: string
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  value = [],
  onChange,
  placeholder = 'Select items...',
  searchable = true,
  showSelectAll = true,
  showClearAll = true,
  maxTagCount = 3,
  disabled = false,
  loading = false,
  size = 'middle',
  className = '',
}) => {
  const [searchValue, setSearchValue] = useState('')
  const [open, setOpen] = useState(false)

  const filteredOptions = useMemo(() => {
    if (!searchValue) return options

    return options.filter((option) =>
      option.label.toLowerCase().includes(searchValue.toLowerCase())
    )
  }, [options, searchValue])

  const groupedOptions = useMemo(() => {
    const groups: Record<string, SelectOption[]> = {}
    const ungrouped: SelectOption[] = []

    filteredOptions.forEach((option) => {
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
  }, [filteredOptions])

  const handleChange = (newValues: (string | number)[]) => {
    onChange?.(newValues)
  }

  const handleSelectAll = () => {
    const allValues = filteredOptions
      .filter((option) => !option.disabled)
      .map((option) => option.value)
    onChange?.(allValues)
  }

  const handleClearAll = () => {
    onChange?.([])
  }

  const isAllSelected = useMemo(() => {
    const availableOptions = filteredOptions.filter(
      (option) => !option.disabled
    )
    return (
      availableOptions.length > 0 &&
      availableOptions.every((option) => value.includes(option.value))
    )
  }, [filteredOptions, value])

  const renderDropdownHeader = () => (
    <div className='multi-select__header'>
      {searchable && (
        <Input
          placeholder='Search options...'
          prefix={<SearchOutlined />}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          size='small'
          className='multi-select__search'
        />
      )}

      <Space size='small' className='multi-select__actions'>
        {showSelectAll && (
          <Button
            type='text'
            size='small'
            icon={<CheckOutlined />}
            onClick={handleSelectAll}
            disabled={isAllSelected || filteredOptions.length === 0}
          >
            Select All
          </Button>
        )}

        {showClearAll && (
          <Button
            type='text'
            size='small'
            icon={<ClearOutlined />}
            onClick={handleClearAll}
            disabled={value.length === 0}
          >
            Clear All
          </Button>
        )}
      </Space>
    </div>
  )

  const renderGroupedOptions = () => {
    const { groups, ungrouped } = groupedOptions
    const elements: React.ReactNode[] = []

    // Render ungrouped options first
    if (ungrouped.length > 0) {
      ungrouped.forEach((option) => {
        elements.push(
          <Select.Option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </Select.Option>
        )
      })
    }

    // Render grouped options
    Object.entries(groups).forEach(([groupName, groupOptions]) => {
      elements.push(
        <Select.OptGroup key={groupName} label={groupName}>
          {groupOptions.map((option) => (
            <Select.Option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </Select.Option>
          ))}
        </Select.OptGroup>
      )
    })

    return elements
  }

  const renderTag = (props: {
    label: React.ReactNode
    value: string
    closable?: boolean
    onClose?: () => void
  }) => {
    const { label, value: tagValue, closable, onClose } = props
    const option = options.find((opt) => opt.value === tagValue)

    return (
      <Tag closable={closable} onClose={onClose} className='multi-select__tag'>
        {option?.label || label}
      </Tag>
    )
  }

  return (
    <div className={`multi-select ${className}`}>
      <Select
        mode='multiple'
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        loading={loading}
        size={size}
        open={open}
        onDropdownVisibleChange={setOpen}
        maxTagCount={maxTagCount}
        tagRender={renderTag}
        dropdownRender={(menu) => (
          <div className='multi-select__dropdown'>
            {renderDropdownHeader()}
            {menu}
            {filteredOptions.length === 0 && (
              <div className='multi-select__empty'>
                <Typography.Text type='secondary'>
                  No options found
                </Typography.Text>
              </div>
            )}
          </div>
        )}
        className='multi-select__select'
        showSearch={false} // We handle search in dropdown header
      >
        {renderGroupedOptions()}
      </Select>

      {value.length > 0 && (
        <div className='multi-select__summary'>
          <Typography.Text type='secondary' className='multi-select__count'>
            {value.length} item{value.length !== 1 ? 's' : ''} selected
          </Typography.Text>
        </div>
      )}
    </div>
  )
}

export default MultiSelect
