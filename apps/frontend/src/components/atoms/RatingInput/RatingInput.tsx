import React, { useState } from 'react'
import { Rate, InputNumber, Tooltip } from 'antd'
import { StarFilled, HeartFilled } from '@ant-design/icons'
import './RatingInput.css'

export type RatingType = 'star' | 'numeric' | 'emoji' | 'heart' | 'thumbs'

export interface EmojiRating {
  value: number
  emoji: string
  label: string
  color?: string
}

export interface RatingInputProps {
  /** Current rating value */
  value?: number
  /** Change handler */
  onChange?: (value: number) => void
  /** Rating type */
  type?: RatingType
  /** Maximum rating value */
  max?: number
  /** Minimum rating value */
  min?: number
  /** Whether to allow half ratings */
  allowHalf?: boolean
  /** Whether to show tooltips */
  showTooltips?: boolean
  /** Custom tooltip labels */
  tooltips?: string[]
  /** Component size */
  size?: 'small' | 'medium' | 'large'
  /** Whether component is disabled */
  disabled?: boolean
  /** Whether component is read-only */
  readOnly?: boolean
  /** Custom emoji ratings (for emoji type) */
  emojiRatings?: EmojiRating[]
  /** Whether to show numeric value */
  showValue?: boolean
  /** Custom color */
  color?: string
  /** Whether to allow clear */
  allowClear?: boolean
  /** Custom character for star type */
  character?: React.ReactNode
  /** Step for numeric type */
  step?: number
  /** Precision for numeric display */
  precision?: number
}

const DEFAULT_EMOJI_RATINGS: EmojiRating[] = [
  { value: 1, emoji: '😞', label: 'Very Bad', color: '#ff4d4f' },
  { value: 2, emoji: '😕', label: 'Bad', color: '#ff7a45' },
  { value: 3, emoji: '😐', label: 'Okay', color: '#faad14' },
  { value: 4, emoji: '😊', label: 'Good', color: '#73d13d' },
  { value: 5, emoji: '😍', label: 'Excellent', color: '#52c41a' },
]

const DEFAULT_TOOLTIPS = ['Terrible', 'Bad', 'Normal', 'Good', 'Wonderful']

export const RatingInput: React.FC<RatingInputProps> = ({
  value = 0,
  onChange,
  type = 'star',
  max = 5,
  min = 0,
  allowHalf = false,
  showTooltips = false,
  tooltips = DEFAULT_TOOLTIPS,
  size = 'medium',
  disabled = false,
  readOnly = false,
  emojiRatings = DEFAULT_EMOJI_RATINGS,
  showValue = false,
  color,
  allowClear = true,
  character,
  step = 0.1,
  precision = 1,
}) => {
  const [hoverValue, setHoverValue] = useState<number | null>(null)

  const ratingClasses = [
    'oda-rating-input',
    `oda-rating-input--${type}`,
    `oda-rating-input--${size}`,
    disabled && 'oda-rating-input--disabled',
    readOnly && 'oda-rating-input--readonly',
    showValue && 'oda-rating-input--with-value',
  ]
    .filter(Boolean)
    .join(' ')

  const handleChange = (newValue: number) => {
    if (!disabled && !readOnly && onChange) {
      onChange(newValue)
    }
  }

  const handleHover = (newValue: number) => {
    if (!disabled && !readOnly) {
      setHoverValue(newValue)
    }
  }

  const handleLeave = () => {
    setHoverValue(null)
  }

  const renderStarRating = () => {
    const customCharacter = character || <StarFilled />

    return (
      <Rate
        value={value}
        onChange={handleChange}
        count={max}
        allowHalf={allowHalf}
        disabled={disabled}
        allowClear={allowClear}
        character={customCharacter}
        className='oda-rating-input__stars'
        style={{ color }}
      />
    )
  }

  const renderHeartRating = () => {
    return (
      <Rate
        value={value}
        onChange={handleChange}
        count={max}
        allowHalf={allowHalf}
        disabled={disabled}
        allowClear={allowClear}
        character={<HeartFilled />}
        className='oda-rating-input__hearts'
        style={{ color: color || '#eb2f96' }}
      />
    )
  }

  const renderNumericRating = () => {
    return (
      <InputNumber
        value={value}
        onChange={(val) => handleChange(val || 0)}
        min={min}
        max={max}
        step={step}
        precision={precision}
        disabled={disabled}
        size={size === 'large' ? 'large' : size === 'small' ? 'small' : 'middle'}
        className='oda-rating-input__numeric'
      />
    )
  }

  const renderEmojiRating = () => {
    const displayValue = hoverValue !== null ? hoverValue : value
    const currentEmoji = emojiRatings.find(
      (e) => e.value === Math.round(displayValue)
    )

    return (
      <div className='oda-rating-input__emoji-container'>
        <div className='oda-rating-input__emoji-display'>
          {currentEmoji && (
            <span
              className='oda-rating-input__emoji-current'
              style={{ color: currentEmoji.color }}
            >
              {currentEmoji.emoji}
            </span>
          )}
        </div>
        <div className='oda-rating-input__emoji-options'>
          {emojiRatings.map((emoji) => (
            <Tooltip key={emoji.value} title={emoji.label}>
              <button
                type='button'
                className={`oda-rating-input__emoji-option ${
                  Math.round(displayValue) === emoji.value ? 'active' : ''
                }`}
                onClick={() => handleChange(emoji.value)}
                onMouseEnter={() => handleHover(emoji.value)}
                onMouseLeave={handleLeave}
                disabled={disabled}
                style={{ color: emoji.color }}
              >
                {emoji.emoji}
              </button>
            </Tooltip>
          ))}
        </div>
      </div>
    )
  }

  const renderThumbsRating = () => {
    return (
      <div className='oda-rating-input__thumbs-container'>
        <button
          type='button'
          className={`oda-rating-input__thumb ${value === 1 ? 'active' : ''}`}
          onClick={() => handleChange(value === 1 ? 0 : 1)}
          disabled={disabled}
        >
          👍
        </button>
        <button
          type='button'
          className={`oda-rating-input__thumb ${value === -1 ? 'active' : ''}`}
          onClick={() => handleChange(value === -1 ? 0 : -1)}
          disabled={disabled}
        >
          👎
        </button>
      </div>
    )
  }

  const renderRatingComponent = () => {
    switch (type) {
      case 'heart':
        return renderHeartRating()
      case 'numeric':
        return renderNumericRating()
      case 'emoji':
        return renderEmojiRating()
      case 'thumbs':
        return renderThumbsRating()
      default:
        return renderStarRating()
    }
  }

  const renderValue = () => {
    if (!showValue) return null

    const displayValue = value
    if (type === 'emoji') {
      const currentEmoji = emojiRatings.find(
        (e) => e.value === Math.round(value)
      )
      return (
        <span className='oda-rating-input__value'>
          {currentEmoji?.label || `${value}/${max}`}
        </span>
      )
    }

    if (type === 'thumbs') {
      if (value === 1)
        return <span className='oda-rating-input__value'>Positive</span>
      if (value === -1)
        return <span className='oda-rating-input__value'>Negative</span>
      return <span className='oda-rating-input__value'>No rating</span>
    }

    return (
      <span className='oda-rating-input__value'>
        {displayValue.toFixed(precision)}/{max}
      </span>
    )
  }

  const renderTooltips = () => {
    if (!showTooltips || type === 'emoji' || type === 'thumbs') return null

    const currentValue = hoverValue !== null ? hoverValue : value
    const tooltipIndex = Math.ceil(currentValue) - 1
    const tooltipText = tooltips[tooltipIndex]

    if (!tooltipText) return null

    return <div className='oda-rating-input__tooltip'>{tooltipText}</div>
  }

  const content = (
    <div className={ratingClasses}>
      <div className='oda-rating-input__component'>
        {renderRatingComponent()}
      </div>
      {renderValue()}
      {renderTooltips()}
    </div>
  )

  // Wrap with tooltip for star/heart ratings if tooltips are enabled
  if (showTooltips && (type === 'star' || type === 'heart')) {
    const currentValue = hoverValue !== null ? hoverValue : value
    const tooltipIndex = Math.ceil(currentValue) - 1
    const tooltipText = tooltips[tooltipIndex]

    return (
      <Tooltip title={tooltipText} open={!!tooltipText}>
        {content}
      </Tooltip>
    )
  }

  return content
}

RatingInput.displayName = 'RatingInput'
