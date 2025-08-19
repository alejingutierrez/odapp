import { z } from 'zod'

// Email validation
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Phone validation
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s-()]+$/
  return phoneRegex.test(phone)
}

// Password validation
export const isValidPassword = (password: string): boolean => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/
  return passwordRegex.test(password)
}

// URL validation
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// SKU validation
export const isValidSku = (sku: string): boolean => {
  // Alphanumeric with hyphens and underscores, 3-50 characters
  const skuRegex = /^[A-Za-z0-9_-]{3,50}$/
  return skuRegex.test(sku)
}

// Zod schemas for validation
export const emailSchema = z.string().email('Invalid email format')
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain at least one uppercase letter, one lowercase letter, and one number'
  )

export const phoneSchema = z
  .string()
  .regex(/^\+?[\d\s-()]+$/, 'Invalid phone number format')

export const skuSchema = z
  .string()
  .regex(/^[A-Za-z0-9_-]{3,50}$/, 'SKU must be 3-50 alphanumeric characters')

export const priceSchema = z
  .number()
  .positive('Price must be positive')
  .max(999999.99, 'Price too high')

export const quantitySchema = z
  .number()
  .int('Quantity must be an integer')
  .min(0, 'Quantity cannot be negative')
