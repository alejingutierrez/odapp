// Application constants
export const APP_NAME = 'Oda Fashion Platform'
export const APP_VERSION = '1.0.0'

// API Constants
export const API_ROUTES = {
  AUTH: '/auth',
  PRODUCTS: '/products',
  INVENTORY: '/inventory',
  ORDERS: '/orders',
  CUSTOMERS: '/customers',
  SHOPIFY: '/shopify',
} as const

// Status Constants
export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const

export const PRODUCT_STATUS = {
  ACTIVE: 'active',
  DRAFT: 'draft',
  ARCHIVED: 'archived',
} as const
