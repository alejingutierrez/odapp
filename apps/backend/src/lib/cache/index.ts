// Redis client
export { redisClient, initializeRedis, shutdownRedis } from './redis-client.js'

// Cache manager
export {
  cacheManager,
  type CacheOptions,
  type CacheEntry,
  type CacheStats,
} from './cache-manager.js'
import {
  cacheManager as cacheManagerInstance,
  type CacheOptions as CacheOptionsType,
} from './cache-manager.js'

// Cache patterns
export {
  CacheAsidePattern,
  WriteThroughPattern,
  WriteBehindPattern,
  RefreshAheadPattern,
  type CacheAsideOptions,
  type WriteThroughOptions,
} from './cache-patterns.js'

// Cache warming
export {
  cacheWarming,
  type WarmupConfig,
  type WarmupItem,
} from './cache-warming.js'

// Cache monitoring
export {
  cacheMonitoring,
  type CacheMetrics,
  type CacheAlert,
} from './cache-monitoring.js'

// Utility functions for common cache operations
export const CacheUtils = {
  /**
   * Generate cache key with namespace
   */
  generateKey(namespace: string, ...parts: (string | number)[]): string {
    return `${namespace}:${parts.join(':')}`
  },

  /**
   * Generate cache key for product
   */
  productKey(productId: string): string {
    return this.generateKey('product', productId)
  },

  /**
   * Generate cache key for product list
   */
  productListKey(filters: Record<string, unknown> = {}): string {
    const filterString = Object.entries(filters)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join('|')
    return this.generateKey('products', 'list', filterString || 'all')
  },

  /**
   * Generate cache key for inventory
   */
  inventoryKey(productId: string, variantId?: string): string {
    return variantId
      ? this.generateKey('inventory', productId, variantId)
      : this.generateKey('inventory', productId)
  },

  /**
   * Generate cache key for customer
   */
  customerKey(customerId: string): string {
    return this.generateKey('customer', customerId)
  },

  /**
   * Generate cache key for order
   */
  orderKey(orderId: string): string {
    return this.generateKey('order', orderId)
  },

  /**
   * Generate cache key for analytics
   */
  analyticsKey(type: string, period: string, ...params: string[]): string {
    return this.generateKey('analytics', type, period, ...params)
  },

  /**
   * Generate cache key for Shopify sync
   */
  shopifySyncKey(resource: string, action: string): string {
    return this.generateKey('shopify', 'sync', resource, action)
  },

  /**
   * Get cache tags for product
   */
  getProductTags(
    productId: string,
    categoryId?: string,
    collectionIds: string[] = []
  ): string[] {
    const tags = ['products', `product:${productId}`]

    if (categoryId) {
      tags.push(`category:${categoryId}`)
    }

    collectionIds.forEach((collectionId) => {
      tags.push(`collection:${collectionId}`)
    })

    return tags
  },

  /**
   * Get cache tags for inventory
   */
  getInventoryTags(productId: string, variantId?: string): string[] {
    const tags = ['inventory', `product:${productId}`]

    if (variantId) {
      tags.push(`variant:${variantId}`)
    }

    return tags
  },

  /**
   * Get cache tags for customer
   */
  getCustomerTags(customerId: string, segmentIds: string[] = []): string[] {
    const tags = ['customers', `customer:${customerId}`]

    segmentIds.forEach((segmentId) => {
      tags.push(`segment:${segmentId}`)
    })

    return tags
  },

  /**
   * Get cache tags for order
   */
  getOrderTags(
    orderId: string,
    customerId: string,
    productIds: string[] = []
  ): string[] {
    const tags = ['orders', `order:${orderId}`, `customer:${customerId}`]

    productIds.forEach((productId) => {
      tags.push(`product:${productId}`)
    })

    return tags
  },
}

// Cache decorators for common patterns
export function Cacheable(
  options: CacheOptionsType & { keyGenerator?: (..._args: unknown[]) => string }
) {
  return function (
    target: Record<string, unknown>,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value

    descriptor.value = async function (...args: unknown[]) {
      const key = options.keyGenerator
        ? options.keyGenerator(...args)
        : `${(target as Record<string, string>).constructor.name}:${propertyName}:${JSON.stringify(args)}`

      const cached = await cacheManagerInstance.get(key, options)
      if (cached !== null) {
        return cached
      }

      const result = await method.apply(this, args)
      await cacheManagerInstance.set(key, result, options)

      return result
    }

    return descriptor
  }
}

export function CacheEvict(options: {
  keys?: string[]
  tags?: string[]
  namespace?: string
}) {
  return function (
    target: Record<string, unknown>,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value

    descriptor.value = async function (...args: unknown[]) {
      const result = await method.apply(this, args)

      // Evict specific keys
      if (options.keys) {
        const evictPromises = options.keys.map((key) =>
          cacheManagerInstance.del(key, options.namespace)
        )
        await Promise.all(evictPromises)
      }

      // Evict by tags
      if (options.tags) {
        await cacheManagerInstance.invalidateByTags(options.tags)
      }

      return result
    }

    return descriptor
  }
}
