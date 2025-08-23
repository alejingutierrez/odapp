import React from 'react'
import { Input as AntInput, InputProps as AntInputProps } from 'antd'
import type { TextAreaProps as AntTextAreaProps } from 'antd/es/input'
import './Input.css'

export interface InputProps extends Omit<AntInputProps, 'value'> {
  label?: string
  error?: string
  helperText?: string
  required?: boolean
  fullWidth?: boolean
  variant?: 'outlined' | 'filled' | 'borderless'
  value?: string | number | null | undefined
}

export interface TextAreaProps extends Omit<AntTextAreaProps, 'size' | 'value'> {
  label?: string
  error?: string
  helperText?: string
  required?: boolean
  fullWidth?: boolean
  variant?: 'outlined' | 'filled' | 'borderless'
  size?: 'small' | 'middle' | 'large'
  value?: string | number | null | undefined
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  required = false,
  fullWidth = false,
  variant = 'outlined',
  className = '',
  value,
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

  // Ensure value is valid for Ant Design Input
  const validValue = value === null || value === undefined ? '' : value

  return (
    <div className='oda-input-wrapper'>
      {label && (
        <label className='oda-input-label'>
          {label}
          {required && <span className='oda-input-required'>*</span>}
        </label>
      )}
      <AntInput
        variant={getAntVariant()}
        status={error ? 'error' : undefined}
        className={inputClasses}
        value={validValue}
        {...props}
      />
      {(error || helperText) && (
        <div
          className={`oda-input-helper ${error ? 'oda-input-helper--error' : ''}`}
        >
          {error || helperText}
        </div>
      )}
    </div>
  )
}

// Export specialized input components
export const TextArea: React.FC<
  TextAreaProps & {
    rows?: number
    autoSize?: boolean | { minRows?: number; maxRows?: number }
  }
> = ({
  rows = 4,
  autoSize = false,
  label,
  error,
  helperText,
  required = false,
  fullWidth = false,
  variant = 'outlined',
  className = '',
  value,
  ...props
}) => {
  const inputClasses = [
    'oda-textarea',
    `oda-textarea--${variant}`,
    fullWidth && 'oda-textarea--full-width',
    error && 'oda-textarea--error',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const getAntVariant = (): AntTextAreaProps['variant'] => {
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

  // Ensure value is valid for Ant Design TextArea
  const validValue = value === null || value === undefined ? '' : value

  return (
    <div className='oda-textarea-wrapper'>
      {label && (
        <label className='oda-textarea-label'>
          {label}
          {required && <span className='oda-textarea-required'>*</span>}
        </label>
      )}
      <AntInput.TextArea
        rows={rows}
        autoSize={autoSize}
        variant={getAntVariant()}
        status={error ? 'error' : undefined}
        className={inputClasses}
        value={validValue}
        {...props}
      />
      {(error || helperText) && (
        <div
          className={`oda-textarea-helper ${error ? 'oda-textarea-helper--error' : ''}`}
        >
          {error || helperText}
        </div>
      )}
    </div>
  )
}

// Search Input Component
export interface SearchProps extends Omit<AntInputProps, 'value'> {
  label?: string
  error?: string
  helperText?: string
  required?: boolean
  fullWidth?: boolean
  variant?: 'outlined' | 'filled' | 'borderless'
  value?: string | number | null | undefined
  onSearch?: (value: string) => void
}

export const SearchInput: React.FC<SearchProps> = ({
  label,
  error,
  helperText,
  required = false,
  fullWidth = false,
  variant = 'outlined',
  className = '',
  value,
  onSearch,
  ...props
}) => {
  const inputClasses = [
    'oda-search-input',
    `oda-search-input--${variant}`,
    fullWidth && 'oda-search-input--full-width',
    error && 'oda-search-input--error',
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

  // Ensure value is valid for Ant Design Input
  const validValue = value === null || value === undefined ? '' : value

  return (
    <div className='oda-search-input-wrapper'>
      {label && (
        <label className='oda-search-input-label'>
          {label}
          {required && <span className='oda-search-input-required'>*</span>}
        </label>
      )}
      <AntInput.Search
        variant={getAntVariant()}
        status={error ? 'error' : undefined}
        className={inputClasses}
        value={validValue}
        onSearch={onSearch}
        {...props}
      />
      {(error || helperText) && (
        <div
          className={`oda-search-input-helper ${error ? 'oda-search-input-helper--error' : ''}`}
        >
          {error || helperText}
        </div>
      )}
    </div>
  )
}

// Password Input Component
export interface PasswordProps extends Omit<AntInputProps, 'value'> {
  label?: string
  error?: string
  helperText?: string
  required?: boolean
  fullWidth?: boolean
  variant?: 'outlined' | 'filled' | 'borderless'
  value?: string | number | null | undefined
}

export const PasswordInput: React.FC<PasswordProps> = ({
  label,
  error,
  helperText,
  required = false,
  fullWidth = false,
  variant = 'outlined',
  className = '',
  value,
  ...props
}) => {
  const inputClasses = [
    'oda-password-input',
    `oda-password-input--${variant}`,
    fullWidth && 'oda-password-input--full-width',
    error && 'oda-password-input--error',
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

  // Ensure value is valid for Ant Design Input
  const validValue = value === null || value === undefined ? '' : value

  return (
    <div className='oda-password-input-wrapper'>
      {label && (
        <label className='oda-password-input-label'>
          {label}
          {required && <span className='oda-password-input-required'>*</span>}
        </label>
      )}
      <AntInput.Password
        variant={getAntVariant()}
        status={error ? 'error' : undefined}
        className={inputClasses}
        value={validValue}
        {...props}
      />
      {(error || helperText) && (
        <div
          className={`oda-password-input-helper ${error ? 'oda-password-input-helper--error' : ''}`}
        >
          {error || helperText}
        </div>
      )}
    </div>
  )
}

// Export all components
export { Input as default }
