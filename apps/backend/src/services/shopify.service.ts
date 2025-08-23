import { PrismaClient } from '@prisma/client'
import axios, { AxiosInstance, AxiosError } from 'axios'

import { CircuitBreaker } from '../lib/circuit-breaker'
import { ConflictResolver } from '../lib/conflict-resolver'
import { logger } from '../lib/logger'
import { RateLimiter } from '../lib/rate-limiter'
import { RetryManager } from '../lib/retry-manager'
import { SyncStatusManager } from '../lib/sync-status-manager'
import { WebhookProcessor } from '../lib/webhook-processor'
import {
  ShopifyProduct,
  ShopifyOrder,
  ShopifyCustomer,
  ShopifyVariant,
  SyncResult,
  SyncStatus,
  WebhookEvent,
} from '../types/shopify'

import { WebSocketService } from './websocket.service'

export class ShopifyService {
  private client!: AxiosInstance
  private circuitBreaker!: CircuitBreaker
  private rateLimiter!: RateLimiter
  private retryManager!: RetryManager
  private syncStatusManager!: SyncStatusManager
  private conflictResolver!: ConflictResolver
  private webhookProcessor!: WebhookProcessor

  constructor(
    private _prisma: PrismaClient,
    private _shopDomain: string,
    private _accessToken: string,
    private _webSocketService?: WebSocketService
  ) {
    this.initializeClient()
    this.initializeComponents()
  }

  private initializeClient(): void {
    this.client = axios.create({
      baseURL: `https://${this._shopDomain}.myshopify.com/admin/api/2023-10`,
      headers: {
        'X-Shopify-Access-Token': this._accessToken,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    })

    // Add request interceptor for rate limiting
    this.client.interceptors.request.use(async (config) => {
      await this.rateLimiter.waitForToken()
      return config
    })

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        this.rateLimiter.updateFromHeaders(response.headers)
        return response
      },
      (error: AxiosError) => {
        if (error.response?.headers) {
          this.rateLimiter.updateFromHeaders(error.response.headers)
        }
        return Promise.reject(error)
      }
    )
  }

  private initializeComponents(): void {
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 5,
      recoveryTimeout: 60000,
      monitoringPeriod: 10000,
    })

    this.rateLimiter = new RateLimiter({
      maxRequests: 40,
      windowMs: 1000,
      burstLimit: 80,
    })

    this.retryManager = new RetryManager({
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffFactor: 2,
    })

    this.syncStatusManager = new SyncStatusManager(this._prisma)
    this.conflictResolver = new ConflictResolver()
    this.webhookProcessor = new WebhookProcessor(this._prisma)
  }

  // Product Synchronization
  async syncProductsToShopify(): Promise<SyncResult> {
    const syncId = await this.syncStatusManager.startSync('products', 'push')

    // Notify sync started
          this._webSocketService?.broadcastShopifyProductSync('started', {
      syncId,
      direction: 'push',
      message: 'Starting product sync to Shopify',
    })

    try {
      const products = await this._prisma.product.findMany({
        where: { 
          // Note: syncStatus field doesn't exist in the current schema
          // Using a placeholder condition that will return all products
          // This should be updated when syncStatus is added to the schema
        },
        include: { variants: true, images: true, collections: true },
      })

      // Notify progress
      this._webSocketService?.broadcastShopifySyncStatus(
        'products',
        'in_progress',
        0,
        undefined,
        {
          total: products.length,
          processed: 0,
        }
      )

      let processed = 0
      const results = await Promise.allSettled(
        products.map(async (product) => {
          // Use type assertion to bypass complex type conversion
          const result = await this.syncSingleProductToShopify(product as unknown as ShopifyProduct)
          processed++

          // Update progress
          const progress = Math.round((processed / products.length) * 100)
          this._webSocketService?.broadcastShopifySyncStatus(
            'products',
            'in_progress',
            progress,
            undefined,
            {
              total: products.length,
              processed,
            }
          )

          return result
        })
      )

      const successful = results.filter((r) => r.status === 'fulfilled').length
      const failed = results.filter((r) => r.status === 'rejected').length

      await this.syncStatusManager.completeSync(syncId, {
        successful,
        failed,
        total: products.length,
      })

      // Notify completion
      this._webSocketService?.broadcastShopifyProductSync('completed', {
        syncId,
        successful,
        failed,
        total: products.length,
        message: `Product sync completed: ${successful}/${products.length} successful`,
      })

      this._webSocketService?.broadcastShopifySyncStatus(
        'products',
        'completed',
        100,
        undefined,
        {
          successful,
          failed,
          total: products.length,
        }
      )

      return {
        syncId,
        successful,
        failed,
        total: products.length,
        errors: results
          .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
          .map((r) => r.reason),
      }
    } catch (error) {
      await this.syncStatusManager.failSync(syncId, error as Error)

      // Notify error
      this._webSocketService?.broadcastShopifyProductSync('error', {
        syncId,
        error: error instanceof Error ? error.message : String(error),
        message: 'Product sync failed',
      })

      this._webSocketService?.broadcastShopifySyncStatus(
        'products',
        'error',
        undefined,
        error instanceof Error ? error.message : String(error)
      )

      throw error
    }
  }

  async syncProductsFromShopify(): Promise<SyncResult> {
    const syncId = await this.syncStatusManager.startSync('products', 'pull')

    // Notify sync started
    this._webSocketService?.broadcastShopifyProductSync('started', {
      syncId,
      direction: 'pull',
      message: 'Starting product sync from Shopify',
    })

    try {
      const shopifyProducts = await this.fetchAllShopifyProducts()

      // Notify progress
      this._webSocketService?.broadcastShopifySyncStatus(
        'products',
        'in_progress',
        0,
        undefined,
        {
          total: shopifyProducts.length,
          processed: 0,
        }
      )

      let processed = 0
      const results = await Promise.allSettled(
        shopifyProducts.map(async (product) => {
          const result = await this.syncSingleProductFromShopify(product)
          processed++

          // Update progress
          const progress = Math.round(
            (processed / shopifyProducts.length) * 100
          )
          this._webSocketService?.broadcastShopifySyncStatus(
            'products',
            'in_progress',
            progress,
            undefined,
            {
              total: shopifyProducts.length,
              processed,
            }
          )

          return result
        })
      )

      const successful = results.filter((r) => r.status === 'fulfilled').length
      const failed = results.filter((r) => r.status === 'rejected').length

      await this.syncStatusManager.completeSync(syncId, {
        successful,
        failed,
        total: shopifyProducts.length,
      })

      // Notify completion
      this._webSocketService?.broadcastShopifyProductSync('completed', {
        syncId,
        successful,
        failed,
        total: shopifyProducts.length,
        message: `Product sync completed: ${successful}/${shopifyProducts.length} successful`,
      })

      this._webSocketService?.broadcastShopifySyncStatus(
        'products',
        'completed',
        100,
        undefined,
        {
          successful,
          failed,
          total: shopifyProducts.length,
        }
      )

      return {
        syncId,
        successful,
        failed,
        total: shopifyProducts.length,
        errors: results
          .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
          .map((r) => r.reason),
      }
    } catch (error) {
      await this.syncStatusManager.failSync(syncId, error as Error)
      throw error
    }
  }

  private async syncSingleProductToShopify(
    product: ShopifyProduct
  ): Promise<void> {
    return this.circuitBreaker.execute(async () => {
      return this.retryManager.execute(async () => {
        const existingShopifyProduct = await this.findShopifyProductBySku(
          (product as { sku?: string }).sku || ''
        )

        if (existingShopifyProduct) {
          // Check for conflicts
           
          const conflict = await this.conflictResolver.detectProductConflict(
            product as any,
            existingShopifyProduct
          )

          if (conflict) {
            const resolution =
              await this.conflictResolver.resolveProductConflict(conflict)
            if (resolution.action === 'skip') {
              logger.info(
                `Skipping product sync due to conflict: ${product.id}`
              )
              return
            }
          }

          await this.updateShopifyProduct(existingShopifyProduct.id.toString(), product)
        } else {
          await this.createShopifyProduct(product)
        }

        // Update local sync status
        await this._prisma.product.update({
          where: { id: product.id.toString() },
          data: {
            // Note: syncStatus field doesn't exist in the current schema
            // lastSyncAt: new Date(),
            updatedAt: new Date(),
          },
        })
      })
    })
  }

  private async syncSingleProductFromShopify(
    shopifyProduct: ShopifyProduct
  ): Promise<void> {
    return this.circuitBreaker.execute(async () => {
      return this.retryManager.execute(async () => {
        const existingProduct = await this._prisma.product.findFirst({
          where: { shopifyId: shopifyProduct.id.toString() },
        })

        if (existingProduct) {
          // Check for conflicts
          const conflict = await this.conflictResolver.detectProductConflict(
            existingProduct,
            shopifyProduct
          )

          if (conflict) {
            const resolution =
              await this.conflictResolver.resolveProductConflict(conflict)
            if (resolution.action === 'skip') {
              logger.info(
                `Skipping product sync due to conflict: ${shopifyProduct.id}`
              )
              return
            }
          }

          await this.updateLocalProduct(existingProduct.id, shopifyProduct)
        } else {
          await this.createLocalProduct(shopifyProduct)
        }
      })
    })
  }

  // Inventory Synchronization
  async syncInventoryToShopify(): Promise<SyncResult> {
    const syncId = await this.syncStatusManager.startSync('inventory', 'push')

    // Notify sync started
    this._webSocketService?.broadcastShopifyInventorySync('started', {
      syncId,
      direction: 'push',
      message: 'Starting inventory sync to Shopify',
    })

    try {
      // Note: inventory table doesn't exist in the current schema
      // Using inventoryItem instead
      const inventoryItems = await this._prisma.inventoryItem.findMany({
        where: { 
          // Note: syncStatus field doesn't exist in the current schema
        },
        include: { product: { include: { variants: true } } },
      })

      // Notify progress
      this._webSocketService?.broadcastShopifySyncStatus(
        'inventory',
        'in_progress',
        0,
        undefined,
        {
          total: inventoryItems.length,
          processed: 0,
        }
      )

      let processed = 0
      const results = await Promise.allSettled(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        inventoryItems.map(async (item: any) => {
          const result = await this.syncSingleInventoryToShopify(item)
          processed++

          // Update progress
          const progress = Math.round((processed / inventoryItems.length) * 100)
          this._webSocketService?.broadcastShopifySyncStatus(
            'inventory',
            'in_progress',
            progress,
            undefined,
            {
              total: inventoryItems.length,
              processed,
            }
          )

          return result
        })
      )

      const successful = results.filter((r) => r.status === 'fulfilled').length
      const failed = results.filter((r) => r.status === 'rejected').length

      await this.syncStatusManager.completeSync(syncId, {
        successful,
        failed,
        total: inventoryItems.length,
      })

      // Notify completion
      this._webSocketService?.broadcastShopifyInventorySync('completed', {
        syncId,
        successful,
        failed,
        total: inventoryItems.length,
        message: `Inventory sync completed: ${successful}/${inventoryItems.length} successful`,
      })

      this._webSocketService?.broadcastShopifySyncStatus(
        'inventory',
        'completed',
        100,
        undefined,
        {
          successful,
          failed,
          total: inventoryItems.length,
        }
      )

      return {
        syncId,
        successful,
        failed,
        total: inventoryItems.length,
        errors: results
          .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
          .map((r) => r.reason),
      }
    } catch (error) {
      await this.syncStatusManager.failSync(syncId, error as Error)

      // Notify error
      this._webSocketService?.broadcastShopifyInventorySync('error', {
        syncId,
        error: error instanceof Error ? error.message : String(error),
        message: 'Inventory sync failed',
      })

      this._webSocketService?.broadcastShopifySyncStatus(
        'inventory',
        'error',
        undefined,
        error instanceof Error ? error.message : String(error)
      )

      throw error
    }
  }

  private async syncSingleInventoryToShopify(
    inventoryItem: Record<string, unknown>
  ): Promise<void> {
    return this.circuitBreaker.execute(async () => {
      return this.retryManager.execute(async () => {
         
        const shopifyVariant = await this.findShopifyVariantBySku(
          (inventoryItem.product as any).variants[0]?.sku
        )

        if (!shopifyVariant) {
           
          throw new Error(
            `Shopify variant not found for SKU: ${(inventoryItem.product as any).variants[0]?.sku}`
          )
        }

        await this.updateShopifyInventoryLevel(
          shopifyVariant.inventory_item_id.toString(),
          inventoryItem.quantity as number
        )

        // Update local sync status
        await this._prisma.inventoryItem.update({
          where: { id: inventoryItem.id as string },
          data: {
            // syncStatus: 'synced',
            // lastSyncAt: new Date(),
            updatedAt: new Date(),
          },
        })
      })
    })
  }

  // Order Import
  async importOrdersFromShopify(): Promise<SyncResult> {
    const syncId = await this.syncStatusManager.startSync('orders', 'pull')

    try {
      const lastSync = await this.syncStatusManager.getLastSyncTime('orders')
      const shopifyOrders = await this.fetchShopifyOrdersSince(lastSync)

      const results = await Promise.allSettled(
        shopifyOrders.map((order) => this.importSingleOrderFromShopify(order))
      )

      const successful = results.filter((r) => r.status === 'fulfilled').length
      const failed = results.filter((r) => r.status === 'rejected').length

      await this.syncStatusManager.completeSync(syncId, {
        successful,
        failed,
        total: shopifyOrders.length,
      })

      return {
        syncId,
        successful,
        failed,
        total: shopifyOrders.length,
        errors: results
          .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
          .map((r) => r.reason),
      }
    } catch (error) {
      await this.syncStatusManager.failSync(syncId, error as Error)
      throw error
    }
  }

  private async importSingleOrderFromShopify(
    shopifyOrder: ShopifyOrder
  ): Promise<void> {
    return this.circuitBreaker.execute(async () => {
      return this.retryManager.execute(async () => {
        // Check if order already exists
        const existingOrder = await this._prisma.order.findFirst({
          where: { shopifyId: shopifyOrder.id.toString() },
        })

        if (existingOrder) {
          logger.info(`Order already exists: ${shopifyOrder.id}`)
          return
        }

        // Import customer first
        let customer = await this._prisma.customer.findFirst({
          where: { shopifyId: shopifyOrder.customer?.id?.toString() },
        })

        if (!customer && shopifyOrder.customer) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          customer = await this.createLocalCustomer(shopifyOrder.customer) as any
        }

        // Create order
        await this.createLocalOrder(shopifyOrder, customer?.id)
      })
    })
  }

  // Customer Synchronization
  async syncCustomersFromShopify(): Promise<SyncResult> {
    const syncId = await this.syncStatusManager.startSync('customers', 'pull')

    try {
      const shopifyCustomers = await this.fetchAllShopifyCustomers()

      const results = await Promise.allSettled(
        shopifyCustomers.map((customer) =>
          this.syncSingleCustomerFromShopify(customer)
        )
      )

      const successful = results.filter((r) => r.status === 'fulfilled').length
      const failed = results.filter((r) => r.status === 'rejected').length

      await this.syncStatusManager.completeSync(syncId, {
        successful,
        failed,
        total: shopifyCustomers.length,
      })

      return {
        syncId,
        successful,
        failed,
        total: shopifyCustomers.length,
        errors: results
          .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
          .map((r) => r.reason),
      }
    } catch (error) {
      await this.syncStatusManager.failSync(syncId, error as Error)
      throw error
    }
  }

  private async syncSingleCustomerFromShopify(
    shopifyCustomer: ShopifyCustomer
  ): Promise<void> {
    return this.circuitBreaker.execute(async () => {
      return this.retryManager.execute(async () => {
        // Check for existing customer by email or Shopify ID
        const existingCustomer = await this._prisma.customer.findFirst({
          where: {
            OR: [
              { shopifyId: shopifyCustomer.id.toString() },
              { email: shopifyCustomer.email },
            ],
          },
        })

        if (existingCustomer) {
          // Deduplicate and merge customer data
           
          const mergedData = await this.deduplicateCustomerData(
            existingCustomer as any,
            shopifyCustomer
          )

          await this._prisma.customer.update({
            where: { id: existingCustomer.id },
            data: mergedData,
          })
        } else {
          await this.createLocalCustomer(shopifyCustomer)
        }
      })
    })
  }

  // Webhook Processing
  async processWebhook(event: WebhookEvent): Promise<void> {
    try {
      // Notify webhook received
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this._webSocketService?.broadcastShopifyWebhookReceived((event as any).type, {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        id: (event as any).id,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        topic: (event as any).type,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        shop_domain: (event as any).shop_domain,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        created_at: (event as any).created_at,
      })

      // Process the webhook
      await this.webhookProcessor.process(event)

      // Notify successful processing
      this._webSocketService?.broadcastNotification(
        'shopify:webhook:processed',
        {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          type: (event as any).type,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          id: (event as any).id,
          status: 'success',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          message: `Webhook ${(event as any).type} processed successfully`,
        }
      )

      logger.info('Shopify webhook processed successfully', {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        type: (event as any).type,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        id: (event as any).id,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        shop_domain: (event as any).shop_domain,
      })
    } catch (error) {
      // Notify processing error
      this._webSocketService?.broadcastNotification('shopify:webhook:error', {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        type: (event as any).type,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        id: (event as any).id,
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        message: `Failed to process webhook ${(event as any).type}`,
      })

      logger.error('Shopify webhook processing failed', {
        type: (event as any).type,
        id: (event as any).id,
        error: error instanceof Error ? error.message : String(error),
      })

      throw error
    }
  }

  // Manual Sync Triggers
  async triggerFullSync(): Promise<{ [key: string]: SyncResult }> {
    const results: { [key: string]: SyncResult } = {}

    try {
      results.products = await this.syncProductsFromShopify()
      results.inventory = await this.syncInventoryToShopify()
      results.orders = await this.importOrdersFromShopify()
      results.customers = await this.syncCustomersFromShopify()

      return results
    } catch (error) {
      logger.error('Full sync failed:', error)
      throw error
    }
  }

  // Sync Status Monitoring
  async getSyncStatus(): Promise<SyncStatus[]> {
    return this.syncStatusManager.getAllSyncStatuses()
  }

  async getSyncHistory(entityType?: string): Promise<SyncStatus[]> {
    return this.syncStatusManager.getSyncHistory(entityType)
  }

  // Circuit Breaker Status
  getCircuitBreakerStatus(): Record<string, unknown> {
    return this.circuitBreaker.getStatus() as unknown as Record<string, unknown>
  }

  // Helper methods for API calls
  private async fetchAllShopifyProducts(): Promise<ShopifyProduct[]> {
    const products: ShopifyProduct[] = []
    let nextPageInfo: string | null = null

    do {
      const response = await this.client.get('/products.json', {
        params: {
          limit: 250,
          ...(nextPageInfo && { page_info: nextPageInfo }),
        },
      })

      products.push(...response.data.products)
      nextPageInfo = this.extractNextPageInfo(response.headers.link)
    } while (nextPageInfo)

    return products
  }

  private async fetchShopifyOrdersSince(since?: Date): Promise<ShopifyOrder[]> {
    const orders: ShopifyOrder[] = []
    let nextPageInfo: string | null = null

    do {
      const response = await this.client.get('/orders.json', {
        params: {
          limit: 250,
          status: 'any',
          ...(since && { updated_at_min: since.toISOString() }),
          ...(nextPageInfo && { page_info: nextPageInfo }),
        },
      })

      orders.push(...response.data.orders)
      nextPageInfo = this.extractNextPageInfo(response.headers.link)
    } while (nextPageInfo)

    return orders
  }

  private async fetchAllShopifyCustomers(): Promise<ShopifyCustomer[]> {
    const customers: ShopifyCustomer[] = []
    let nextPageInfo: string | null = null

    do {
      const response = await this.client.get('/customers.json', {
        params: {
          limit: 250,
          ...(nextPageInfo && { page_info: nextPageInfo }),
        },
      })

      customers.push(...response.data.customers)
      nextPageInfo = this.extractNextPageInfo(response.headers.link)
    } while (nextPageInfo)

    return customers
  }

  private extractNextPageInfo(linkHeader?: string): string | null {
    if (!linkHeader) return null

    const nextMatch = linkHeader.match(/<([^>]+)>;\s*rel="next"/)
    if (!nextMatch) return null

    const url = new URL(nextMatch[1])
    return url.searchParams.get('page_info')
  }

  // Additional helper methods would be implemented here...
  private async findShopifyProductBySku(
    _sku: string
  ): Promise<ShopifyProduct | null> {
    // Implementation for finding Shopify product by SKU
    return null
  }

  private async updateShopifyProduct(
    _shopifyId: string,
    _product: ShopifyProduct
  ): Promise<void> {
    // Implementation for updating Shopify product
  }

  private async createShopifyProduct(_product: ShopifyProduct): Promise<void> {
    // Implementation for creating Shopify product
  }

  private async updateLocalProduct(
    _productId: string,
    _shopifyProduct: ShopifyProduct
  ): Promise<void> {
    // Implementation for updating local product
  }

  private async createLocalProduct(
    _shopifyProduct: ShopifyProduct
  ): Promise<void> {
    // Implementation for creating local product
  }

  private async findShopifyVariantBySku(
    _sku: string
  ): Promise<ShopifyVariant | null> {
    // Implementation for finding Shopify variant by SKU
    return null
  }

  private async updateShopifyInventoryLevel(
    _inventoryItemId: string,
    _quantity: number
  ): Promise<void> {
    // Implementation for updating Shopify inventory level
  }

  private async createLocalOrder(
    _shopifyOrder: ShopifyOrder,
    _customerId?: string
  ): Promise<void> {
    // Implementation for creating local order
  }

  private async createLocalCustomer(
    _shopifyCustomer: ShopifyCustomer
  ): Promise<ShopifyCustomer | null> {
    // Implementation for creating local customer
    return null
  }

  private async deduplicateCustomerData(
    _existingCustomer: ShopifyCustomer,
    _shopifyCustomer: ShopifyCustomer
  ): Promise<Record<string, unknown>> {
    // Implementation for deduplicating customer data
    return {}
  }
}
