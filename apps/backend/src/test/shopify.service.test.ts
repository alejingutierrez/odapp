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

vi.mock('@prisma/client', () => {
  // Create mock prisma instance inside the mock
  const mockPrismaInstance = {
    product: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    inventoryItem: {
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
    $transaction: vi.fn(),
  }
  
  // Make it globally accessible
  globalThis.mockPrisma = mockPrismaInstance
  
  return {
  PrismaClient: vi.fn().mockImplementation(() => mockPrismaInstance),
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

const mockedAxios = axios as any

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

    // Mock CircuitBreaker
    const mockCircuitBreaker = {
      isOpen: vi.fn().mockReturnValue(false),
      getFailureCount: vi.fn().mockReturnValue(0),
      execute: vi.fn().mockImplementation(async (fn) => fn()),
    }

    // Setup default mock implementations
    mockPrisma.syncStatus.create.mockResolvedValue({ id: 'sync-1' })
    mockPrisma.syncStatus.update.mockResolvedValue({})
    mockPrisma.syncStatus.findMany.mockResolvedValue([])
    mockPrisma.product.findMany.mockResolvedValue([])
    mockPrisma.product.findFirst.mockResolvedValue(null)
    mockPrisma.product.create.mockResolvedValue({})
    mockPrisma.product.update.mockResolvedValue({})
    mockPrisma.inventoryItem.findMany.mockResolvedValue([])
    mockPrisma.inventoryItem.update.mockResolvedValue({})
    mockPrisma.inventoryItem.upsert.mockResolvedValue({})
    mockPrisma.order.findFirst.mockResolvedValue(null)
    mockPrisma.order.create.mockResolvedValue({})
    mockPrisma.order.update.mockResolvedValue({})
    mockPrisma.customer.findFirst.mockResolvedValue(null)
    mockPrisma.customer.create.mockResolvedValue({})
    mockPrisma.customer.update.mockResolvedValue({})
    mockPrisma.$transaction.mockImplementation(async (callback) => {
      return await callback(mockPrisma)
    })

    // Initialize service
    shopifyService = new ShopifyService(mockPrisma, 'test-shop', 'test-token', mockCircuitBreaker as any)
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

        mockPrisma.product.findMany.mockResolvedValue(mockProducts)
        mockAxiosInstance.get.mockResolvedValue({
          data: { products: [] },
          headers: {},
        })
        mockAxiosInstance.post.mockResolvedValue({
          data: { product: mockShopifyProduct },
          headers: {},
        })

        // Act
        const result = await shopifyService.syncProductsToShopify()

        // Assert
        expect(result).toEqual({
          syncId: expect.any(String),
          successful: 1,
          failed: 0,
          total: 1,
          errors: [],
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

        mockPrisma.product.findMany.mockResolvedValue(mockProducts)
        mockAxiosInstance.get.mockResolvedValue({
          data: { products: [] },
          headers: {},
        })
        mockAxiosInstance.post.mockRejectedValue(new Error('API Error'))

        // Act
        const result = await shopifyService.syncProductsToShopify()

        // Assert
        expect(result.failed).toBe(1)
        expect(result.errors).toHaveLength(1)
        expect(mockPrisma.syncStatus.update).toHaveBeenCalledWith({
          where: { id: 'sync-1' },
          data: expect.objectContaining({
            status: 'failed',
          }),
        })
      })
    })
  })

  describe('Inventory Synchronization', () => {
    describe('syncInventoryToShopify', () => {
      it('should sync inventory to Shopify successfully', async () => {
        // Arrange
        const mockInventoryItems = [
          {
            id: 'inv-1',
            productId: 'prod-1',
            locationId: 'loc-1',
            quantity: 10,
            syncStatus: 'pending',
          },
        ]

        mockPrisma.inventoryItem.findMany.mockResolvedValue(mockInventoryItems)
        mockAxiosInstance.post.mockResolvedValue({
          data: { inventory_level: { available: 10 } },
          headers: {},
        })

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
        mockAxiosInstance.get.mockResolvedValue({
          data: { orders: [mockShopifyOrder] },
          headers: {},
        })

        // Act
        const result = await shopifyService.importOrdersFromShopify()

        // Assert
        expect(result.successful).toBe(1)
        expect(result.failed).toBe(0)
        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/orders.json', {
          params: expect.objectContaining({
            limit: 250,
            status: 'any',
          }),
        })
      })
    })
  })

  describe('Customer Synchronization', () => {
    describe('syncCustomersFromShopify', () => {
      it('should handle customer deduplication', async () => {
        // Arrange
        const existingCustomer = {
          id: 'existing-1',
          email: 'test@example.com',
          shopifyId: null,
        }

        mockAxiosInstance.get.mockResolvedValue({
          data: { customers: [mockShopifyCustomer] },
          headers: {},
        })
        mockPrisma.customer.findFirst.mockResolvedValue(existingCustomer)

        // Act
        const result = await shopifyService.syncCustomersFromShopify()

        // Assert
        expect(result.successful).toBe(1)
        expect(mockPrisma.customer.update).toHaveBeenCalledWith({
          where: { id: existingCustomer.id },
          data: expect.objectContaining({
            shopifyId: '1',
          }),
        })
      })
    })
  })

  describe('Full Sync', () => {
    describe('triggerFullSync', () => {
      it('should trigger full sync for all entities', async () => {
        // Arrange
        mockAxiosInstance.get.mockResolvedValue({
          data: { products: [], orders: [], customers: [] },
          headers: {},
        })

        // Act
        const result = await shopifyService.triggerFullSync()

        // Assert
        expect(result).toBeDefined()
        expect(mockPrisma.syncStatus.create).toHaveBeenCalled()
      })
    })
  })

  describe('Circuit Breaker', () => {
    it('should open circuit breaker after failures', async () => {
      // Arrange
      mockAxiosInstance.get.mockRejectedValue(new Error('Network Error'))

      // Act - Make multiple failed requests
      for (let i = 0; i < 5; i++) {
        try {
          await shopifyService.getProducts()
        } catch (error) {
          // Expected to fail
        }
      }

      const circuitBreakerStatus = shopifyService.getCircuitBreakerStatus()
      expect(circuitBreakerStatus.failureCount).toBeGreaterThan(0)
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // Arrange
      mockAxiosInstance.get.mockRejectedValue(new Error('Network Error'))

      // Act
      const result = await shopifyService.syncProductsToShopify()

      // Assert
      expect(mockPrisma.syncStatus.update).toHaveBeenCalledWith({
        where: { id: 'sync-1' },
        data: expect.objectContaining({
          status: 'failed',
        }),
      })
    })
  })

  describe('Sync Status Management', () => {
    it('should track sync progress correctly', async () => {
      // Arrange
      mockPrisma.syncStatus.findMany.mockResolvedValue([
        {
          id: 'sync-1',
          entityType: 'products',
          status: 'completed',
          startedAt: new Date(),
          completedAt: new Date(),
        },
      ])

      // Act
      const statuses = await shopifyService.getSyncStatuses()

      // Assert
      expect(statuses).toHaveLength(1)
      expect(statuses[0]).toMatchObject({
        entityType: 'products',
        status: 'completed',
      })
    })
  })
})
