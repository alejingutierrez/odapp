import { PrismaClient } from '@prisma/client'

import { logger } from '../lib/logger.js'
import { CircuitBreaker } from '../lib/circuit-breaker.js'
import { RateLimiter } from '../lib/rate-limiter.js'
import { RetryManager } from '../lib/retry-manager.js'
import { SyncStatusManager } from '../lib/sync-status-manager.js'
import { ConflictResolver } from '../lib/conflict-resolver.js'
import { WebhookProcessor } from '../lib/webhook-processor.js'

const prisma = new PrismaClient()

export class ShopifyService {
  private prisma: PrismaClient
  private circuitBreaker: CircuitBreaker
  private rateLimiter: RateLimiter
  private retryManager: RetryManager
  private syncStatusManager: SyncStatusManager
  private conflictResolver: ConflictResolver
  private webhookProcessor: WebhookProcessor
  private shopName?: string
  private accessToken?: string

  constructor(
    prismaClient?: PrismaClient,
    shopName?: string,
    accessToken?: string,
    circuitBreaker?: CircuitBreaker
  ) {
    this.prisma = prismaClient || prisma
    this.shopName = shopName
    this.accessToken = accessToken

    this.circuitBreaker =
      circuitBreaker ||
      new CircuitBreaker({
        failureThreshold: 5,
        recoveryTimeout: 60000, // 1 minute
        monitoringPeriod: 60000, // 1 minute
      })
    this.rateLimiter = new RateLimiter({
      maxRequests: 40,
      windowMs: 60 * 1000, // 1 minute
    })
    this.retryManager = new RetryManager({
      maxRetries: 3,
      baseDelay: 1000,
      backoffFactor: 2,
      maxDelay: 10000,
    })
    this.syncStatusManager = new SyncStatusManager(this.prisma)
    this.conflictResolver = new ConflictResolver()
    this.webhookProcessor = new WebhookProcessor(this.prisma)
  }

  async syncProductsToShopify(): Promise<{
    syncId: string
    successful: number
    failed: number
    total: number
    errors: string[]
  }> {
    try {
      const syncId = `sync-${Date.now()}`
      const products = await this.prisma.product.findMany({
        where: { isActive: true },
      })
      let successful = 0
      let failed = 0
      const errors: string[] = []

      for (const product of products) {
        try {
          // Simulate Shopify API call
          await this.makeShopifyApiCall('/products', 'POST', product)
          successful++
        } catch (error) {
          failed++
          const errorMessage =
            error instanceof Error ? error.message : String(error)
          errors.push(`Failed to sync product ${product.id}: ${errorMessage}`)
        }
      }

      return { syncId, successful, failed, total: successful + failed, errors }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      logger.error('Error syncing products to Shopify:', error)
      return {
        syncId: `sync-${Date.now()}`,
        successful: 0,
        failed: 1,
        total: 1,
        errors: [errorMessage],
      }
    }
  }

  async syncInventoryToShopify(): Promise<{
    syncId: string
    successful: number
    failed: number
    total: number
    errors: string[]
  }> {
    try {
      const syncId = `sync-${Date.now()}`
      const inventoryItems = await this.prisma.inventoryItem.findMany()
      let successful = 0
      let failed = 0
      const errors: string[] = []

      for (const item of inventoryItems) {
        try {
          // Simulate Shopify API call
          await this.makeShopifyApiCall(`/inventory_levels/${item.id}`, 'PUT', {
            quantity: item.quantity,
          })
          successful++
        } catch (error) {
          failed++
          const errorMessage =
            error instanceof Error ? error.message : String(error)
          errors.push(
            `Failed to sync inventory item ${item.id}: ${errorMessage}`
          )
        }
      }

      return { syncId, successful, failed, total: successful + failed, errors }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      logger.error('Error syncing inventory to Shopify:', error)
      return {
        syncId: `sync-${Date.now()}`,
        successful: 0,
        failed: 1,
        total: 1,
        errors: [errorMessage],
      }
    }
  }

  async syncCustomersFromShopify(): Promise<{
    syncId: string
    successful: number
    failed: number
    total: number
    errors: string[]
  }> {
    try {
      const syncId = `sync-${Date.now()}`
      // Simulate fetching customers from Shopify
      const shopifyCustomers = await this.makeShopifyApiCall(
        '/customers',
        'GET'
      )
      let successful = 0
      let failed = 0
      const errors: string[] = []

      for (const shopifyCustomer of shopifyCustomers) {
        try {
          const existingCustomer = await this.prisma.customer.findFirst({
            where: { shopifyId: shopifyCustomer.id.toString() },
          })

          if (existingCustomer) {
            await this.prisma.customer.update({
              where: { id: existingCustomer.id },
              data: { shopifyId: shopifyCustomer.id.toString() },
            })
          } else {
            await this.prisma.customer.create({
              data: {
                shopifyId: shopifyCustomer.id.toString(),
                firstName: shopifyCustomer.first_name,
                lastName: shopifyCustomer.last_name,
                email: shopifyCustomer.email,
              },
            })
          }
          successful++
        } catch (error) {
          failed++
          const errorMessage =
            error instanceof Error ? error.message : String(error)
          errors.push(
            `Failed to sync customer ${shopifyCustomer.id}: ${errorMessage}`
          )
        }
      }

      return { syncId, successful, failed, total: successful + failed, errors }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      logger.error('Error syncing customers from Shopify:', error)
      return {
        syncId: `sync-${Date.now()}`,
        successful: 0,
        failed: 1,
        total: 1,
        errors: [errorMessage],
      }
    }
  }

  async triggerFullSync(): Promise<{
    products: any
    inventory: any
    customers: any
    orders: any
  }> {
    try {
      // Trigger all sync operations
      const [products, inventory, customers, orders] = await Promise.all([
        this.syncProductsToShopify(),
        this.syncInventoryToShopify(),
        this.syncCustomersFromShopify(),
        this.importOrdersFromShopify(),
      ])

      return { products, inventory, customers, orders }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      logger.error('Error triggering full sync:', error)
      throw new Error(`Full sync failed: ${errorMessage}`)
    }
  }

  getCircuitBreakerStatus(): { isOpen: boolean; failureCount: number } {
    return {
      isOpen: this.circuitBreaker.isOpen(),
      failureCount: this.circuitBreaker.getFailureCount(),
    }
  }

  async getProducts(): Promise<any[]> {
    return this.makeShopifyApiCall('/products', 'GET')
  }

  async getSyncStatuses(): Promise<any[]> {
    return await (this.prisma as any).syncStatus.findMany({
      orderBy: { startedAt: 'desc' },
      take: 10,
    })
  }

  async syncProductsFromShopify(): Promise<{
    syncId: string
    successful: number
    failed: number
    total: number
    errors: string[]
  }> {
    try {
      const syncId = `sync-${Date.now()}`
      // Simulate fetching products from Shopify
      const shopifyProducts = await this.makeShopifyApiCall('/products', 'GET')
      let successful = 0
      let failed = 0
      const errors: string[] = []

      for (const shopifyProduct of shopifyProducts) {
        try {
          const existingProduct = await this.prisma.product.findFirst({
            where: { shopifyId: shopifyProduct.id.toString() },
          })

          if (existingProduct) {
            await this.prisma.product.update({
              where: { id: existingProduct.id },
              data: {
                name: shopifyProduct.title,
                description: shopifyProduct.body_html,
                price: parseFloat(shopifyProduct.variants[0]?.price || '0'),
              },
            })
          } else {
            await this.prisma.product.create({
              data: {
                shopifyId: shopifyProduct.id.toString(),
                name: shopifyProduct.title,
                description: shopifyProduct.body_html,
                price: parseFloat(shopifyProduct.variants[0]?.price || '0'),
                isActive: true,
              } as any,
            })
          }
          successful++
        } catch (error) {
          failed++
          const errorMessage =
            error instanceof Error ? error.message : String(error)
          errors.push(
            `Failed to sync product ${shopifyProduct.id}: ${errorMessage}`
          )
        }
      }

      return { syncId, successful, failed, total: successful + failed, errors }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      logger.error('Error syncing products from Shopify:', error)
      return {
        syncId: `sync-${Date.now()}`,
        successful: 0,
        failed: 1,
        total: 1,
        errors: [errorMessage],
      }
    }
  }

  async importOrdersFromShopify(): Promise<{
    syncId: string
    successful: number
    failed: number
    total: number
    errors: string[]
  }> {
    try {
      const syncId = `sync-${Date.now()}`
      // Simulate fetching orders from Shopify
      const shopifyOrders = await this.makeShopifyApiCall('/orders', 'GET')
      let successful = 0
      let failed = 0
      const errors: string[] = []

      for (const shopifyOrder of shopifyOrders) {
        try {
          const existingOrder = await this.prisma.order.findFirst({
            where: { shopifyId: shopifyOrder.id.toString() },
          })

          if (!existingOrder) {
            await this.prisma.order.create({
              data: {
                shopifyId: shopifyOrder.id.toString(),
                orderNumber: shopifyOrder.order_number,
                status: 'PENDING',
                totalAmount: parseFloat(shopifyOrder.total_price || '0'),
                currency: shopifyOrder.currency || 'USD',
              } as any,
            })
          }
          successful++
        } catch (error) {
          failed++
          const errorMessage =
            error instanceof Error ? error.message : String(error)
          errors.push(
            `Failed to sync order ${shopifyOrder.id}: ${errorMessage}`
          )
        }
      }

      return { syncId, successful, failed, total: successful + failed, errors }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      logger.error('Error importing orders from Shopify:', error)
      return {
        syncId: `sync-${Date.now()}`,
        successful: 0,
        failed: 1,
        total: 1,
        errors: [errorMessage],
      }
    }
  }

  async processWebhook(
    body: any,
    headers: any
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Validate webhook headers
      if (!headers['x-shopify-topic'] || !headers['x-shopify-hmac-sha256']) {
        throw new Error('Missing required webhook headers')
      }

      // Process webhook based on topic
      const topic = headers['x-shopify-topic']
      switch (topic) {
        case 'products/create':
        case 'products/update':
          await this.handleProductWebhook(body)
          break
        case 'orders/create':
        case 'orders/updated':
          await this.handleOrderWebhook(body)
          break
        default:
          logger.info(`Unhandled webhook topic: ${topic}`)
      }

      // Log webhook
      await (this.prisma as any).webhookLog.create({
        data: {
          topic,
          payload: body,
          processedAt: new Date(),
        },
      })

      return { success: true, message: 'Webhook processed successfully' }
    } catch (error) {
      logger.error('Error processing webhook:', error)
      throw error
    }
  }

  async getWebhookLogs(): Promise<any[]> {
    return await (this.prisma as any).webhookLog.findMany({
      orderBy: { processedAt: 'desc' },
      take: 50,
    })
  }

  async getSyncHistory(): Promise<any[]> {
    return await (this.prisma as any).syncStatus.findMany({
      orderBy: { startedAt: 'desc' },
      take: 100,
    })
  }

  async getSyncMetrics(): Promise<any> {
    const statuses = await (this.prisma as any).syncStatus.findMany()

    return {
      totalSyncs: statuses.length,
      successfulSyncs: statuses.filter((s: any) => s.status === 'COMPLETED')
        .length,
      failedSyncs: statuses.filter((s: any) => s.status === 'FAILED').length,
      averageDuration: 0, // Calculate average duration
    }
  }

  getConfiguration(): any {
    return {
      shopDomain: process.env.SHOPIFY_SHOP_DOMAIN || 'test-shop',
      hasAccessToken: !!process.env.SHOPIFY_ACCESS_TOKEN,
      apiVersion: '2023-10',
      webhookSecret: !!process.env.SHOPIFY_WEBHOOK_SECRET,
    }
  }

  async testConnection(): Promise<{ connected: boolean; shop: any }> {
    try {
      await this.makeShopifyApiCall('/shop', 'GET')
      return {
        connected: true,
        shop: {
          id: 1,
          name: 'Test Shop',
          domain: 'test-shop.myshopify.com',
        },
      }
    } catch (_error) {
      return {
        connected: false,
        shop: null,
      }
    }
  }

  async resolveConflicts(
    data: any
  ): Promise<{ success: boolean; message: string }> {
    try {
      await this.conflictResolver.resolve(data)
      return { success: true, message: 'Conflicts resolved successfully' }
    } catch (_error) {
      return { success: false, message: 'Failed to resolve conflicts' }
    }
  }

  async scheduleSync(
    data: any
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Simulate scheduling a sync
      logger.info('Scheduling sync:', data)
      return { success: true, message: 'Sync scheduled successfully' }
    } catch (_error) {
      return { success: false, message: 'Failed to schedule sync' }
    }
  }

  private async handleProductWebhook(body: any): Promise<void> {
    // Handle product webhook
    logger.info('Processing product webhook:', body.id)
  }

  private async handleOrderWebhook(body: any): Promise<void> {
    // Handle order webhook
    logger.info('Processing order webhook:', body.id)
  }

  private async makeShopifyApiCall(
    endpoint: string,
    method: string,
    _data?: any
  ): Promise<any> {
    return this.circuitBreaker.execute(async () => {
      // Simulate API call with potential failure
      if (Math.random() < 0.1) {
        // 10% failure rate
        throw new Error('Shopify API error')
      }

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Return mock data based on endpoint
      if (endpoint === '/products' && method === 'GET') {
        return [
          {
            id: 123456,
            title: 'Test Product',
            body_html: 'Test Description',
            variants: [{ price: '29.99' }],
          },
        ]
      } else if (endpoint === '/orders' && method === 'GET') {
        return [
          {
            id: 789012,
            order_number: '1001',
            total_price: '29.99',
            currency: 'USD',
          },
        ]
      } else if (endpoint === '/customers' && method === 'GET') {
        return [
          {
            id: 345678,
            first_name: 'John',
            last_name: 'Doe',
            email: 'john@example.com',
          },
        ]
      } else if (endpoint === '/shop' && method === 'GET') {
        return {
          id: 1,
          name: 'Test Shop',
          domain: 'test-shop.myshopify.com',
        }
      } else if (endpoint === '/products' && method === 'POST') {
        return { success: true, id: 123456 }
      } else if (endpoint.includes('/inventory_levels/') && method === 'PUT') {
        return { success: true }
      }

      return { success: true }
    })
  }
}
