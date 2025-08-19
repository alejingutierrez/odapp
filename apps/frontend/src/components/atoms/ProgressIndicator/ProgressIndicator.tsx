import React, { CSSProperties } from 'react'
import { Progress, ProgressProps, theme, Typography } from 'antd'
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'

const { Text } = Typography
const { useToken } = theme

export type ProgressVariant =
  | 'line'
  | 'circle'
  | 'dashboard'
  | 'gradient'
  | 'stepped'
export type ProgressSize = 'small' | 'default' | 'large'
export type ProgressTheme =
  | 'default'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
export type ProgressStatus = 'normal' | 'success' | 'exception' | 'active'

export interface ProgressIndicatorProps
  extends Omit<ProgressProps, 'type' | 'size' | 'status'> {
  variant?: ProgressVariant
  size?: ProgressSize
  theme?: ProgressTheme
  showLabel?: boolean
  showPercentage?: boolean
  label?: string
  animated?: boolean
  status?: ProgressStatus
  showIcon?: boolean
  steps?: number
  description?: string
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  variant = 'line',
  size = 'default',
  theme = 'default',
  showLabel = true,
  showPercentage = true,
  showIcon = false,
  label,
  animated = true,
  percent = 0,
  status = 'normal',
  steps,
  description,
  ...props
}) => {
  const { token } = useToken()

  const getSize = () => {
    if (variant === 'circle' || variant === 'dashboard') {
      return {
        small: 80,
        default: 120,
        large: 160,
      }[size]
    }
    if (variant === 'stepped') {
      return undefined
    }
    return {
      small: 6,
      default: 8,
      large: 10,
    }[size]
  }

  const getThemeColor = () => {
    switch (theme) {
      case 'success':
        return token.colorSuccess
      case 'warning':
        return token.colorWarning
      case 'danger':
        return token.colorError
      case 'info':
        return token.colorInfo
      default:
        return token.colorPrimary
    }
  }

  const getStatusIcon = () => {
    if (!showIcon) return null

    switch (status) {
      case 'success':
        return <CheckCircleOutlined style={{ color: token.colorSuccess }} />
      case 'exception':
        return <CloseCircleOutlined style={{ color: token.colorError }} />
      default:
        return null
    }
  }

  const getContainerStyle = (): CSSProperties => ({
    textAlign:
      variant !== 'line' && variant !== 'stepped' ? 'center' : undefined,
    width: '100%',
  })

  const getLabelStyle = (): CSSProperties => ({
    marginBottom: 8,
    fontSize: size === 'small' ? 12 : 14,
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  })

  const getGradientProps = () => {
    if (variant !== 'gradient') return {}

    return {
      strokeColor: {
        '0%': getThemeColor(),
        '100%': token.colorPrimaryBg,
      },
    }
  }

  const renderSteppedProgress = () => {
    if (variant !== 'stepped' || !steps) return null

    const currentStep = Math.floor((percent / 100) * steps)

    return (
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        {Array.from({ length: steps }, (_, index) => (
          <div
            key={index}
            style={{
              flex: 1,
              height: getSize() || 8,
              backgroundColor:
                index < currentStep ? getThemeColor() : token.colorBgContainer,
              borderRadius: 4,
              border: `1px solid ${token.colorBorder}`,
              transition: 'all 0.3s ease',
            }}
          />
        ))}
      </div>
    )
  }

  const renderProgress = () => {
    if (variant === 'stepped') {
      return renderSteppedProgress()
    }

    const progressProps = {
      type: variant === 'gradient' ? 'line' : variant,
      size: getSize(),
      percent,
      status: animated && status === 'normal' ? 'active' : status,
      strokeColor: theme !== 'default' ? getThemeColor() : undefined,
      ...getGradientProps(),
      ...props,
    }

    return <Progress {...progressProps} />
  }

  return (
    <div style={getContainerStyle()}>
      {(showLabel && label) || showPercentage ? (
        <div style={getLabelStyle()}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {getStatusIcon()}
            {showLabel && label && (
              <Text strong={size !== 'small'}>{label}</Text>
            )}
          </div>
          {showPercentage && (
            <Text
              type='secondary'
              style={{ fontSize: size === 'small' ? 11 : 12 }}
            >
              {percent}%
            </Text>
          )}
        </div>
      ) : null}

      {renderProgress()}

      {description && (
        <div style={{ marginTop: 4 }}>
          <Text
            type='secondary'
            style={{ fontSize: size === 'small' ? 11 : 12 }}
          >
            {description}
          </Text>
        </div>
      )}
    </div>
  )
}
