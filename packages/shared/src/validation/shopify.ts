import { z } from 'zod'
import { 
  uuidSchema, 
  emailSchema, 
  phoneSchema,
  urlSchema,
  sanitizeString,
  paginationSchema
} from './common.js'

// Shopify webhook event types
export const shopifyWebhookTopicSchema = z.enum([
  'orders/create',
  'orders/updated',
  'orders/paid',
  'orders/cancelled',
  'orders/fulfilled',
  'orders/partially_fulfilled',
  'orders/refunded',
  'products/create',
  'products/update',
  'products/delete',
  'inventory_levels/update',
  'customers/create',
  'customers/update',
  'customers/delete',
  'app/uninstalled',
])

// Shopify sync status
export const shopifySyncStatusSchema = z.enum([
  'idle',
  'syncing',
  'completed',
  'failed',
  'paused'
])

// Shopify sync direction
export const shopifySyncDirectionSchema = z.enum([
  'to_shopify',
  'from_shopify',
  'bidirectional'
])

// Shopify product sync schema
export const shopifyProductSyncSchema = z.object({
  id: uuidSchema.optional(),
  localProductId: uuidSchema,
  shopifyProductId: z.string(),
  shopifyHandle: z.string(),
  lastSyncAt: z.string().datetime().optional(),
  syncStatus: shopifySyncStatusSchema.default('idle'),
  syncDirection: shopifySyncDirectionSchema.default('bidirectional'),
  conflictResolution: z.enum(['local_wins', 'shopify_wins', 'manual']).default('manual'),
  errors: z.array(z.string()).default([]),
  metadata: z.record(z.any()).optional(),
})

// Shopify inventory sync schema
export const shopifyInventorySyncSchema = z.object({
  id: uuidSchema.optional(),
  localVariantId: uuidSchema,
  shopifyVariantId: z.string(),
  shopifyInventoryItemId: z.string(),
  shopifyLocationId: z.string(),
  lastSyncAt: z.string().datetime().optional(),
  syncStatus: shopifySyncStatusSchema.default('idle'),
  localQuantity: z.number().int().min(0),
  shopifyQuantity: z.number().int().min(0),
  conflictResolution: z.enum(['local_wins', 'shopify_wins', 'manual']).default('manual'),
  errors: z.array(z.string()).default([]),
})

// Shopify order sync schema
export const shopifyOrderSyncSchema = z.object({
  id: uuidSchema.optional(),
  localOrderId: uuidSchema.optional(),
  shopifyOrderId: z.string(),
  shopifyOrderNumber: z.string(),
  lastSyncAt: z.string().datetime().optional(),
  syncStatus: shopifySyncStatusSchema.default('idle'),
  importStatus: z.enum(['pending', 'imported', 'failed', 'skipped']).default('pending'),
  errors: z.array(z.string()).default([]),
  metadata: z.record(z.any()).optional(),
})

// Shopify customer sync schema
export const shopifyCustomerSyncSchema = z.object({
  id: uuidSchema.optional(),
  localCustomerId: uuidSchema.optional(),
  shopifyCustomerId: z.string(),
  lastSyncAt: z.string().datetime().optional(),
  syncStatus: shopifySyncStatusSchema.default('idle'),
  syncDirection: shopifySyncDirectionSchema.default('from_shopify'),
  conflictResolution: z.enum(['local_wins', 'shopify_wins', 'manual']).default('shopify_wins'),
  errors: z.array(z.string()).default([]),
  metadata: z.record(z.any()).optional(),
})

// Shopify webhook schema
export const shopifyWebhookSchema = z.object({
  id: uuidSchema.optional(),
  topic: shopifyWebhookTopicSchema,
  shopId: z.string(),
  payload: z.record(z.any()),
  headers: z.record(z.string()),
  verified: z.boolean().default(false),
  processed: z.boolean().default(false),
  processedAt: z.string().datetime().optional(),
  errors: z.array(z.string()).default([]),
  retryCount: z.number().int().min(0).default(0),
  createdAt: z.string().datetime().optional(),
})

// Shopify API configuration schema
export const shopifyConfigSchema = z.object({
  shopDomain: z.string().regex(/^[a-zA-Z0-9-]+\.myshopify\.com$/, 'Invalid Shopify domain format'),
  accessToken: z.string().min(1, 'Access token is required'),
  apiVersion: z.string().regex(/^\d{4}-\d{2}$/, 'Invalid API version format (YYYY-MM)').default('2024-01'),
  webhookSecret: z.string().min(1, 'Webhook secret is required'),
  scopes: z.array(z.string()).default([
    'read_products',
    'write_products',
    'read_inventory',
    'write_inventory',
    'read_orders',
    'read_customers',
    'write_customers'
  ]),
  isActive: z.boolean().default(true),
  rateLimitSettings: z.object({
    maxRequestsPerSecond: z.number().min(1).max(10).default(2),
    burstLimit: z.number().min(1).max(40).default(40),
    retryDelay: z.number().min(1000).max(60000).default(1000),
    maxRetries: z.number().min(1).max(5).default(3),
  }).default({}),
})

// Shopify sync configuration schema
export const shopifySyncConfigSchema = z.object({
  products: z.object({
    enabled: z.boolean().default(true),
    direction: shopifySyncDirectionSchema.default('bidirectional'),
    autoSync: z.boolean().default(true),
    syncInterval: z.number().min(300).max(86400).default(3600), // 5 minutes to 24 hours
    conflictResolution: z.enum(['local_wins', 'shopify_wins', 'manual']).default('manual'),
    fieldsToSync: z.array(z.string()).default([
      'title', 'description', 'vendor', 'product_type', 'tags', 'images', 'variants'
    ]),
  }).default({}),
  inventory: z.object({
    enabled: z.boolean().default(true),
    direction: shopifySyncDirectionSchema.default('to_shopify'),
    autoSync: z.boolean().default(true),
    syncInterval: z.number().min(60).max(3600).default(300), // 1 minute to 1 hour
    conflictResolution: z.enum(['local_wins', 'shopify_wins', 'manual']).default('local_wins'),
    locations: z.array(z.string()).default([]), // Shopify location IDs
  }).default({}),
  orders: z.object({
    enabled: z.boolean().default(true),
    direction: shopifySyncDirectionSchema.default('from_shopify'),
    autoImport: z.boolean().default(true),
    importInterval: z.number().min(300).max(3600).default(600), // 5 minutes to 1 hour
    statusesToImport: z.array(z.string()).default(['open', 'closed']),
    createCustomers: z.boolean().default(true),
  }).default({}),
  customers: z.object({
    enabled: z.boolean().default(true),
    direction: shopifySyncDirectionSchema.default('from_shopify'),
    autoSync: z.boolean().default(false),
    syncInterval: z.number().min(3600).max(86400).default(86400), // 1 hour to 24 hours
    conflictResolution: z.enum(['local_wins', 'shopify_wins', 'manual']).default('shopify_wins'),
  }).default({}),
})

// Shopify sync operation schema
export const shopifySyncOperationSchema = z.object({
  id: uuidSchema.optional(),
  type: z.enum(['products', 'inventory', 'orders', 'customers', 'full_sync']),
  direction: shopifySyncDirectionSchema,
  status: shopifySyncStatusSchema.default('idle'),
  progress: z.object({
    total: z.number().int().min(0).default(0),
    processed: z.number().int().min(0).default(0),
    successful: z.number().int().min(0).default(0),
    failed: z.number().int().min(0).default(0),
    skipped: z.number().int().min(0).default(0),
  }).default({}),
  filters: z.record(z.any()).optional(),
  errors: z.array(z.object({
    entityId: z.string(),
    entityType: z.string(),
    error: z.string(),
    timestamp: z.string().datetime(),
  })).default([]),
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  createdBy: uuidSchema.optional(),
})

// Shopify API request validation
export const shopifyApiRequestSchema = z.object({
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE']),
  endpoint: z.string().min(1, 'Endpoint is required'),
  params: z.record(z.any()).optional(),
  body: z.record(z.any()).optional(),
  headers: z.record(z.string()).optional(),
})

// Shopify webhook verification schema
export const shopifyWebhookVerificationSchema = z.object({
  body: z.string(),
  signature: z.string(),
  secret: z.string(),
})

// Shopify product mapping schema
export const shopifyProductMappingSchema = z.object({
  localField: z.string(),
  shopifyField: z.string(),
  transformation: z.enum(['none', 'string_to_array', 'array_to_string', 'price_to_cents', 'cents_to_price']).default('none'),
  defaultValue: z.any().optional(),
  required: z.boolean().default(false),
})

// Shopify bulk operation schema
export const shopifyBulkOperationSchema = z.object({
  operation: z.enum(['product_sync', 'inventory_sync', 'order_import', 'customer_sync']),
  entityIds: z.array(z.string()).min(1, 'At least one entity ID is required'),
  options: z.object({
    forceSync: z.boolean().default(false),
    skipValidation: z.boolean().default(false),
    batchSize: z.number().min(1).max(100).default(10),
  }).optional(),
})

// Query schemas
export const shopifyProductSyncQuerySchema = z.object({
  ...paginationSchema.shape,
  syncStatus: shopifySyncStatusSchema.optional(),
  hasErrors: z.coerce.boolean().optional(),
  lastSyncBefore: z.string().datetime().optional(),
  lastSyncAfter: z.string().datetime().optional(),
})

export const shopifyOrderSyncQuerySchema = z.object({
  ...paginationSchema.shape,
  importStatus: z.enum(['pending', 'imported', 'failed', 'skipped']).optional(),
  hasErrors: z.coerce.boolean().optional(),
  shopifyOrderNumber: z.string().optional(),
})

export const shopifyWebhookQuerySchema = z.object({
  ...paginationSchema.shape,
  topic: shopifyWebhookTopicSchema.optional(),
  processed: z.coerce.boolean().optional(),
  verified: z.coerce.boolean().optional(),
  hasErrors: z.coerce.boolean().optional(),
})

// Type exports
export type ShopifyWebhookTopic = z.infer<typeof shopifyWebhookTopicSchema>
export type ShopifySyncStatus = z.infer<typeof shopifySyncStatusSchema>
export type ShopifySyncDirection = z.infer<typeof shopifySyncDirectionSchema>
export type ShopifyProductSync = z.infer<typeof shopifyProductSyncSchema>
export type ShopifyInventorySync = z.infer<typeof shopifyInventorySyncSchema>
export type ShopifyOrderSync = z.infer<typeof shopifyOrderSyncSchema>
export type ShopifyCustomerSync = z.infer<typeof shopifyCustomerSyncSchema>
export type ShopifyWebhook = z.infer<typeof shopifyWebhookSchema>
export type ShopifyConfig = z.infer<typeof shopifyConfigSchema>
export type ShopifySyncConfig = z.infer<typeof shopifySyncConfigSchema>
export type ShopifySyncOperation = z.infer<typeof shopifySyncOperationSchema>
export type ShopifyApiRequest = z.infer<typeof shopifyApiRequestSchema>
export type ShopifyWebhookVerification = z.infer<typeof shopifyWebhookVerificationSchema>
export type ShopifyProductMapping = z.infer<typeof shopifyProductMappingSchema>
export type ShopifyBulkOperation = z.infer<typeof shopifyBulkOperationSchema>
export type ShopifyProductSyncQuery = z.infer<typeof shopifyProductSyncQuerySchema>
export type ShopifyOrderSyncQuery = z.infer<typeof shopifyOrderSyncQuerySchema>
export type ShopifyWebhookQuery = z.infer<typeof shopifyWebhookQuerySchema>