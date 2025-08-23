import { Switch, SwitchProps } from 'antd'
import React from 'react'
import './Toggle.css'

export interface ToggleProps
  extends Omit<SwitchProps, 'checkedChildren' | 'unCheckedChildren'> {
  /** Label for the toggle */
  label?: string
  /** Description text */
  description?: string
  /** Text to show when toggle is on */
  onLabel?: string
  /** Text to show when toggle is off */
  offLabel?: string
  /** Icon to show when toggle is on */
  onIcon?: React.ReactNode
  /** Icon to show when toggle is off */
  offIcon?: React.ReactNode
  /** Toggle size */
  size?: 'small' | 'default'
  /** Toggle variant */
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
  /** Label position */
  labelPosition?: 'left' | 'right' | 'top' | 'bottom'
  /** Whether to show loading state */
  loading?: boolean
  /** Custom styling */
  color?: string
}

export const Toggle: React.FC<ToggleProps> = ({
  label,
  description,
  onLabel,
  offLabel,
  onIcon,
  offIcon,
  size = 'medium',
  variant = 'default',
  labelPosition = 'right',
  loading = false,
  color,
  className = '',
  style,
  ...props
}) => {
  const toggleClasses = [
    'oda-toggle',
    `oda-toggle--${size}`,
    `oda-toggle--${variant}`,
    `oda-toggle--label-${labelPosition}`,
    loading && 'oda-toggle--loading',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const toggleStyle = {
    ...style,
    ...(color && { '--toggle-color': color }),
  } as React.CSSProperties

  const renderLabel = () => {
    if (!label && !description) return null

    return (
      <div className='oda-toggle__label-container'>
        {label && <span className='oda-toggle__label'>{label}</span>}
        {description && (
          <span className='oda-toggle__description'>{description}</span>
        )}
      </div>
    )
  }

  const renderToggle = () => (
    <Switch
      className='oda-toggle__switch'
      size={size === 'small' ? 'small' : 'default'}
      loading={loading}
      checkedChildren={
        onLabel || onIcon ? (
          <span className='oda-toggle__content'>
            {onIcon && <span className='oda-toggle__icon'>{onIcon}</span>}
            {onLabel && <span className='oda-toggle__text'>{onLabel}</span>}
          </span>
        ) : undefined
      }
      unCheckedChildren={
        offLabel || offIcon ? (
          <span className='oda-toggle__content'>
            {offIcon && <span className='oda-toggle__icon'>{offIcon}</span>}
            {offLabel && <span className='oda-toggle__text'>{offLabel}</span>}
          </span>
        ) : undefined
      }
      {...props}
    />
  )

  return (
    <div className={toggleClasses} style={toggleStyle}>
      {(labelPosition === 'left' || labelPosition === 'top') && renderLabel()}
      {renderToggle()}
      {(labelPosition === 'right' || labelPosition === 'bottom') &&
        renderLabel()}
    </div>
  )
}

Toggle.displayName = 'Toggle'
