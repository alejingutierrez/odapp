import React from 'react'
import { Input as AntInput, InputProps as AntInputProps } from 'antd'
import type { TextAreaProps as AntTextAreaProps } from 'antd/es/input'
import './Input.css'

export interface InputProps extends AntInputProps {
  label?: string
  error?: string
  helperText?: string
  required?: boolean
  fullWidth?: boolean
  variant?: 'outlined' | 'filled' | 'borderless'
}

export interface TextAreaProps extends Omit<AntTextAreaProps, 'size'> {
  label?: string
  error?: string
  helperText?: string
  required?: boolean
  fullWidth?: boolean
  variant?: 'outlined' | 'filled' | 'borderless'
  size?: 'small' | 'middle' | 'large'
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  required = false,
  fullWidth = false,
  variant = 'outlined',
  className = '',
  ...props
}) => {
  const inputClasses = [
    'oda-input',
    `oda-input--${variant}`,
    fullWidth && 'oda-input--full-width',
    error && 'oda-input--error',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const getAntVariant = (): AntInputProps['variant'] => {
    switch (variant) {
      case 'filled':
        return 'filled'
      case 'borderless':
        return 'borderless'
      case 'outlined':
      default:
        return 'outlined'
    }
  }

  return (
    <div className="oda-input-wrapper">
      {label && (
        <label className="oda-input-label">
          {label}
          {required && <span className="oda-input-required">*</span>}
        </label>
      )}
      <AntInput
        variant={getAntVariant()}
        status={error ? 'error' : undefined}
        className={inputClasses}
        {...props}
      />
      {(error || helperText) && (
        <div className={`oda-input-helper ${error ? 'oda-input-helper--error' : ''}`}>
          {error || helperText}
        </div>
      )}
    </div>
  )
}

// Export specialized input components
export const TextArea: React.FC<TextAreaProps & { rows?: number; autoSize?: boolean | { minRows?: number; maxRows?: number } }> = ({
  rows = 4,
  autoSize = false,
  label,
  error,
  helperText,
  required = false,
  fullWidth = false,
  variant = 'outlined',
  className = '',
  ...props
}) => {
  const inputClasses = [
    'oda-input',
    `oda-input--${variant}`,
    fullWidth && 'oda-input--full-width',
    error && 'oda-input--error',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const getAntVariant = (): AntInputProps['variant'] => {
    switch (variant) {
      case 'filled':
        return 'filled'
      case 'borderless':
        return 'borderless'
      case 'outlined':
      default:
        return 'outlined'
    }
  }

  return (
    <div className="oda-input-wrapper">
      {label && (
        <label className="oda-input-label">
          {label}
          {required && <span className="oda-input-required">*</span>}
        </label>
      )}
      <AntInput.TextArea
        variant={getAntVariant()}
        status={error ? 'error' : undefined}
        className={inputClasses}
        rows={rows}
        autoSize={autoSize}
        {...props}
      />
      {(error || helperText) && (
        <div className={`oda-input-helper ${error ? 'oda-input-helper--error' : ''}`}>
          {error || helperText}
        </div>
      )}
    </div>
  )
}

export const Password: React.FC<InputProps> = (props) => {
  return <Input {...props} type="password" />
}

export const Search: React.FC<InputProps & { onSearch?: (value: string) => void }> = ({
  onSearch,
  label,
  error,
  helperText,
  required = false,
  fullWidth = false,
  variant = 'outlined',
  className = '',
  ...props
}) => {
  const inputClasses = [
    'oda-input',
    `oda-input--${variant}`,
    fullWidth && 'oda-input--full-width',
    error && 'oda-input--error',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const getAntVariant = (): AntInputProps['variant'] => {
    switch (variant) {
      case 'filled':
        return 'filled'
      case 'borderless':
        return 'borderless'
      case 'outlined':
      default:
        return 'outlined'
    }
  }

  return (
    <div className="oda-input-wrapper">
      {label && (
        <label className="oda-input-label">
          {label}
          {required && <span className="oda-input-required">*</span>}
        </label>
      )}
      <AntInput.Search
        variant={getAntVariant()}
        status={error ? 'error' : undefined}
        className={inputClasses}
        onSearch={onSearch}
        {...props}
      />
      {(error || helperText) && (
        <div className={`oda-input-helper ${error ? 'oda-input-helper--error' : ''}`}>
          {error || helperText}
        </div>
      )}
    </div>
  )
}

Input.displayName = 'Input'
TextArea.displayName = 'TextArea'
Password.displayName = 'Password'
Search.displayName = 'Search'