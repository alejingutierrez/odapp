import {
  PhoneOutlined,
  MailOutlined,
  VideoCameraOutlined,
  MessageOutlined,
  UserOutlined,
  ShoppingCartOutlined,
  FileTextOutlined,
  CalendarOutlined,
  BellOutlined,
  HeartOutlined,
  ShareAltOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  DownloadOutlined,
  UploadOutlined,
  LoginOutlined,
  LogoutOutlined,
  SettingOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons'
import { Tooltip } from 'antd'
import React from 'react'
import './ActivityIcon.css'

export type ActivityType =
  | 'call'
  | 'email'
  | 'meeting'
  | 'message'
  | 'chat'
  | 'visit'
  | 'purchase'
  | 'order'
  | 'return'
  | 'refund'
  | 'note'
  | 'task'
  | 'appointment'
  | 'reminder'
  | 'like'
  | 'share'
  | 'view'
  | 'comment'
  | 'review'
  | 'edit'
  | 'delete'
  | 'create'
  | 'update'
  | 'download'
  | 'upload'
  | 'export'
  | 'import'
  | 'login'
  | 'logout'
  | 'register'
  | 'settings'
  | 'support'
  | 'feedback'
  | 'complaint'
  | 'inquiry'

export interface ActivityIconProps {
  /** Type of activity */
  type: ActivityType
  /** Icon size */
  size?: 'small' | 'medium' | 'large' | number
  /** Icon color variant */
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'
  /** Custom color */
  color?: string
  /** Whether to show background circle */
  showBackground?: boolean
  /** Background color */
  backgroundColor?: string
  /** Tooltip text */
  tooltip?: string
  /** Whether icon is active/highlighted */
  active?: boolean
  /** Whether icon is disabled */
  disabled?: boolean
  /** Click handler */
  onClick?: () => void
  /** Custom icon (overrides type) */
  customIcon?: React.ReactNode
  /** Additional CSS class */
  className?: string
}

const ACTIVITY_ICONS: Record<ActivityType, React.ReactNode> = {
  // Communication
  call: <PhoneOutlined />,
  email: <MailOutlined />,
  meeting: <VideoCameraOutlined />,
  message: <MessageOutlined />,
  chat: <MessageOutlined />,

  // Customer interactions
  visit: <UserOutlined />,
  purchase: <ShoppingCartOutlined />,
  order: <ShoppingCartOutlined />,
  return: <ShoppingCartOutlined />,
  refund: <ShoppingCartOutlined />,

  // Tasks and notes
  note: <FileTextOutlined />,
  task: <FileTextOutlined />,
  appointment: <CalendarOutlined />,
  reminder: <BellOutlined />,

  // Social interactions
  like: <HeartOutlined />,
  share: <ShareAltOutlined />,
  view: <EyeOutlined />,
  comment: <MessageOutlined />,
  review: <FileTextOutlined />,

  // CRUD operations
  edit: <EditOutlined />,
  delete: <DeleteOutlined />,
  create: <EditOutlined />,
  update: <EditOutlined />,

  // File operations
  download: <DownloadOutlined />,
  upload: <UploadOutlined />,
  export: <DownloadOutlined />,
  import: <UploadOutlined />,

  // Authentication
  login: <LoginOutlined />,
  logout: <LogoutOutlined />,
  register: <UserOutlined />,
  settings: <SettingOutlined />,

  // Support
  support: <QuestionCircleOutlined />,
  feedback: <MessageOutlined />,
  complaint: <MessageOutlined />,
  inquiry: <QuestionCircleOutlined />,
}

const ACTIVITY_COLORS: Record<ActivityType, string> = {
  // Communication - Blue
  call: '#1890ff',
  email: '#1890ff',
  meeting: '#1890ff',
  message: '#1890ff',
  chat: '#1890ff',

  // Customer interactions - Green
  visit: '#52c41a',
  purchase: '#52c41a',
  order: '#52c41a',
  return: '#faad14',
  refund: '#faad14',

  // Tasks and notes - Purple
  note: '#722ed1',
  task: '#722ed1',
  appointment: '#722ed1',
  reminder: '#fa8c16',

  // Social interactions - Pink/Red
  like: '#eb2f96',
  share: '#13c2c2',
  view: '#1890ff',
  comment: '#722ed1',
  review: '#722ed1',

  // CRUD operations - Orange
  edit: '#fa8c16',
  delete: '#ff4d4f',
  create: '#52c41a',
  update: '#fa8c16',

  // File operations - Cyan
  download: '#13c2c2',
  upload: '#13c2c2',
  export: '#13c2c2',
  import: '#13c2c2',

  // Authentication - Gray
  login: '#52c41a',
  logout: '#ff4d4f',
  register: '#1890ff',
  settings: '#8c8c8c',

  // Support - Yellow/Orange
  support: '#faad14',
  feedback: '#1890ff',
  complaint: '#ff4d4f',
  inquiry: '#1890ff',
}

export const ActivityIcon: React.FC<ActivityIconProps> = ({
  type,
  size = 'medium',
  variant = 'default',
  color,
  showBackground = false,
  backgroundColor,
  tooltip,
  active = false,
  disabled = false,
  onClick,
  customIcon,
  className = '',
}) => {
  const iconClasses = [
    'oda-activity-icon',
    `oda-activity-icon--${typeof size === 'string' ? size : 'custom'}`,
    `oda-activity-icon--${variant}`,
    showBackground && 'oda-activity-icon--with-background',
    active && 'oda-activity-icon--active',
    disabled && 'oda-activity-icon--disabled',
    onClick && !disabled && 'oda-activity-icon--clickable',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const getIconSize = (): number => {
    if (typeof size === 'number') return size

    const sizes = {
      small: 14,
      medium: 16,
      large: 20,
    }
    return sizes[size]
  }

  const getIconColor = (): string => {
    if (disabled) return '#d9d9d9'
    if (color) return color

    const variantColors = {
      default: ACTIVITY_COLORS[type] || '#8c8c8c',
      primary: '#1890ff',
      success: '#52c41a',
      warning: '#faad14',
      error: '#ff4d4f',
      info: '#13c2c2',
    }

    return variantColors[variant]
  }

  const getBackgroundColor = (): string => {
    if (backgroundColor) return backgroundColor

    const iconColor = getIconColor()
    // Convert hex to rgba with low opacity
    const hex = iconColor.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)

    return `rgba(${r}, ${g}, ${b}, 0.1)`
  }

  const iconStyle: React.CSSProperties = {
    fontSize: getIconSize(),
    color: getIconColor(),
    ...(showBackground && {
      backgroundColor: getBackgroundColor(),
      padding: '6px',
      borderRadius: '50%',
    }),
  }

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick()
    }
  }

  const renderIcon = () => {
    const icon = customIcon || ACTIVITY_ICONS[type] || (
      <QuestionCircleOutlined />
    )

    return (
      <span
        className={iconClasses}
        style={iconStyle}
        onClick={handleClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick && !disabled ? 0 : undefined}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && onClick && !disabled) {
            e.preventDefault()
            onClick()
          }
        }}
      >
        {icon}
      </span>
    )
  }

  if (tooltip) {
    return (
      <Tooltip title={tooltip} placement='top'>
        {renderIcon()}
      </Tooltip>
    )
  }

  return renderIcon()
}

ActivityIcon.displayName = 'ActivityIcon'
