import { TagOutlined } from '@ant-design/icons'
import { Space, Typography, Tooltip } from 'antd'
import React from 'react'
import './PriceDisplay.css'

export interface PriceDisplayProps {
  price: number
  compareAtPrice?: number
  currency?: string
  locale?: string
  showCurrency?: boolean
  showDiscount?: boolean
  showTax?: boolean
  taxRate?: number
  taxIncluded?: boolean
  size?: 'small' | 'default' | 'large'
  layout?: 'horizontal' | 'vertical'
  className?: string
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({
  price,
  compareAtPrice,
  currency = 'USD',
  locale = 'en-US',
  showCurrency = true,
  showDiscount = true,
  showTax = false,
  taxRate = 0,
  taxIncluded = true,
  size = 'default',
  layout = 'horizontal',
  className = '',
}) => {
  const formatPrice = (amount: number) => {
    if (showCurrency) {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
      }).format(amount)
    }
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const hasDiscount = compareAtPrice && compareAtPrice > price
  const discountAmount = hasDiscount ? compareAtPrice - price : 0
  const discountPercentage = hasDiscount
    ? Math.round((discountAmount / compareAtPrice) * 100)
    : 0

  const taxAmount = showTax && taxRate > 0 ? price * (taxRate / 100) : 0

  const getSizeClass = () => {
    switch (size) {
      case 'small':
        return 'price-display--small'
      case 'large':
        return 'price-display--large'
      default:
        return ''
    }
  }

  const renderMainPrice = () => (
    <Typography.Text
      strong
      className={`price-display__current ${getSizeClass()}`}
    >
      {formatPrice(price)}
    </Typography.Text>
  )

  const renderComparePrice = () => {
    if (!hasDiscount || !showDiscount) return null

    return (
      <Typography.Text
        delete
        type='secondary'
        className={`price-display__compare ${getSizeClass()}`}
      >
        {formatPrice(compareAtPrice)}
      </Typography.Text>
    )
  }

  const renderDiscount = () => {
    if (!hasDiscount || !showDiscount) return null

    return (
      <Space size='small' className='price-display__discount'>
        <Typography.Text
          type='success'
          className={`price-display__discount-badge ${getSizeClass()}`}
        >
          <TagOutlined /> -{discountPercentage}%
        </Typography.Text>
        <Typography.Text
          type='success'
          className={`price-display__savings ${getSizeClass()}`}
        >
          Save {formatPrice(discountAmount)}
        </Typography.Text>
      </Space>
    )
  }

  const renderTaxInfo = () => {
    if (!showTax || taxRate === 0) return null

    const taxText = taxIncluded
      ? `Incl. tax (${taxRate}%): ${formatPrice(taxAmount)}`
      : `+ tax (${taxRate}%): ${formatPrice(taxAmount)}`

    return (
      <Tooltip
        title={`Price ${taxIncluded ? 'including' : 'excluding'} ${taxRate}% tax`}
      >
        <Typography.Text
          type='secondary'
          className={`price-display__tax ${getSizeClass()}`}
        >
          {taxText}
        </Typography.Text>
      </Tooltip>
    )
  }

  if (layout === 'vertical') {
    return (
      <div className={`price-display price-display--vertical ${className}`}>
        <div className='price-display__main'>
          {renderMainPrice()}
          {renderComparePrice()}
        </div>
        {renderDiscount()}
        {renderTaxInfo()}
      </div>
    )
  }

  return (
    <Space
      size='small'
      className={`price-display price-display--horizontal ${className}`}
      wrap
    >
      {renderMainPrice()}
      {renderComparePrice()}
      {renderDiscount()}
      {renderTaxInfo()}
    </Space>
  )
}

export default PriceDisplay
