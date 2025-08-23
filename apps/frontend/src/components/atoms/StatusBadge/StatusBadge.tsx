import React, { CSSProperties } from 'react'
import { Badge, BadgeProps, theme, Typography } from 'antd'
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  InfoCircleOutlined,
  MinusCircleOutlined,
} from '@ant-design/icons'

const { Text } = Typography
const { useToken } = theme

export type StatusType =
  | 'success'
  | 'processing'
  | 'warning'
  | 'error'
  | 'default'
  | 'info'
  | 'pending'
  | 'cancelled'
export type StatusSize = 'small' | 'default' | 'large'
export type StatusVariant = 'badge' | 'dot' | 'outlined' | 'filled' | 'minimal'

export interface StatusBadgeProps
  extends Omit<BadgeProps, 'status' | 'color' | 'size'> {
  status: StatusType
  size?: StatusSize
  variant?: StatusVariant
  showIcon?: boolean
  label?: string
  animated?: boolean
  interactive?: boolean
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'default',
  variant = 'badge',
  showIcon = true,
  label,
  animated = false,
  interactive = false,
  ...props
}) => {
  const { token } = useToken()

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return token.colorSuccess
      case 'processing':
        return token.colorPrimary
      case 'warning':
        return token.colorWarning
      case 'error':
        return token.colorError
      case 'info':
        return token.colorInfo
      case 'pending':
        return token.colorTextSecondary
      case 'cancelled':
        return token.colorTextDisabled
      default:
        return token.colorTextSecondary
    }
  }

  const getAntdColor = () => {
    switch (status) {
      case 'success':
        return 'green'
      case 'processing':
        return 'blue'
      case 'warning':
        return 'orange'
      case 'error':
        return 'red'
      case 'info':
        return 'cyan'
      case 'pending':
        return 'default'
      case 'cancelled':
        return 'default'
      default:
        return 'default'
    }
  }

  const getStatusIcon = () => {
    if (!showIcon) return undefined

    const iconProps = {
      style: {
        color: getStatusColor(),
        fontSize: size === 'small' ? 10 : size === 'large' ? 16 : 12,
      },
    }

    switch (status) {
      case 'success':
        return <CheckCircleOutlined {...iconProps} />
      case 'processing':
        return <SyncOutlined spin={animated} {...iconProps} />
      case 'warning':
        return <ExclamationCircleOutlined {...iconProps} />
      case 'error':
        return <CloseCircleOutlined {...iconProps} />
      case 'info':
        return <InfoCircleOutlined {...iconProps} />
      case 'pending':
        return <ClockCircleOutlined {...iconProps} />
      case 'cancelled':
        return <MinusCircleOutlined {...iconProps} />
      default:
        return <ClockCircleOutlined {...iconProps} />
    }
  }

  const getContainerStyle = (): CSSProperties => {
    const baseStyle: CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      gap: size === 'small' ? 4 : 6,
      fontSize: size === 'small' ? 11 : size === 'large' ? 14 : 12,
    }

    if (interactive) {
      baseStyle.cursor = 'pointer'
      baseStyle.transition = 'all 0.2s ease'
      baseStyle.borderRadius = '4px'
      baseStyle.padding = '2px 4px'
    }

    switch (variant) {
      case 'outlined':
        baseStyle.border = `1px solid ${getStatusColor()}`
        baseStyle.borderRadius = '4px'
        baseStyle.padding = size === 'small' ? '2px 6px' : '4px 8px'
        baseStyle.backgroundColor = 'transparent'
        break
      case 'filled':
        baseStyle.backgroundColor = getStatusColor()
        baseStyle.color = token.colorWhite
        baseStyle.borderRadius = '4px'
        baseStyle.padding = size === 'small' ? '2px 6px' : '4px 8px'
        baseStyle.fontWeight = 500
        break
      case 'minimal':
        baseStyle.color = getStatusColor()
        baseStyle.fontWeight = 500
        break
    }

    return baseStyle
  }

  const renderCustomVariant = () => {
    if (variant === 'badge' || variant === 'dot') {
      const badgeSize = size === 'large' ? 'default' : size // Map 'large' to 'default' for Badge
      return (
        <Badge
          color={getAntdColor()}
          text={label}
          size={badgeSize as 'small' | 'default'}
          dot={variant === 'dot'}
          {...props}
        >
          {variant === 'badge' && getStatusIcon()}
        </Badge>
      )
    }

    return (
      <span style={getContainerStyle()}>
        {getStatusIcon()}
        {label && (
          <Text
            style={{
              color: variant === 'filled' ? token.colorWhite : getStatusColor(),
              fontSize: 'inherit',
              fontWeight: 'inherit',
            }}
          >
            {label}
          </Text>
        )}
      </span>
    )
  }

  return renderCustomVariant()
}
