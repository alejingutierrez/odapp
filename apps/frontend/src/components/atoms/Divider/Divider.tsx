import React from 'react'
import { Divider as AntDivider, DividerProps as AntDividerProps } from 'antd'
import './Divider.css'

export interface DividerProps extends AntDividerProps {
  variant?: 'solid' | 'dashed' | 'dotted' | 'gradient'
  thickness?: 'thin' | 'medium' | 'thick'
  spacing?: 'tight' | 'normal' | 'loose'
  color?: 'default' | 'light' | 'primary' | 'secondary'
  className?: string
}

export const Divider: React.FC<DividerProps> = ({
  variant = 'solid',
  thickness = 'thin',
  spacing = 'normal',
  color = 'default',
  className = '',
  children,
  ...props
}) => {
  const dividerClasses = [
    'oda-divider',
    `oda-divider--${variant}`,
    `oda-divider--${thickness}`,
    `oda-divider--${spacing}`,
    `oda-divider--${color}`,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <AntDivider
      className={dividerClasses}
      {...props}
    >
      {children}
    </AntDivider>
  )
}

// Section Divider Component
export interface SectionDividerProps {
  title?: string
  subtitle?: string
  icon?: React.ReactNode
  variant?: 'default' | 'centered' | 'left' | 'right'
  size?: 'small' | 'medium' | 'large'
  className?: string
}

export const SectionDivider: React.FC<SectionDividerProps> = ({
  title,
  subtitle,
  icon,
  variant = 'default',
  size = 'medium',
  className = '',
}) => {
  const sectionClasses = [
    'oda-section-divider',
    `oda-section-divider--${variant}`,
    `oda-section-divider--${size}`,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  if (!title && !subtitle && !icon) {
    return <Divider className={className} />
  }

  return (
    <div className={sectionClasses}>
      <div className="oda-section-divider__content">
        {icon && (
          <div className="oda-section-divider__icon">
            {icon}
          </div>
        )}
        {title && (
          <h3 className="oda-section-divider__title">
            {title}
          </h3>
        )}
        {subtitle && (
          <p className="oda-section-divider__subtitle">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )
}

// Spacer Component for consistent spacing
export interface SpacerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | number
  direction?: 'horizontal' | 'vertical'
  className?: string
}

export const Spacer: React.FC<SpacerProps> = ({
  size = 'md',
  direction = 'vertical',
  className = '',
}) => {
  const getSpacing = () => {
    if (typeof size === 'number') return `${size}px`
    
    const spacingMap = {
      xs: '4px',
      sm: '8px',
      md: '16px',
      lg: '24px',
      xl: '32px',
      '2xl': '48px',
    }
    
    return spacingMap[size] || '16px'
  }

  const spacerClasses = [
    'oda-spacer',
    `oda-spacer--${direction}`,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const style = direction === 'vertical' 
    ? { height: getSpacing() }
    : { width: getSpacing() }

  return <div className={spacerClasses} style={style} />
}

Divider.displayName = 'Divider'
SectionDivider.displayName = 'SectionDivider'
Spacer.displayName = 'Spacer'