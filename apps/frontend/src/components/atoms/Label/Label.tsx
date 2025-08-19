import React from 'react'
import './Label.css'

export interface LabelProps {
  children: React.ReactNode
  htmlFor?: string
  required?: boolean
  size?: 'small' | 'medium' | 'large'
  weight?: 'normal' | 'medium' | 'semibold' | 'bold'
  color?: 'default' | 'secondary' | 'success' | 'warning' | 'error'
  className?: string
}

export const Label: React.FC<LabelProps> = ({
  children,
  htmlFor,
  required = false,
  size = 'medium',
  weight = 'medium',
  color = 'default',
  className = '',
}) => {
  const labelClasses = [
    'oda-label',
    `oda-label--${size}`,
    `oda-label--${weight}`,
    `oda-label--${color}`,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <label htmlFor={htmlFor} className={labelClasses}>
      {children}
      {required && <span className="oda-label__required">*</span>}
    </label>
  )
}

Label.displayName = 'Label'