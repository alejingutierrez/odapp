import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import request from 'supertest'
import express from 'express'

import shopifyRoutes from '../routes/shopify'
import {
  mockSyncResult,
  mockSyncStatus,
  mockWebhookEvent,
} from './mocks/shopify-mocks'

// Mock dependencies
vi.mock('@prisma/client')
vi.mock('../services/shopify.service')
vi.mock('../lib/webhook-processor')
vi.mock('../middleware/auth', () => ({
  authenticateToken: (req: any, res: any, next: any) => next(),
}))

const mockPrisma = {
  syncStatus: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  webhookLog: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
} as any

const mockShopifyService = {
  syncProductsToShopify: vi.fn(),
  syncProductsFromShopify: vi.fn(),
  syncInventoryToShopify: vi.fn(),
  importOrdersFromShopify: vi.fn(),
  syncCustomersFromShopify: vi.fn(),
  triggerFullSync: vi.fn(),
  getSyncStatus: vi.fn(),
  getSyncHistory: vi.fn(),
  getCircuitBreakerStatus: vi.fn(),
}

const mockWebhookProcessor = {
  process: vi.fn(),
}

describe('Shopify Routes', () => {
  let app: express.Application

  beforeEach(() => {
    vi.clearAllMocks()

    app = express()
    app.use(express.json())
    app.use('/api/shopify', shopifyRoutes)

    // Mock environment variables
    process.env.SHOPIFY_SHOP_DOMAIN = 'test-shop'
    process.env.SHOPIFY_ACCESS_TOKEN = 'test-token'
    process.env.SHOPIFY_WEBHOOK_SECRET = 'test-secret'
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Product Sync Routes', () => {
    describe('POST /sync/products/push', () => {
      it('should sync products to Shopify successfully', async () => {
        // Arrange
        mockShopifyService.syncProductsToShopify.mockResolvedValue(
          mockSyncResult
        )

        // Act
        const response = await request(app)
          .post('/api/shopify/sync/products/push')
          .send({})

        // Assert
        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
        expect(response.body.data).toEqual(mockSyncResult)
      })

      it('should handle sync errors', async () => {
        // Arrange
        const error = new Error('Sync failed')
        mockShopifyService.syncProductsToShopify.mockRejectedValue(error)

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
        mockShopifyService.getSyncStatus.mockResolvedValue(statuses)

        // Act
        const response = await request(app).get('/api/shopify/sync/status')

        // Assert
        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
        expect(response.body.data).toEqual(statuses)
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
        expect(response.body.data).toEqual(history)
        expect(mockShopifyService.getSyncHistory).toHaveBeenCalledWith(
          'products'
        )
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

        // Mock the SyncStatusManager
        const { SyncStatusManager } = await import('../lib/sync-status-manager')
        vi.mocked(SyncStatusManager.prototype.getSyncMetrics).mockResolvedValue(
          metrics
        )

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
        mockWebhookProcessor.process.mockResolvedValue(undefined)

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
        mockWebhookProcessor.process.mockRejectedValue(error)

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
        expect(response.body.message).toBe('Webhook processing failed')
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
        mockPrisma.webhookLog.findMany.mockResolvedValue(logs)

        // Act
        const response = await request(app)
          .get('/api/shopify/webhooks/logs')
          .query({ limit: '10', topic: 'products/create' })

        // Assert
        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
        expect(response.body.data).toEqual(logs)
        expect(mockPrisma.webhookLog.findMany).toHaveBeenCalledWith({
          where: { topic: 'products/create' },
          orderBy: { processedAt: 'desc' },
          take: 10,
        })
      })
    })
  })

  describe('Configuration Routes', () => {
    describe('GET /config', () => {
      it('should get Shopify configuration successfully', async () => {
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

        // Mock the axios client get method
        const mockGet = vi.fn().mockResolvedValue({ data: shopInfo })
        vi.doMock('../services/shopify.service', () => ({
          ShopifyService: vi.fn().mockImplementation(() => ({
            client: { get: mockGet },
          })),
        }))

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
      expect(response.status).toBe(500)
      expect(response.body.success).toBe(false)
    })
  })
})
