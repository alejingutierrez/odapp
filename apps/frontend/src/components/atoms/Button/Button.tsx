import { Button as AntButton, ButtonProps as AntButtonProps } from 'antd'
import React from 'react'
import './Button.css'

export interface ButtonProps extends Omit<AntButtonProps, 'type' | 'variant'> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'link' | 'text'
  size?: 'small' | 'middle' | 'large'
  fullWidth?: boolean
  loading?: boolean
  icon?: React.ReactNode
  iconPosition?: 'start' | 'end'
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  children,
  className = '',
  iconPosition = 'start',
  icon,
  ...props
}) => {
  // Map our variants to Ant Design types
  const getAntType = (): AntButtonProps['type'] => {
    switch (variant) {
      case 'primary':
        return 'primary'
      case 'secondary':
        return 'default'
      case 'danger':
        return 'primary'
      case 'ghost':
        return 'default' // Ant Design doesn't have 'ghost' type, use 'default'
      case 'link':
        return 'link'
      case 'text':
        return 'text'
      default:
        return 'default'
    }
  }

  // Map our sizes to Ant Design sizes
  const getAntSize = (): AntButtonProps['size'] => {
    switch (size) {
      case 'small':
        return 'small'
      case 'middle':
        return 'middle'
      case 'large':
        return 'large'
      default:
        return 'middle'
    }
  }

  const buttonClasses = [
    'oda-button',
    `oda-button--${variant}`,
    `oda-button--${size}`,
    fullWidth && 'oda-button--full-width',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <AntButton
      type={getAntType()}
      size={getAntSize()}
      danger={variant === 'danger'}
      block={fullWidth}
      icon={iconPosition === 'start' ? icon : undefined}
      className={buttonClasses}
      {...props}
    >
      {iconPosition === 'end' && icon && (
        <>
          {children}
          <span className='oda-button__icon-end'>{icon}</span>
        </>
      )}
      {iconPosition === 'start' && children}
    </AntButton>
  )
}

Button.displayName = 'Button'
