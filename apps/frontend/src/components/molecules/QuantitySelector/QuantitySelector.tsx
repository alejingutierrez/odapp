import { PlusOutlined, MinusOutlined } from '@ant-design/icons'
import { InputNumber, Button, Space, Typography } from 'antd'
import React, { useState, useCallback } from 'react'
import './QuantitySelector.css'

export interface QuantitySelectorProps {
  value?: number
  onChange?: (value: number) => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  size?: 'small' | 'middle' | 'large'
  showControls?: boolean
  showLabel?: boolean
  label?: string
  placeholder?: string
  className?: string
  precision?: number
  formatter?: (value: number | undefined) => string
  parser?: (displayValue: string | undefined) => number
  addonBefore?: React.ReactNode
  addonAfter?: React.ReactNode
}

export const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  value = 1,
  onChange,
  min = 1,
  max = 999999,
  step = 1,
  disabled = false,
  size = 'middle',
  showControls = true,
  showLabel = false,
  label = 'Quantity',
  placeholder = 'Enter quantity',
  className = '',
  precision = 0,
  formatter,
  parser,
  addonBefore,
  addonAfter,
}) => {
  const [internalValue, setInternalValue] = useState(value)

  const handleChange = useCallback(
    (newValue: number | null) => {
      const validValue = Math.max(min, Math.min(max, newValue || min))
      setInternalValue(validValue)
      onChange?.(validValue)
    },
    [min, max, onChange]
  )

  const handleIncrement = useCallback(() => {
    const newValue = Math.min(max, internalValue + step)
    handleChange(newValue)
  }, [internalValue, step, max, handleChange])

  const handleDecrement = useCallback(() => {
    const newValue = Math.max(min, internalValue - step)
    handleChange(newValue)
  }, [internalValue, step, min, handleChange])

  const canIncrement = internalValue < max && !disabled
  const canDecrement = internalValue > min && !disabled

  if (showControls) {
    return (
      <div className={`quantity-selector ${className}`}>
        {showLabel && (
          <Typography.Text className='quantity-selector__label'>
            {label}
          </Typography.Text>
        )}
        <Space.Compact className='quantity-selector__controls'>
          <Button
            icon={<MinusOutlined />}
            onClick={handleDecrement}
            disabled={!canDecrement}
            size={size}
            className='quantity-selector__decrement'
          />
          <InputNumber
            value={internalValue}
            onChange={handleChange}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            size={size}
            placeholder={placeholder}
            precision={precision}
            formatter={formatter}
            parser={parser}
            className='quantity-selector__input'
            controls={false}
          />
          <Button
            icon={<PlusOutlined />}
            onClick={handleIncrement}
            disabled={!canIncrement}
            size={size}
            className='quantity-selector__increment'
          />
        </Space.Compact>
      </div>
    )
  }

  return (
    <div className={`quantity-selector ${className}`}>
      {showLabel && (
        <Typography.Text className='quantity-selector__label'>
          {label}
        </Typography.Text>
      )}
      <InputNumber
        value={internalValue}
        onChange={handleChange}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        size={size}
        placeholder={placeholder}
        precision={precision}
        formatter={formatter}
        parser={parser}
        addonBefore={addonBefore}
        addonAfter={addonAfter}
        className='quantity-selector__input'
      />
    </div>
  )
}

export default QuantitySelector
