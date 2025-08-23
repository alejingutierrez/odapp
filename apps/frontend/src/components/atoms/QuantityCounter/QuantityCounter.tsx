import React, { useState, useEffect } from 'react'
import { InputNumber, Button } from 'antd'
import { PlusOutlined, MinusOutlined } from '@ant-design/icons'
import './QuantityCounter.css'

export interface QuantityCounterProps {
  /** Current quantity value */
  value?: number
  /** Change handler */
  onChange?: (value: number | null) => void
  /** Minimum allowed value */
  min?: number
  /** Maximum allowed value */
  max?: number
  /** Step increment/decrement */
  step?: number
  /** Counter size */
  size?: 'small' | 'medium' | 'large'
  /** Counter variant */
  variant?: 'default' | 'compact' | 'inline' | 'stepper'
  /** Whether to show +/- buttons */
  showButtons?: boolean
  /** Whether to allow bulk entry */
  allowBulkEntry?: boolean
  /** Bulk entry threshold */
  bulkThreshold?: number
  /** Custom button icons */
  incrementIcon?: React.ReactNode
  decrementIcon?: React.ReactNode
  /** Whether to show stock info */
  showStock?: boolean
  /** Available stock */
  stock?: number
  /** Unit label */
  unit?: string
  /** Whether to validate on change */
  validateOnChange?: boolean
  /** Custom validation function */
  validator?: (value: number) => string | undefined
  /** Whether component is disabled */
  disabled?: boolean
  /** CSS class name */
  className?: string
}

export const QuantityCounter: React.FC<QuantityCounterProps> = ({
  value = 0,
  onChange,
  min = 0,
  max,
  step = 1,
  size = 'medium',
  variant = 'default',
  showButtons = true,
  allowBulkEntry = false,
  bulkThreshold = 100,
  incrementIcon = <PlusOutlined />,
  decrementIcon = <MinusOutlined />,
  showStock = false,
  stock,
  unit,
  validateOnChange = true,
  validator,
  className = '',
  disabled = false,
  ...props
}) => {
  const [inputValue, setInputValue] = useState<number | null>(value)
  const [error, setError] = useState<string>()
  const [isBulkMode, setIsBulkMode] = useState(false)

  useEffect(() => {
    setInputValue(value)
  }, [value])

  const effectiveMax = stock !== undefined ? Math.min(max || stock, stock) : max

  const validateValue = (val: number | null): string | undefined => {
    if (val === null || val === undefined) return undefined

    if (val < min) {
      return `Minimum quantity is ${min}`
    }

    if (effectiveMax !== undefined && val > effectiveMax) {
      return `Maximum quantity is ${effectiveMax}`
    }

    if (stock !== undefined && val > stock) {
      return `Only ${stock} items available`
    }

    if (validator) {
      return validator(val)
    }

    return undefined
  }

  const handleChange = (newValue: number | string | null) => {
    const numericValue = typeof newValue === 'string' ? parseFloat(newValue) || null : newValue
    setInputValue(numericValue)

    if (validateOnChange) {
      const validationError = validateValue(numericValue)
      setError(validationError)
    }

    if (onChange) {
      onChange(numericValue)
    }
  }

  const handleIncrement = () => {
    const newValue = (inputValue || 0) + step
    const clampedValue =
      effectiveMax !== undefined ? Math.min(newValue, effectiveMax) : newValue
    handleChange(clampedValue)
  }

  const handleDecrement = () => {
    const newValue = Math.max((inputValue || 0) - step, min)
    handleChange(newValue)
  }

  const handleBulkToggle = () => {
    if (allowBulkEntry && (inputValue || 0) >= bulkThreshold) {
      setIsBulkMode(!isBulkMode)
    }
  }

  const canIncrement =
    !disabled &&
    (effectiveMax === undefined || (inputValue || 0) < effectiveMax)
  const canDecrement = !disabled && (inputValue || 0) > min

  const counterClasses = [
    'oda-quantity-counter',
    `oda-quantity-counter--${variant}`,
    `oda-quantity-counter--${size}`,
    isBulkMode && 'oda-quantity-counter--bulk',
    error && 'oda-quantity-counter--error',
    disabled && 'oda-quantity-counter--disabled',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const renderCompactCounter = () => (
    <div className='oda-quantity-counter__compact'>
      <Button
        size={size === 'large' ? 'large' : size === 'small' ? 'small' : 'middle'}
        icon={decrementIcon}
        onClick={handleDecrement}
        disabled={!canDecrement}
        className='oda-quantity-counter__button oda-quantity-counter__button--decrement'
      />
      <InputNumber
        value={inputValue}
        onChange={handleChange}
        min={min}
        max={effectiveMax}
        step={step}
        size={size === 'large' ? 'large' : size === 'small' ? 'small' : 'middle'}
        controls={false}
        className='oda-quantity-counter__input'
        disabled={disabled}
        {...props}
      />
      <Button
        size={size === 'large' ? 'large' : size === 'small' ? 'small' : 'middle'}
        icon={incrementIcon}
        onClick={handleIncrement}
        disabled={!canIncrement}
        className='oda-quantity-counter__button oda-quantity-counter__button--increment'
      />
    </div>
  )

  const renderInlineCounter = () => (
    <div className='oda-quantity-counter__inline'>
      <span className='oda-quantity-counter__label'>Qty:</span>
      <Button
        size='small'
        icon={decrementIcon}
        onClick={handleDecrement}
        disabled={!canDecrement}
        className='oda-quantity-counter__button oda-quantity-counter__button--decrement'
      />
      <span className='oda-quantity-counter__value'>
        {inputValue || 0}
        {unit && <span className='oda-quantity-counter__unit'>{unit}</span>}
      </span>
      <Button
        size='small'
        icon={incrementIcon}
        onClick={handleIncrement}
        disabled={!canIncrement}
        className='oda-quantity-counter__button oda-quantity-counter__button--increment'
      />
    </div>
  )

  const renderStepperCounter = () => (
    <div className='oda-quantity-counter__stepper'>
      <InputNumber
        value={inputValue}
        onChange={handleChange}
        min={min}
        max={effectiveMax}
        step={step}
        size={size === 'large' ? 'large' : size === 'small' ? 'small' : 'middle'}
        controls={{
          upIcon: incrementIcon,
          downIcon: decrementIcon,
        }}
        className='oda-quantity-counter__input'
        disabled={disabled}
        {...props}
      />
    </div>
  )

  const renderDefaultCounter = () => (
    <div className='oda-quantity-counter__default'>
      {showButtons && (
        <Button
          size={size === 'large' ? 'large' : size === 'small' ? 'small' : 'middle'}
          icon={decrementIcon}
          onClick={handleDecrement}
          disabled={!canDecrement}
          className='oda-quantity-counter__button oda-quantity-counter__button--decrement'
        />
      )}
      <InputNumber
        value={inputValue}
        onChange={handleChange}
        min={min}
        max={effectiveMax}
        step={step}
        size={size === 'large' ? 'large' : size === 'small' ? 'small' : 'middle'}
        controls={false}
        className='oda-quantity-counter__input'
        disabled={disabled}
        {...props}
      />
      {showButtons && (
        <Button
          size={size === 'large' ? 'large' : size === 'small' ? 'small' : 'middle'}
          icon={incrementIcon}
          onClick={handleIncrement}
          disabled={!canIncrement}
          className='oda-quantity-counter__button oda-quantity-counter__button--increment'
        />
      )}
      {unit && <span className='oda-quantity-counter__unit-label'>{unit}</span>}
    </div>
  )

  const renderCounter = () => {
    switch (variant) {
      case 'compact':
        return renderCompactCounter()
      case 'inline':
        return renderInlineCounter()
      case 'stepper':
        return renderStepperCounter()
      default:
        return renderDefaultCounter()
    }
  }

  return (
    <div className={counterClasses}>
      {renderCounter()}

      {showStock && stock !== undefined && (
        <div className='oda-quantity-counter__stock'>{stock} available</div>
      )}

      {allowBulkEntry && (inputValue || 0) >= bulkThreshold && (
        <Button
          size='small'
          type='link'
          onClick={handleBulkToggle}
          className='oda-quantity-counter__bulk-toggle'
        >
          {isBulkMode ? 'Exit bulk mode' : 'Bulk entry'}
        </Button>
      )}

      {error && <div className='oda-quantity-counter__error'>{error}</div>}
    </div>
  )
}

QuantityCounter.displayName = 'QuantityCounter'
