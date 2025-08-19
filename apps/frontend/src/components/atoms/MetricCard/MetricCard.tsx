import React from 'react'
import { Card, Statistic } from 'antd'
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons'

export type TrendType = 'up' | 'down' | 'neutral'

export interface MetricCardProps {
  title: string
  value: string | number
  trend?: TrendType
  trendValue?: string | number
  trendLabel?: string
  prefix?: React.ReactNode
  suffix?: React.ReactNode
  precision?: number
  loading?: boolean
  bordered?: boolean
  size?: 'small' | 'default'
  extra?: React.ReactNode
  onClick?: () => void
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  trend,
  trendValue,
  trendLabel = 'vs last period',
  prefix,
  suffix,
  precision,
  loading = false,
  bordered = true,
  size = 'default',
  extra,
  onClick,
}) => {
  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return '#3f8600'
      case 'down':
        return '#cf1322'
      default:
        return '#666'
    }
  }

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <ArrowUpOutlined />
      case 'down':
        return <ArrowDownOutlined />
      default:
        return null
    }
  }

  const cardStyle = {
    cursor: onClick ? 'pointer' : undefined,
    transition: 'all 0.3s',
  }

  const hoverStyle = onClick
    ? {
        ':hover': {
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        },
      }
    : {}

  return (
    <Card
      variant={bordered ? 'outlined' : 'borderless'}
      size={size}
      style={cardStyle}
      styles={{
        body: {
          padding: size === 'small' ? 16 : 24,
        },
      }}
      extra={extra}
      onClick={onClick}
      {...hoverStyle}
    >
      <Statistic
        title={title}
        value={value}
        precision={precision}
        prefix={prefix}
        suffix={suffix}
        loading={loading}
        valueStyle={{
          fontSize: size === 'small' ? 20 : 24,
          fontWeight: 600,
        }}
      />

      {trend && trendValue && (
        <div
          style={{
            marginTop: 8,
            display: 'flex',
            alignItems: 'center',
            fontSize: 12,
            color: getTrendColor(),
          }}
        >
          {getTrendIcon()}
          <span style={{ marginLeft: 4 }}>
            {trendValue} {trendLabel}
          </span>
        </div>
      )}
    </Card>
  )
}
