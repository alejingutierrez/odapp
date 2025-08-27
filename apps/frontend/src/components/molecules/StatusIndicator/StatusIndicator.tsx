import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  MinusCircleOutlined,
} from '@ant-design/icons'
import { Badge, Tooltip, Space } from 'antd'
import React from 'react'

import { Text } from '../../atoms/Typography/Typography'
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

/**
 * Props for the StatusIndicator component
 */
export interface StatusIndicatorProps {
  /** The status type to display */
  status: StatusType
  /** Custom text to display (overrides default text) */
  text?: string
  /** Tooltip text to show on hover */
  tooltip?: string
  /** Whether to show the status icon */
  showIcon?: boolean
  /** Whether to show as a dot instead of icon + text */
  showDot?: boolean
  /** Whether to animate the indicator (only works for 'processing' status) */
  animated?: boolean
  /** Size of the status indicator */
  size?: 'small' | 'default' | 'large'
  /** Additional CSS class name */
  className?: string
}

const statusConfig = {
  success: {
    color: 'success',
    icon: CheckCircleOutlined,
    defaultText: 'Success',
  },
  processing: {
    color: 'processing',
    icon: SyncOutlined,
    defaultText: 'Processing',
  },
  warning: {
    color: 'warning',
    icon: ExclamationCircleOutlined,
    defaultText: 'Warning',
  },
  error: {
    color: 'error',
    icon: CloseCircleOutlined,
    defaultText: 'Error',
  },
  pending: {
    color: 'default',
    icon: ClockCircleOutlined,
    defaultText: 'Pending',
  },
  cancelled: {
    color: 'default',
    icon: MinusCircleOutlined,
    defaultText: 'Cancelled',
  },
  draft: {
    color: 'default',
    icon: MinusCircleOutlined,
    defaultText: 'Draft',
  },
  default: {
    color: 'default',
    icon: MinusCircleOutlined,
    defaultText: 'Unknown',
  },
} as const

/**
 * StatusIndicator - A status indicator component
 * 
 * Displays various status types with icons, dots, and animations. 
 * Perfect for showing process states, order statuses, and system notifications.
 * 
 * @example
 * ```tsx
 * <StatusIndicator
 *   status="success"
 *   text="Order Completed"
 *   showIcon={true}
 *   animated={false}
 * />
 * ```
 */
export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  text,
  tooltip,
  showIcon = true,
  showDot = false,
  animated = false,
  size = 'default',
  className = '',
}) => {
  const config = statusConfig[status] || statusConfig.default
  const displayText = text || config.defaultText
  const IconComponent = config.icon

  const shouldAnimate = animated && status === 'processing'

  const renderContent = () => {
    if (showDot) {
      return (
        <Badge
          status={
            config.color as
              | 'success'
              | 'processing'
              | 'warning'
              | 'error'
              | 'default'
          }
          text={displayText}
          className={`status-indicator__badge ${shouldAnimate ? 'status-indicator__badge--animated' : ''}`}
        />
      )
    }

    return (
      <Space size='small' className='status-indicator__content'>
        {showIcon && (
          <IconComponent
            className={`status-indicator__icon status-indicator__icon--${status} ${shouldAnimate ? 'status-indicator__icon--spinning' : ''}`}
          />
        )}
        <Text
          className={`status-indicator__text status-indicator__text--${size}`}
        >
          {displayText}
        </Text>
      </Space>
    )
  }

  const content = renderContent()

  if (tooltip) {
    return (
      <Tooltip title={tooltip}>
        <span className={`status-indicator ${className}`}>{content}</span>
      </Tooltip>
    )
  }

  return <span className={`status-indicator ${className}`}>{content}</span>
}

export default StatusIndicator
