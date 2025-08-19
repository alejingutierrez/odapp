import React, { useState, useEffect } from 'react'
import { Input, InputProps, Select } from 'antd'
import './CurrencyInput.css'

const { Option } = Select

export interface Currency {
  code: string
  symbol: string
  name: string
  position: 'before' | 'after'
}

export interface CurrencyInputProps
  extends Omit<
    InputProps,
    'value' | 'onChange' | 'addonBefore' | 'addonAfter'
  > {
  /** Current value as number */
  value?: number
  /** Change handler */
  onChange?: (value: number | undefined, currency: string) => void
  /** Selected currency */
  currency?: string
  /** Available currencies */
  currencies?: Currency[]
  /** Whether to allow currency selection */
  allowCurrencyChange?: boolean
  /** Locale for number formatting */
  locale?: string
  /** Number of decimal places */
  precision?: number
  /** Minimum value */
  min?: number
  /** Maximum value */
  max?: number
  /** Whether to show thousands separator */
  showThousandsSeparator?: boolean
  /** Custom currency symbol position */
  symbolPosition?: 'before' | 'after'
  /** Whether to validate on blur */
  validateOnBlur?: boolean
  /** Custom validation function */
  validator?: (value: number) => string | undefined
}

const DEFAULT_CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', position: 'before' },
  { code: 'EUR', symbol: '€', name: 'Euro', position: 'after' },
  { code: 'GBP', symbol: '£', name: 'British Pound', position: 'before' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', position: 'before' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', position: 'before' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', position: 'before' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', position: 'before' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', position: 'before' },
]

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  currency = 'USD',
  currencies = DEFAULT_CURRENCIES,
  allowCurrencyChange = false,
  locale = 'en-US',
  precision = 2,
  min,
  max,
  showThousandsSeparator = true,
  symbolPosition,
  validateOnBlur = true,
  validator,
  className = '',
  ...props
}) => {
  const [displayValue, setDisplayValue] = useState('')
  const [error, setError] = useState<string>()

  const currentCurrency =
    currencies.find((c) => c.code === currency) || currencies[0]
  const effectiveSymbolPosition = symbolPosition || currentCurrency.position

  useEffect(() => {
    if (value !== undefined && value !== null) {
      setDisplayValue(formatDisplayValue(value))
    } else {
      setDisplayValue('')
    }
  }, [value, locale, precision, showThousandsSeparator])

  const formatDisplayValue = (num: number): string => {
    if (isNaN(num)) return ''

    const options: Intl.NumberFormatOptions = {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
      useGrouping: showThousandsSeparator,
    }

    try {
      return new Intl.NumberFormat(locale, options).format(num)
    } catch {
      return num.toFixed(precision)
    }
  }

  const parseInputValue = (input: string): number | undefined => {
    if (!input.trim()) return undefined

    // Remove currency symbols and spaces
    let cleanInput = input
      .replace(new RegExp(`\\${currentCurrency.symbol}`, 'g'), '')
      .replace(/\s/g, '')

    // Handle different decimal separators based on locale
    if (locale.includes('de') || locale.includes('fr')) {
      // European format: 1.234,56
      cleanInput = cleanInput.replace(/\./g, '').replace(',', '.')
    } else {
      // US format: 1,234.56
      cleanInput = cleanInput.replace(/,/g, '')
    }

    const parsed = parseFloat(cleanInput)
    return isNaN(parsed) ? undefined : parsed
  }

  const validateValue = (val: number | undefined): string | undefined => {
    if (val === undefined) return undefined

    if (min !== undefined && val < min) {
      return `Value must be at least ${formatDisplayValue(min)}`
    }

    if (max !== undefined && val > max) {
      return `Value must be at most ${formatDisplayValue(max)}`
    }

    if (validator) {
      return validator(val)
    }

    return undefined
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    setDisplayValue(inputValue)

    const parsedValue = parseInputValue(inputValue)
    const validationError = validateValue(parsedValue)

    setError(validationError)

    if (onChange) {
      onChange(parsedValue, currency)
    }
  }

  const handleBlur = () => {
    if (validateOnBlur && value !== undefined) {
      setDisplayValue(formatDisplayValue(value))
    }
  }

  const handleCurrencyChange = (newCurrency: string) => {
    if (onChange) {
      onChange(value, newCurrency)
    }
  }

  const currencyClasses = [
    'oda-currency-input',
    `oda-currency-input--${effectiveSymbolPosition}`,
    allowCurrencyChange && 'oda-currency-input--changeable',
    error && 'oda-currency-input--error',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const renderCurrencySymbol = () => {
    if (allowCurrencyChange) {
      return (
        <Select
          value={currency}
          onChange={handleCurrencyChange}
          className='oda-currency-input__selector'
          size={props.size}
        >
          {currencies.map((curr) => (
            <Option key={curr.code} value={curr.code}>
              {curr.symbol} {curr.code}
            </Option>
          ))}
        </Select>
      )
    }

    return (
      <span className='oda-currency-input__symbol'>
        {currentCurrency.symbol}
      </span>
    )
  }

  const inputProps = {
    ...props,
    value: displayValue,
    onChange: handleInputChange,
    onBlur: handleBlur,
    status: error ? ('error' as const) : undefined,
    className: 'oda-currency-input__field',
  }

  if (effectiveSymbolPosition === 'before') {
    return (
      <div className={currencyClasses}>
        <Input {...inputProps} addonBefore={renderCurrencySymbol()} />
        {error && <div className='oda-currency-input__error'>{error}</div>}
      </div>
    )
  }

  return (
    <div className={currencyClasses}>
      <Input {...inputProps} addonAfter={renderCurrencySymbol()} />
      {error && <div className='oda-currency-input__error'>{error}</div>}
    </div>
  )
}

CurrencyInput.displayName = 'CurrencyInput'
