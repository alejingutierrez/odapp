import React, { useState, useCallback } from 'react'
import { Space, Select, Radio, Typography, Tooltip } from 'antd'
import { ColorSwatch, SizeIndicator, MaterialTag } from '../../atoms'
import type { ProductVariant } from '../ProductCard/ProductCard'
import './ProductVariantSelector.css'

export interface VariantOption {
  type: 'size' | 'color' | 'material'
  value: string
  label: string
  available: boolean
  color?: string
  texture?: string
}

export interface ProductVariantSelectorProps {
  variants: ProductVariant[]
  selectedVariant?: ProductVariant
  onVariantChange: (variant: ProductVariant) => void
  layout?: 'horizontal' | 'vertical'
  showLabels?: boolean
  showAvailability?: boolean
  disabled?: boolean
  className?: string
}

export const ProductVariantSelector: React.FC<ProductVariantSelectorProps> = ({
  variants,
  selectedVariant,
  onVariantChange,
  layout = 'vertical',
  showLabels = true,
  showAvailability = true,
  disabled = false,
  className = '',
}) => {
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >({
    size: selectedVariant?.size || '',
    color: selectedVariant?.color || '',
    material: selectedVariant?.material || '',
  })

  // Extract unique options for each variant type
  const getUniqueOptions = (type: keyof ProductVariant) => {
    const options = new Map<string, VariantOption>()

    variants.forEach((variant) => {
      const value = variant[type] as string
      if (value && !options.has(value)) {
        const isAvailable = variants.some(
          (v) =>
            v[type] === value &&
            v.inventory > 0 &&
            (!selectedOptions.size ||
              !v.size ||
              v.size === selectedOptions.size) &&
            (!selectedOptions.color ||
              !v.color ||
              v.color === selectedOptions.color) &&
            (!selectedOptions.material ||
              !v.material ||
              v.material === selectedOptions.material)
        )

        options.set(value, {
          type: type as 'size' | 'color' | 'material',
          value,
          label: value,
          available: isAvailable,
        })
      }
    })

    return Array.from(options.values())
  }

  const sizeOptions = getUniqueOptions('size')
  const colorOptions = getUniqueOptions('color')
  const materialOptions = getUniqueOptions('material')

  const handleOptionChange = useCallback(
    (type: string, value: string) => {
      const newOptions = { ...selectedOptions, [type]: value }
      setSelectedOptions(newOptions)

      // Find matching variant
      const matchingVariant = variants.find(
        (variant) =>
          (!newOptions.size || variant.size === newOptions.size) &&
          (!newOptions.color || variant.color === newOptions.color) &&
          (!newOptions.material || variant.material === newOptions.material)
      )

      if (matchingVariant) {
        onVariantChange(matchingVariant)
      }
    },
    [selectedOptions, variants, onVariantChange]
  )

  const renderSizeSelector = () => {
    if (sizeOptions.length === 0) return null

    return (
      <div className='variant-selector__group'>
        {showLabels && (
          <Typography.Text strong className='variant-selector__label'>
            Size
          </Typography.Text>
        )}
        <Radio.Group
          value={selectedOptions.size}
          onChange={(e) => handleOptionChange('size', e.target.value)}
          disabled={disabled}
          className='variant-selector__size-group'
        >
          {sizeOptions.map((option) => (
            <Tooltip
              key={option.value}
              title={
                !option.available && showAvailability
                  ? 'Out of stock'
                  : undefined
              }
            >
              <Radio.Button
                value={option.value}
                disabled={!option.available && showAvailability}
                className={`variant-selector__size-option ${!option.available ? 'variant-selector__size-option--unavailable' : ''}`}
              >
                <SizeIndicator size={option.value} />
              </Radio.Button>
            </Tooltip>
          ))}
        </Radio.Group>
      </div>
    )
  }

  const renderColorSelector = () => {
    if (colorOptions.length === 0) return null

    return (
      <div className='variant-selector__group'>
        {showLabels && (
          <Typography.Text strong className='variant-selector__label'>
            Color
          </Typography.Text>
        )}
        <Space wrap className='variant-selector__color-group'>
          {colorOptions.map((option) => (
            <Tooltip
              key={option.value}
              title={`${option.label}${!option.available && showAvailability ? ' - Out of stock' : ''}`}
            >
              <ColorSwatch
                color={option.value}
                name={option.label}
                selected={selectedOptions.color === option.value}
                disabled={(!option.available && showAvailability) || disabled}
                onClick={() => handleOptionChange('color', option.value)}
                size='md'
              />
            </Tooltip>
          ))}
        </Space>
      </div>
    )
  }

  const renderMaterialSelector = () => {
    if (materialOptions.length === 0) return null

    return (
      <div className='variant-selector__group'>
        {showLabels && (
          <Typography.Text strong className='variant-selector__label'>
            Material
          </Typography.Text>
        )}
        <Select
          value={selectedOptions.material}
          onChange={(value) => handleOptionChange('material', value)}
          placeholder='Select material'
          disabled={disabled}
          className='variant-selector__material-select'
          style={{ width: '100%' }}
        >
          {materialOptions.map((option) => (
            <Select.Option
              key={option.value}
              value={option.value}
              disabled={!option.available && showAvailability}
            >
              <MaterialTag
                material={option.value}
                size='small'
                showIcon={false}
              />
            </Select.Option>
          ))}
        </Select>
      </div>
    )
  }

  return (
    <div
      className={`variant-selector variant-selector--${layout} ${className}`}
    >
      {renderSizeSelector()}
      {renderColorSelector()}
      {renderMaterialSelector()}
    </div>
  )
}

export default ProductVariantSelector
