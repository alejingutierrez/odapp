import React from 'react'
import './Spinner.css'

export interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  color?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'white'
  variant?: 'spin' | 'dots' | 'pulse' | 'bars' | 'ring' | 'bounce'
  text?: string
  centered?: boolean
  overlay?: boolean
  className?: string
  children?: React.ReactNode
  'aria-label'?: string
  testId?: string
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  color = 'primary',
  variant = 'spin',
  text,
  centered = false,
  overlay = false,
  className = '',
  children,
  'aria-label': ariaLabel,
  testId,
}) => {
  const spinnerClasses = [
    'oda-spinner',
    `oda-spinner--${size}`,
    `oda-spinner--${color}`,
    `oda-spinner--${variant}`,
    centered && 'oda-spinner--centered',
    text && 'oda-spinner--with-text',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const renderSpinnerIcon = () => {
    switch (variant) {
      case 'spin':
        return (
          <div className="oda-spinner__spin" aria-hidden="true">
            <svg viewBox="0 0 24 24" className="oda-spinner__svg">
              <circle
                cx="12"
                cy="12"
                r="10"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="31.416"
                strokeDashoffset="31.416"
              />
            </svg>
          </div>
        )
      
      case 'dots':
        return (
          <div className="oda-spinner__dots" aria-hidden="true">
            <div className="oda-spinner__dot" />
            <div className="oda-spinner__dot" />
            <div className="oda-spinner__dot" />
          </div>
        )
      
      case 'pulse':
        return <div className="oda-spinner__pulse" aria-hidden="true" />
      
      case 'bars':
        return (
          <div className="oda-spinner__bars" aria-hidden="true">
            <div className="oda-spinner__bar" />
            <div className="oda-spinner__bar" />
            <div className="oda-spinner__bar" />
            <div className="oda-spinner__bar" />
          </div>
        )
      
      case 'ring':
        return (
          <div className="oda-spinner__ring" aria-hidden="true">
            <div className="oda-spinner__ring-inner" />
          </div>
        )
      
      case 'bounce':
        return (
          <div className="oda-spinner__bounce" aria-hidden="true">
            <div className="oda-spinner__bounce-dot" />
            <div className="oda-spinner__bounce-dot" />
          </div>
        )
      
      default:
        return (
          <div className="oda-spinner__spin" aria-hidden="true">
            <svg viewBox="0 0 24 24" className="oda-spinner__svg">
              <circle
                cx="12"
                cy="12"
                r="10"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="31.416"
                strokeDashoffset="31.416"
              />
            </svg>
          </div>
        )
    }
  }

  const spinnerContent = (
    <div 
      className={spinnerClasses}
      role="status"
      aria-label={ariaLabel || text || 'Loading'}
      data-testid={testId}
    >
      {renderSpinnerIcon()}
      {text && <span className="oda-spinner__text">{text}</span>}
      {children && <div className="oda-spinner__content">{children}</div>}
    </div>
  )

  if (overlay) {
    return (
      <div className="oda-spinner-overlay" data-testid={testId ? `${testId}-overlay` : undefined}>
        {spinnerContent}
      </div>
    )
  }

  return spinnerContent
}

// Loading Button Component
export interface LoadingButtonProps {
  loading?: boolean
  children: React.ReactNode
  size?: SpinnerProps['size']
  spinnerColor?: SpinnerProps['color']
  className?: string
  disabled?: boolean
  testId?: string
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  loading = false,
  children,
  size = 'sm',
  spinnerColor = 'white',
  className = '',
  disabled = false,
  testId,
}) => {
  const buttonClasses = [
    'oda-loading-button',
    loading && 'oda-loading-button--loading',
    disabled && 'oda-loading-button--disabled',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={buttonClasses} data-testid={testId}>
      {loading && (
        <Spinner 
          size={size} 
          color={spinnerColor} 
          variant="spin"
          aria-label="Loading"
        />
      )}
      <span className="oda-loading-button__text">
        {children}
      </span>
    </div>
  )
}

// Page Loader Component
export interface PageLoaderProps {
  text?: string
  size?: SpinnerProps['size']
  variant?: SpinnerProps['variant']
  color?: SpinnerProps['color']
  className?: string
  minHeight?: string | number
  testId?: string
}

export const PageLoader: React.FC<PageLoaderProps> = ({
  text = 'Loading...',
  size = 'lg',
  variant = 'spin',
  color = 'primary',
  className = '',
  minHeight = '200px',
  testId,
}) => {
  const loaderStyle = {
    minHeight: typeof minHeight === 'number' ? `${minHeight}px` : minHeight,
  }

  return (
    <div 
      className={`oda-page-loader ${className}`}
      style={loaderStyle}
      data-testid={testId}
    >
      <Spinner
        size={size}
        variant={variant}
        color={color}
        text={text}
        centered
        aria-label={text}
      />
    </div>
  )
}

// Inline Loader Component
export interface InlineLoaderProps {
  size?: SpinnerProps['size']
  color?: SpinnerProps['color']
  variant?: SpinnerProps['variant']
  className?: string
  testId?: string
}

export const InlineLoader: React.FC<InlineLoaderProps> = ({
  size = 'sm',
  color = 'primary',
  variant = 'spin',
  className = '',
  testId,
}) => {
  return (
    <Spinner
      size={size}
      color={color}
      variant={variant}
      className={`oda-inline-loader ${className}`}
      aria-label="Loading"
      testId={testId}
    />
  )
}

Spinner.displayName = 'Spinner'
LoadingButton.displayName = 'LoadingButton'
PageLoader.displayName = 'PageLoader'