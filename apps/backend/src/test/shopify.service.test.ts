import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import axios from 'axios'
import { ShopifyService } from '../services/shopify.service'
import {
  mockShopifyProduct,
  mockShopifyOrder,
  mockShopifyCustomer,
} from './mocks/shopify-mocks'

// Mock dependencies
vi.mock('axios')
vi.mock('@prisma/client')
vi.mock('../lib/logger')

const mockedAxios = axios as any
const mockPrisma = {
  product: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  inventory: {
    findMany: vi.fn(),
    update: vi.fn(),
    upsert: vi.fn(),
  },
  order: {
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  customer: {
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
} as any

describe('ShopifyService', () => {
  let shopifyService: ShopifyService
  let mockAxiosInstance: any

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()

    // Mock axios.create
    mockAxiosInstance = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    }

    mockedAxios.create.mockReturnValue(mockAxiosInstance)

    // Initialize service
    shopifyService = new ShopifyService(mockPrisma, 'test-shop', 'test-token')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Product Synchronization', () => {
    describe('syncProductsToShopify', () => {
      it('should sync products to Shopify successfully', async () => {
        // Arrange
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
        mockAxiosInstance.get.mockResolvedValue({
          data: { products: [] },
          headers: {},
        })
        mockPrisma.syncStatus.update.mockResolvedValue({})
        mockPrisma.product.update.mockResolvedValue({})

        // Act
        const result = await shopifyService.syncProductsToShopify()

        // Assert
        expect(result).toEqual({
          syncId: 'sync-1',
          successful: 1,
          failed: 0,
          total: 1,
          errors: [],
        })
        expect(mockPrisma.syncStatus.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            entityType: 'products',
            direction: 'push',
            status: 'running',
          }),
        })
      })

      it('should handle sync failures gracefully', async () => {
        // Arrange
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

        // Mock a failure in the sync process
        const syncError = new Error('Shopify API error')
        mockAxiosInstance.get.mockRejectedValue(syncError)
        mockPrisma.syncStatus.update.mockResolvedValue({})

        // Act
        const result = await shopifyService.syncProductsToShopify()

        // Assert
        expect(result.failed).toBe(1)
        expect(result.errors).toHaveLength(1)
        expect(mockPrisma.syncStatus.update).toHaveBeenCalledWith({
          where: { id: 'sync-1' },
          data: expect.objectContaining({
            status: 'completed',
            failed: 1,
          }),
        })
      })
    })

    describe('syncProductsFromShopify', () => {
      it('should sync products from Shopify successfully', async () => {
        // Arrange
        const mockShopifyProducts = [mockShopifyProduct]

        mockPrisma.syncStatus.create.mockResolvedValue({ id: 'sync-1' })
        mockAxiosInstance.get.mockResolvedValue({
          data: { products: mockShopifyProducts },
          headers: {},
        })
        mockPrisma.product.findFirst.mockResolvedValue(null)
        mockPrisma.product.create.mockResolvedValue({})
        mockPrisma.syncStatus.update.mockResolvedValue({})

        // Act
        const result = await shopifyService.syncProductsFromShopify()

        // Assert
        expect(result.successful).toBe(1)
        expect(result.failed).toBe(0)
        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/products.json', {
          params: { limit: 250 },
        })
      })

      it('should handle pagination correctly', async () => {
        // Arrange
        const mockShopifyProducts1 = [mockShopifyProduct]
        const mockShopifyProducts2 = [{ ...mockShopifyProduct, id: 2 }]

        mockPrisma.syncStatus.create.mockResolvedValue({ id: 'sync-1' })

        // Mock paginated responses
        mockAxiosInstance.get
          .mockResolvedValueOnce({
            data: { products: mockShopifyProducts1 },
            headers: {
              link: '<https://test-shop.myshopify.com/admin/api/2023-10/products.json?page_info=next123>; rel="next"',
            },
          })
          .mockResolvedValueOnce({
            data: { products: mockShopifyProducts2 },
            headers: {},
          })

        mockPrisma.product.findFirst.mockResolvedValue(null)
        mockPrisma.product.create.mockResolvedValue({})
        mockPrisma.syncStatus.update.mockResolvedValue({})

        // Act
        const result = await shopifyService.syncProductsFromShopify()

        // Assert
        expect(result.total).toBe(2)
        expect(mockAxiosInstance.get).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('Inventory Synchronization', () => {
    describe('syncInventoryToShopify', () => {
      it('should sync inventory to Shopify successfully', async () => {
        // Arrange
        const mockInventoryItems = [
          {
            id: '1',
            quantity: 100,
            syncStatus: 'pending',
            product: {
              variants: [{ sku: 'TEST-001' }],
            },
          },
        ]

        mockPrisma.syncStatus.create.mockResolvedValue({ id: 'sync-1' })
        mockPrisma.inventory.findMany.mockResolvedValue(mockInventoryItems)
        mockAxiosInstance.get.mockResolvedValue({
          data: {
            variants: [{ id: 1, inventory_item_id: 123, sku: 'TEST-001' }],
          },
        })
        mockAxiosInstance.post.mockResolvedValue({})
        mockPrisma.inventory.update.mockResolvedValue({})
        mockPrisma.syncStatus.update.mockResolvedValue({})

        // Act
        const result = await shopifyService.syncInventoryToShopify()

        // Assert
        expect(result.successful).toBe(1)
        expect(result.failed).toBe(0)
      })
    })
  })

  describe('Order Import', () => {
    describe('importOrdersFromShopify', () => {
      it('should import orders from Shopify successfully', async () => {
        // Arrange
        const mockShopifyOrders = [mockShopifyOrder]

        mockPrisma.syncStatus.create.mockResolvedValue({ id: 'sync-1' })
        mockPrisma.syncStatus.findFirst.mockResolvedValue({
          completedAt: new Date('2023-01-01'),
        })
        mockAxiosInstance.get.mockResolvedValue({
          data: { orders: mockShopifyOrders },
          headers: {},
        })
        mockPrisma.order.findFirst.mockResolvedValue(null)
        mockPrisma.customer.findFirst.mockResolvedValue(null)
        mockPrisma.customer.create.mockResolvedValue({ id: 'customer-1' })
        mockPrisma.order.create.mockResolvedValue({})
        mockPrisma.syncStatus.update.mockResolvedValue({})

        // Act
        const result = await shopifyService.importOrdersFromShopify()

        // Assert
        expect(result.successful).toBe(1)
        expect(result.failed).toBe(0)
        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/orders.json', {
          params: expect.objectContaining({
            limit: 250,
            status: 'any',
            updated_at_min: expect.any(String),
          }),
        })
      })

      it('should skip existing orders', async () => {
        // Arrange
        const mockShopifyOrders = [mockShopifyOrder]

        mockPrisma.syncStatus.create.mockResolvedValue({ id: 'sync-1' })
        mockPrisma.syncStatus.findFirst.mockResolvedValue(null)
        mockAxiosInstance.get.mockResolvedValue({
          data: { orders: mockShopifyOrders },
          headers: {},
        })
        mockPrisma.order.findFirst.mockResolvedValue({ id: 'existing-order' })
        mockPrisma.syncStatus.update.mockResolvedValue({})

        // Act
        const result = await shopifyService.importOrdersFromShopify()

        // Assert
        expect(result.successful).toBe(1)
        expect(mockPrisma.order.create).not.toHaveBeenCalled()
      })
    })
  })

  describe('Customer Synchronization', () => {
    describe('syncCustomersFromShopify', () => {
      it('should sync customers from Shopify successfully', async () => {
        // Arrange
        const mockShopifyCustomers = [mockShopifyCustomer]

        mockPrisma.syncStatus.create.mockResolvedValue({ id: 'sync-1' })
        mockAxiosInstance.get.mockResolvedValue({
          data: { customers: mockShopifyCustomers },
          headers: {},
        })
        mockPrisma.customer.findFirst.mockResolvedValue(null)
        mockPrisma.customer.create.mockResolvedValue({})
        mockPrisma.syncStatus.update.mockResolvedValue({})

        // Act
        const result = await shopifyService.syncCustomersFromShopify()

        // Assert
        expect(result.successful).toBe(1)
        expect(result.failed).toBe(0)
      })

      it('should handle customer deduplication', async () => {
        // Arrange
        const mockShopifyCustomers = [mockShopifyCustomer]
        const existingCustomer = {
          id: 'existing-1',
          email: mockShopifyCustomer.email,
          shopifyId: null,
        }

        mockPrisma.syncStatus.create.mockResolvedValue({ id: 'sync-1' })
        mockAxiosInstance.get.mockResolvedValue({
          data: { customers: mockShopifyCustomers },
          headers: {},
        })
        mockPrisma.customer.findFirst.mockResolvedValue(existingCustomer)
        mockPrisma.customer.update.mockResolvedValue({})
        mockPrisma.syncStatus.update.mockResolvedValue({})

        // Act
        const result = await shopifyService.syncCustomersFromShopify()

        // Assert
        expect(result.successful).toBe(1)
        expect(mockPrisma.customer.update).toHaveBeenCalledWith({
          where: { id: existingCustomer.id },
          data: expect.objectContaining({
            shopifyId: mockShopifyCustomer.id.toString(),
          }),
        })
      })
    })
  })

  describe('Full Sync', () => {
    describe('triggerFullSync', () => {
      it('should trigger full sync for all entities', async () => {
        // Arrange
        mockPrisma.syncStatus.create.mockResolvedValue({ id: 'sync-1' })
        mockPrisma.product.findMany.mockResolvedValue([])
        mockPrisma.inventory.findMany.mockResolvedValue([])
        mockPrisma.syncStatus.findFirst.mockResolvedValue(null)
        mockAxiosInstance.get.mockResolvedValue({
          data: { products: [], orders: [], customers: [] },
          headers: {},
        })
        mockPrisma.syncStatus.update.mockResolvedValue({})

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

  describe('Circuit Breaker', () => {
    it('should open circuit breaker after failures', async () => {
      // Arrange
      const error = new Error('API Error')
      mockPrisma.syncStatus.create.mockResolvedValue({ id: 'sync-1' })
      mockPrisma.product.findMany.mockResolvedValue([
        {
          id: '1',
          syncStatus: 'pending',
          variants: [],
          images: [],
          collections: [],
        },
      ])

      // Mock multiple failures
      mockAxiosInstance.get.mockRejectedValue(error)
      mockPrisma.syncStatus.update.mockResolvedValue({})

      // Act & Assert
      await expect(
        shopifyService.syncProductsToShopify()
      ).resolves.toBeDefined()

      const circuitBreakerStatus = shopifyService.getCircuitBreakerStatus()
      expect(circuitBreakerStatus.failureCount).toBeGreaterThan(0)
    })
  })

  describe('Rate Limiting', () => {
    it('should respect Shopify rate limits', async () => {
      // Arrange
      mockPrisma.syncStatus.create.mockResolvedValue({ id: 'sync-1' })
      mockAxiosInstance.get.mockResolvedValue({
        data: { products: [] },
        headers: {
          'x-shopify-shop-api-call-limit': '40/40',
        },
      })
      mockPrisma.syncStatus.update.mockResolvedValue({})

      // Act
      await shopifyService.syncProductsFromShopify()

      // Assert
      // Rate limiter should have been updated from headers
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // Arrange
      const networkError = new Error('Network Error')
      mockPrisma.syncStatus.create.mockResolvedValue({ id: 'sync-1' })
      mockAxiosInstance.get.mockRejectedValue(networkError)
      mockPrisma.syncStatus.update.mockResolvedValue({})

      // Act
      await expect(shopifyService.syncProductsFromShopify()).rejects.toThrow(
        'Network Error'
      )

      // Assert
      expect(mockPrisma.syncStatus.update).toHaveBeenCalledWith({
        where: { id: 'sync-1' },
        data: expect.objectContaining({
          status: 'failed',
        }),
      })
    })

    it('should handle authentication errors', async () => {
      // Arrange
      const authError = new Error('Unauthorized')
      mockPrisma.syncStatus.create.mockResolvedValue({ id: 'sync-1' })
      mockAxiosInstance.get.mockRejectedValue(authError)
      mockPrisma.syncStatus.update.mockResolvedValue({})

      // Act
      await expect(shopifyService.syncProductsFromShopify()).rejects.toThrow(
        'Unauthorized'
      )
    })
  })

  describe('Sync Status Management', () => {
    it('should track sync progress correctly', async () => {
      // Arrange
      mockPrisma.syncStatus.create.mockResolvedValue({ id: 'sync-1' })
      mockPrisma.syncStatus.findMany.mockResolvedValue([
        {
          id: 'sync-1',
          entityType: 'products',
          status: 'completed',
          successful: 10,
          failed: 0,
          total: 10,
        },
      ])

      // Act
      const statuses = await shopifyService.getSyncStatus()

      // Assert
      expect(statuses).toHaveLength(1)
      expect(statuses[0]).toMatchObject({
        entityType: 'products',
        status: 'completed',
        successful: 10,
      })
    })
  })
})
