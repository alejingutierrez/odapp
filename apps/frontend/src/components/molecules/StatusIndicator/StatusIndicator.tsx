import React from 'react'
import { Badge, Tooltip, Space } from 'antd'
import { 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  MinusCircleOutlined
} from '@ant-design/icons'
import { Typography } from '../../atoms'
import './StatusIndicator.css'

export type StatusType = 
  | 'success' 
  | 'processing' 
  | 'warning' 
  | 'error' 
  | 'default'
  | 'pending'
  | 'cancelled'
  | 'draft'

export interface StatusIndicatorProps {
  status: StatusType
  text?: string
  tooltip?: string
  showIcon?: boolean
  showDot?: boolean
  animated?: boolean
  size?: 'small' | 'default' | 'large'
  className?: string
}

const statusConfig = {
  success: {
    color: 'success',
    icon: CheckCircleOutlined,
    defaultText: 'Success'
  },
  processing: {
    color: 'processing',
    icon: SyncOutlined,
    defaultText: 'Processing'
  },
  warning: {
    color: 'warning',
    icon: ExclamationCircleOutlined,
    defaultText: 'Warning'
  },
  error: {
    color: 'error',
    icon: CloseCircleOutlined,
    defaultText: 'Error'
  },
  pending: {
    color: 'default',
    icon: ClockCircleOutlined,
    defaultText: 'Pending'
  },
  cancelled: {
    color: 'default',
    icon: MinusCircleOutlined,
    defaultText: 'Cancelled'
  },
  draft: {
    color: 'default',
    icon: MinusCircleOutlined,
    defaultText: 'Draft'
  },
  default: {
    color: 'default',
    icon: MinusCircleOutlined,
    defaultText: 'Unknown'
  }
} as const

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  text,
  tooltip,
  showIcon = true,
  showDot = false,
  animated = false,
  size = 'default',
  className = ''
}) => {
  const config = statusConfig[status] || statusConfig.default
  const displayText = text || config.defaultText
  const IconComponent = config.icon

  const shouldAnimate = animated && (status === 'processing')

  const renderContent = () => {
    if (showDot) {
      return (
        <Badge 
          status={config.color as any}
          text={displayText}
          className={`status-indicator__badge ${shouldAnimate ? 'status-indicator__badge--animated' : ''}`}
        />
      )
    }

    return (
      <Space size="small" className="status-indicator__content">
        {showIcon && (
          <IconComponent 
            className={`status-indicator__icon status-indicator__icon--${status} ${shouldAnimate ? 'status-indicator__icon--spinning' : ''}`}
          />
        )}
        <Typography.Text 
          className={`status-indicator__text status-indicator__text--${size}`}
        >
          {displayText}
        </Typography.Text>
      </Space>
    )
  }

  const content = renderContent()

  if (tooltip) {
    return (
      <Tooltip title={tooltip}>
        <span className={`status-indicator ${className}`}>
          {content}
        </span>
      </Tooltip>
    )
  }

  return (
    <span className={`status-indicator ${className}`}>
      {content}
    </span>
  )
}

export default StatusIndicator