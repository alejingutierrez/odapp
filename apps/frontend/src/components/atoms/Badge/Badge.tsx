import { Badge as AntBadge, BadgeProps as AntBadgeProps } from 'antd'
import React from 'react'
import './Badge.css'

export interface BadgeProps
  extends Omit<AntBadgeProps, 'status' | 'variant' | 'size'> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'
  size?: 'small' | 'medium' | 'large'
  dot?: boolean
  showZero?: boolean
  overflowCount?: number
  offset?: [number, number]
  children?: React.ReactNode
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'medium',
  className = '',
  children,
  dot,
  showZero,
  overflowCount,
  offset,
  count,
  title,
  color,
  style,
  prefixCls,
  id,
  tabIndex,
  onClick,
  onMouseEnter,
  onMouseLeave,
}) => {
  const badgeClasses = [
    'oda-badge',
    `oda-badge--${variant}`,
    `oda-badge--${size}`,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  // Map our variants to Ant Design status
  const getAntStatus = (): AntBadgeProps['status'] => {
    switch (variant) {
      case 'success':
        return 'success'
      case 'warning':
        return 'warning'
      case 'error':
        return 'error'
      case 'info':
        return 'processing'
      default:
        return 'default'
    }
  }

  return (
    <AntBadge
      status={getAntStatus()}
      className={badgeClasses}
      dot={dot}
      showZero={showZero}
      overflowCount={overflowCount}
      offset={offset}
      count={count}
      title={title}
      color={color}
      style={style}
      prefixCls={prefixCls}
      id={id}
      tabIndex={tabIndex}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </AntBadge>
  )
}

// Status Badge Component for simple status indicators
export interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'pending' | 'success' | 'warning' | 'error'
  text?: string
  size?: 'small' | 'medium' | 'large'
  className?: string
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  text,
  size = 'medium',
  className = '',
}) => {
  const getVariant = () => {
    switch (status) {
      case 'active':
      case 'success':
        return 'success'
      case 'pending':
        return 'warning'
      case 'error':
        return 'error'
      case 'inactive':
        return 'default'
      default:
        return 'info'
    }
  }

  const statusClasses = [
    'oda-status-badge',
    `oda-status-badge--${status}`,
    `oda-status-badge--${size}`,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <span className={statusClasses}>
      <Badge variant={getVariant()} dot />
      {text && <span className='oda-status-badge__text'>{text}</span>}
    </span>
  )
}

// Count Badge Component for numerical indicators
export interface CountBadgeProps {
  count: number
  max?: number
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error'
  size?: 'small' | 'medium' | 'large'
  showZero?: boolean
  className?: string
}

export const CountBadge: React.FC<CountBadgeProps> = ({
  count,
  max = 99,
  variant = 'primary',
  size = 'medium',
  showZero = false,
  className = '',
}) => {
  const countClasses = [
    'oda-count-badge',
    `oda-count-badge--${variant}`,
    `oda-count-badge--${size}`,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <Badge
      count={count}
      overflowCount={max}
      showZero={showZero}
      variant={variant}
      size={size}
      className={countClasses}
    />
  )
}

Badge.displayName = 'Badge'
StatusBadge.displayName = 'StatusBadge'
CountBadge.displayName = 'CountBadge'
