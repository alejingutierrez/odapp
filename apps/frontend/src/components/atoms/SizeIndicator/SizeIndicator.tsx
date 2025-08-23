import { Tooltip } from 'antd'
import React from 'react'
import './SizeIndicator.css'

export interface SizeIndicatorProps {
  size: string
  label?: string
  selected?: boolean
  disabled?: boolean
  available?: boolean
  variant?: 'default' | 'compact' | 'detailed'
  shape?: 'square' | 'circle' | 'rounded'
  className?: string
  onClick?: (size: string) => void
}

export const SizeIndicator: React.FC<SizeIndicatorProps> = ({
  size,
  label,
  selected = false,
  disabled = false,
  available = true,
  variant = 'default',
  shape = 'square',
  className = '',
  onClick,
}) => {
  const indicatorClasses = [
    'oda-size-indicator',
    `oda-size-indicator--${variant}`,
    `oda-size-indicator--${shape}`,
    selected && 'oda-size-indicator--selected',
    disabled && 'oda-size-indicator--disabled',
    !available && 'oda-size-indicator--unavailable',
    onClick && !disabled && available && 'oda-size-indicator--clickable',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const handleClick = () => {
    if (!disabled && available && onClick) {
      onClick(size)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (
      (event.key === 'Enter' || event.key === ' ') &&
      !disabled &&
      available &&
      onClick
    ) {
      event.preventDefault()
      onClick(size)
    }
  }

  const getDisplaySize = () => {
    // Handle common size mappings
    const sizeMap: Record<string, string> = {
      xs: 'XS',
      sm: 'S',
      md: 'M',
      lg: 'L',
      xl: 'XL',
      xxl: 'XXL',
      '2xl': 'XXL',
      '3xl': 'XXXL',
    }

    return sizeMap[size.toLowerCase()] || size.toUpperCase()
  }

  const indicator = (
    <div
      className={indicatorClasses}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={onClick && !disabled && available ? 0 : -1}
      role={onClick ? 'button' : undefined}
      aria-label={label ? `Size: ${label}` : `Size: ${size}`}
      aria-pressed={selected}
      aria-disabled={disabled || !available}
    >
      <span className='oda-size-indicator__text'>
        {variant === 'detailed' && label ? label : getDisplaySize()}
      </span>
      {!available && (
        <div className='oda-size-indicator__unavailable-overlay' />
      )}
    </div>
  )

  if (label && variant !== 'detailed') {
    return (
      <Tooltip title={label} placement='top'>
        {indicator}
      </Tooltip>
    )
  }

  return indicator
}

// Size Chart Component for multiple sizes
export interface SizeChartProps {
  sizes: Array<{
    size: string
    label?: string
    available?: boolean
    disabled?: boolean
  }>
  selectedSize?: string
  variant?: SizeIndicatorProps['variant']
  shape?: SizeIndicatorProps['shape']
  className?: string
  onSizeSelect?: (size: string) => void
}

export const SizeChart: React.FC<SizeChartProps> = ({
  sizes,
  selectedSize,
  variant = 'default',
  shape = 'square',
  className = '',
  onSizeSelect,
}) => {
  const chartClasses = [
    'oda-size-chart',
    `oda-size-chart--${variant}`,
    `oda-size-chart--${shape}`,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={chartClasses}>
      {sizes.map(({ size, label, available = true, disabled = false }) => (
        <SizeIndicator
          key={size}
          size={size}
          label={label}
          selected={selectedSize === size}
          disabled={disabled}
          available={available}
          variant={variant}
          shape={shape}
          onClick={onSizeSelect}
        />
      ))}
    </div>
  )
}

// Size Guide Component with measurements
export interface SizeGuideProps {
  sizes: Array<{
    size: string
    label?: string
    measurements?: {
      chest?: number
      waist?: number
      hips?: number
      length?: number
      [key: string]: number | undefined
    }
  }>
  unit?: 'cm' | 'in'
  className?: string
}

export const SizeGuide: React.FC<SizeGuideProps> = ({
  sizes,
  unit = 'cm',
  className = '',
}) => {
  const guideClasses = ['oda-size-guide', className].filter(Boolean).join(' ')

  const measurementKeys = sizes.reduce((keys, size) => {
    if (size.measurements) {
      Object.keys(size.measurements).forEach((key) => {
        if (!keys.includes(key)) {
          keys.push(key)
        }
      })
    }
    return keys
  }, [] as string[])

  return (
    <div className={guideClasses}>
      <table className='oda-size-guide__table'>
        <thead>
          <tr>
            <th>Size</th>
            {measurementKeys.map((key) => (
              <th key={key}>
                {key.charAt(0).toUpperCase() + key.slice(1)} ({unit})
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sizes.map(({ size, label, measurements }) => (
            <tr key={size}>
              <td className='oda-size-guide__size'>
                <strong>{label || size.toUpperCase()}</strong>
              </td>
              {measurementKeys.map((key) => (
                <td key={key}>{measurements?.[key] || '-'}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

SizeIndicator.displayName = 'SizeIndicator'
SizeChart.displayName = 'SizeChart'
SizeGuide.displayName = 'SizeGuide'
