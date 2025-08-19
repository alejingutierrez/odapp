import { cacheManager, CacheOptions } from './cache-manager.js'
import logger from '../logger.js'
import { prisma } from '../prisma.js'

export interface WarmupConfig {
  enabled: boolean
  scheduleInterval: number // in milliseconds
  batchSize: number
  maxRetries: number
  retryDelay: number
}

export interface WarmupItem {
  key: string
  loader: () => Promise<unknown>
  options?: CacheOptions
  priority: number // 1 = highest, 10 = lowest
}

export class CacheWarming {
  private config: WarmupConfig
  private warmupInterval: NodeJS.Timeout | null = null
  private isWarming = false

  constructor(config: Partial<WarmupConfig> = {}) {
    this.config = {
      enabled: true,
      scheduleInterval: 30 * 60 * 1000, // 30 minutes
      batchSize: 10,
      maxRetries: 3,
      retryDelay: 1000,
      ...config,
    }
  }

  /**
   * Start scheduled cache warming
   */
  start(): void {
    if (!this.config.enabled) {
      logger.info('Cache warming is disabled')
      return
    }

    if (this.warmupInterval) {
      logger.warn('Cache warming is already running')
      return
    }

    // Initial warmup
    this.warmCache().catch(error => {
      logger.error('Initial cache warmup failed', { error })
    })

    // Schedule periodic warmup
    this.warmupInterval = setInterval(() => {
      this.warmCache().catch(error => {
        logger.error('Scheduled cache warmup failed', { error })
      })
    }, this.config.scheduleInterval)

    logger.info('Cache warming started', {
      interval: this.config.scheduleInterval,
      batchSize: this.config.batchSize,
    })
  }

  /**
   * Stop scheduled cache warming
   */
  stop(): void {
    if (this.warmupInterval) {
      clearInterval(this.warmupInterval)
      this.warmupInterval = null
      logger.info('Cache warming stopped')
    }
  }

  /**
   * Manually trigger cache warming
   */
  async warmCache(): Promise<void> {
    if (this.isWarming) {
      logger.debug('Cache warming already in progress, skipping')
      return
    }

    this.isWarming = true
    const startTime = Date.now()

    try {
      logger.info('Starting cache warmup')

      // Get warmup items
      const warmupItems = await this.getWarmupItems()
      
      // Sort by priority (highest first)
      warmupItems.sort((a, b) => a.priority - b.priority)

      // Process in batches
      const batches = this.createBatches(warmupItems, this.config.batchSize)
      let totalWarmed = 0
      let totalFailed = 0

      for (const batch of batches) {
        const batchResults = await this.processBatch(batch)
        totalWarmed += batchResults.success
        totalFailed += batchResults.failed
      }

      const duration = Date.now() - startTime
      logger.info('Cache warmup completed', {
        totalItems: warmupItems.length,
        warmed: totalWarmed,
        failed: totalFailed,
        duration: `${duration}ms`,
      })
    } catch (error) {
      logger.error('Cache warmup error', { error })
    } finally {
      this.isWarming = false
    }
  }

  /**
   * Get items to warm up
   */
  private async getWarmupItems(): Promise<WarmupItem[]> {
    const items: WarmupItem[] = []

    try {
      // 1. Popular products (highest priority)
      items.push({
        key: 'popular-products',
        loader: () => this.loadPopularProducts(),
        options: {
          ttl: 3600, // 1 hour
          tags: ['products', 'popular'],
          namespace: 'products',
        },
        priority: 1,
      })

      // 2. Product categories (high priority)
      items.push({
        key: 'product-categories',
        loader: () => this.loadProductCategories(),
        options: {
          ttl: 7200, // 2 hours
          tags: ['categories'],
          namespace: 'products',
        },
        priority: 2,
      })

      // 3. Collections (high priority)
      items.push({
        key: 'collections',
        loader: () => this.loadCollections(),
        options: {
          ttl: 3600, // 1 hour
          tags: ['collections'],
          namespace: 'products',
        },
        priority: 2,
      })

      // 4. Featured products (medium priority)
      items.push({
        key: 'featured-products',
        loader: () => this.loadFeaturedProducts(),
        options: {
          ttl: 1800, // 30 minutes
          tags: ['products', 'featured'],
          namespace: 'products',
        },
        priority: 3,
      })

      // 5. Low stock alerts (medium priority)
      items.push({
        key: 'low-stock-products',
        loader: () => this.loadLowStockProducts(),
        options: {
          ttl: 300, // 5 minutes
          tags: ['inventory', 'alerts'],
          namespace: 'inventory',
        },
        priority: 4,
      })

      // 6. Recent orders summary (medium priority)
      items.push({
        key: 'recent-orders-summary',
        loader: () => this.loadRecentOrdersSummary(),
        options: {
          ttl: 600, // 10 minutes
          tags: ['orders', 'summary'],
          namespace: 'orders',
        },
        priority: 5,
      })

      // 7. Customer segments (lower priority)
      items.push({
        key: 'customer-segments',
        loader: () => this.loadCustomerSegments(),
        options: {
          ttl: 3600, // 1 hour
          tags: ['customers', 'segments'],
          namespace: 'customers',
        },
        priority: 6,
      })

      // 8. Sales analytics (lower priority)
      items.push({
        key: 'sales-analytics-daily',
        loader: () => this.loadDailySalesAnalytics(),
        options: {
          ttl: 1800, // 30 minutes
          tags: ['analytics', 'sales'],
          namespace: 'analytics',
        },
        priority: 7,
      })

      return items
    } catch (error) {
      logger.error('Error getting warmup items', { error })
      return []
    }
  }

  /**
   * Process a batch of warmup items
   */
  private async processBatch(batch: WarmupItem[]): Promise<{ success: number; failed: number }> {
    const promises = batch.map(item => this.warmupItem(item))
    const results = await Promise.allSettled(promises)

    const success = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    return { success, failed }
  }

  /**
   * Warm up a single item with retry logic
   */
  private async warmupItem(item: WarmupItem): Promise<void> {
    let attempts = 0
    let lastError: Error | null = null

    while (attempts < this.config.maxRetries) {
      try {
        const data = await item.loader()
        await cacheManager.set(item.key, data, item.options)
        
        logger.debug('Cache item warmed', { key: item.key, attempt: attempts + 1 })
        return
      } catch (error) {
        attempts++
        lastError = error as Error
        
        if (attempts < this.config.maxRetries) {
          await this.delay(this.config.retryDelay * attempts)
        }
      }
    }

    logger.error('Failed to warm cache item', {
      key: item.key,
      attempts,
      error: lastError,
    })
    throw lastError
  }

  /**
   * Create batches from items array
   */
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = []
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize))
    }
    return batches
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Data loaders for different entities

  private async loadPopularProducts() {
    // This would typically be based on sales data, views, etc.
    // For now, we'll use a simple query
    return await prisma.product.findMany({
      take: 50,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        variants: true,
        images: true,
        category: true,
      },
    })
  }

  private async loadProductCategories() {
    return await prisma.category.findMany({
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    })
  }

  private async loadCollections() {
    return await prisma.collection.findMany({
      include: {
        products: {
          take: 10,
          include: {
            images: true,
          },
        },
        _count: {
          select: {
            products: true,
          },
        },
      },
    })
  }

  private async loadFeaturedProducts() {
    return await prisma.product.findMany({
      where: {
        featured: true,
      },
      include: {
        variants: true,
        images: true,
        category: true,
      },
    })
  }

  private async loadLowStockProducts() {
    return await prisma.productVariant.findMany({
      where: {
        inventory: {
          quantity: {
            lte: 10, // Low stock threshold
          },
        },
      },
      include: {
        product: {
          include: {
            images: true,
          },
        },
        inventory: true,
      },
    })
  }

  private async loadRecentOrdersSummary() {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    return await prisma.order.findMany({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      take: 100,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        customer: true,
        items: {
          include: {
            productVariant: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    })
  }

  private async loadCustomerSegments() {
    // This would typically involve complex analytics
    // For now, we'll return basic customer data
    return await prisma.customer.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    })
  }

  private async loadDailySalesAnalytics() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    return await prisma.order.aggregate({
      where: {
        createdAt: {
          gte: today,
        },
        status: 'COMPLETED',
      },
      _sum: {
        totalAmount: true,
      },
      _count: {
        id: true,
      },
    })
  }
}

// Create and export cache warming instance
export const cacheWarming = new CacheWarming()

// Auto-start cache warming
if (process.env.NODE_ENV !== 'test') {
  cacheWarming.start()
}

// Graceful shutdown
process.on('SIGTERM', () => {
  cacheWarming.stop()
})

process.on('SIGINT', () => {
  cacheWarming.stop()
})