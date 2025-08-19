import React, { useState, useEffect } from 'react'
import { DatePicker, TimePicker, Select, Space, Alert } from 'antd'
import { CalendarOutlined, ClockCircleOutlined, GlobalOutlined } from '@ant-design/icons'
import dayjs, { Dayjs } from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { designTokens } from '../../../config/theme'
import './DateTimePicker.css'

dayjs.extend(utc)
dayjs.extend(timezone)

const { Option } = Select

export interface BusinessHours {
  start: string // HH:mm format
  end: string // HH:mm format
  days: number[] // 0-6, Sunday = 0
}

export interface DateTimePickerProps {
  /** Current date-time value */
  value?: Dayjs | null
  /** Change handler */
  onChange?: (value: Dayjs | null, timezone?: string) => void
  /** Date format */
  dateFormat?: string
  /** Time format */
  timeFormat?: string
  /** Whether to show timezone selector */
  showTimezone?: boolean
  /** Selected timezone */
  timezone?: string
  /** Available timezones */
  timezones?: string[]
  /** Whether to enforce business hours */
  enforceBusinessHours?: boolean
  /** Business hours configuration */
  businessHours?: BusinessHours
  /** Minimum selectable date */
  minDate?: Dayjs
  /** Maximum selectable date */
  maxDate?: Dayjs
  /** Disabled dates function */
  disabledDate?: (date: Dayjs) => boolean
  /** Disabled times function */
  disabledTime?: (date: Dayjs) => {
    disabledHours?: () => number[]
    disabledMinutes?: (hour: number) => number[]
    disabledSeconds?: (hour: number, minute: number) => number[]
  }
  /** Component size */
  size?: 'small' | 'medium' | 'large'
  /** Whether to show seconds */
  showSeconds?: boolean
  /** Whether to show now button */
  showNow?: boolean
  /** Placeholder text */
  placeholder?: {
    date?: string
    time?: string
    timezone?: string
  }
  /** Whether component is disabled */
  disabled?: boolean
  /** Layout variant */
  layout?: 'horizontal' | 'vertical' | 'compact'
  /** Custom validation */
  validator?: (date: Dayjs, timezone: string) => string | undefined
}

const DEFAULT_TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
]

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
  value,
  onChange,
  dateFormat = 'YYYY-MM-DD',
  timeFormat = 'HH:mm',
  showTimezone = false,
  timezone: selectedTimezone = dayjs.tz.guess(),
  timezones = DEFAULT_TIMEZONES,
  enforceBusinessHours = false,
  businessHours = {
    start: '09:00',
    end: '17:00',
    days: [1, 2, 3, 4, 5], // Monday to Friday
  },
  minDate,
  maxDate,
  disabledDate,
  disabledTime,
  size = 'medium',
  showSeconds = false,
  showNow = true,
  placeholder = {},
  disabled = false,
  layout = 'horizontal',
  validator,
}) => {
  const [internalValue, setInternalValue] = useState<Dayjs | null>(value || null)
  const [currentTimezone, setCurrentTimezone] = useState(selectedTimezone)
  const [validationError, setValidationError] = useState<string>()

  useEffect(() => {
    setInternalValue(value || null)
  }, [value])

  const pickerClasses = [
    'oda-datetime-picker',
    `oda-datetime-picker--${layout}`,
    `oda-datetime-picker--${size}`,
    showTimezone && 'oda-datetime-picker--with-timezone',
    validationError && 'oda-datetime-picker--error',
  ]
    .filter(Boolean)
    .join(' ')

  const isBusinessDay = (date: Dayjs): boolean => {
    return businessHours.days.includes(date.day())
  }

  const isBusinessHour = (time: Dayjs): boolean => {
    const timeStr = time.format('HH:mm')
    return timeStr >= businessHours.start && timeStr <= businessHours.end
  }

  const validateDateTime = (date: Dayjs | null, tz: string): string | undefined => {
    if (!date) return undefined

    if (enforceBusinessHours) {
      if (!isBusinessDay(date)) {
        return 'Selected date is outside business days'
      }
      if (!isBusinessHour(date)) {
        return `Selected time is outside business hours (${businessHours.start} - ${businessHours.end})`
      }
    }

    if (validator) {
      return validator(date, tz)
    }

    return undefined
  }

  const handleDateChange = (date: Dayjs | null) => {
    let newValue = date
    
    if (date && internalValue) {
      // Preserve time when changing date
      newValue = date
        .hour(internalValue.hour())
        .minute(internalValue.minute())
        .second(internalValue.second())
    }

    setInternalValue(newValue)
    
    const error = validateDateTime(newValue, currentTimezone)
    setValidationError(error)

    if (onChange && !error) {
      onChange(newValue ? newValue.tz(currentTimezone) : null, currentTimezone)
    }
  }

  const handleTimeChange = (time: Dayjs | null) => {
    if (!time || !internalValue) return

    const newValue = internalValue
      .hour(time.hour())
      .minute(time.minute())
      .second(time.second())

    setInternalValue(newValue)
    
    const error = validateDateTime(newValue, currentTimezone)
    setValidationError(error)

    if (onChange && !error) {
      onChange(newValue.tz(currentTimezone), currentTimezone)
    }
  }

  const handleTimezoneChange = (tz: string) => {
    setCurrentTimezone(tz)
    
    if (internalValue && onChange) {
      const convertedValue = internalValue.tz(tz)
      onChange(convertedValue, tz)
    }
  }

  const getDisabledDate = (date: Dayjs): boolean => {
    if (disabledDate && disabledDate(date)) return true
    if (minDate && date.isBefore(minDate, 'day')) return true
    if (maxDate && date.isAfter(maxDate, 'day')) return true
    
    if (enforceBusinessHours && !isBusinessDay(date)) {
      return true
    }
    
    return false
  }

  const getDisabledTime = (date: Dayjs | null) => {
    if (!date) return {}

    const baseDisabled = disabledTime ? disabledTime(date) : {}
    
    if (enforceBusinessHours) {
      const [startHour, startMinute] = businessHours.start.split(':').map(Number)
      const [endHour, endMinute] = businessHours.end.split(':').map(Number)
      
      return {
        ...baseDisabled,
        disabledHours: () => {
          const hours = []
          for (let i = 0; i < 24; i++) {
            if (i < startHour || i > endHour) {
              hours.push(i)
            }
          }
          return hours
        },
        disabledMinutes: (hour: number) => {
          const minutes = []
          if (hour === startHour) {
            for (let i = 0; i < startMinute; i++) {
              minutes.push(i)
            }
          }
          if (hour === endHour) {
            for (let i = endMinute + 1; i < 60; i++) {
              minutes.push(i)
            }
          }
          return minutes
        },
      }
    }
    
    return baseDisabled
  }

  const renderCompactLayout = () => (
    <div className={pickerClasses}>
      <DatePicker
        value={internalValue}
        onChange={handleDateChange}
        format={dateFormat}
        size={size === 'large' ? 'middle' : size}
        disabled={disabled}
        disabledDate={getDisabledDate}
        placeholder={placeholder.date || 'Select date'}
        suffixIcon={<CalendarOutlined />}
        showTime={{
          format: showSeconds ? 'HH:mm:ss' : timeFormat,
          showNow,
          disabledTime: getDisabledTime,
        }}
        showNow={showNow}
        className="oda-datetime-picker__combined"
      />
      {showTimezone && (
        <Select
          value={currentTimezone}
          onChange={handleTimezoneChange}
          size={size === 'large' ? 'middle' : size}
          disabled={disabled}
          placeholder={placeholder.timezone || 'Timezone'}
          suffixIcon={<GlobalOutlined />}
          className="oda-datetime-picker__timezone"
        >
          {timezones.map(tz => (
            <Option key={tz} value={tz}>
              {tz} ({dayjs().tz(tz).format('Z')})
            </Option>
          ))}
        </Select>
      )}
    </div>
  )

  const renderSeparateLayout = () => (
    <div className={pickerClasses}>
      <Space direction={layout === 'vertical' ? 'vertical' : 'horizontal'} size="middle">
        <DatePicker
          value={internalValue}
          onChange={handleDateChange}
          format={dateFormat}
          size={size === 'large' ? 'middle' : size}
          disabled={disabled}
          disabledDate={getDisabledDate}
          placeholder={placeholder.date || 'Select date'}
          suffixIcon={<CalendarOutlined />}
          className="oda-datetime-picker__date"
        />
        
        <TimePicker
          value={internalValue}
          onChange={handleTimeChange}
          format={showSeconds ? 'HH:mm:ss' : timeFormat}
          size={size === 'large' ? 'middle' : size}
          disabled={disabled}
          disabledTime={() => getDisabledTime(internalValue)}
          placeholder={placeholder.time || 'Select time'}
          suffixIcon={<ClockCircleOutlined />}
          showNow={showNow}
          className="oda-datetime-picker__time"
        />
        
        {showTimezone && (
          <Select
            value={currentTimezone}
            onChange={handleTimezoneChange}
            size={size === 'large' ? 'middle' : size}
            disabled={disabled}
            placeholder={placeholder.timezone || 'Timezone'}
            suffixIcon={<GlobalOutlined />}
            className="oda-datetime-picker__timezone"
          >
            {timezones.map(tz => (
              <Option key={tz} value={tz}>
                {tz} ({dayjs().tz(tz).format('Z')})
              </Option>
            ))}
          </Select>
        )}
      </Space>
    </div>
  )

  return (
    <div className="oda-datetime-picker-wrapper">
      {layout === 'compact' ? renderCompactLayout() : renderSeparateLayout()}
      
      {validationError && (
        <Alert
          message={validationError}
          type="error"
          size="small"
          showIcon
          className="oda-datetime-picker__error"
        />
      )}
      
      {enforceBusinessHours && !validationError && (
        <div className="oda-datetime-picker__business-hours-info">
          Business hours: {businessHours.start} - {businessHours.end}
          {businessHours.days.length < 7 && (
            <span> (Business days only)</span>
          )}
        </div>
      )}
    </div>
  )
}

DateTimePicker.displayName = 'DateTimePicker'