import { CheckOutlined } from '@ant-design/icons'
import { Tooltip } from 'antd'
import React from 'react'
import './ColorSwatch.css'

export interface ColorSwatchProps {
  color: string
  name?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  selected?: boolean
  disabled?: boolean
  showBorder?: boolean
  showTooltip?: boolean
  className?: string
  onClick?: (color: string) => void
}

export const ColorSwatch: React.FC<ColorSwatchProps> = ({
  color,
  name,
  size = 'md',
  selected = false,
  disabled = false,
  showBorder = true,
  showTooltip = true,
  className = '',
  onClick,
}) => {
  const swatchClasses = [
    'oda-color-swatch',
    `oda-color-swatch--${size}`,
    selected && 'oda-color-swatch--selected',
    disabled && 'oda-color-swatch--disabled',
    showBorder && 'oda-color-swatch--bordered',
    onClick && !disabled && 'oda-color-swatch--clickable',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick(color)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if ((event.key === 'Enter' || event.key === ' ') && !disabled && onClick) {
      event.preventDefault()
      onClick(color)
    }
  }

  // Determine if the color is light or dark for contrast
  const isLightColor = (hexColor: string): boolean => {
    const hex = hexColor.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000
    return brightness > 128
  }

  const swatch = (
    <div
      className={swatchClasses}
      style={{ backgroundColor: color }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={onClick && !disabled ? 0 : -1}
      role={onClick ? 'button' : undefined}
      aria-label={name ? `Color: ${name}` : `Color: ${color}`}
      aria-pressed={selected}
      aria-disabled={disabled}
    >
      {selected && (
        <CheckOutlined
          className={`oda-color-swatch__check ${
            isLightColor(color)
              ? 'oda-color-swatch__check--dark'
              : 'oda-color-swatch__check--light'
          }`}
        />
      )}
    </div>
  )

  if (showTooltip && name) {
    return (
      <Tooltip title={name} placement='top'>
        {swatch}
      </Tooltip>
    )
  }

  return swatch
}

// Color Palette Component for multiple swatches
export interface ColorPaletteProps {
  colors: Array<{ color: string; name?: string }>
  selectedColor?: string
  size?: ColorSwatchProps['size']
  disabled?: boolean
  showBorder?: boolean
  showTooltip?: boolean
  className?: string
  onColorSelect?: (color: string) => void
}

export const ColorPalette: React.FC<ColorPaletteProps> = ({
  colors,
  selectedColor,
  size = 'md',
  disabled = false,
  showBorder = true,
  showTooltip = true,
  className = '',
  onColorSelect,
}) => {
  const paletteClasses = [
    'oda-color-palette',
    `oda-color-palette--${size}`,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={paletteClasses}>
      {colors.map(({ color, name }, index) => (
        <ColorSwatch
          key={`${color}-${index}`}
          color={color}
          name={name}
          size={size}
          selected={selectedColor === color}
          disabled={disabled}
          showBorder={showBorder}
          showTooltip={showTooltip}
          onClick={onColorSelect}
        />
      ))}
    </div>
  )
}

ColorSwatch.displayName = 'ColorSwatch'
ColorPalette.displayName = 'ColorPalette'
