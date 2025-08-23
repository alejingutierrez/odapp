import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {
  Drawer,
  List,
  Button,
  Typography,
  Badge,
  Space,
  Empty,
  Tag,
} from 'antd'
import {
  BellOutlined,
  CheckOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

import { AppDispatch } from '../../store'
import {
  selectNotifications,
  selectUnreadNotificationCount,
  removeNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearNotifications,
} from '../../store/slices/uiSlice'

dayjs.extend(relativeTime)

const { Text } = Typography

interface NotificationCenterProps {
  open: boolean
  onClose: () => void
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  open,
  onClose,
}) => {
  const dispatch = useDispatch<AppDispatch>()
  const notifications = useSelector(selectNotifications)
  const unreadCount = useSelector(selectUnreadNotificationCount)

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />
      case 'error':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
      case 'warning':
        return <ExclamationCircleOutlined style={{ color: '#faad14' }} />
      case 'info':
      default:
        return <InfoCircleOutlined style={{ color: '#1890ff' }} />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return '#52c41a'
      case 'error':
        return '#ff4d4f'
      case 'warning':
        return '#faad14'
      case 'info':
      default:
        return '#1890ff'
    }
  }

  const handleMarkAsRead = (notificationId: string) => {
    dispatch(markNotificationAsRead(notificationId))
  }

  const handleRemove = (notificationId: string) => {
    dispatch(removeNotification(notificationId))
  }

  const handleMarkAllAsRead = () => {
    dispatch(markAllNotificationsAsRead())
  }

  const handleClearAll = () => {
    dispatch(clearNotifications())
  }

  return (
    <Drawer
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BellOutlined />
          <span>Notifications</span>
          {unreadCount > 0 && <Badge count={unreadCount} size='small' />}
        </div>
      }
      placement='right'
      onClose={onClose}
      open={open}
      width={400}
      extra={
        notifications.length > 0 && (
          <Space>
            {unreadCount > 0 && (
              <Button
                type='text'
                size='small'
                icon={<CheckOutlined />}
                onClick={handleMarkAllAsRead}
              >
                Mark all read
              </Button>
            )}
            <Button
              type='text'
              size='small'
              icon={<DeleteOutlined />}
              onClick={handleClearAll}
              danger
            >
              Clear all
            </Button>
          </Space>
        )
      }
    >
      {notifications.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description='No notifications'
        />
      ) : (
        <List
          dataSource={notifications}
          renderItem={(notification) => (
            <List.Item
              style={{
                padding: '16px 0',
                opacity: notification.read ? 0.7 : 1,
                borderLeft: `3px solid ${getNotificationColor(notification.type)}`,
                paddingLeft: '12px',
                marginLeft: '4px',
              }}
              actions={[
                !notification.read && (
                  <Button
                    type='text'
                    size='small'
                    icon={<CheckOutlined />}
                    onClick={() => handleMarkAsRead(notification.id)}
                    title='Mark as read'
                  />
                ),
                <Button
                  type='text'
                  size='small'
                  icon={<DeleteOutlined />}
                  onClick={() => handleRemove(notification.id)}
                  title='Remove'
                  danger
                />,
              ].filter(Boolean)}
            >
              <List.Item.Meta
                avatar={getNotificationIcon(notification.type)}
                title={
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <Text strong={!notification.read}>
                      {notification.title}
                    </Text>
                    {!notification.read && <Badge dot />}
                  </div>
                }
                description={
                  <div>
                    <Text type='secondary'>{notification.message}</Text>
                    <div style={{ marginTop: '4px' }}>
                      <Text type='secondary' style={{ fontSize: '12px' }}>
                        {dayjs(notification.timestamp).fromNow()}
                      </Text>
                      <Tag
                        color={getNotificationColor(notification.type)}
                        style={{ marginLeft: '8px' }}
                      >
                        {notification.type.toUpperCase()}
                      </Tag>
                    </div>
                    {notification.actions &&
                      notification.actions.length > 0 && (
                        <div style={{ marginTop: '8px' }}>
                          <Space size='small'>
                            {notification.actions.map((action, index) => (
                              <Button
                                key={index}
                                type='link'
                                size='small'
                                onClick={() => {
                                  // Handle notification action
                                  console.log('Notification action:', action)
                                }}
                              >
                                {action.label}
                              </Button>
                            ))}
                          </Space>
                        </div>
                      )}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      )}
    </Drawer>
  )
}
