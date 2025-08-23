import React from 'react'
import { Card, Progress, Tooltip } from 'antd'
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  FireOutlined,
  HeartOutlined,
  ShareAltOutlined,
  EyeOutlined,
} from '@ant-design/icons'
// import { designTokens } from '../../../config/theme'
import './TrendIndicator.css'

export interface TrendMetrics {
  popularity: number
  socialMentions: number
  searchVolume: number
  salesGrowth: number
  engagement: number
}

export interface TrendForecast {
  direction: 'up' | 'down' | 'stable'
  confidence: number
  timeframe: string
  prediction: string
}

export interface TrendIndicatorProps {
  /** Trend name/title */
  title: string
  /** Current trend score (0-100) */
  score: number
  /** Trend direction */
  direction: 'up' | 'down' | 'stable'
  /** Trend velocity (how fast it's changing) */
  velocity?: number
  /** Detailed metrics */
  metrics?: TrendMetrics
  /** Trend forecast */
  forecast?: TrendForecast
  /** Trend category */
  category?: 'fashion' | 'color' | 'style' | 'seasonal' | 'celebrity' | 'social'
  /** Whether trend is hot/viral */
  isHot?: boolean
  /** Trend tags */
  tags?: string[]
  /** Component size */
  size?: 'small' | 'medium' | 'large'
  /** Display variant */
  variant?: 'card' | 'compact' | 'minimal'
  /** Click handler */
  onClick?: () => void
}

export const TrendIndicator: React.FC<TrendIndicatorProps> = ({
  title,
  score,
  direction,
  velocity = 0,
  metrics,
  forecast,
  category = 'fashion',
  isHot = false,
  tags = [],
  size = 'medium',
  variant = 'card',
  onClick,
}) => {
  const indicatorClasses = [
    'oda-trend-indicator',
    `oda-trend-indicator--${variant}`,
    `oda-trend-indicator--${size}`,
    `oda-trend-indicator--${direction}`,
    `oda-trend-indicator--${category}`,
    isHot && 'oda-trend-indicator--hot',
    onClick && 'oda-trend-indicator--clickable',
  ]
    .filter(Boolean)
    .join(' ')

  const getTrendColor = () => {
    if (isHot) return '#ff4d4f'
    if (score >= 80) return '#52c41a'
    if (score >= 60) return '#faad14'
    if (score >= 40) return '#1890ff'
    return '#8c8c8c'
  }

  const getTrendIcon = () => {
    if (isHot) return <FireOutlined />
    switch (direction) {
      case 'up':
        return <ArrowUpOutlined />
      case 'down':
        return <ArrowDownOutlined />
      default:
        return null
    }
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const renderMetrics = () => {
    if (!metrics) return null

    return (
      <div className='oda-trend-indicator__metrics'>
        <div className='oda-trend-indicator__metric'>
          <HeartOutlined className='oda-trend-indicator__metric-icon' />
          <span>{formatNumber(metrics.engagement)}</span>
        </div>
        <div className='oda-trend-indicator__metric'>
          <ShareAltOutlined className='oda-trend-indicator__metric-icon' />
          <span>{formatNumber(metrics.socialMentions)}</span>
        </div>
        <div className='oda-trend-indicator__metric'>
          <EyeOutlined className='oda-trend-indicator__metric-icon' />
          <span>{formatNumber(metrics.searchVolume)}</span>
        </div>
      </div>
    )
  }

  const renderForecast = () => {
    if (!forecast) return null

    return (
      <div className='oda-trend-indicator__forecast'>
        <div className='oda-trend-indicator__forecast-direction'>
          {getTrendIcon()}
          <span>{forecast.prediction}</span>
        </div>
        <div className='oda-trend-indicator__forecast-confidence'>
          {forecast.confidence}% confidence • {forecast.timeframe}
        </div>
      </div>
    )
  }

  const renderTags = () => {
    if (tags.length === 0) return null

    return (
      <div className='oda-trend-indicator__tags'>
        {tags.slice(0, 3).map((tag, index) => (
          <span key={index} className='oda-trend-indicator__tag'>
            #{tag}
          </span>
        ))}
      </div>
    )
  }

  const renderCompactVariant = () => (
    <div className={indicatorClasses} onClick={onClick}>
      <div className='oda-trend-indicator__compact-content'>
        <div className='oda-trend-indicator__compact-header'>
          <span className='oda-trend-indicator__title'>{title}</span>
          <div className='oda-trend-indicator__score-badge'>
            {getTrendIcon()}
            <span>{score}</span>
          </div>
        </div>
        <Progress
          percent={score}
          strokeColor={getTrendColor()}
          showInfo={false}
          size='small'
        />
      </div>
    </div>
  )

  const renderMinimalVariant = () => (
    <div className={indicatorClasses} onClick={onClick}>
      <div className='oda-trend-indicator__minimal-content'>
        <span className='oda-trend-indicator__title'>{title}</span>
        <div className='oda-trend-indicator__minimal-score'>
          {getTrendIcon()}
          <span>{score}%</span>
        </div>
      </div>
    </div>
  )

  const renderCardVariant = () => (
    <Card
      className={indicatorClasses}
      onClick={onClick}
      hoverable={!!onClick}
      size='small'
    >
      <div className='oda-trend-indicator__header'>
        <div className='oda-trend-indicator__title-section'>
          <h4 className='oda-trend-indicator__title'>{title}</h4>
          <span className='oda-trend-indicator__category'>{category}</span>
        </div>
        <div className='oda-trend-indicator__score-section'>
          {isHot && <FireOutlined className='oda-trend-indicator__hot-icon' />}
          <span className='oda-trend-indicator__score'>{score}</span>
        </div>
      </div>

      <div className='oda-trend-indicator__progress-section'>
        <Progress
          percent={score}
          strokeColor={getTrendColor()}
          showInfo={false}
          strokeWidth={8}
        />
        <div className='oda-trend-indicator__direction'>
          {getTrendIcon()}
          <span className='oda-trend-indicator__velocity'>
            {velocity > 0 ? `+${velocity}%` : `${velocity}%`}
          </span>
        </div>
      </div>

      {renderMetrics()}
      {renderForecast()}
      {renderTags()}
    </Card>
  )

  const tooltipContent = metrics ? (
    <div className='oda-trend-indicator__tooltip'>
      <div className='oda-trend-indicator__tooltip-title'>{title}</div>
      <div className='oda-trend-indicator__tooltip-metrics'>
        <div>Popularity: {metrics.popularity}%</div>
        <div>Social Mentions: {formatNumber(metrics.socialMentions)}</div>
        <div>Search Volume: {formatNumber(metrics.searchVolume)}</div>
        <div>
          Sales Growth: {metrics.salesGrowth > 0 ? '+' : ''}
          {metrics.salesGrowth}%
        </div>
        <div>Engagement: {formatNumber(metrics.engagement)}</div>
      </div>
      {forecast && (
        <div className='oda-trend-indicator__tooltip-forecast'>
          Forecast: {forecast.prediction} ({forecast.confidence}% confidence)
        </div>
      )}
    </div>
  ) : (
    title
  )

  const content = () => {
    switch (variant) {
      case 'compact':
        return renderCompactVariant()
      case 'minimal':
        return renderMinimalVariant()
      default:
        return renderCardVariant()
    }
  }

  return (
    <Tooltip title={tooltipContent} placement='top'>
      {content()}
    </Tooltip>
  )
}

TrendIndicator.displayName = 'TrendIndicator'
