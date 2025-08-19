// Core entity types
export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  permissions: Permission[]
  createdAt: Date
  updatedAt: Date
}

export interface Product {
  id: string
  name: string
  description: string
  status: ProductStatus
  category: string
  variants: ProductVariant[]
  images: ProductImage[]
  createdAt: Date
  updatedAt: Date
}

export interface ProductVariant {
  id: string
  productId: string
  sku: string
  size: string
  color: string
  material?: string
  price: number
  compareAtPrice?: number
  inventory: number
  createdAt: Date
  updatedAt: Date
}

export interface ProductImage {
  id: string
  productId: string
  url: string
  alt: string
  position: number
  createdAt: Date
}

export interface Customer {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  addresses: Address[]
  orders: Order[]
  createdAt: Date
  updatedAt: Date
}

export interface Address {
  id: string
  customerId: string
  type: AddressType
  street: string
  city: string
  state: string
  country: string
  zipCode: string
  isDefault: boolean
}

export interface Order {
  id: string
  customerId: string
  status: OrderStatus
  items: OrderItem[]
  subtotal: number
  tax: number
  shipping: number
  total: number
  shippingAddress: Address
  billingAddress: Address
  createdAt: Date
  updatedAt: Date
}

export interface OrderItem {
  id: string
  orderId: string
  productVariantId: string
  quantity: number
  price: number
  total: number
}

// Enums
export type UserRole = 'admin' | 'manager' | 'employee'
export type Permission =
  | 'products:read'
  | 'products:write'
  | 'orders:read'
  | 'orders:write'
  | 'customers:read'
  | 'customers:write'
export type ProductStatus = 'active' | 'draft' | 'archived'
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
export type AddressType = 'shipping' | 'billing'
