import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons'
import { Card, Space, Tooltip, Progress } from 'antd'
import { Typography } from 'antd'
import React from 'react'
import './MetricCard.css'

export interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  trend?: {
    value: number
    period: string
    isPositive?: boolean
  }
  progress?: {
    percent: number
    status?: 'success' | 'exception' | 'active' | 'normal'
  }
  tooltip?: string
  loading?: boolean
  size?: 'small' | 'default' | 'large'
  color?: 'primary' | 'success' | 'warning' | 'error' | 'default'
  className?: string
  onClick?: () => void
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  progress,
  tooltip,
  loading = false,
  size = 'default',
  color = 'default',
  className = '',
  onClick,
}) => {
  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      return new Intl.NumberFormat().format(val)
    }
    return val
  }

  const getTrendIcon = () => {
    if (!trend) return null

    const isPositive = trend.isPositive ?? trend.value > 0
    const Icon = isPositive ? ArrowUpOutlined : ArrowDownOutlined
    const trendColor = isPositive
      ? 'var(--ant-color-success)'
      : 'var(--ant-color-error)'

    return <Icon style={{ color: trendColor, fontSize: '12px' }} />
  }

  const renderHeader = () => (
    <div className='metric-card__header'>
      <Space size='small'>
        <Typography.Text
          type='secondary'
          className={`metric-card__title metric-card__title--${size}`}
        >
          {title}
        </Typography.Text>
        {tooltip && (
          <Tooltip title={tooltip}>
            <InfoCircleOutlined className='metric-card__info-icon' />
          </Tooltip>
        )}
      </Space>
      {icon && (
        <div className={`metric-card__icon metric-card__icon--${color}`}>
          {icon}
        </div>
      )}
    </div>
  )

  const renderValue = () => (
    <div className='metric-card__value-section'>
      <Typography.Title
        level={size === 'large' ? 2 : size === 'small' ? 5 : 3}
        className={`metric-card__value metric-card__value--${color}`}
        style={{ margin: 0 }}
      >
        {formatValue(value)}
      </Typography.Title>

      {subtitle && (
        <Typography.Text
          type='secondary'
          className={`metric-card__subtitle metric-card__subtitle--${size}`}
        >
          {subtitle}
        </Typography.Text>
      )}
    </div>
  )

  const renderTrend = () => {
    if (!trend) return null

    const isPositive = trend.isPositive ?? trend.value > 0
    const trendColor = isPositive ? 'success' : 'danger'

    return (
      <Space size='small' className='metric-card__trend'>
        {getTrendIcon()}
        <Typography.Text
          type={trendColor}
          className={`metric-card__trend-value metric-card__trend-value--${size}`}
        >
          {Math.abs(trend.value)}%
        </Typography.Text>
        <Typography.Text
          type='secondary'
          className={`metric-card__trend-period metric-card__trend-period--${size}`}
        >
          vs {trend.period}
        </Typography.Text>
      </Space>
    )
  }

  const renderProgress = () => {
    if (!progress) return null

    return (
      <Progress
        percent={progress.percent}
        status={progress.status}
        showInfo={false}
        size='small'
        className='metric-card__progress'
      />
    )
  }

  return (
    <Card
      loading={loading}
      hoverable={!!onClick}
      onClick={onClick}
      className={`metric-card metric-card--${size} metric-card--${color} ${className}`}
      bodyStyle={{ padding: size === 'small' ? '12px' : '16px' }}
    >
      {renderHeader()}
      {renderValue()}
      {renderTrend()}
      {renderProgress()}
    </Card>
  )
}

export default MetricCard
