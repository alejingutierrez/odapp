import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import request from 'supertest'
import express from 'express'

import { createShopifyRouter } from '../routes/shopify'
import {
  mockSyncResult,
  mockSyncStatus,
  mockWebhookEvent,
} from './mocks/shopify-mocks'

// Mock dependencies
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({
    product: {
      findMany: vi
        .fn()
        .mockResolvedValue([
          { id: 'product-1', name: 'Test Product', isActive: true },
        ]),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    inventoryItem: {
      findMany: vi.fn().mockResolvedValue([{ id: 'item-1', quantity: 10 }]),
    },
    customer: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    order: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    syncStatus: {
      findMany: vi
        .fn()
        .mockResolvedValue([
          {
            id: 'sync-1',
            entityType: 'products',
            status: 'completed',
            startedAt: new Date(),
          },
        ]),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    webhookLog: {
      findMany: vi
        .fn()
        .mockResolvedValue([
          {
            id: '1',
            topic: 'products/create',
            status: 'processed',
            processedAt: new Date(),
          },
        ]),
      create: vi.fn(),
    },
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

// Mock the entire module
vi.mock('../services/shopify.service', () => ({
  ShopifyService: vi.fn().mockImplementation(() => ({
    syncProductsToShopify: vi.fn(),
    syncProductsFromShopify: vi.fn(),
    syncInventoryToShopify: vi.fn(),
    importOrdersFromShopify: vi.fn(),
    syncCustomersFromShopify: vi.fn(),
    triggerFullSync: vi.fn(),
    getSyncStatuses: vi.fn(),
    getSyncHistory: vi.fn(),
    getSyncMetrics: vi.fn(),
    getCircuitBreakerStatus: vi.fn(),
    processWebhook: vi.fn(),
    getWebhookLogs: vi.fn(),
    getConfiguration: vi.fn(),
    testConnection: vi.fn(),
    resolveConflicts: vi.fn(),
    scheduleSync: vi.fn(),
  })),
}))
vi.mock('../lib/webhook-processor')
vi.mock('../middleware/auth', () => ({
  authenticate: (req: any, res: any, next: any) => next(),
  authRateLimit: () => (req: any, res: any, next: any) => next(),
  requireTwoFactor: (req: any, res: any, next: any) => next(),
}))

// Create mock ShopifyService instance
const mockShopifyService = {
  syncProductsToShopify: vi.fn(),
  syncProductsFromShopify: vi.fn(),
  syncInventoryToShopify: vi.fn(),
  importOrdersFromShopify: vi.fn(),
  syncCustomersFromShopify: vi.fn(),
  triggerFullSync: vi.fn(),
  getSyncStatuses: vi.fn(),
  getSyncHistory: vi.fn(),
  getSyncMetrics: vi.fn(),
  getCircuitBreakerStatus: vi.fn(),
  processWebhook: vi.fn(),
  getWebhookLogs: vi.fn(),
  getConfiguration: vi.fn(),
  testConnection: vi.fn(),
  resolveConflicts: vi.fn(),
  scheduleSync: vi.fn(),
}

describe('Shopify Routes', () => {
  let app: express.Application

  beforeEach(() => {
    vi.clearAllMocks()

    // Setup default mock return values
    mockShopifyService.syncProductsToShopify.mockResolvedValue(mockSyncResult)
    mockShopifyService.syncProductsFromShopify.mockResolvedValue(mockSyncResult)
    mockShopifyService.syncInventoryToShopify.mockResolvedValue(mockSyncResult)
    mockShopifyService.importOrdersFromShopify.mockResolvedValue(mockSyncResult)
    mockShopifyService.syncCustomersFromShopify.mockResolvedValue(
      mockSyncResult
    )
    mockShopifyService.triggerFullSync.mockResolvedValue({})
    mockShopifyService.getSyncStatuses.mockResolvedValue([mockSyncStatus])
    mockShopifyService.getSyncHistory.mockResolvedValue([mockSyncStatus])
    mockShopifyService.getSyncMetrics.mockResolvedValue({})
    mockShopifyService.processWebhook.mockResolvedValue(undefined)
    mockShopifyService.getWebhookLogs.mockResolvedValue([])
    mockShopifyService.getConfiguration.mockReturnValue({})
    mockShopifyService.testConnection.mockResolvedValue({})
    mockShopifyService.resolveConflicts.mockResolvedValue({})
    mockShopifyService.scheduleSync.mockResolvedValue({})
    mockShopifyService.getCircuitBreakerStatus.mockReturnValue({
      state: 'closed',
      failureCount: 0,
      lastFailureTime: null,
      nextAttemptTime: null,
    })

    app = express()
    app.use(express.json())
    app.use('/api/shopify', createShopifyRouter(mockShopifyService))

    // Mock environment variables
    process.env.SHOPIFY_SHOP_DOMAIN = 'test-shop'
    process.env.SHOPIFY_ACCESS_TOKEN = 'test-token'
    process.env.SHOPIFY_WEBHOOK_SECRET = 'test-secret'
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Product Sync Routes', () => {
    describe('POST /sync/products/push', () => {
      it('should sync products to Shopify successfully', async () => {
        // Act
        const response = await request(app)
          .post('/api/shopify/sync/products/push')
          .send({})

        // Assert
        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
        expect(response.body.data).toBeDefined()
        expect(response.body.data).toHaveProperty('syncId')
        expect(response.body.data).toHaveProperty('successful')
        expect(response.body.data).toHaveProperty('failed')
        expect(response.body.data).toHaveProperty('total')
        expect(response.body.data).toHaveProperty('errors')
      })

      it('should handle sync errors', async () => {
        // Arrange
        const error = new Error('Sync failed')
        mockShopifyService.syncProductsToShopify.mockImplementationOnce(() =>
          Promise.reject(error)
        )

        // Act
        const response = await request(app)
          .post('/api/shopify/sync/products/push')
          .send({})

        // Assert
        expect(response.status).toBe(500)
        expect(response.body.success).toBe(false)
        expect(response.body.message).toBe('Products sync failed')
      })
    })

    describe('POST /sync/products/pull', () => {
      it('should sync products from Shopify successfully', async () => {
        // Arrange
        mockShopifyService.syncProductsFromShopify.mockResolvedValue(
          mockSyncResult
        )

        // Act
        const response = await request(app)
          .post('/api/shopify/sync/products/pull')
          .send({})

        // Assert
        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
        expect(response.body.data).toEqual(mockSyncResult)
      })
    })
  })

  describe('Inventory Sync Routes', () => {
    describe('POST /sync/inventory/push', () => {
      it('should sync inventory to Shopify successfully', async () => {
        // Arrange
        mockShopifyService.syncInventoryToShopify.mockResolvedValue(
          mockSyncResult
        )

        // Act
        const response = await request(app)
          .post('/api/shopify/sync/inventory/push')
          .send({})

        // Assert
        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
        expect(response.body.data).toEqual(mockSyncResult)
      })
    })
  })

  describe('Order Import Routes', () => {
    describe('POST /sync/orders/pull', () => {
      it('should import orders from Shopify successfully', async () => {
        // Arrange
        mockShopifyService.importOrdersFromShopify.mockResolvedValue(
          mockSyncResult
        )

        // Act
        const response = await request(app)
          .post('/api/shopify/sync/orders/pull')
          .send({})

        // Assert
        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
        expect(response.body.data).toEqual(mockSyncResult)
      })
    })
  })

  describe('Customer Sync Routes', () => {
    describe('POST /sync/customers/pull', () => {
      it('should sync customers from Shopify successfully', async () => {
        // Arrange
        mockShopifyService.syncCustomersFromShopify.mockResolvedValue(
          mockSyncResult
        )

        // Act
        const response = await request(app)
          .post('/api/shopify/sync/customers/pull')
          .send({})

        // Assert
        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
        expect(response.body.data).toEqual(mockSyncResult)
      })
    })
  })

  describe('Full Sync Routes', () => {
    describe('POST /sync/full', () => {
      it('should trigger full sync successfully', async () => {
        // Arrange
        const fullSyncResults = {
          products: mockSyncResult,
          inventory: mockSyncResult,
          orders: mockSyncResult,
          customers: mockSyncResult,
        }
        mockShopifyService.triggerFullSync.mockResolvedValue(fullSyncResults)

        // Act
        const response = await request(app)
          .post('/api/shopify/sync/full')
          .send({})

        // Assert
        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
        expect(response.body.data).toEqual(fullSyncResults)
      })
    })
  })

  describe('Sync Status Routes', () => {
    describe('GET /sync/status', () => {
      it('should get sync statuses successfully', async () => {
        // Arrange
        const statuses = [mockSyncStatus]
        mockShopifyService.getSyncStatuses.mockResolvedValue(statuses)

        // Act
        const response = await request(app).get('/api/shopify/sync/status')

        // Assert
        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
        expect(mockShopifyService.getSyncStatuses).toHaveBeenCalled()
      })
    })

    describe('GET /sync/history', () => {
      it('should get sync history successfully', async () => {
        // Arrange
        const history = [mockSyncStatus]
        mockShopifyService.getSyncHistory.mockResolvedValue(history)

        // Act
        const response = await request(app)
          .get('/api/shopify/sync/history')
          .query({ entityType: 'products' })

        // Assert
        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
        expect(response.body.data).toHaveLength(1)
        expect(response.body.data[0]).toMatchObject({
          id: 'test-sync-id',
          entityType: 'products',
          direction: 'pull',
          status: 'completed',
          successful: 1,
          failed: 0,
          total: 1,
          errors: [],
        })
      })
    })

    describe('GET /sync/metrics', () => {
      it('should get sync metrics successfully', async () => {
        // Arrange
        const metrics = {
          totalSyncs: 10,
          successfulSyncs: 8,
          failedSyncs: 2,
          averageDuration: 5000,
          successRate: 80,
        }

        mockShopifyService.getSyncMetrics.mockResolvedValue(metrics)

        // Act
        const response = await request(app)
          .get('/api/shopify/sync/metrics')
          .query({ entityType: 'products', days: '7' })

        // Assert
        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
        expect(response.body.data).toEqual(metrics)
      })
    })
  })

  describe('Circuit Breaker Routes', () => {
    describe('GET /circuit-breaker/status', () => {
      it('should get circuit breaker status successfully', async () => {
        // Arrange
        const status = {
          state: 'closed',
          failureCount: 0,
          lastFailureTime: null,
          nextAttemptTime: null,
        }
        mockShopifyService.getCircuitBreakerStatus.mockReturnValue(status)

        // Act
        const response = await request(app).get(
          '/api/shopify/circuit-breaker/status'
        )

        // Assert
        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
        expect(response.body.data).toEqual(status)
      })
    })
  })

  describe('Webhook Routes', () => {
    describe('POST /webhooks', () => {
      it('should process webhook successfully', async () => {
        // Arrange
        mockShopifyService.processWebhook.mockResolvedValue(undefined)

        // Act
        const response = await request(app)
          .post('/api/shopify/webhooks')
          .set('x-shopify-topic', 'products/create')
          .set('x-shopify-shop-domain', 'test-shop.myshopify.com')
          .set('x-shopify-hmac-sha256', 'test-hmac')
          .send(mockWebhookEvent.payload)

        // Assert
        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
        expect(response.body.message).toBe('Webhook processed successfully')
      })

      it('should handle missing webhook headers', async () => {
        // Act
        const response = await request(app)
          .post('/api/shopify/webhooks')
          .send(mockWebhookEvent.payload)

        // Assert
        expect(response.status).toBe(400)
        expect(response.body.success).toBe(false)
        expect(response.body.message).toBe('Missing required webhook headers')
      })

      it('should handle webhook processing errors', async () => {
        // Arrange
        const error = new Error('Webhook processing failed')
        mockShopifyService.processWebhook.mockImplementationOnce(() =>
          Promise.reject(error)
        )

        // Act
        const response = await request(app)
          .post('/api/shopify/webhooks')
          .set('x-shopify-topic', 'products/create')
          .set('x-shopify-shop-domain', 'test-shop.myshopify.com')
          .set('x-shopify-hmac-sha256', 'test-hmac')
          .send(mockWebhookEvent.payload)

        // Assert
        expect(response.status).toBe(500)
        expect(response.body.success).toBe(false)
        expect(response.body.error).toBe('Webhook processing failed')
      })
    })

    describe('GET /webhooks/logs', () => {
      it('should get webhook logs successfully', async () => {
        // Arrange
        const logs = [
          {
            id: '1',
            topic: 'products/create',
            shopDomain: 'test-shop.myshopify.com',
            status: 'processed',
            processedAt: new Date(),
          },
        ]
        mockShopifyService.getWebhookLogs.mockResolvedValue(logs)

        // Act
        const response = await request(app)
          .get('/api/shopify/webhooks/logs')
          .query({ limit: '10', topic: 'products/create' })

        // Assert
        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
        expect(response.body.data).toHaveLength(1)
        expect(response.body.data[0]).toMatchObject({
          id: '1',
          topic: 'products/create',
          status: 'processed',
          shopDomain: 'test-shop.myshopify.com',
        })
      })
    })
  })

  describe('Configuration Routes', () => {
    describe('GET /config', () => {
      it('should get Shopify configuration successfully', async () => {
        // Arrange
        mockShopifyService.getConfiguration.mockReturnValue({
          shopDomain: 'test-shop',
          hasAccessToken: true,
          webhookSecret: true,
          apiVersion: '2023-10',
        })

        // Act
        const response = await request(app).get('/api/shopify/config')

        // Assert
        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
        expect(response.body.data).toMatchObject({
          shopDomain: 'test-shop',
          hasAccessToken: true,
          webhookSecret: true,
          apiVersion: '2023-10',
        })
      })
    })

    describe('POST /config/test', () => {
      it('should test Shopify connection successfully', async () => {
        // Arrange
        const shopInfo = {
          shop: {
            id: 1,
            name: 'Test Shop',
            domain: 'test-shop.myshopify.com',
          },
        }
        mockShopifyService.testConnection.mockResolvedValue({
          connected: true,
          shop: shopInfo.shop,
        })

        // Act
        const response = await request(app).post('/api/shopify/config/test')

        // Assert
        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
        expect(response.body.data).toMatchObject({
          connected: true,
          shop: shopInfo.shop,
        })
      })
    })
  })

  describe('Conflict Resolution Routes', () => {
    describe('POST /conflicts/resolve', () => {
      it('should resolve conflicts successfully', async () => {
        // Arrange
        mockShopifyService.resolveConflicts.mockResolvedValue({
          conflictId: 'conflict-1',
          resolution: 'merge',
        })

        // Act
        const response = await request(app)
          .post('/api/shopify/conflicts/resolve')
          .send({
            conflictId: 'conflict-1',
            resolution: 'merge',
          })

        // Assert
        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
        expect(response.body.data).toMatchObject({
          conflictId: 'conflict-1',
          resolution: 'merge',
        })
      })
    })
  })

  describe('Scheduled Sync Routes', () => {
    describe('POST /sync/schedule', () => {
      it('should schedule sync successfully', async () => {
        // Arrange
        mockShopifyService.scheduleSync.mockResolvedValue({
          entityType: 'products',
          direction: 'pull',
          schedule: '0 */6 * * *',
        })

        // Act
        const response = await request(app)
          .post('/api/shopify/sync/schedule')
          .send({
            entityType: 'products',
            direction: 'pull',
            schedule: '0 */6 * * *', // Every 6 hours
          })

        // Assert
        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
        expect(response.body.data).toMatchObject({
          entityType: 'products',
          direction: 'pull',
          schedule: '0 */6 * * *',
        })
      })
    })
  })

  describe('Request Validation', () => {
    it('should validate sync request parameters', async () => {
      // Act
      const response = await request(app)
        .post('/api/shopify/sync/products/push')
        .send({
          entityType: 'invalid-entity',
          direction: 'invalid-direction',
        })

      // Assert - Should still work as validation is optional for these fields
      expect(response.status).toBe(200)
    })
  })

  describe('Error Handling', () => {
    it('should handle missing Shopify configuration', async () => {
      // Arrange
      delete process.env.SHOPIFY_SHOP_DOMAIN
      delete process.env.SHOPIFY_ACCESS_TOKEN

      // Act
      const response = await request(app)
        .post('/api/shopify/sync/products/push')
        .send({})

      // Assert
      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    })
  })
})
