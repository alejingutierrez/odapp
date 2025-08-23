import React, { useState } from 'react'
import { DatePicker, Button, Space, Typography, Dropdown, Tag } from 'antd'
import { CalendarOutlined, ClockCircleOutlined } from '@ant-design/icons'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import quarterOfYear from 'dayjs/plugin/quarterOfYear'
import './DateRangePicker.css'

// Extend dayjs with quarter plugin
dayjs.extend(quarterOfYear)

const { RangePicker } = DatePicker

export interface DateRange {
  start: Dayjs | null
  end: Dayjs | null
}

export interface PresetRange {
  label: string
  value: [Dayjs, Dayjs]
}

export interface DateRangePickerProps {
  value?: DateRange
  onChange?: (range: DateRange) => void
  showPresets?: boolean
  showTime?: boolean
  format?: string
  placeholder?: [string, string]
  disabled?: boolean
  allowClear?: boolean
  size?: 'small' | 'middle' | 'large'
  className?: string
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  showPresets = true,
  showTime = false,
  format,
  placeholder = ['Start date', 'End date'],
  disabled = false,
  allowClear = true,
  size = 'middle',
  className = '',
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)

  const defaultFormat = showTime ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD'
  const dateFormat = format || defaultFormat

  const presets: PresetRange[] = [
    {
      label: 'Today',
      value: [dayjs().startOf('day'), dayjs().endOf('day')],
    },
    {
      label: 'Yesterday',
      value: [
        dayjs().subtract(1, 'day').startOf('day'),
        dayjs().subtract(1, 'day').endOf('day'),
      ],
    },
    {
      label: 'This Week',
      value: [dayjs().startOf('week'), dayjs().endOf('week')],
    },
    {
      label: 'Last Week',
      value: [
        dayjs().subtract(1, 'week').startOf('week'),
        dayjs().subtract(1, 'week').endOf('week'),
      ],
    },
    {
      label: 'This Month',
      value: [dayjs().startOf('month'), dayjs().endOf('month')],
    },
    {
      label: 'Last Month',
      value: [
        dayjs().subtract(1, 'month').startOf('month'),
        dayjs().subtract(1, 'month').endOf('month'),
      ],
    },
    {
      label: 'This Quarter',
      value: [dayjs().startOf('quarter'), dayjs().endOf('quarter')],
    },
    {
      label: 'Last Quarter',
      value: [
        dayjs().subtract(3, 'month').startOf('quarter'),
        dayjs().subtract(3, 'month').endOf('quarter'),
      ],
    },
    {
      label: 'This Year',
      value: [dayjs().startOf('year'), dayjs().endOf('year')],
    },
    {
      label: 'Last Year',
      value: [
        dayjs().subtract(1, 'year').startOf('year'),
        dayjs().subtract(1, 'year').endOf('year'),
      ],
    },
    {
      label: 'Last 7 Days',
      value: [dayjs().subtract(7, 'day'), dayjs()],
    },
    {
      label: 'Last 30 Days',
      value: [dayjs().subtract(30, 'day'), dayjs()],
    },
    {
      label: 'Last 90 Days',
      value: [dayjs().subtract(90, 'day'), dayjs()],
    },
  ]

  const handleRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    if (dates) {
      const [start, end] = dates
      onChange?.({ start, end })
      setSelectedPreset(null) // Clear preset selection when manually selecting dates
    } else {
      onChange?.({ start: null, end: null })
      setSelectedPreset(null)
    }
  }

  const handlePresetSelect = (preset: PresetRange) => {
    const [start, end] = preset.value
    onChange?.({ start, end })
    setSelectedPreset(preset.label)
  }

  const handleClear = () => {
    onChange?.({ start: null, end: null })
    setSelectedPreset(null)
  }

  const renderPresetButton = (preset: PresetRange) => (
    <Button
      key={preset.label}
      type={selectedPreset === preset.label ? 'primary' : 'default'}
      size='small'
      onClick={() => handlePresetSelect(preset)}
      className='date-range-picker__preset-btn'
    >
      {preset.label}
    </Button>
  )

  const renderPresetDropdown = () => {
    const menuItems = presets.map((preset) => ({
      key: preset.label,
      label: preset.label,
      onClick: () => handlePresetSelect(preset),
    }))

    return (
      <Dropdown
        menu={{ items: menuItems }}
        trigger={['click']}
        placement='bottomLeft'
      >
        <Button
          icon={<ClockCircleOutlined />}
          size={size}
          className='date-range-picker__preset-dropdown'
        >
          Quick Select
        </Button>
      </Dropdown>
    )
  }

  const renderPresets = () => {
    if (!showPresets) return null

    return (
      <div className='date-range-picker__presets'>
        <Typography.Text
          type='secondary'
          className='date-range-picker__presets-label'
        >
          Quick select:
        </Typography.Text>

        <div className='date-range-picker__presets-buttons'>
          {presets.slice(0, 6).map(renderPresetButton)}
        </div>

        <div className='date-range-picker__presets-more'>
          {renderPresetDropdown()}
        </div>
      </div>
    )
  }

  const renderSelectedRange = () => {
    if (!value?.start || !value?.end) return null

    const duration = value.end.diff(value.start, 'day') + 1

    return (
      <div className='date-range-picker__selection-info'>
        <Space size='small'>
          <Tag color='blue' className='date-range-picker__duration-tag'>
            {duration} day{duration !== 1 ? 's' : ''} selected
          </Tag>
          {selectedPreset && (
            <Tag color='green' className='date-range-picker__preset-tag'>
              {selectedPreset}
            </Tag>
          )}
        </Space>
      </div>
    )
  }

  return (
    <div className={`date-range-picker ${className}`}>
      <div className='date-range-picker__input-section'>
        <RangePicker
          value={value?.start && value?.end ? [value.start, value.end] : null}
          onChange={handleRangeChange}
          showTime={showTime}
          format={dateFormat}
          placeholder={placeholder}
          disabled={disabled}
          allowClear={allowClear}
          size={size}
          suffixIcon={<CalendarOutlined />}
          className='date-range-picker__picker'
        />

        {allowClear && (value?.start || value?.end) && (
          <Button
            type='text'
            size='small'
            onClick={handleClear}
            className='date-range-picker__clear-btn'
          >
            Clear
          </Button>
        )}
      </div>

      {renderSelectedRange()}
      {renderPresets()}
    </div>
  )
}

export default DateRangePicker
