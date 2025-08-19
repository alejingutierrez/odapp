import React, { useState } from 'react'
import { Rate, Typography, Space, Tooltip } from 'antd'
import { StarFilled, StarOutlined } from '@ant-design/icons'
import './ProductRating.css'

export interface ProductRatingProps {
  rating: number
  reviewCount?: number
  maxRating?: number
  allowHalf?: boolean
  interactive?: boolean
  showCount?: boolean
  showValue?: boolean
  size?: 'small' | 'default' | 'large'
  onChange?: (rating: number) => void
  disabled?: boolean
  className?: string
}

export const ProductRating: React.FC<ProductRatingProps> = ({
  rating,
  reviewCount = 0,
  maxRating = 5,
  allowHalf = true,
  interactive = false,
  showCount = true,
  showValue = false,
  size = 'default',
  onChange,
  disabled = false,
  className = ''
}) => {
  const [hoverRating, setHoverRating] = useState<number>(0)

  const handleChange = (value: number) => {
    if (interactive && onChange) {
      onChange(value)
    }
  }

  const handleHoverChange = (value: number) => {
    if (interactive) {
      setHoverRating(value)
    }
  }

  const displayRating = hoverRating || rating
  const ratingText = `${displayRating.toFixed(1)} out of ${maxRating} stars`

  const getSizeClass = () => {
    switch (size) {
      case 'small':
        return 'product-rating--small'
      case 'large':
        return 'product-rating--large'
      default:
        return ''
    }
  }

  return (
    <div className={`product-rating ${getSizeClass()} ${className}`}>
      <Space size="small" align="center">
        <Tooltip title={interactive ? 'Click to rate' : ratingText}>
          <Rate
            value={rating}
            count={maxRating}
            allowHalf={allowHalf}
            disabled={disabled || !interactive}
            onChange={handleChange}
            onHoverChange={handleHoverChange}
            character={({ index = 0, value = 0 }) => {
              const filled = index < value
              return filled ? <StarFilled /> : <StarOutlined />
            }}
            className="product-rating__stars"
          />
        </Tooltip>

        {showValue && (
          <Typography.Text 
            strong 
            className="product-rating__value"
          >
            {displayRating.toFixed(1)}
          </Typography.Text>
        )}

        {showCount && reviewCount > 0 && (
          <Typography.Text 
            type="secondary" 
            className="product-rating__count"
          >
            ({reviewCount.toLocaleString()} {reviewCount === 1 ? 'review' : 'reviews'})
          </Typography.Text>
        )}
      </Space>
    </div>
  )
}

export default ProductRating