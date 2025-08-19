import React, { useState, useEffect } from 'react'
import { Slider, SliderSingleProps, InputNumber } from 'antd'
import './RangeSlider.css'

export interface RangeSliderProps
  extends Omit<SliderSingleProps, 'value' | 'onChange' | 'range'> {
  /** Current range value [min, max] */
  value?: [number, number]
  /** Change handler */
  onChange?: (value: [number, number]) => void
  /** Minimum allowed value */
  min?: number
  /** Maximum allowed value */
  max?: number
  /** Step increment */
  step?: number
  /** Whether to show input fields */
  showInputs?: boolean
  /** Whether to show value labels */
  showLabels?: boolean
  /** Custom value formatter */
  formatter?: (value: number) => string
  /** Custom value parser */
  parser?: (displayValue: string) => number
  /** Range slider size */
  size?: 'small' | 'medium' | 'large'
  /** Whether to show range info */
  showRange?: boolean
  /** Custom range labels */
  rangeLabels?: [string, string]
  /** Whether to allow crossing handles */
  allowCross?: boolean
  /** Custom marks */
  marks?: Record<
    number,
    React.ReactNode | { style: React.CSSProperties; label: React.ReactNode }
  >
  /** Whether to show tooltips */
  showTooltips?: boolean
  /** Tooltip formatter */
  tooltipFormatter?: (value: number) => React.ReactNode
  /** Unit label */
  unit?: string
  /** Prefix for values */
  prefix?: string
  /** Suffix for values */
  suffix?: string
}

export const RangeSlider: React.FC<RangeSliderProps> = ({
  value = [0, 100],
  onChange,
  min = 0,
  max = 100,
  step = 1,
  showInputs = false,
  showLabels = true,
  formatter,
  parser,
  size = 'medium',
  showRange = false,
  rangeLabels = ['Min', 'Max'],
  marks,
  showTooltips = true,
  tooltipFormatter,
  unit,
  prefix,
  suffix,
  className = '',
  ...props
}) => {
  const [internalValue, setInternalValue] = useState<[number, number]>(value)

  useEffect(() => {
    setInternalValue(value)
  }, [value])

  const sliderClasses = [
    'oda-range-slider',
    `oda-range-slider--${size}`,
    showInputs && 'oda-range-slider--with-inputs',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const formatValue = (val: number): string => {
    if (val === null || val === undefined || isNaN(val)) return '0'
    if (formatter) return formatter(val)

    let formatted = val.toString()
    if (prefix) formatted = prefix + formatted
    if (suffix) formatted = formatted + suffix
    if (unit) formatted = formatted + ' ' + unit

    return formatted
  }

  const handleSliderChange = (newValue: number | [number, number]) => {
    const rangeValue = Array.isArray(newValue)
      ? newValue
      : ([newValue, newValue] as [number, number])
    setInternalValue(rangeValue)

    if (onChange) {
      onChange(rangeValue)
    }
  }

  const handleMinInputChange = (newMin: number | null) => {
    if (newMin === null) return

    const clampedMin = Math.max(min, Math.min(newMin, internalValue[1]))
    const newValue: [number, number] = [clampedMin, internalValue[1]]

    setInternalValue(newValue)
    if (onChange) {
      onChange(newValue)
    }
  }

  const handleMaxInputChange = (newMax: number | null) => {
    if (newMax === null) return

    const clampedMax = Math.min(max, Math.max(newMax, internalValue[0]))
    const newValue: [number, number] = [internalValue[0], clampedMax]

    setInternalValue(newValue)
    if (onChange) {
      onChange(newValue)
    }
  }

  const defaultTooltipFormatter = (val: number) => formatValue(val)

  const renderInputs = () => {
    if (!showInputs) return null

    return (
      <div className='oda-range-slider__inputs'>
        <div className='oda-range-slider__input-group'>
          {showLabels && (
            <label className='oda-range-slider__input-label'>
              {rangeLabels[0]}
            </label>
          )}
          <InputNumber
            value={internalValue[0]}
            onChange={handleMinInputChange}
            min={min}
            max={internalValue[1]}
            step={step}
            size={size === 'large' ? 'middle' : size}
            formatter={formatter}
            parser={parser}
            className='oda-range-slider__input'
          />
        </div>

        <div className='oda-range-slider__separator'>-</div>

        <div className='oda-range-slider__input-group'>
          {showLabels && (
            <label className='oda-range-slider__input-label'>
              {rangeLabels[1]}
            </label>
          )}
          <InputNumber
            value={internalValue[1]}
            onChange={handleMaxInputChange}
            min={internalValue[0]}
            max={max}
            step={step}
            size={size === 'large' ? 'middle' : size}
            formatter={formatter}
            parser={parser}
            className='oda-range-slider__input'
          />
        </div>
      </div>
    )
  }

  const renderRangeInfo = () => {
    if (!showRange) return null

    // Ensure internalValue is a valid array with two elements
    const safeValue =
      Array.isArray(internalValue) && internalValue.length >= 2
        ? internalValue
        : [min, max]

    const rangeSize = safeValue[1] - safeValue[0]
    const rangePercentage = ((rangeSize / (max - min)) * 100).toFixed(1)

    return (
      <div className='oda-range-slider__range-info'>
        <span className='oda-range-slider__range-size'>
          Range: {formatValue(rangeSize)}
        </span>
        <span className='oda-range-slider__range-percentage'>
          ({rangePercentage}% of total)
        </span>
      </div>
    )
  }

  const renderLabels = () => {
    if (!showLabels || showInputs) return null

    // Ensure internalValue is a valid array with two elements
    const safeValue =
      Array.isArray(internalValue) && internalValue.length >= 2
        ? internalValue
        : [min, max]

    return (
      <div className='oda-range-slider__labels'>
        <span className='oda-range-slider__label oda-range-slider__label--min'>
          {rangeLabels[0]}: {formatValue(safeValue[0])}
        </span>
        <span className='oda-range-slider__label oda-range-slider__label--max'>
          {rangeLabels[1]}: {formatValue(safeValue[1])}
        </span>
      </div>
    )
  }

  return (
    <div className={sliderClasses}>
      {renderInputs()}

      <div className='oda-range-slider__slider-container'>
        <Slider
          range
          value={internalValue}
          onChange={handleSliderChange}
          min={min}
          max={max}
          step={step}
          marks={marks}
          tooltip={{
            formatter: showTooltips
              ? tooltipFormatter || defaultTooltipFormatter
              : undefined,
          }}
          {...props}
        />
      </div>

      {renderLabels()}
      {renderRangeInfo()}
    </div>
  )
}

RangeSlider.displayName = 'RangeSlider'
