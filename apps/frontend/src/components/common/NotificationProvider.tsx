import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { notification } from 'antd'
import { 
  selectNotifications, 
  removeNotification,
  markNotificationAsRead 
} from '../../store/slices/uiSlice'
import { AppDispatch } from '../../store'

interface NotificationProviderProps {
  children: React.ReactNode
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const dispatch = useDispatch<AppDispatch>()
  const notifications = useSelector(selectNotifications)
  const [api, contextHolder] = notification.useNotification()

  useEffect(() => {
    // Show new notifications
    notifications.forEach((notif) => {
      if (!notif.read) {
        api[notif.type]({
          key: notif.id,
          message: notif.title,
          description: notif.message,
          duration: notif.duration || 4.5,
          onClose: () => {
            dispatch(removeNotification(notif.id))
          },
          onClick: () => {
            dispatch(markNotificationAsRead(notif.id))
            
            // Handle notification actions
            if (notif.actions && notif.actions.length > 0) {
              const primaryAction = notif.actions[0]
              // Handle action based on type
              console.log('Notification action:', primaryAction)
            }
          },
          placement: 'topRight',
          style: {
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          }
        })
        
        // Mark as read after showing
        setTimeout(() => {
          dispatch(markNotificationAsRead(notif.id))
        }, 1000)
      }
    })
  }, [notifications, api, dispatch])

  return (
    <>
      {contextHolder}
      {children}
    </>
  )
}