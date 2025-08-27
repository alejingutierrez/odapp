import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import express from 'express'
import { AdjustmentType } from '@prisma/client'
import { authenticate } from '../middleware/auth'
import { errorHandler } from '../middleware/error-handler'

// Mock dependencies first
vi.mock('../middleware/auth', () => ({
  authenticate: vi.fn((req: unknown, res: unknown, next: unknown) => {
    const reqTyped = req as { user: unknown }
    const nextTyped = next as () => void
    reqTyped.user = { id: 'user1', roles: ['admin'] }
    nextTyped()
  }),
  authRateLimit: () => (req: unknown, res: unknown, next: unknown) => {
    const nextTyped = next as () => void
    nextTyped()
  },
  requireTwoFactor: (req: unknown, res: unknown, next: unknown) => {
    const nextTyped = next as () => void
    nextTyped()
  },
}))

vi.mock('../services/inventory.service')
vi.mock('../services/websocket.service')

// Import after mocking
import { createInventoryRouter } from '../routes/inventory'
import { InventoryService } from '../services/inventory.service'
import { WebSocketService } from '../services/websocket.service'

const _mockAuthMiddleware = vi.mocked(authenticate)
const _MockInventoryService = vi.mocked(InventoryService)
const _MockWebSocketService = vi.mocked(WebSocketService)

describe('Inventory Routes', () => {
  let app: express.Application
  let mockInventoryService: Record<string, ReturnType<typeof vi.fn>>
  let mockWebSocketService: Record<string, unknown>
  let mockPrisma: Record<string, unknown>

  beforeEach(() => {
    vi.clearAllMocks()

    // Setup Express app
    app = express()
    app.use(express.json())

    // Auth middleware is already mocked above

    // Create mock services
    mockInventoryService = {
      getInventoryByLocation: vi.fn(),
      getInventoryByProduct: vi.fn(),
      getTotalInventory: vi.fn(),
      updateStockLevel: vi.fn(),
      bulkUpdateStockLevels: vi.fn(),
      createReservation: vi.fn(),
      releaseReservation: vi.fn(),
      fulfillReservation: vi.fn(),
      createAdjustment: vi.fn(),
      getInventoryMovementHistory: vi.fn(),
      createTransfer: vi.fn(),
      shipTransfer: vi.fn(),
      receiveTransfer: vi.fn(),
      getLowStockItems: vi.fn(),
      updateLowStockThreshold: vi.fn(),
      getInventoryReport: vi.fn(),
      getInventoryTrends: vi.fn(),
      cleanupExpiredReservations: vi.fn(),
    }

    mockWebSocketService = {}
    mockPrisma = {}

    // Create router with mocked services
    const inventoryRouter = createInventoryRouter(
      mockInventoryService as any,
      mockWebSocketService as any
    )
    app.use('/api/v1/inventory', inventoryRouter)
  })

  describe('GET /api/v1/inventory', () => {
    it('should retrieve inventory items for a location', async () => {
      const mockInventory = [
        {
          id: 'inv1',
          locationId: 'loc1',
          quantity: 100,
          product: { name: 'Test Product' },
        },
      ]

      mockInventoryService.getInventoryByLocation.mockResolvedValue(
        mockInventory
      )

      const response = await request(app)
        .get('/api/v1/inventory')
        .query({ locationId: 'loc1' })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockInventory)
      expect(mockInventoryService.getInventoryByLocation).toHaveBeenCalledWith(
        'loc1',
        {
          productIds: undefined,
          lowStockOnly: false,
          includeZeroStock: false,
        }
      )
    })

    it('should handle query parameters correctly', async () => {
      mockInventoryService.getInventoryByLocation.mockResolvedValue([])

      await request(app)
        .get('/api/v1/inventory')
        .query({
          locationId: 'loc1',
          productIds: 'prod1,prod2',
          lowStockOnly: 'true',
          includeZeroStock: 'false',
        })
        .expect(200)

      expect(mockInventoryService.getInventoryByLocation).toHaveBeenCalledWith(
        'loc1',
        {
          productIds: ['prod1', 'prod2'],
          lowStockOnly: true,
          includeZeroStock: false,
        }
      )
    })

    it('should use inventory report when no location specified', async () => {
      const mockReport = { items: [], totals: {} }
      mockInventoryService.getInventoryReport.mockResolvedValue(mockReport)

      const response = await request(app).get('/api/v1/inventory').expect(200)

      expect(response.body.data).toEqual(mockReport)
      expect(mockInventoryService.getInventoryReport).toHaveBeenCalled()
    })
  })

  describe('GET /api/v1/inventory/product/:productId', () => {
    it('should retrieve inventory for a specific product', async () => {
      const mockInventory = [
        { id: 'inv1', locationId: 'loc1', quantity: 50 },
        { id: 'inv2', locationId: 'loc2', quantity: 30 },
      ]
      const mockTotals = {
        totalQuantity: 80,
        totalReserved: 10,
        totalAvailable: 70,
      }

      mockInventoryService.getInventoryByProduct.mockResolvedValue(
        mockInventory
      )
      mockInventoryService.getTotalInventory.mockResolvedValue(mockTotals)

      const response = await request(app)
        .get('/api/v1/inventory/product/prod1')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual({
        inventory: mockInventory,
        totals: mockTotals,
      })
      expect(mockInventoryService.getInventoryByProduct).toHaveBeenCalledWith(
        'prod1',
        undefined
      )
      expect(mockInventoryService.getTotalInventory).toHaveBeenCalledWith(
        'prod1',
        undefined
      )
    })

    it('should handle variant ID parameter', async () => {
      mockInventoryService.getInventoryByProduct.mockResolvedValue([])
      mockInventoryService.getTotalInventory.mockResolvedValue({})

      await request(app)
        .get('/api/v1/inventory/product/prod1')
        .query({ variantId: 'var1' })
        .expect(200)

      expect(mockInventoryService.getInventoryByProduct).toHaveBeenCalledWith(
        'prod1',
        'var1'
      )
      expect(mockInventoryService.getTotalInventory).toHaveBeenCalledWith(
        'prod1',
        'var1'
      )
    })
  })

  describe('PUT /api/v1/inventory/:inventoryItemId/stock', () => {
    it('should update stock level successfully', async () => {
      const updatedItem = {
        id: 'inv1',
        quantity: 150,
        availableQuantity: 140,
      }

      mockInventoryService.updateStockLevel.mockResolvedValue(updatedItem)

      const response = await request(app)
        .put('/api/v1/inventory/inv1/stock')
        .send({
          quantity: 150,
          reason: 'Stock replenishment',
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(updatedItem)
      expect(mockInventoryService.updateStockLevel).toHaveBeenCalledWith(
        'inv1',
        150,
        'Stock replenishment',
        'user1'
      )
    })

    it('should validate request body', async () => {
      await request(app)
        .put('/api/v1/inventory/inv1/stock')
        .send({
          quantity: -10, // Invalid negative quantity
        })
        .expect(400)

      expect(mockInventoryService.updateStockLevel).not.toHaveBeenCalled()
    })

    it('should require quantity field', async () => {
      await request(app)
        .put('/api/v1/inventory/inv1/stock')
        .send({
          reason: 'Test',
        })
        .expect(400)

      expect(mockInventoryService.updateStockLevel).not.toHaveBeenCalled()
    })
  })

  describe('PUT /api/v1/inventory/bulk-update', () => {
    it('should perform bulk update successfully', async () => {
      const mockResults = [
        { success: true, inventoryItemId: 'inv1', result: { id: 'inv1' } },
        { success: true, inventoryItemId: 'inv2', result: { id: 'inv2' } },
      ]

      mockInventoryService.bulkUpdateStockLevels.mockResolvedValue(mockResults)

      const response = await request(app)
        .put('/api/v1/inventory/bulk-update')
        .send({
          updates: [
            { inventoryItemId: 'inv1', quantity: 100, reason: 'Restock' },
            { inventoryItemId: 'inv2', quantity: 50, reason: 'Adjustment' },
          ],
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.results).toEqual(mockResults)
      expect(response.body.data.summary).toEqual({
        total: 2,
        successful: 2,
        failed: 0,
      })
    })

    it('should handle partial failures', async () => {
      const mockResults = [
        { success: true, inventoryItemId: 'inv1', result: { id: 'inv1' } },
        { success: false, inventoryItemId: 'inv2', error: 'Not found' },
      ]

      mockInventoryService.bulkUpdateStockLevels.mockResolvedValue(mockResults)

      const response = await request(app)
        .put('/api/v1/inventory/bulk-update')
        .send({
          updates: [
            { inventoryItemId: 'inv1', quantity: 100 },
            { inventoryItemId: 'inv2', quantity: 50 },
          ],
        })
        .expect(200)

      expect(response.body.data.summary).toEqual({
        total: 2,
        successful: 1,
        failed: 1,
      })
    })

    it('should validate updates array', async () => {
      await request(app)
        .put('/api/v1/inventory/bulk-update')
        .send({
          updates: [], // Empty array
        })
        .expect(400)

      expect(mockInventoryService.bulkUpdateStockLevels).not.toHaveBeenCalled()
    })
  })

  describe('POST /api/v1/inventory/:inventoryItemId/reservations', () => {
    it('should create reservation successfully', async () => {
      const mockReservation = {
        id: 'res1',
        inventoryItemId: 'inv1',
        quantity: 20,
        reason: 'Order pending',
      }

      mockInventoryService.createReservation.mockResolvedValue(mockReservation)

      const response = await request(app)
        .post('/api/v1/inventory/inv1/reservations')
        .send({
          quantity: 20,
          reason: 'Order pending',
          referenceId: 'order1',
        })
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockReservation)
      expect(mockInventoryService.createReservation).toHaveBeenCalledWith({
        inventoryItemId: 'inv1',
        quantity: 20,
        reason: 'Order pending',
        referenceId: 'order1',
        expiresAt: undefined,
      })
    })

    it('should validate required fields', async () => {
      await request(app)
        .post('/api/v1/inventory/inv1/reservations')
        .send({
          quantity: 20,
          // Missing reason
        })
        .expect(400)

      expect(mockInventoryService.createReservation).not.toHaveBeenCalled()
    })

    it('should validate quantity is positive', async () => {
      await request(app)
        .post('/api/v1/inventory/inv1/reservations')
        .send({
          quantity: 0,
          reason: 'Test',
        })
        .expect(400)

      expect(mockInventoryService.createReservation).not.toHaveBeenCalled()
    })
  })

  describe('DELETE /api/v1/inventory/reservations/:reservationId', () => {
    it('should release reservation successfully', async () => {
      mockInventoryService.releaseReservation.mockResolvedValue(true)

      const response = await request(app)
        .delete('/api/v1/inventory/reservations/res1')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(mockInventoryService.releaseReservation).toHaveBeenCalledWith(
        'res1'
      )
    })
  })

  describe('POST /api/v1/inventory/reservations/:reservationId/fulfill', () => {
    it('should fulfill reservation successfully', async () => {
      mockInventoryService.fulfillReservation.mockResolvedValue(true)

      const response = await request(app)
        .post('/api/v1/inventory/reservations/res1/fulfill')
        .send({
          quantityFulfilled: 15,
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(mockInventoryService.fulfillReservation).toHaveBeenCalledWith(
        'res1',
        15
      )
    })

    it('should validate quantityFulfilled is positive', async () => {
      await request(app)
        .post('/api/v1/inventory/reservations/res1/fulfill')
        .send({
          quantityFulfilled: 0,
        })
        .expect(400)

      expect(mockInventoryService.fulfillReservation).not.toHaveBeenCalled()
    })
  })

  describe('POST /api/v1/inventory/:inventoryItemId/adjustments', () => {
    it('should create adjustment successfully', async () => {
      const mockAdjustment = {
        id: 'adj1',
        inventoryItemId: 'inv1',
        type: AdjustmentType.INCREASE,
        quantityChange: 25,
      }

      mockInventoryService.createAdjustment.mockResolvedValue(mockAdjustment)

      const response = await request(app)
        .post('/api/v1/inventory/inv1/adjustments')
        .send({
          type: 'INCREASE',
          quantityChange: 25,
          reason: 'Stock replenishment',
          notes: 'Received new shipment',
        })
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockAdjustment)
      expect(mockInventoryService.createAdjustment).toHaveBeenCalledWith({
        inventoryItemId: 'inv1',
        type: AdjustmentType.INCREASE,
        quantityChange: 25,
        reason: 'Stock replenishment',
        notes: 'Received new shipment',
        unitCost: undefined,
        referenceType: undefined,
        referenceId: undefined,
        userId: 'user1',
      })
    })

    it('should validate adjustment type', async () => {
      await request(app)
        .post('/api/v1/inventory/inv1/adjustments')
        .send({
          type: 'INVALID_TYPE',
          quantityChange: 25,
        })
        .expect(400)

      expect(mockInventoryService.createAdjustment).not.toHaveBeenCalled()
    })

    it('should validate quantityChange is non-negative', async () => {
      await request(app)
        .post('/api/v1/inventory/inv1/adjustments')
        .send({
          type: 'INCREASE',
          quantityChange: -5,
        })
        .expect(400)

      expect(mockInventoryService.createAdjustment).not.toHaveBeenCalled()
    })
  })

  describe('GET /api/v1/inventory/:inventoryItemId/history', () => {
    it('should retrieve movement history', async () => {
      const mockHistory = [
        {
          id: 'adj1',
          type: AdjustmentType.INCREASE,
          quantityChange: 25,
          createdAt: '2023-01-01T00:00:00.000Z',
        },
      ]

      mockInventoryService.getInventoryMovementHistory.mockResolvedValue(
        mockHistory
      )

      const response = await request(app)
        .get('/api/v1/inventory/inv1/history')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockHistory)
      expect(
        mockInventoryService.getInventoryMovementHistory
      ).toHaveBeenCalledWith('inv1', undefined, undefined)
    })

    it('should handle date range parameters', async () => {
      mockInventoryService.getInventoryMovementHistory.mockResolvedValue([])

      await request(app)
        .get('/api/v1/inventory/inv1/history')
        .query({
          dateFrom: '2023-01-01',
          dateTo: '2023-01-31',
        })
        .expect(200)

      expect(
        mockInventoryService.getInventoryMovementHistory
      ).toHaveBeenCalledWith(
        'inv1',
        new Date('2023-01-01'),
        new Date('2023-01-31')
      )
    })
  })

  describe('POST /api/v1/inventory/transfers', () => {
    it('should create transfer successfully', async () => {
      const mockTransfer = {
        id: 'transfer1',
        fromLocationId: 'loc1',
        toLocationId: 'loc2',
        status: 'PENDING',
      }

      mockInventoryService.createTransfer.mockResolvedValue(mockTransfer)

      const response = await request(app)
        .post('/api/v1/inventory/transfers')
        .send({
          fromLocationId: 'loc1',
          toLocationId: 'loc2',
          items: [
            { productId: 'prod1', quantity: 10 },
            { variantId: 'var1', quantity: 5 },
          ],
          notes: 'Transfer for restocking',
        })
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockTransfer)
      expect(mockInventoryService.createTransfer).toHaveBeenCalledWith({
        fromLocationId: 'loc1',
        toLocationId: 'loc2',
        items: [
          { productId: 'prod1', quantity: 10 },
          { variantId: 'var1', quantity: 5 },
        ],
        notes: 'Transfer for restocking',
        userId: 'user1',
      })
    })

    it('should validate required fields', async () => {
      await request(app)
        .post('/api/v1/inventory/transfers')
        .send({
          fromLocationId: 'loc1',
          // Missing toLocationId and items
        })
        .expect(400)

      expect(mockInventoryService.createTransfer).not.toHaveBeenCalled()
    })

    it('should validate items array is not empty', async () => {
      await request(app)
        .post('/api/v1/inventory/transfers')
        .send({
          fromLocationId: 'loc1',
          toLocationId: 'loc2',
          items: [], // Empty array
        })
        .expect(400)

      expect(mockInventoryService.createTransfer).not.toHaveBeenCalled()
    })
  })

  describe('POST /api/v1/inventory/transfers/:transferId/ship', () => {
    it('should ship transfer successfully', async () => {
      mockInventoryService.shipTransfer.mockResolvedValue(true)

      const response = await request(app)
        .post('/api/v1/inventory/transfers/transfer1/ship')
        .send({
          trackingNumber: 'TRACK123',
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(mockInventoryService.shipTransfer).toHaveBeenCalledWith(
        'transfer1',
        'TRACK123',
        'user1'
      )
    })

    it('should work without tracking number', async () => {
      mockInventoryService.shipTransfer.mockResolvedValue(true)

      await request(app)
        .post('/api/v1/inventory/transfers/transfer1/ship')
        .send({})
        .expect(200)

      expect(mockInventoryService.shipTransfer).toHaveBeenCalledWith(
        'transfer1',
        undefined,
        'user1'
      )
    })
  })

  describe('POST /api/v1/inventory/transfers/:transferId/receive', () => {
    it('should receive transfer successfully', async () => {
      mockInventoryService.receiveTransfer.mockResolvedValue(true)

      const response = await request(app)
        .post('/api/v1/inventory/transfers/transfer1/receive')
        .send({
          receivedItems: [
            { transferItemId: 'item1', quantityReceived: 10 },
            { transferItemId: 'item2', quantityReceived: 5 },
          ],
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(mockInventoryService.receiveTransfer).toHaveBeenCalledWith(
        'transfer1',
        [
          { transferItemId: 'item1', quantityReceived: 10 },
          { transferItemId: 'item2', quantityReceived: 5 },
        ],
        'user1'
      )
    })

    it('should validate receivedItems array', async () => {
      await request(app)
        .post('/api/v1/inventory/transfers/transfer1/receive')
        .send({
          receivedItems: [], // Empty array
        })
        .expect(400)

      expect(mockInventoryService.receiveTransfer).not.toHaveBeenCalled()
    })
  })

  describe('GET /api/v1/inventory/low-stock', () => {
    it('should retrieve low stock items', async () => {
      const mockLowStockItems = [
        {
          id: 'inv1',
          quantity: 5,
          lowStockThreshold: 10,
          product: { name: 'Low Stock Product' },
        },
      ]

      mockInventoryService.getLowStockItems.mockResolvedValue(mockLowStockItems)

      const response = await request(app)
        .get('/api/v1/inventory/low-stock')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockLowStockItems)
      expect(mockInventoryService.getLowStockItems).toHaveBeenCalledWith(
        undefined
      )
    })

    it('should filter by location when provided', async () => {
      mockInventoryService.getLowStockItems.mockResolvedValue([])

      await request(app)
        .get('/api/v1/inventory/low-stock')
        .query({ locationId: 'loc1' })
        .expect(200)

      expect(mockInventoryService.getLowStockItems).toHaveBeenCalledWith('loc1')
    })
  })

  describe('PUT /api/v1/inventory/:inventoryItemId/threshold', () => {
    it('should update threshold successfully', async () => {
      const updatedItem = {
        id: 'inv1',
        lowStockThreshold: 15,
      }

      mockInventoryService.updateLowStockThreshold.mockResolvedValue(
        updatedItem
      )

      const response = await request(app)
        .put('/api/v1/inventory/inv1/threshold')
        .send({
          threshold: 15,
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(updatedItem)
      expect(mockInventoryService.updateLowStockThreshold).toHaveBeenCalledWith(
        'inv1',
        15
      )
    })

    it('should validate threshold is non-negative', async () => {
      await request(app)
        .put('/api/v1/inventory/inv1/threshold')
        .send({
          threshold: -5,
        })
        .expect(400)

      expect(
        mockInventoryService.updateLowStockThreshold
      ).not.toHaveBeenCalled()
    })
  })

  describe('GET /api/v1/inventory/reports', () => {
    it('should generate inventory report', async () => {
      const mockReport = {
        items: [],
        totals: {
          totalItems: 100,
          totalQuantity: 5000,
          totalValue: 50000,
        },
        summary: {
          averageValue: 500,
          fillRate: 85,
        },
      }

      mockInventoryService.getInventoryReport.mockResolvedValue(mockReport)

      const response = await request(app)
        .get('/api/v1/inventory/reports')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockReport)
      expect(mockInventoryService.getInventoryReport).toHaveBeenCalledWith({
        locationIds: undefined,
        productIds: undefined,
        lowStockOnly: false,
        dateFrom: undefined,
        dateTo: undefined,
      })
    })

    it('should handle filter parameters', async () => {
      mockInventoryService.getInventoryReport.mockResolvedValue({})

      await request(app)
        .get('/api/v1/inventory/reports')
        .query({
          locationIds: 'loc1,loc2',
          productIds: 'prod1,prod2',
          lowStockOnly: 'true',
          dateFrom: '2023-01-01',
          dateTo: '2023-01-31',
        })
        .expect(200)

      expect(mockInventoryService.getInventoryReport).toHaveBeenCalledWith({
        locationIds: ['loc1', 'loc2'],
        productIds: ['prod1', 'prod2'],
        lowStockOnly: true,
        dateFrom: new Date('2023-01-01'),
        dateTo: new Date('2023-01-31'),
      })
    })
  })

  describe('GET /api/v1/inventory/trends', () => {
    it('should retrieve inventory trends', async () => {
      const mockTrends = {
        dailyChanges: {},
        totalAdjustments: 50,
        periodSummary: {
          totalIncreases: 1000,
          totalDecreases: 500,
          netChange: 500,
        },
      }

      mockInventoryService.getInventoryTrends.mockResolvedValue(mockTrends)

      const response = await request(app)
        .get('/api/v1/inventory/trends')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockTrends)
      expect(mockInventoryService.getInventoryTrends).toHaveBeenCalledWith(
        undefined,
        undefined,
        30
      )
    })

    it('should handle query parameters', async () => {
      mockInventoryService.getInventoryTrends.mockResolvedValue({})

      await request(app)
        .get('/api/v1/inventory/trends')
        .query({
          locationId: 'loc1',
          productIds: 'prod1,prod2',
          days: '60',
        })
        .expect(200)

      expect(mockInventoryService.getInventoryTrends).toHaveBeenCalledWith(
        'loc1',
        ['prod1', 'prod2'],
        60
      )
    })
  })

  describe('POST /api/v1/inventory/cleanup-reservations', () => {
    it('should cleanup expired reservations', async () => {
      mockInventoryService.cleanupExpiredReservations.mockResolvedValue(5)

      const response = await request(app)
        .post('/api/v1/inventory/cleanup-reservations')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.cleanedCount).toBe(5)
      expect(response.body.message).toBe('Cleaned up 5 expired reservations')
      expect(mockInventoryService.cleanupExpiredReservations).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      mockInventoryService.updateStockLevel.mockRejectedValue(
        new Error('Inventory item not found')
      )

      const response = await request(app)
        .put('/api/v1/inventory/inv1/stock')
        .send({
          quantity: 100,
          reason: 'Test error handling',
        })
        .expect(500)

      expect(response.body.success).toBe(false)
    })

    it('should handle validation errors', async () => {
      const response = await request(app)
        .put('/api/v1/inventory/inv1/stock')
        .send({
          quantity: 'invalid', // Should be number
        })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(mockInventoryService.updateStockLevel).not.toHaveBeenCalled()
    })
  })
})
