import React from 'react'
import * as AntIcons from '@ant-design/icons'
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
  spin = false,
  rotate,
  className = '',
  onClick,
  style,
}) => {
  const IconComponent = AntIcons[name] as React.ComponentType<
    React.SVGProps<SVGSVGElement>
  >

  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in Ant Design icons`)
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

  const iconProps: React.SVGProps<SVGSVGElement> & { spin?: boolean; rotate?: number } = {
    className: iconClasses,
    spin,
    rotate,
    onClick,
    style,
    ...(onClick && { role: 'button', tabIndex: 0 })
  }

  return <IconComponent {...iconProps} />
}

// Commonly used icons as separate components for better DX
export const SearchIcon: React.FC<Omit<IconProps, 'name'>> = (props) => (
  <Icon name='SearchOutlined' {...props} />
)

export const EditIcon: React.FC<Omit<IconProps, 'name'>> = (props) => (
  <Icon name='EditOutlined' {...props} />
)

export const DeleteIcon: React.FC<Omit<IconProps, 'name'>> = (props) => (
  <Icon name='DeleteOutlined' {...props} />
)

export const PlusIcon: React.FC<Omit<IconProps, 'name'>> = (props) => (
  <Icon name='PlusOutlined' {...props} />
)

export const MinusIcon: React.FC<Omit<IconProps, 'name'>> = (props) => (
  <Icon name='MinusOutlined' {...props} />
)

export const CloseIcon: React.FC<Omit<IconProps, 'name'>> = (props) => (
  <Icon name='CloseOutlined' {...props} />
)

export const CheckIcon: React.FC<Omit<IconProps, 'name'>> = (props) => (
  <Icon name='CheckOutlined' {...props} />
)

export const WarningIcon: React.FC<Omit<IconProps, 'name'>> = (props) => (
  <Icon name='WarningOutlined' {...props} />
)

export const InfoIcon: React.FC<Omit<IconProps, 'name'>> = (props) => (
  <Icon name='InfoCircleOutlined' {...props} />
)

export const LoadingIcon: React.FC<Omit<IconProps, 'name'>> = (props) => (
  <Icon name='LoadingOutlined' spin {...props} />
)

Icon.displayName = 'Icon'
