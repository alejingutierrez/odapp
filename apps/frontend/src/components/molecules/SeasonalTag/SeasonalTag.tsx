import {
  SunOutlined,
  CloudOutlined,
  StarOutlined,
  EnvironmentOutlined,
  FireOutlined,
  RiseOutlined,
} from '@ant-design/icons'
import { Tag, Tooltip, Space } from 'antd'
import React from 'react'
import './SeasonalTag.css'

export type Season = 'spring' | 'summer' | 'autumn' | 'winter'
export type TrendLevel = 'low' | 'medium' | 'high' | 'trending'

export interface SeasonalTagProps {
  season: Season
  year?: number
  collection?: string
  trendLevel?: TrendLevel
  showTrendIndicator?: boolean
  showIcon?: boolean
  animated?: boolean
  size?: 'small' | 'default' | 'large'
  className?: string
}

const seasonConfig = {
  spring: {
    icon: EnvironmentOutlined,
    color: '#52c41a',
    gradient: 'linear-gradient(135deg, #a8e6cf, #52c41a)',
    name: 'Spring',
  },
  summer: {
    icon: SunOutlined,
    color: '#faad14',
    gradient: 'linear-gradient(135deg, #ffd666, #faad14)',
    name: 'Summer',
  },
  autumn: {
    icon: CloudOutlined,
    color: '#fa8c16',
    gradient: 'linear-gradient(135deg, #ffb366, #fa8c16)',
    name: 'Autumn',
  },
  winter: {
    icon: StarOutlined,
    color: '#1890ff',
    gradient: 'linear-gradient(135deg, #91d5ff, #1890ff)',
    name: 'Winter',
  },
} as const

const trendConfig = {
  low: {
    icon: null,
    color: '#d9d9d9',
    label: 'Low trend',
  },
  medium: {
    icon: RiseOutlined,
    color: '#faad14',
    label: 'Medium trend',
  },
  high: {
    icon: RiseOutlined,
    color: '#fa8c16',
    label: 'High trend',
  },
  trending: {
    icon: FireOutlined,
    color: '#ff4d4f',
    label: 'Trending now',
  },
} as const

export const SeasonalTag: React.FC<SeasonalTagProps> = ({
  season,
  year,
  collection,
  trendLevel = 'medium',
  showTrendIndicator = true,
  showIcon = true,
  animated = false,
  size = 'default',
  className = '',
}) => {
  const seasonInfo = seasonConfig[season]
  const trendInfo = trendConfig[trendLevel]
  const IconComponent = seasonInfo.icon
  const TrendIcon = trendInfo.icon

  const getDisplayText = () => {
    let text = seasonInfo.name

    if (year) {
      text += ` ${year}`
    }

    if (collection) {
      text += ` - ${collection}`
    }

    return text
  }

  const renderTrendIndicator = () => {
    if (!showTrendIndicator || !TrendIcon) return null

    return (
      <TrendIcon
        className={`seasonal-tag__trend-icon ${animated ? 'seasonal-tag__trend-icon--animated' : ''}`}
        style={{ color: trendInfo.color }}
      />
    )
  }

  const tagContent = (
    <Space size='small' className='seasonal-tag__content'>
      {showIcon && <IconComponent className='seasonal-tag__season-icon' />}
      <span className='seasonal-tag__text'>{getDisplayText()}</span>
      {renderTrendIndicator()}
    </Space>
  )

  const tooltipContent = (
    <div>
      <div>{getDisplayText()}</div>
      {showTrendIndicator && (
        <div style={{ fontSize: '11px', marginTop: '4px' }}>
          Trend level: {trendInfo.label}
        </div>
      )}
    </div>
  )

  return (
    <Tooltip title={tooltipContent}>
      <Tag
        className={`
          seasonal-tag 
          seasonal-tag--${season} 
          seasonal-tag--${size}
          ${animated ? 'seasonal-tag--animated' : ''}
          ${className}
        `}
        style={{
          background: seasonInfo.gradient,
          borderColor: seasonInfo.color,
          color: 'white',
        }}
      >
        {tagContent}
      </Tag>
    </Tooltip>
  )
}

export default SeasonalTag
