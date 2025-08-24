import * as AntIcons from '@ant-design/icons'
import React from 'react'
import './Icon.css'

export interface IconProps {
  name: keyof typeof AntIcons
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  color?:
    | 'default'
    | 'primary'
    | 'secondary'
    | 'success'
    | 'warning'
    | 'error'
    | 'white'
  spin?: boolean
  rotate?: number
  className?: string
  onClick?: () => void
  style?: React.CSSProperties
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 'md',
  color = 'default',
  spin: _spin,
  rotate,
  className = '',
  onClick,
  style,
}) => {
  const IconComponent = AntIcons[name] as React.ComponentType<
    React.SVGProps<SVGSVGElement>
  >

  if (!IconComponent) {
    // console.warn(`Icon "${name}" not found in Ant Design icons`)
    return null
  }

  const iconClasses = [
    'oda-icon',
    `oda-icon--${size}`,
    `oda-icon--${color}`,
    onClick && 'oda-icon--clickable',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <IconComponent
      className={iconClasses}
      rotate={rotate}
      onClick={onClick}
      style={style}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    />
  )
}

// Commonly used icons as separate components for better DX
export const SearchIcon: React.FC<Omit<IconProps, 'name'>> = ({
  className,
  style,
  onClick,
}) => (
  <Icon
    name='SearchOutlined'
    className={className}
    style={style}
    onClick={onClick}
  />
)

export const EditIcon: React.FC<Omit<IconProps, 'name'>> = ({
  className,
  style,
  onClick,
}) => (
  <Icon
    name='EditOutlined'
    className={className}
    style={style}
    onClick={onClick}
  />
)

export const DeleteIcon: React.FC<Omit<IconProps, 'name'>> = ({
  className,
  style,
  onClick,
}) => (
  <Icon
    name='DeleteOutlined'
    className={className}
    style={style}
    onClick={onClick}
  />
)

export const PlusIcon: React.FC<Omit<IconProps, 'name'>> = ({
  className,
  style,
  onClick,
}) => (
  <Icon
    name='PlusOutlined'
    className={className}
    style={style}
    onClick={onClick}
  />
)

export const MinusIcon: React.FC<Omit<IconProps, 'name'>> = ({
  className,
  style,
  onClick,
}) => (
  <Icon
    name='MinusOutlined'
    className={className}
    style={style}
    onClick={onClick}
  />
)

export const CloseIcon: React.FC<Omit<IconProps, 'name'>> = ({
  className,
  style,
  onClick,
}) => (
  <Icon
    name='CloseOutlined'
    className={className}
    style={style}
    onClick={onClick}
  />
)

export const CheckIcon: React.FC<Omit<IconProps, 'name'>> = ({
  className,
  style,
  onClick,
}) => (
  <Icon
    name='CheckOutlined'
    className={className}
    style={style}
    onClick={onClick}
  />
)

export const WarningIcon: React.FC<Omit<IconProps, 'name'>> = ({
  className,
  style,
  onClick,
}) => (
  <Icon
    name='WarningOutlined'
    className={className}
    style={style}
    onClick={onClick}
  />
)

export const InfoIcon: React.FC<Omit<IconProps, 'name'>> = ({
  className,
  style,
  onClick,
}) => (
  <Icon
    name='InfoCircleOutlined'
    className={className}
    style={style}
    onClick={onClick}
  />
)

export const LoadingIcon: React.FC<Omit<IconProps, 'name'>> = ({
  className,
  style,
  onClick,
}) => (
  <Icon
    name='LoadingOutlined'
    spin
    className={className}
    style={style}
    onClick={onClick}
  />
)

Icon.displayName = 'Icon'
