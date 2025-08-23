import { z } from 'zod'
import {
  uuidSchema,
  emailSchema,
  phoneSchema,
  currencySchema,
  sanitizeString,
  searchSchema,
  dateRangeSchema,
} from './common.js'
import { customerAddressSchema } from './customer.js'

// Order status enums
export const orderStatusSchema = z.enum([
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
  'partially_refunded',
])

export const paymentStatusSchema = z.enum([
  'pending',
  'authorized',
  'paid',
  'partially_paid',
  'refunded',
  'partially_refunded',
  'voided',
  'failed',
])

export const fulfillmentStatusSchema = z.enum([
  'unfulfilled',
  'partial',
  'fulfilled',
  'restocked',
])

// Order line item schema
export const orderLineItemSchema = z.object({
  id: uuidSchema.optional(),
  productId: uuidSchema,
  variantId: uuidSchema,
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  price: z.number().min(0, 'Price must be non-negative'),
  compareAtPrice: z
    .number()
    .min(0, 'Compare at price must be non-negative')
    .optional(),
  totalDiscount: z
    .number()
    .min(0, 'Total discount must be non-negative')
    .default(0),
  title: z
    .string()
    .min(1, 'Product title is required')
    .max(255, 'Title must be less than 255 characters'),
  variantTitle: z
    .string()
    .max(255, 'Variant title must be less than 255 characters')
    .optional(),
  sku: z.string().max(50, 'SKU must be less than 50 characters').optional(),
  weight: z.number().min(0, 'Weight must be non-negative').optional(),
  requiresShipping: z.boolean().default(true),
  taxable: z.boolean().default(true),
  taxLines: z
    .array(
      z.object({
        title: z.string(),
        rate: z.number().min(0).max(1),
        price: z.number().min(0),
      })
    )
    .default([]),
  properties: z.record(z.string()).optional(),
})

// Order discount schema
export const orderDiscountSchema = z.object({
  id: uuidSchema.optional(),
  code: z
    .string()
    .max(50, 'Discount code must be less than 50 characters')
    .optional(),
  type: z.enum(['percentage', 'fixed_amount', 'shipping']),
  value: z.number().min(0, 'Discount value must be non-negative'),
  amount: z.number().min(0, 'Discount amount must be non-negative'),
  title: z.string().max(255, 'Discount title must be less than 255 characters'),
})

// Order shipping line schema
export const orderShippingLineSchema = z.object({
  id: uuidSchema.optional(),
  title: z
    .string()
    .min(1, 'Shipping title is required')
    .max(255, 'Title must be less than 255 characters'),
  price: z.number().min(0, 'Shipping price must be non-negative'),
  code: z
    .string()
    .max(50, 'Shipping code must be less than 50 characters')
    .optional(),
  carrier: z
    .string()
    .max(100, 'Carrier must be less than 100 characters')
    .optional(),
  requestedFulfillmentServiceId: z.string().optional(),
  taxLines: z
    .array(
      z.object({
        title: z.string(),
        rate: z.number().min(0).max(1),
        price: z.number().min(0),
      })
    )
    .default([]),
})

// Order payment schema
export const orderPaymentSchema = z.object({
  id: uuidSchema.optional(),
  status: paymentStatusSchema,
  gateway: z
    .string()
    .max(50, 'Payment gateway must be less than 50 characters'),
  amount: z.number().min(0, 'Payment amount must be non-negative'),
  currency: currencySchema,
  transactionId: z
    .string()
    .max(255, 'Transaction ID must be less than 255 characters')
    .optional(),
  authorizationCode: z
    .string()
    .max(255, 'Authorization code must be less than 255 characters')
    .optional(),
  avsResultCode: z
    .string()
    .max(10, 'AVS result code must be less than 10 characters')
    .optional(),
  cvvResultCode: z
    .string()
    .max(10, 'CVV result code must be less than 10 characters')
    .optional(),
  processedAt: z.string().datetime().optional(),
  createdAt: z.string().datetime().optional(),
})

// Order fulfillment schema
export const orderFulfillmentSchema = z.object({
  id: uuidSchema.optional(),
  status: fulfillmentStatusSchema,
  trackingCompany: z
    .string()
    .max(100, 'Tracking company must be less than 100 characters')
    .optional(),
  trackingNumber: z
    .string()
    .max(255, 'Tracking number must be less than 255 characters')
    .optional(),
  trackingUrl: z.string().url('Invalid tracking URL').optional(),
  lineItems: z.array(
    z.object({
      lineItemId: uuidSchema,
      quantity: z.number().int().min(1),
    })
  ),
  notifyCustomer: z.boolean().default(true),
  locationId: uuidSchema.optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  shippedAt: z.string().datetime().optional(),
  deliveredAt: z.string().datetime().optional(),
})

// Order refund schema
export const orderRefundSchema = z.object({
  id: uuidSchema.optional(),
  amount: z.number().min(0, 'Refund amount must be non-negative'),
  currency: currencySchema,
  reason: z.enum(['duplicate', 'fraudulent', 'requested_by_customer', 'other']),
  note: z
    .string()
    .max(1000, 'Refund note must be less than 1000 characters')
    .optional(),
  refundLineItems: z.array(
    z.object({
      lineItemId: uuidSchema,
      quantity: z.number().int().min(1),
      restockType: z
        .enum(['no_restock', 'cancel', 'return'])
        .default('no_restock'),
    })
  ),
  transactions: z.array(
    z.object({
      amount: z.number().min(0),
      gateway: z.string(),
      kind: z.enum(['refund', 'void']),
      status: z.enum(['success', 'failure', 'error']),
      transactionId: z.string().optional(),
    })
  ),
  processedAt: z.string().datetime().optional(),
  createdAt: z.string().datetime().optional(),
})

// Main order schema
export const orderSchema = z.object({
  id: uuidSchema.optional(),
  orderNumber: z
    .string()
    .max(50, 'Order number must be less than 50 characters')
    .optional(),
  customerId: uuidSchema.optional(),
  email: emailSchema,
  phone: phoneSchema.optional(),
  status: orderStatusSchema.default('pending'),
  paymentStatus: paymentStatusSchema.default('pending'),
  fulfillmentStatus: fulfillmentStatusSchema.default('unfulfilled'),

  // Customer information
  customerInfo: z.object({
    firstName: z
      .string()
      .min(1, 'First name is required')
      .max(50, 'First name must be less than 50 characters')
      .transform(sanitizeString),
    lastName: z
      .string()
      .min(1, 'Last name is required')
      .max(50, 'Last name must be less than 50 characters')
      .transform(sanitizeString),
    email: emailSchema,
    phone: phoneSchema.optional(),
  }),

  // Addresses
  billingAddress: customerAddressSchema,
  shippingAddress: customerAddressSchema,

  // Order items and pricing
  lineItems: z
    .array(orderLineItemSchema)
    .min(1, 'At least one line item is required'),
  discounts: z.array(orderDiscountSchema).default([]),
  shippingLines: z.array(orderShippingLineSchema).default([]),
  taxLines: z
    .array(
      z.object({
        title: z.string(),
        rate: z.number().min(0).max(1),
        price: z.number().min(0),
      })
    )
    .default([]),

  // Totals
  subtotalPrice: z.number().min(0, 'Subtotal must be non-negative'),
  totalTax: z.number().min(0, 'Total tax must be non-negative').default(0),
  totalDiscounts: z
    .number()
    .min(0, 'Total discounts must be non-negative')
    .default(0),
  totalShipping: z
    .number()
    .min(0, 'Total shipping must be non-negative')
    .default(0),
  totalPrice: z.number().min(0, 'Total price must be non-negative'),
  currency: currencySchema.default('USD'),

  // Additional information
  note: z
    .string()
    .max(2000, 'Order note must be less than 2000 characters')
    .optional(),
  tags: z
    .array(z.string().max(50, 'Tag must be less than 50 characters'))
    .max(20, 'Maximum 20 tags allowed')
    .default([]),
  source: z
    .string()
    .max(50, 'Source must be less than 50 characters')
    .default('web'),
  referringSite: z.string().url('Invalid referring site URL').optional(),
  landingSite: z.string().url('Invalid landing site URL').optional(),

  // Payments and fulfillments
  payments: z.array(orderPaymentSchema).default([]),
  fulfillments: z.array(orderFulfillmentSchema).default([]),
  refunds: z.array(orderRefundSchema).default([]),

  // Integration fields
  shopifyOrderId: z.string().optional(),
  shopifyOrderNumber: z.string().optional(),

  // Timestamps
  processedAt: z.string().datetime().optional(),
  cancelledAt: z.string().datetime().optional(),
  closedAt: z.string().datetime().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
})

// Order creation schema
export const createOrderSchema = orderSchema.omit({
  id: true,
  orderNumber: true,
  createdAt: true,
  updatedAt: true,
  processedAt: true,
  cancelledAt: true,
  closedAt: true,
  payments: true,
  fulfillments: true,
  refunds: true,
})

// Order update schema
export const updateOrderSchema = orderSchema.partial().extend({
  id: uuidSchema,
})

// Order query schemas
export const orderQuerySchema = searchSchema.extend({
  status: orderStatusSchema.optional(),
  paymentStatus: paymentStatusSchema.optional(),
  fulfillmentStatus: fulfillmentStatusSchema.optional(),
  customerId: uuidSchema.optional(),
  email: emailSchema.optional(),
  orderNumber: z.string().optional(),
  source: z.string().optional(),
  tags: z.array(z.string()).optional(),
  totalMin: z.coerce.number().min(0).optional(),
  totalMax: z.coerce.number().min(0).optional(),
  createdDateRange: dateRangeSchema.optional(),
  processedDateRange: dateRangeSchema.optional(),
})

// Order analytics schema
export const orderAnalyticsSchema = z.object({
  dateRange: dateRangeSchema.optional(),
  groupBy: z.enum(['day', 'week', 'month', 'quarter', 'year']).default('month'),
  metrics: z
    .array(
      z.enum([
        'total_orders',
        'total_sales',
        'average_order_value',
        'conversion_rate',
        'refund_rate',
        'fulfillment_rate',
      ])
    )
    .min(1, 'At least one metric is required'),
  segmentBy: z
    .enum(['status', 'source', 'customer_type', 'product_category'])
    .optional(),
})

// Bulk order operations
export const bulkOrderUpdateSchema = z.object({
  orderIds: z.array(uuidSchema).min(1, 'At least one order ID is required'),
  updates: z.object({
    status: orderStatusSchema.optional(),
    tags: z.array(z.string()).optional(),
    note: z.string().max(2000).optional(),
  }),
})

// Order fulfillment operations
export const createFulfillmentSchema = orderFulfillmentSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  shippedAt: true,
  deliveredAt: true,
})

export const updateFulfillmentSchema = orderFulfillmentSchema.partial().extend({
  id: uuidSchema,
})

// Order refund operations
export const createRefundSchema = orderRefundSchema.omit({
  id: true,
  processedAt: true,
  createdAt: true,
})

// Type exports
export type OrderStatus = z.infer<typeof orderStatusSchema>
export type PaymentStatus = z.infer<typeof paymentStatusSchema>
export type FulfillmentStatus = z.infer<typeof fulfillmentStatusSchema>
export type OrderLineItem = z.infer<typeof orderLineItemSchema>
export type OrderDiscount = z.infer<typeof orderDiscountSchema>
export type OrderShippingLine = z.infer<typeof orderShippingLineSchema>
export type OrderPayment = z.infer<typeof orderPaymentSchema>
export type OrderFulfillment = z.infer<typeof orderFulfillmentSchema>
export type OrderRefund = z.infer<typeof orderRefundSchema>
export type Order = z.infer<typeof orderSchema>
export type CreateOrder = z.infer<typeof createOrderSchema>
export type UpdateOrder = z.infer<typeof updateOrderSchema>
export type OrderQuery = z.infer<typeof orderQuerySchema>
export type OrderAnalytics = z.infer<typeof orderAnalyticsSchema>
export type BulkOrderUpdate = z.infer<typeof bulkOrderUpdateSchema>
export type CreateFulfillment = z.infer<typeof createFulfillmentSchema>
export type UpdateFulfillment = z.infer<typeof updateFulfillmentSchema>
export type CreateRefund = z.infer<typeof createRefundSchema>
