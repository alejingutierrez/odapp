import dayjs from 'dayjs'

// Currency formatting
export const formatCurrency = (
  amount: number,
  currency = 'USD',
  locale = 'en-US'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount)
}

// Date formatting
export const formatDate = (
  date: Date | string,
  format = 'YYYY-MM-DD'
): string => {
  return dayjs(date).format(format)
}

export const formatDateTime = (date: Date | string): string => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

export const formatRelativeTime = (date: Date | string): string => {
  // Note: fromNow() requires dayjs/plugin/relativeTime plugin
  // For now, return a simple format
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

// Number formatting
export const formatNumber = (num: number, locale = 'en-US'): string => {
  return new Intl.NumberFormat(locale).format(num)
}

export const formatPercentage = (
  value: number,
  decimals = 2,
  locale = 'en-US'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100)
}

// Text formatting
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

export const capitalizeFirst = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

export const capitalizeWords = (text: string): string => {
  return text.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  )
}
