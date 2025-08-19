import React from 'react'
import { Tag, TagProps } from 'antd'
import { CloseOutlined } from '@ant-design/icons'
import './Chip.css'

export interface ChipProps extends Omit<TagProps, 'closable' | 'onClose'> {
  /** Chip label text */
  label: string
  /** Chip variant */
  variant?:
    | 'default'
    | 'primary'
    | 'secondary'
    | 'success'
    | 'warning'
    | 'error'
    | 'info'
  /** Chip size */
  size?: 'small' | 'medium' | 'large'
  /** Whether chip is removable */
  removable?: boolean
  /** Whether chip is selected/active */
  selected?: boolean
  /** Whether chip is disabled */
  disabled?: boolean
  /** Icon to display before label */
  icon?: React.ReactNode
  /** Avatar to display before label */
  avatar?: React.ReactNode
  /** Callback when chip is removed */
  onRemove?: () => void
  /** Callback when chip is clicked */
  onClick?: () => void
  /** Custom styles for different contexts */
  context?: 'filter' | 'tag' | 'status' | 'category'
}

export const Chip: React.FC<ChipProps> = ({
  label,
  variant = 'default',
  size = 'medium',
  removable = false,
  selected = false,
  disabled = false,
  icon,
  avatar,
  onRemove,
  onClick,
  context = 'tag',
  className = '',
  ...props
}) => {
  const chipClasses = [
    'oda-chip',
    `oda-chip--${variant}`,
    `oda-chip--${size}`,
    `oda-chip--${context}`,
    selected && 'oda-chip--selected',
    disabled && 'oda-chip--disabled',
    onClick && 'oda-chip--clickable',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick()
    }
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!disabled && onRemove) {
      onRemove()
    }
  }

  return (
    <Tag
      className={chipClasses}
      closable={removable && !disabled}
      onClose={handleRemove}
      onClick={handleClick}
      closeIcon={<CloseOutlined className='oda-chip__close-icon' />}
      {...props}
    >
      <div className='oda-chip__content'>
        {avatar && <div className='oda-chip__avatar'>{avatar}</div>}
        {icon && <div className='oda-chip__icon'>{icon}</div>}
        <span className='oda-chip__label'>{label}</span>
      </div>
    </Tag>
  )
}

Chip.displayName = 'Chip'
