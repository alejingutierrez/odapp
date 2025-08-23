import { z } from 'zod'
import {
  uuidSchema,
  emailSchema,
  phoneSchema,
  sanitizeString,
  searchSchema,
  dateRangeSchema,
} from './common.js'

// Customer status enum
export const customerStatusSchema = z.enum(['active', 'inactive', 'blocked'])

// Customer address schema
export const customerAddressSchema = z.object({
  id: uuidSchema.optional(),
  type: z.enum(['billing', 'shipping', 'both']).default('both'),
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
  company: z
    .string()
    .max(100, 'Company must be less than 100 characters')
    .optional()
    .transform((val) => (val ? sanitizeString(val) : val)),
  address1: z
    .string()
    .min(1, 'Address line 1 is required')
    .max(255, 'Address line 1 must be less than 255 characters')
    .transform(sanitizeString),
  address2: z
    .string()
    .max(255, 'Address line 2 must be less than 255 characters')
    .optional()
    .transform((val) => (val ? sanitizeString(val) : val)),
  city: z
    .string()
    .min(1, 'City is required')
    .max(100, 'City must be less than 100 characters')
    .transform(sanitizeString),
  province: z
    .string()
    .max(100, 'Province must be less than 100 characters')
    .optional()
    .transform((val) => (val ? sanitizeString(val) : val)),
  country: z
    .string()
    .min(2, 'Country is required')
    .max(2, 'Country must be 2 characters')
    .regex(/^[A-Z]{2}$/, 'Country must be 2 uppercase letters'),
  zip: z
    .string()
    .min(1, 'ZIP code is required')
    .max(20, 'ZIP code must be less than 20 characters'),
  phone: phoneSchema.optional(),
  isDefault: z.boolean().default(false),
})

// Customer preferences schema
export const customerPreferencesSchema = z.object({
  language: z
    .string()
    .regex(/^[a-z]{2}(-[A-Z]{2})?$/, 'Invalid language format')
    .default('en'),
  currency: z
    .string()
    .regex(/^[A-Z]{3}$/, 'Invalid currency code')
    .default('USD'),
  timezone: z.string().default('UTC'),
  emailMarketing: z.boolean().default(true),
  smsMarketing: z.boolean().default(false),
  pushNotifications: z.boolean().default(true),
  newsletter: z.boolean().default(true),
})

// Customer segment schema
export const customerSegmentSchema = z.object({
  id: uuidSchema.optional(),
  name: z
    .string()
    .min(1, 'Segment name is required')
    .max(100, 'Segment name must be less than 100 characters'),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  conditions: z
    .array(
      z.object({
        field: z.string(),
        operator: z.enum([
          'equals',
          'not_equals',
          'greater_than',
          'less_than',
          'contains',
          'not_contains',
          'in',
          'not_in',
        ]),
        value: z.union([z.string(), z.number(), z.array(z.string())]),
      })
    )
    .min(1, 'At least one condition is required'),
  isActive: z.boolean().default(true),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
})

// Customer loyalty schema
export const customerLoyaltySchema = z.object({
  points: z.number().int().min(0, 'Points must be non-negative').default(0),
  tier: z.enum(['bronze', 'silver', 'gold', 'platinum']).default('bronze'),
  totalSpent: z.number().min(0, 'Total spent must be non-negative').default(0),
  totalOrders: z
    .number()
    .int()
    .min(0, 'Total orders must be non-negative')
    .default(0),
  averageOrderValue: z
    .number()
    .min(0, 'Average order value must be non-negative')
    .default(0),
  lastOrderDate: z.string().datetime().optional(),
  lifetimeValue: z
    .number()
    .min(0, 'Lifetime value must be non-negative')
    .default(0),
})

// Customer communication schema
export const customerCommunicationSchema = z.object({
  id: uuidSchema.optional(),
  type: z.enum(['email', 'sms', 'phone', 'chat', 'note']),
  direction: z.enum(['inbound', 'outbound']),
  subject: z
    .string()
    .max(255, 'Subject must be less than 255 characters')
    .optional(),
  content: z
    .string()
    .min(1, 'Content is required')
    .max(5000, 'Content must be less than 5000 characters'),
  status: z.enum(['sent', 'delivered', 'read', 'failed']).optional(),
  userId: uuidSchema.optional(), // User who created the communication
  createdAt: z.string().datetime().optional(),
})

// Main customer schema
export const customerSchema = z.object({
  id: uuidSchema.optional(),
  email: emailSchema,
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
  phone: phoneSchema.optional(),
  dateOfBirth: z.string().date().optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
  status: customerStatusSchema.default('active'),
  addresses: z
    .array(customerAddressSchema)
    .max(10, 'Maximum 10 addresses allowed')
    .default([]),
  preferences: customerPreferencesSchema.default({}),
  loyalty: customerLoyaltySchema.default({}),
  segmentIds: z
    .array(uuidSchema)
    .max(20, 'Maximum 20 segments allowed')
    .default([]),
  tags: z
    .array(z.string().max(50, 'Tag must be less than 50 characters'))
    .max(20, 'Maximum 20 tags allowed')
    .default([]),
  notes: z
    .string()
    .max(2000, 'Notes must be less than 2000 characters')
    .optional(),
  metafields: z.record(z.any()).optional(),
  acceptsMarketing: z.boolean().default(true),
  acceptsSmsMarketing: z.boolean().default(false),
  taxExempt: z.boolean().default(false),
  verifiedEmail: z.boolean().default(false),
  shopifyCustomerId: z.string().optional(), // For Shopify integration
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  lastOrderAt: z.string().datetime().optional(),
})

// Customer creation schema
export const createCustomerSchema = customerSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastOrderAt: true,
  loyalty: true, // Loyalty is calculated, not set directly
})

// Customer update schema
export const updateCustomerSchema = customerSchema.partial().extend({
  id: uuidSchema,
})

// Customer query schemas
export const customerQuerySchema = searchSchema.extend({
  status: customerStatusSchema.optional(),
  segmentId: uuidSchema.optional(),
  tags: z.array(z.string()).optional(),
  country: z.string().length(2).optional(),
  acceptsMarketing: z.coerce.boolean().optional(),
  verifiedEmail: z.coerce.boolean().optional(),
  hasOrders: z.coerce.boolean().optional(),
  totalSpentMin: z.coerce.number().min(0).optional(),
  totalSpentMax: z.coerce.number().min(0).optional(),
  lastOrderDateRange: dateRangeSchema.optional(),
  createdDateRange: dateRangeSchema.optional(),
})

// Customer analytics schema
export const customerAnalyticsSchema = z.object({
  dateRange: dateRangeSchema.optional(),
  segmentId: uuidSchema.optional(),
  groupBy: z.enum(['day', 'week', 'month', 'quarter', 'year']).default('month'),
  metrics: z
    .array(
      z.enum([
        'total_customers',
        'new_customers',
        'returning_customers',
        'average_order_value',
        'customer_lifetime_value',
        'churn_rate',
        'retention_rate',
      ])
    )
    .min(1, 'At least one metric is required'),
})

// Bulk customer operations
export const bulkCustomerUpdateSchema = z.object({
  customerIds: z
    .array(uuidSchema)
    .min(1, 'At least one customer ID is required'),
  updates: z.object({
    status: customerStatusSchema.optional(),
    segmentIds: z.array(uuidSchema).optional(),
    tags: z.array(z.string()).optional(),
    acceptsMarketing: z.boolean().optional(),
    acceptsSmsMarketing: z.boolean().optional(),
  }),
})

export const bulkCustomerDeleteSchema = z.object({
  customerIds: z
    .array(uuidSchema)
    .min(1, 'At least one customer ID is required'),
})

// Customer import/export schemas
export const customerImportSchema = z.object({
  customers: z.array(createCustomerSchema),
  options: z
    .object({
      updateExisting: z.boolean().default(false),
      skipInvalid: z.boolean().default(true),
      sendWelcomeEmail: z.boolean().default(false),
    })
    .optional(),
})

export const customerExportSchema = z.object({
  format: z.enum(['csv', 'json', 'xlsx']).default('csv'),
  filters: customerQuerySchema.omit({ page: true, limit: true }).optional(),
  fields: z.array(z.string()).optional(),
  includeAddresses: z.boolean().default(true),
  includeLoyalty: z.boolean().default(true),
})

// Type exports
export type CustomerStatus = z.infer<typeof customerStatusSchema>
export type CustomerAddress = z.infer<typeof customerAddressSchema>
export type CustomerPreferences = z.infer<typeof customerPreferencesSchema>
export type CustomerSegment = z.infer<typeof customerSegmentSchema>
export type CustomerLoyalty = z.infer<typeof customerLoyaltySchema>
export type CustomerCommunication = z.infer<typeof customerCommunicationSchema>
export type Customer = z.infer<typeof customerSchema>
export type CreateCustomer = z.infer<typeof createCustomerSchema>
export type UpdateCustomer = z.infer<typeof updateCustomerSchema>
export type CustomerQuery = z.infer<typeof customerQuerySchema>
export type CustomerAnalytics = z.infer<typeof customerAnalyticsSchema>
export type BulkCustomerUpdate = z.infer<typeof bulkCustomerUpdateSchema>
export type BulkCustomerDelete = z.infer<typeof bulkCustomerDeleteSchema>
export type CustomerImport = z.infer<typeof customerImportSchema>
export type CustomerExport = z.infer<typeof customerExportSchema>
