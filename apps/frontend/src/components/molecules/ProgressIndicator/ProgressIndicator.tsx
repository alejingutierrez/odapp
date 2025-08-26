import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  LoadingOutlined,
} from '@ant-design/icons'
import { Progress, Typography, Space } from 'antd'
import React from 'react'
import './ProgressIndicator.css'

export type ProgressType = 'line' | 'circle' | 'dashboard'
export type ProgressStatus = 'normal' | 'success' | 'exception' | 'active'

export interface ProgressStep {
  title: string
  description?: string
  status: 'wait' | 'process' | 'finish' | 'error'
}

export interface ProgressIndicatorProps {
  percent: number
  type?: ProgressType
  status?: ProgressStatus
  showInfo?: boolean
  showSteps?: boolean
  steps?: ProgressStep[]
  size?: 'small' | 'default' | 'large'
  strokeColor?: string | { from: string; to: string }
  trailColor?: string
  strokeWidth?: number // @deprecated Use size instead
  format?: (percent?: number) => React.ReactNode
  title?: string
  subtitle?: string
  animated?: boolean
  className?: string
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  percent,
  type = 'line',
  status = 'normal',
  showInfo = true,
  showSteps = false,
  steps = [],
  size = 'default',
  strokeColor,
  trailColor,

  format,
  title,
  subtitle,

  className = '',
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />
      case 'exception':
        return <CheckCircleOutlined style={{ color: '#ff4d4f' }} />
      case 'active':
        return <LoadingOutlined />
      default:
        return <ClockCircleOutlined style={{ color: '#1890ff' }} />
    }
  }

  const defaultFormat = (percent?: number) => {
    if (percent === undefined) return '0%'
    return `${Math.round(percent)}%`
  }

  const renderSteps = () => {
    if (!showSteps || steps.length === 0) return null

    return (
      <div className='progress-indicator__steps'>
        {steps.map((step, index) => (
          <div
            key={index}
            className={`progress-indicator__step progress-indicator__step--${step.status}`}
          >
            <div className='progress-indicator__step-icon'>
              {step.status === 'finish' && <CheckCircleOutlined />}
              {step.status === 'process' && <LoadingOutlined />}
              {step.status === 'error' && <CheckCircleOutlined />}
              {step.status === 'wait' && <ClockCircleOutlined />}
            </div>
            <div className='progress-indicator__step-content'>
              <Typography.Text
                strong
                className='progress-indicator__step-title'
              >
                {step.title}
              </Typography.Text>
              {step.description && (
                <Typography.Text
                  type='secondary'
                  className='progress-indicator__step-description'
                >
                  {step.description}
                </Typography.Text>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderHeader = () => {
    if (!title && !subtitle) return null

    return (
      <div className='progress-indicator__header'>
        {title && (
          <Typography.Title level={5} className='progress-indicator__title'>
            {title}
          </Typography.Title>
        )}
        {subtitle && (
          <Typography.Text
            type='secondary'
            className='progress-indicator__subtitle'
          >
            {subtitle}
          </Typography.Text>
        )}
      </div>
    )
  }

  return (
    <div
      className={`progress-indicator progress-indicator--${type} progress-indicator--${size} ${className}`}
    >
      {renderHeader()}

      <div className='progress-indicator__content'>
        <Progress
          percent={percent}
          type={type}
          status={status}
          showInfo={showInfo}
          size={
            size === 'small'
              ? 'small'
              : size === 'large'
                ? 'default'
                : 'default'
          }
          strokeColor={strokeColor}
          trailColor={trailColor}
          format={format || defaultFormat}
          className='progress-indicator__progress'
        />

        {(title || subtitle) && showInfo && (
          <div className='progress-indicator__info'>
            <Space size='small' align='center'>
              {getStatusIcon()}
              <Typography.Text className='progress-indicator__status-text'>
                {status === 'active' && 'In Progress'}
                {status === 'success' && 'Completed'}
                {status === 'exception' && 'Failed'}
                {status === 'normal' && 'Pending'}
              </Typography.Text>
            </Space>
          </div>
        )}
      </div>

      {renderSteps()}
    </div>
  )
}

export default ProgressIndicator
