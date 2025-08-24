import { DollarOutlined, EuroOutlined, PoundOutlined } from '@ant-design/icons'
import { Typography, theme } from 'antd'
import React, { CSSProperties } from 'react'

const { Text } = Typography
const { useToken } = theme

export type CurrencyVariant = 'default' | 'compact' | 'large'
export type CurrencyTheme = 'default' | 'success' | 'danger' | 'warning'

export interface CurrencyDisplayProps {
  amount: number
  currency?: string
  locale?: string
  showSymbol?: boolean
  showIcon?: boolean
  precision?: number
  colorize?: boolean
  variant?: CurrencyVariant
  theme?: CurrencyTheme
  prefix?: string
  suffix?: string
  className?: string
}

export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({
  amount,
  currency = 'USD',
  locale = 'en-US',
  showSymbol = true,
  showIcon = false,
  precision = 2,
  colorize = false,
  variant = 'default',
  theme: themeOverride,
  prefix,
  suffix,
  className,
}) => {
  const { token } = useToken()
  const isNegative = amount < 0
  const absoluteAmount = Math.abs(amount)

  const formatCurrency = () => {
    if (showSymbol) {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: precision,
        maximumFractionDigits: precision,
      }).format(absoluteAmount)
    }

    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
    }).format(absoluteAmount)
  }

  const getCurrencyIcon = () => {
    if (!showIcon) return null

    switch (currency.toUpperCase()) {
      case 'USD':
        return <DollarOutlined className='currency-icon' />
      case 'EUR':
        return <EuroOutlined className='currency-icon' />
      case 'GBP':
        return <PoundOutlined className='currency-icon' />
      default:
        return <DollarOutlined className='currency-icon' />
    }
  }

  const getThemeColor = () => {
    if (themeOverride) {
      switch (themeOverride) {
        case 'success':
          return token.colorSuccess
        case 'danger':
          return token.colorError
        case 'warning':
          return token.colorWarning
        default:
          return undefined
      }
    }

    if (!colorize) return undefined
    if (amount > 0) return 'success'
    if (amount < 0) return 'danger'
    return undefined
  }

  const formattedAmount = formatCurrency()
  const displayAmount = isNegative ? `-${formattedAmount}` : formattedAmount

  const getContainerStyle = (): CSSProperties => {
    const baseStyle: CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      gap: variant === 'compact' ? '2px' : '4px',
      fontVariantNumeric: 'tabular-nums',
      fontWeight: variant === 'large' ? 600 : 500,
    }

    if (colorize || themeOverride) {
      baseStyle.color = isNegative ? token.colorError : token.colorSuccess
    }

    return baseStyle
  }

  const getIconStyle = (): CSSProperties => ({
    fontSize: {
      compact: '10px',
      large: '16px',
      default: '12px',
    }[variant],
    opacity: 0.7,
  })

  const getAmountStyle = (): CSSProperties => ({
    fontSize: {
      compact: '12px',
      large: '18px',
      default: '14px',
    }[variant],
  })

  return (
    <span style={getContainerStyle()}>
      {prefix && <span style={{ marginRight: 2 }}>{prefix}</span>}
      {getCurrencyIcon() && (
        <span style={getIconStyle()}>{getCurrencyIcon()}</span>
      )}
      <Text
        type={getThemeColor() as 'success' | 'danger' | 'warning' | undefined}
        style={getAmountStyle()}
        className={className}
      >
        {displayAmount}
      </Text>
      {suffix && <span style={{ marginLeft: 2 }}>{suffix}</span>}
    </span>
  )
}
