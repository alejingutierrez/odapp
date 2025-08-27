import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  mockShopifyProduct,
  mockShopifyOrder,
  mockWebhookEvent,
} from './mocks/shopify-mocks'

// Set required environment variables
process.env.DATABASE_URL ||= 'postgres://localhost:5432/test'
process.env.REDIS_URL ||= 'redis://localhost:6379'
process.env.ELASTICSEARCH_URL ||= 'http://localhost:9200'
process.env.RABBITMQ_URL ||= 'amqp://localhost'
process.env.S3_ENDPOINT ||= 'http://localhost:9000'
process.env.S3_ACCESS_KEY ||= 'key'
process.env.S3_SECRET_KEY ||= 'secret'
process.env.S3_BUCKET_NAME ||= 'bucket'
process.env.JWT_SECRET ||= 'secretsecretsecretsecretsecretsecret'
process.env.CORS_ORIGINS ||= '*'
process.env.SMTP_HOST ||= 'smtp.example.com'
process.env.SMTP_PORT ||= '587'
process.env.SMTP_FROM ||= 'test@example.com'
process.env.SESSION_SECRET ||= '12345678901234567890123456789012'
process.env.ALLOWED_FILE_TYPES ||= 'image/jpeg,image/png'

// Workspace packages are built before tests run, no mocking needed

// Mock external dependencies
vi.mock('axios')

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({
    product: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    inventoryItem: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    customer: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    order: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    syncStatus: {
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    webhookLog: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    $transaction: vi.fn(),
  })),
  SyncStatus: {
    PENDING: 'pending',
    RUNNING: 'running',
    COMPLETED: 'completed',
    FAILED: 'failed',
  },
  SyncDirection: {
    PUSH: 'push',
    PULL: 'pull',
  },
  EntityType: {
    PRODUCTS: 'products',
    INVENTORY: 'inventory',
    CUSTOMERS: 'customers',
    ORDERS: 'orders',
  },
}))
vi.mock('../lib/logger')

// Dynamically import modules after env and mocks are set
const { PrismaClient } = await import('@prisma/client')
const { ShopifyService } = await import('../services/shopify.service')
const { WebhookProcessor } = await import('../lib/webhook-processor')
const { CircuitBreaker } = await import('../lib/circuit-breaker')
const { RateLimiter } = await import('../lib/rate-limiter')
const { RetryManager } = await import('../lib/retry-manager')
const { SyncStatusManager } = await import('../lib/sync-status-manager')

describe('Shopify Integration Tests', () => {
  let prisma: any
  let mockPrisma: any
  let shopifyService: any
  let webhookProcessor: any

  beforeEach(() => {
    vi.clearAllMocks()

    prisma = new PrismaClient()
    mockPrisma = prisma as any
    shopifyService = new ShopifyService(prisma, 'test-shop', 'test-token')
    webhookProcessor = new WebhookProcessor(prisma)
  })

  describe('End-to-End Product Sync', () => {
    it('should complete full product sync workflow', async () => {
      // Arrange
      const mockProducts = [
        {
          id: '1',
          title: 'Test Product',
          sku: 'TEST-001',
          syncStatus: 'pending',
          variants: [{ sku: 'TEST-001-V1' }],
          images: [],
          collections: [],
        },
      ]

      mockPrisma.syncStatus.create.mockResolvedValue({ id: 'sync-1' })
      mockPrisma.product.findMany.mockResolvedValue(mockProducts)
      mockPrisma.product.update.mockResolvedValue({})

      vi.spyOn(shopifyService as any, 'makeShopifyApiCall').mockResolvedValue({
        success: true,
      })

      // Act
      const result = await shopifyService.syncProductsToShopify()

      // Assert
      expect(result.successful).toBe(1)
      expect(result.failed).toBe(0)
      expect(result.total).toBe(1)
    })
    it('should record failures when API calls reject', async () => {
      const mockProducts = [
        {
          id: '1',
          title: 'Test Product',
          sku: 'TEST-001',
          syncStatus: 'pending',
          variants: [],
          images: [],
          collections: [],
        },
      ]

      mockPrisma.syncStatus.create.mockResolvedValue({ id: 'sync-1' })
      mockPrisma.product.findMany.mockResolvedValue(mockProducts)

      vi.spyOn(shopifyService as any, 'makeShopifyApiCall').mockRejectedValue(
        new Error('API Error')
      )

      const result = await shopifyService.syncProductsToShopify()

      expect(result.successful).toBe(0)
      expect(result.failed).toBe(1)
      expect(result.errors[0]).toContain('API Error')
    })
  })

  describe('Webhook Processing Integration', () => {
    it('should process product webhook and update database', async () => {
      // Arrange
      const productWebhook = {
        ...mockWebhookEvent,
        topic: 'products/create',
        payload: mockShopifyProduct,
      }

      mockPrisma.product.findFirst.mockResolvedValue(null)
      mockPrisma.product.create.mockResolvedValue({})
      mockPrisma.webhookLog.create.mockResolvedValue({})

      // Mock webhook verification
      process.env.SHOPIFY_WEBHOOK_SECRET = 'test-secret'

      // Bypass webhook signature verification
      vi.spyOn(webhookProcessor as any, 'verifyWebhook').mockResolvedValue()

      // Act
      await webhookProcessor.process(productWebhook)

      // Assert
      expect(mockPrisma.product.create).toHaveBeenCalled()
      expect(mockPrisma.webhookLog.create).toHaveBeenCalled()
    })

    it('should process order webhook and create order with customer', async () => {
      // Arrange
      const orderWebhook = {
        ...mockWebhookEvent,
        topic: 'orders/create',
        payload: mockShopifyOrder,
      }

      mockPrisma.order.findFirst.mockResolvedValue(null)
      mockPrisma.customer.findFirst.mockResolvedValue(null)
      mockPrisma.customer.create.mockResolvedValue({ id: 'customer-1' })
      mockPrisma.order.create.mockResolvedValue({})
      mockPrisma.webhookLog.create.mockResolvedValue({})

      // Bypass webhook signature verification
      vi.spyOn(webhookProcessor as any, 'verifyWebhook').mockResolvedValue()

      // Act
      await webhookProcessor.process(orderWebhook)

      // Assert
      expect(mockPrisma.customer.create).toHaveBeenCalled()
      expect(mockPrisma.order.create).toHaveBeenCalled()
    })

    it('should handle webhook verification failure', async () => {
      // Arrange
      const invalidWebhook = {
        ...mockWebhookEvent,
        headers: {
          ...mockWebhookEvent.headers,
          'x-shopify-hmac-sha256': 'invalid-hmac',
        },
      }

      process.env.SHOPIFY_WEBHOOK_SECRET = 'test-secret'

      // Act & Assert
      await expect(webhookProcessor.process(invalidWebhook)).rejects.toThrow(
        'Input buffers must have the same byte length'
      )
    })
  })

  describe('Circuit Breaker Integration', () => {
    it('should open circuit breaker after consecutive failures', async () => {
      // Arrange
      const circuitBreaker = new CircuitBreaker({
        failureThreshold: 3,
        recoveryTimeout: 60000,
        monitoringPeriod: 10000,
      })

      const failingOperation = vi.fn().mockRejectedValue(new Error('API Error'))

      // Act - Trigger failures
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failingOperation)
        } catch (_error) {
          // Expected to fail
        }
      }

      // Assert
      const status = circuitBreaker.getStatus()
      expect(status.state).toBe('open')
      expect(status.failureCount).toBe(3)

      // Verify circuit breaker blocks further calls
      await expect(circuitBreaker.execute(failingOperation)).rejects.toThrow(
        'Circuit breaker is open'
      )
    })

    it('should transition to half-open and recover', async () => {
      // Arrange
      const circuitBreaker = new CircuitBreaker({
        failureThreshold: 2,
        recoveryTimeout: 100, // Short timeout for testing
        monitoringPeriod: 10000,
      })

      const operation = vi
        .fn()
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'))
        .mockResolvedValueOnce('Success')

      // Act - Trigger failures to open circuit
      try {
        await circuitBreaker.execute(operation)
      } catch {
        // Intentionally ignore error for testing circuit breaker
      }
      try {
        await circuitBreaker.execute(operation)
      } catch {
        // Intentionally ignore error for testing circuit breaker
      }

      expect(circuitBreaker.getStatus().state).toBe('open')

      // Wait for recovery timeout
      await new Promise((resolve) => setTimeout(resolve, 150))

      // Execute successful operation
      const result = await circuitBreaker.execute(operation)

      // Assert
      expect(result).toBe('Success')
      expect(circuitBreaker.getStatus().state).toBe('closed')
    })
  })

  describe('Rate Limiting Integration', () => {
    it('should respect rate limits and wait when necessary', async () => {
      // Arrange
      const rateLimiter = new RateLimiter({
        maxRequests: 2,
        windowMs: 1000,
        burstLimit: 2,
      })

      const startTime = Date.now()

      // Act - Make requests that exceed rate limit
      await rateLimiter.waitForToken() // Request 1
      await rateLimiter.waitForToken() // Request 2
      await rateLimiter.waitForToken() // Request 3 - should wait

      const endTime = Date.now()

      // Assert - Should have waited for rate limit reset
      expect(endTime - startTime).toBeGreaterThan(900) // Almost 1 second
    })

    it('should update rate limits from Shopify headers', async () => {
      // Arrange
      const rateLimiter = new RateLimiter({
        maxRequests: 40,
        windowMs: 1000,
        burstLimit: 80,
      })

      // Act
      rateLimiter.updateFromHeaders({
        'x-shopify-shop-api-call-limit': '35/40',
        'x-shopify-api-request-bucket-leak-rate': '2',
      })

      // Assert
      const status = rateLimiter.getStatus()
      expect(status.remaining).toBe(5) // 40 - 35
    })
  })

  describe('Retry Manager Integration', () => {
    it('should retry failed operations with exponential backoff', async () => {
      // Arrange
      const retryManager = new RetryManager({
        maxRetries: 3,
        baseDelay: 100,
        maxDelay: 1000,
        backoffFactor: 2,
      })

      const operation = vi
        .fn()
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockRejectedValueOnce(new Error('Another temporary error'))
        .mockResolvedValueOnce('Success')

      const startTime = Date.now()

      // Act
      const result = await retryManager.execute(operation)
      const endTime = Date.now()

      // Assert
      expect(result).toBe('Success')
      expect(operation).toHaveBeenCalledTimes(3)
      expect(endTime - startTime).toBeGreaterThan(150) // Should have waited for retries
    })

    it('should not retry non-retryable errors', async () => {
      // Arrange
      const retryManager = new RetryManager({
        maxRetries: 3,
        baseDelay: 100,
        maxDelay: 1000,
        backoffFactor: 2,
      })

      const operation = vi.fn().mockRejectedValue(new Error('Unauthorized'))

      // Act & Assert
      await expect(retryManager.execute(operation)).rejects.toThrow(
        'Unauthorized'
      )
      expect(operation).toHaveBeenCalledTimes(1) // Should not retry
    })
  })

  describe('Sync Status Management Integration', () => {
    it('should track sync lifecycle correctly', async () => {
      const syncStatusManager = new SyncStatusManager(mockPrisma)

      const syncId = await syncStatusManager.startSync('products', 'pull')
      await expect(
        syncStatusManager.updateSyncProgress(syncId, {
          successful: 5,
          failed: 1,
          total: 10,
        })
      ).resolves.toBeUndefined()
      await expect(
        syncStatusManager.completeSync(syncId, {
          successful: 9,
          failed: 1,
          total: 10,
        })
      ).resolves.toBeUndefined()
    })

    it('should calculate sync metrics correctly', async () => {
      const syncStatusManager = new SyncStatusManager(mockPrisma)
      const metrics = await syncStatusManager.getSyncMetrics('products', 7)
      expect(metrics).toMatchObject({
        totalSyncs: 0,
        successfulSyncs: 0,
        failedSyncs: 0,
        successRate: 0,
        averageDuration: 0,
      })
    })
  })

  describe('Full Integration Scenario', () => {
    it('should handle complete sync workflow with all components', async () => {
      // Arrange - Set up all mocks for a complete workflow
      const mockCreate = mockPrisma.syncStatus.create
      const mockUpdate = mockPrisma.syncStatus.update
      const mockProductFindMany = mockPrisma.product.findMany
      const mockInventoryFindMany = mockPrisma.inventoryItem.findMany
      const mockFindFirst = mockPrisma.syncStatus.findFirst
      mockCreate.mockResolvedValue({ id: 'sync-1' })
      mockUpdate.mockResolvedValue({})
      mockProductFindMany.mockResolvedValue([])
      mockInventoryFindMany.mockResolvedValue([])
      mockFindFirst.mockResolvedValue(null)

      const mockAxiosInstance = {
        get: vi.fn().mockResolvedValue({
          data: { products: [], orders: [], customers: [] },
          headers: {},
        }),
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() },
        },
      }

      const shopifyServiceTyped = shopifyService as any
      shopifyServiceTyped.client = mockAxiosInstance

      // Act
      const results = await shopifyService.triggerFullSync()

      // Assert
      expect(results).toHaveProperty('products')
      expect(results).toHaveProperty('inventory')
      expect(results).toHaveProperty('orders')
      expect(results).toHaveProperty('customers')
    })
  })
})
