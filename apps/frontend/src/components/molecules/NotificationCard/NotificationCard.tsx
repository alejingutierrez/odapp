import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  CloseCircleOutlined,
  CloseOutlined,
} from '@ant-design/icons'
import { Card, Space, Button, Typography } from 'antd'
import React from 'react'
import './NotificationCard.css'

export type NotificationType = 'success' | 'info' | 'warning' | 'error'

export interface NotificationAction {
  label: string
  onClick: () => void
  type?: 'primary' | 'default' | 'link'
}

export interface NotificationCardProps {
  type: NotificationType
  title: string
  message?: string
  timestamp?: Date
  actions?: NotificationAction[]
  closable?: boolean
  onClose?: () => void
  className?: string
}

const notificationConfig = {
  success: {
    icon: CheckCircleOutlined,
    color: 'var(--ant-color-success)',
  },
  info: {
    icon: InfoCircleOutlined,
    color: 'var(--ant-color-info)',
  },
  warning: {
    icon: ExclamationCircleOutlined,
    color: 'var(--ant-color-warning)',
  },
  error: {
    icon: CloseCircleOutlined,
    color: 'var(--ant-color-error)',
  },
}

export const NotificationCard: React.FC<NotificationCardProps> = ({
  type,
  title,
  message,
  timestamp,
  actions = [],
  closable = true,
  onClose,
  className = '',
}) => {
  const config = notificationConfig[type]
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

  return (
    <Card
      className={`notification-card notification-card--${type} ${className}`}
      bodyStyle={{ padding: '12px 16px' }}
    >
      <div className='notification-card__content'>
        <div className='notification-card__header'>
          <Space size='small' align='start'>
            <IconComponent
              className='notification-card__icon'
              style={{ color: config.color }}
            />
            <div className='notification-card__text'>
              <Typography.Text strong className='notification-card__title'>
                {title}
              </Typography.Text>
              {message && (
                <Typography.Paragraph
                  className='notification-card__message'
                  ellipsis={{ rows: 2, expandable: true }}
                >
                  {message}
                </Typography.Paragraph>
              )}
            </div>
          </Space>

          {closable && (
            <Button
              type='text'
              size='small'
              icon={<CloseOutlined />}
              onClick={onClose}
              className='notification-card__close'
            />
          )}
        </div>

        {(timestamp || actions.length > 0) && (
          <div className='notification-card__footer'>
            <div className='notification-card__timestamp'>
              {timestamp && (
                <Typography.Text
                  type='secondary'
                  className='notification-card__time'
                >
                  {formatTimestamp(timestamp)}
                </Typography.Text>
              )}
            </div>

            {actions.length > 0 && (
              <Space size='small' className='notification-card__actions'>
                {actions.map((action, index) => (
                  <Button
                    key={index}
                    type={action.type || 'link'}
                    size='small'
                    onClick={action.onClick}
                  >
                    {action.label}
                  </Button>
                ))}
              </Space>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}

export default NotificationCard
