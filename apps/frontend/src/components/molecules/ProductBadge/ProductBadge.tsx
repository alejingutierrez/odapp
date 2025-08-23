import {
  FireOutlined,
  StarOutlined,
  ThunderboltOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons'
import { Tag, Tooltip } from 'antd'
import React from 'react'
import './ProductBadge.css'

export type BadgeType =
  | 'sale'
  | 'new'
  | 'featured'
  | 'bestseller'
  | 'limited'
  | 'out-of-stock'
  | 'low-stock'
  | 'in-stock'
  | 'pre-order'
  | 'discontinued'

export interface ProductBadgeProps {
  type: BadgeType
  text?: string
  discount?: number
  stockCount?: number
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  size?: 'small' | 'default' | 'large'
  animated?: boolean
  tooltip?: string
  className?: string
}

const badgeConfig = {
  sale: {
    color: 'red',
    icon: FireOutlined,
    defaultText: 'Sale',
  },
  new: {
    color: 'green',
    icon: StarOutlined,
    defaultText: 'New',
  },
  featured: {
    color: 'gold',
    icon: StarOutlined,
    defaultText: 'Featured',
  },
  bestseller: {
    color: 'purple',
    icon: ThunderboltOutlined,
    defaultText: 'Bestseller',
  },
  limited: {
    color: 'orange',
    icon: ExclamationCircleOutlined,
    defaultText: 'Limited',
  },
  'out-of-stock': {
    color: 'default',
    icon: ExclamationCircleOutlined,
    defaultText: 'Out of Stock',
  },
  'low-stock': {
    color: 'orange',
    icon: ExclamationCircleOutlined,
    defaultText: 'Low Stock',
  },
  'in-stock': {
    color: 'green',
    icon: CheckCircleOutlined,
    defaultText: 'In Stock',
  },
  'pre-order': {
    color: 'blue',
    icon: ClockCircleOutlined,
    defaultText: 'Pre-Order',
  },
  discontinued: {
    color: 'default',
    icon: ExclamationCircleOutlined,
    defaultText: 'Discontinued',
  },
} as const

export const ProductBadge: React.FC<ProductBadgeProps> = ({
  type,
  text,
  discount,
  stockCount,
  position = 'top-right',
  size = 'default',
  animated = false,
  tooltip,
  className = '',
}) => {
  const config = badgeConfig[type]
  const IconComponent = config.icon

  const getBadgeText = () => {
    if (text) return text

    switch (type) {
      case 'sale':
        return discount ? `-${discount}%` : config.defaultText
      case 'low-stock':
        return stockCount ? `Only ${stockCount} left` : config.defaultText
      case 'in-stock':
        return stockCount ? `${stockCount} available` : config.defaultText
      default:
        return config.defaultText
    }
  }

  const getSizeClass = () => {
    switch (size) {
      case 'small':
        return 'product-badge--small'
      case 'large':
        return 'product-badge--large'
      default:
        return ''
    }
  }

  const getPositionClass = () => {
    return `product-badge--${position}`
  }

  const badgeContent = (
    <Tag
      color={config.color}
      icon={<IconComponent />}
      className={`
        product-badge 
        ${getSizeClass()} 
        ${getPositionClass()}
        ${animated ? 'product-badge--animated' : ''}
        ${className}
      `}
    >
      {getBadgeText()}
    </Tag>
  )

  if (tooltip) {
    return <Tooltip title={tooltip}>{badgeContent}</Tooltip>
  }

  return badgeContent
}

export default ProductBadge
