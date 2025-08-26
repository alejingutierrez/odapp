import {
  UserOutlined,
  ShoppingOutlined,
  TruckOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import { Timeline, Typography, Space, Avatar, Tag } from 'antd'
import React from 'react'
import './TimelineItem.css'

export type TimelineItemType =
  | 'order-created'
  | 'order-confirmed'
  | 'order-shipped'
  | 'order-delivered'
  | 'order-cancelled'
  | 'payment-received'
  | 'inventory-updated'
  | 'customer-registered'
  | 'product-created'
  | 'sync-completed'
  | 'custom'

export interface TimelineItemData {
  id: string
  type: TimelineItemType
  title: string
  description?: string
  timestamp: Date
  user?: {
    name: string
    avatar?: string
  }
  metadata?: Record<string, unknown>
  status?: 'success' | 'processing' | 'error' | 'warning'
  tags?: string[]
}

export interface TimelineItemProps {
  item: TimelineItemData
  showAvatar?: boolean
  showTags?: boolean
  showMetadata?: boolean
  compact?: boolean
  className?: string
}

const typeConfig = {
  'order-created': {
    icon: ShoppingOutlined,
    color: 'blue',
  },
  'order-confirmed': {
    icon: CheckCircleOutlined,
    color: 'green',
  },
  'order-shipped': {
    icon: TruckOutlined,
    color: 'orange',
  },
  'order-delivered': {
    icon: CheckCircleOutlined,
    color: 'green',
  },
  'order-cancelled': {
    icon: ExclamationCircleOutlined,
    color: 'red',
  },
  'payment-received': {
    icon: CheckCircleOutlined,
    color: 'green',
  },
  'inventory-updated': {
    icon: ClockCircleOutlined,
    color: 'blue',
  },
  'customer-registered': {
    icon: UserOutlined,
    color: 'purple',
  },
  'product-created': {
    icon: ShoppingOutlined,
    color: 'blue',
  },
  'sync-completed': {
    icon: CheckCircleOutlined,
    color: 'green',
  },
  custom: {
    icon: ClockCircleOutlined,
    color: 'gray',
  },
} as const

export const TimelineItem: React.FC<TimelineItemProps> = ({
  item,
  showAvatar = true,
  showTags = true,
  showMetadata = false,
  compact = false,
  className = '',
}) => {
  const config = typeConfig[item.type] || typeConfig.custom
  const IconComponent = config.icon

  const formatTimestamp = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  const getStatusColor = () => {
    switch (item.status) {
      case 'success':
        return 'green'
      case 'error':
        return 'red'
      case 'warning':
        return 'orange'
      case 'processing':
        return 'blue'
      default:
        return config.color
    }
  }

  const renderContent = () => (
    <div
      className={`timeline-item__content ${compact ? 'timeline-item__content--compact' : ''}`}
    >
      <div className='timeline-item__header'>
        <Space size='small' align='start'>
          {showAvatar && item.user && (
            <Avatar
              size='small'
              src={item.user.avatar}
              icon={<UserOutlined />}
              className='timeline-item__avatar'
            />
          )}

          <div className='timeline-item__text'>
            <Typography.Text strong className='timeline-item__title'>
              {item.title}
            </Typography.Text>

            {item.user && (
              <Typography.Text type='secondary' className='timeline-item__user'>
                by {item.user.name}
              </Typography.Text>
            )}
          </div>
        </Space>

        <Typography.Text type='secondary' className='timeline-item__timestamp'>
          {formatTimestamp(item.timestamp)}
        </Typography.Text>
      </div>

      {item.description && (
        <Typography.Paragraph
          className='timeline-item__description'
          ellipsis={compact ? { rows: 2 } : false}
        >
          {item.description}
        </Typography.Paragraph>
      )}

      {showTags && item.tags && item.tags.length > 0 && (
        <Space size='small' className='timeline-item__tags'>
          {item.tags.map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </Space>
      )}

      {showMetadata && item.metadata && (
        <div className='timeline-item__metadata'>
          {Object.entries(item.metadata).map(([key, value]) => (
            <div key={key} className='timeline-item__metadata-item'>
              <Typography.Text
                type='secondary'
                className='timeline-item__metadata-key'
              >
                {key}:
              </Typography.Text>
              <Typography.Text className='timeline-item__metadata-value'>
                {String(value)}
              </Typography.Text>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <Timeline.Item
      dot={<IconComponent style={{ color: getStatusColor() }} />}
      className={`timeline-item ${className}`}
    >
      {renderContent()}
    </Timeline.Item>
  )
}

export default TimelineItem
