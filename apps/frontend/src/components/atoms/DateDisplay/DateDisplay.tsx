import React, { CSSProperties } from 'react'
import { Typography, Tooltip, theme } from 'antd'
import {
  CalendarOutlined,
  ClockCircleOutlined,
  HistoryOutlined,
} from '@ant-design/icons'

const { Text } = Typography
const { useToken } = theme

export type DateFormatType =
  | 'short'
  | 'medium'
  | 'long'
  | 'relative'
  | 'time'
  | 'datetime'
  | 'smart'
export type DateVariant = 'default' | 'compact' | 'badge' | 'card'
export type DateTheme = 'default' | 'primary' | 'success' | 'warning' | 'danger'

export interface DateDisplayProps {
  date: Date | string | number
  format?: DateFormatType
  locale?: string
  showIcon?: boolean
  showTooltip?: boolean
  tooltipFormat?: DateFormatType
  variant?: DateVariant
  theme?: DateTheme
  interactive?: boolean
  showRelativeIndicator?: boolean
}

export const DateDisplay: React.FC<DateDisplayProps> = ({
  date,
  format = 'medium',
  locale = 'en-US',
  showIcon = false,
  showTooltip = true,
  tooltipFormat = 'long',
  variant = 'default',
  theme = 'default',
  interactive = false,
  showRelativeIndicator = false,
  ...props
}) => {
  const { token } = useToken()
  const dateObj = new Date(date)
  const now = new Date()
  const diffInMs = now.getTime() - dateObj.getTime()
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

  const formatDate = (
    dateToFormat: Date,
    formatType: DateFormatType
  ): string => {
    if (formatType === 'relative') {
      if (Math.abs(diffInHours) < 1) return 'Just now'
      if (Math.abs(diffInHours) < 24) {
        return diffInHours > 0
          ? `${diffInHours}h ago`
          : `In ${Math.abs(diffInHours)}h`
      }
      if (diffInDays === 0) return 'Today'
      if (diffInDays === 1) return 'Yesterday'
      if (diffInDays === -1) return 'Tomorrow'
      if (diffInDays > 0 && diffInDays < 7) return `${diffInDays}d ago`
      if (diffInDays < 0 && diffInDays > -7)
        return `In ${Math.abs(diffInDays)}d`
      if (diffInDays > 0) return `${Math.floor(diffInDays / 7)}w ago`
      return `In ${Math.floor(Math.abs(diffInDays) / 7)}w`
    }

    if (formatType === 'smart') {
      if (Math.abs(diffInDays) < 7) return formatDate(dateToFormat, 'relative')
      if (Math.abs(diffInDays) < 365) {
        return new Intl.DateTimeFormat(locale, {
          month: 'short',
          day: 'numeric',
        }).format(dateToFormat)
      }
      return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(dateToFormat)
    }

    const options: Intl.DateTimeFormatOptions = {
      short: { dateStyle: 'short' as const },
      medium: { dateStyle: 'medium' as const },
      long: { dateStyle: 'long' as const },
      time: { timeStyle: 'short' as const },
      datetime: { dateStyle: 'medium' as const, timeStyle: 'short' as const },
    }[formatType] || { dateStyle: 'medium' as const }

    return new Intl.DateTimeFormat(locale, options).format(dateToFormat)
  }

  const getDateIcon = () => {
    if (!showIcon) return null

    if (
      format === 'relative' ||
      (format === 'smart' && Math.abs(diffInDays) < 7)
    ) {
      return <HistoryOutlined className='date-icon' />
    }
    if (format === 'time') {
      return <ClockCircleOutlined className='date-icon' />
    }
    return <CalendarOutlined className='date-icon' />
  }

  const getThemeColor = () => {
    switch (theme) {
      case 'primary':
        return token.colorPrimary
      case 'success':
        return token.colorSuccess
      case 'warning':
        return token.colorWarning
      case 'danger':
        return token.colorError
      default:
        return undefined
    }
  }

  const getRelativeIndicator = () => {
    if (!showRelativeIndicator || format === 'relative') return null

    if (Math.abs(diffInDays) < 1) {
      return <span className='relative-indicator'>• Today</span>
    }
    if (diffInDays === 1) {
      return <span className='relative-indicator'>• Yesterday</span>
    }
    if (diffInDays === -1) {
      return <span className='relative-indicator'>• Tomorrow</span>
    }
    return null
  }

  const formattedDate = formatDate(dateObj, format)
  const tooltipText = showTooltip ? formatDate(dateObj, tooltipFormat) : ''

  const getContainerStyle = (): CSSProperties => {
    const baseStyle: CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      fontVariantNumeric: 'tabular-nums',
    }

    if (interactive) {
      baseStyle.cursor = 'pointer'
      baseStyle.transition = 'all 0.2s ease'
      baseStyle.borderRadius = '4px'
      baseStyle.padding = '2px 6px'
    }

    switch (variant) {
      case 'compact':
        baseStyle.gap = '3px'
        baseStyle.fontSize = '12px'
        break
      case 'badge':
        baseStyle.background =
          'linear-gradient(135deg, #f0f2f5 0%, #e6f7ff 100%)'
        baseStyle.border = '1px solid #d9d9d9'
        baseStyle.borderRadius = '16px'
        baseStyle.padding = '4px 12px'
        baseStyle.fontSize = '12px'
        baseStyle.fontWeight = 500
        break
      case 'card':
        baseStyle.background = '#fafafa'
        baseStyle.border = '1px solid #f0f0f0'
        baseStyle.borderRadius = '8px'
        baseStyle.padding = '8px 12px'
        baseStyle.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.03)'
        break
    }

    return baseStyle
  }

  const getIconStyle = (): CSSProperties => ({
    opacity: 0.65,
    fontSize: {
      compact: '10px',
      badge: '11px',
      card: '14px',
      default: '12px',
    }[variant],
  })

  const getIndicatorStyle = (): CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '2px',
    fontSize: '10px',
    color: '#8c8c8c',
    marginLeft: '4px',
  })

  const content = (
    <span style={getContainerStyle()}>
      {getDateIcon() && <span style={getIconStyle()}>{getDateIcon()}</span>}
      <Text style={{ color: getThemeColor() }} {...props}>
        {formattedDate}
      </Text>
      {getRelativeIndicator() && (
        <span style={getIndicatorStyle()}>{getRelativeIndicator()}</span>
      )}
    </span>
  )

  return showTooltip && tooltipText !== formattedDate ? (
    <Tooltip title={tooltipText} placement='top'>
      {content}
    </Tooltip>
  ) : (
    content
  )
}
