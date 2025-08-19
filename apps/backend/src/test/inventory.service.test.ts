import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest'
import { PrismaClient, AdjustmentType, TransferStatus } from '@prisma/client'
import { InventoryService } from '../services/inventory.service'
import { AppError } from '../lib/errors'

// Mock logger
vi.mock('../lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  }
}))

// Mock Prisma Client
const mockPrisma = {
  inventoryItem: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    fields: {
      lowStockThreshold: 'lowStockThreshold'
    }
  },
  inventoryAdjustment: {
    create: vi.fn(),
    findMany: vi.fn()
  },
  inventoryReservation: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  },
  inventoryTransfer: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn()
  },
  inventoryTransferItem: {
    create: vi.fn(),
    update: vi.fn()
  },
  location: {
    findUnique: vi.fn()
  },
  $transaction: vi.fn()
} as unknown as PrismaClient

describe('InventoryService', () => {
  let inventoryService: InventoryService
  let mockEmit: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    inventoryService = new InventoryService(mockPrisma)
    mockEmit = vi.fn()
    inventoryService.emit = mockEmit
  })

  describe('getInventoryByLocation', () => {
    it('should retrieve inventory items for a location', async () => {
      const mockInventoryItems = [
        {
          id: 'inv1',
          locationId: 'loc1',
          productId: 'prod1',
          variantId: null,
          quantity: 100,
          reservedQuantity: 10,
          availableQuantity: 90,
          lowStockThreshold: 20,
          product: {
            id: 'prod1',
            name: 'Test Product',
            images: [{ url: 'test.jpg' }]
          },
          variant: null,
          location: { id: 'loc1', name: 'Main Warehouse' }
        }
      ]

      mockPrisma.inventoryItem.findMany.mockResolvedValue(mockInventoryItems)

      const result = await inventoryService.getInventoryByLocation('loc1')

      expect(mockPrisma.inventoryItem.findMany).toHaveBeenCalledWith({
        where: { locationId: 'loc1' },
        include: {
          product: {
            include: {
              images: { take: 1, orderBy: { sortOrder: 'asc' } }
            }
          },
          variant: true,
          location: true
        },
        orderBy: [
          { product: { name: 'asc' } },
          { variant: { name: 'asc' } }
        ]
      })

      expect(result).toEqual(mockInventoryItems)
    })

    it('should filter by product IDs when provided', async () => {
      mockPrisma.inventoryItem.findMany.mockResolvedValue([])

      await inventoryService.getInventoryByLocation('loc1', {
        productIds: ['prod1', 'prod2']
      })

      expect(mockPrisma.inventoryItem.findMany).toHaveBeenCalledWith({
        where: {
          locationId: 'loc1',
          OR: [
            { productId: { in: ['prod1', 'prod2'] } },
            { variantId: { in: ['prod1', 'prod2'] } }
          ]
        },
        include: expect.any(Object),
        orderBy: expect.any(Array)
      })
    })

    it('should filter low stock items when requested', async () => {
      mockPrisma.inventoryItem.findMany.mockResolvedValue([])

      await inventoryService.getInventoryByLocation('loc1', {
        lowStockOnly: true
      })

      expect(mockPrisma.inventoryItem.findMany).toHaveBeenCalledWith({
        where: {
          locationId: 'loc1',
          quantity: { lte: 'lowStockThreshold' }
        },
        include: expect.any(Object),
        orderBy: expect.any(Array)
      })
    })
  })

  describe('updateStockLevel', () => {
    const mockInventoryItem = {
      id: 'inv1',
      productId: 'prod1',
      variantId: null,
      locationId: 'loc1',
      quantity: 50,
      reservedQuantity: 5,
      availableQuantity: 45,
      lowStockThreshold: 10,
      product: { name: 'Test Product' },
      variant: null,
      location: { name: 'Main Warehouse' }
    }

    it('should update stock level and create adjustment record', async () => {
      const updatedItem = { ...mockInventoryItem, quantity: 75, availableQuantity: 70 }

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          inventoryItem: {
            findUnique: vi.fn().mockResolvedValue(mockInventoryItem),
            update: vi.fn().mockResolvedValue(updatedItem)
          },
          inventoryAdjustment: {
            create: vi.fn().mockResolvedValue({ id: 'adj1' })
          }
        })
      })

      const result = await inventoryService.updateStockLevel('inv1', 75, 'Stock replenishment', 'user1')

      expect(result).toEqual(updatedItem)
      expect(mockEmit).toHaveBeenCalledWith('inventory:updated', {
        inventoryItemId: 'inv1',
        productId: 'prod1',
        variantId: undefined,
        locationId: 'loc1',
        oldQuantity: 50,
        newQuantity: 75,
        availableQuantity: 70,
        reason: 'Stock replenishment',
        userId: 'user1'
      })
    })

    it('should emit low stock alert when quantity drops below threshold', async () => {
      const lowStockItem = { ...mockInventoryItem, quantity: 15 }
      const updatedItem = { ...lowStockItem, quantity: 5, availableQuantity: 0 }

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          inventoryItem: {
            findUnique: vi.fn().mockResolvedValue(lowStockItem),
            update: vi.fn().mockResolvedValue(updatedItem)
          },
          inventoryAdjustment: {
            create: vi.fn().mockResolvedValue({ id: 'adj1' })
          }
        })
      })

      await inventoryService.updateStockLevel('inv1', 5, 'Sale', 'user1')

      expect(mockEmit).toHaveBeenCalledWith('inventory:lowStock', {
        inventoryItemId: 'inv1',
        productId: 'prod1',
        variantId: undefined,
        locationId: 'loc1',
        currentQuantity: 5,
        threshold: 10,
        productName: 'Test Product',
        variantName: undefined,
        locationName: 'Main Warehouse'
      })
    })

    it('should throw error when inventory item not found', async () => {
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          inventoryItem: {
            findUnique: vi.fn().mockResolvedValue(null)
          }
        })
      })

      await expect(
        inventoryService.updateStockLevel('nonexistent', 10)
      ).rejects.toThrow(AppError)
    })
  })

  describe('createReservation', () => {
    const mockInventoryItem = {
      id: 'inv1',
      quantity: 100,
      reservedQuantity: 10,
      availableQuantity: 90
    }

    it('should create reservation when sufficient inventory available', async () => {
      const mockReservation = {
        id: 'res1',
        inventoryItemId: 'inv1',
        quantity: 20,
        reason: 'Order pending',
        referenceId: 'order1'
      }

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          inventoryItem: {
            findUnique: vi.fn().mockResolvedValue(mockInventoryItem),
            update: vi.fn().mockResolvedValue({})
          },
          inventoryReservation: {
            create: vi.fn().mockResolvedValue(mockReservation)
          }
        })
      })

      const result = await inventoryService.createReservation({
        inventoryItemId: 'inv1',
        quantity: 20,
        reason: 'Order pending',
        referenceId: 'order1'
      })

      expect(result).toEqual(mockReservation)
      expect(mockEmit).toHaveBeenCalledWith('inventory:reserved', {
        inventoryItemId: 'inv1',
        reservationId: 'res1',
        quantity: 20,
        reason: 'Order pending',
        referenceId: 'order1'
      })
    })

    it('should throw error when insufficient inventory available', async () => {
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          inventoryItem: {
            findUnique: vi.fn().mockResolvedValue(mockInventoryItem)
          }
        })
      })

      await expect(
        inventoryService.createReservation({
          inventoryItemId: 'inv1',
          quantity: 100, // More than available (90)
          reason: 'Order pending'
        })
      ).rejects.toThrow(AppError)
    })

    it('should throw error when inventory item not found', async () => {
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          inventoryItem: {
            findUnique: vi.fn().mockResolvedValue(null)
          }
        })
      })

      await expect(
        inventoryService.createReservation({
          inventoryItemId: 'nonexistent',
          quantity: 10,
          reason: 'Test'
        })
      ).rejects.toThrow(AppError)
    })
  })

  describe('releaseReservation', () => {
    const mockReservation = {
      id: 'res1',
      inventoryItemId: 'inv1',
      quantity: 20,
      reason: 'Order cancelled'
    }

    const mockInventoryItem = {
      id: 'inv1',
      quantity: 100,
      reservedQuantity: 30,
      availableQuantity: 70
    }

    it('should release reservation and update inventory', async () => {
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          inventoryReservation: {
            findUnique: vi.fn().mockResolvedValue(mockReservation),
            delete: vi.fn().mockResolvedValue({})
          },
          inventoryItem: {
            findUnique: vi.fn().mockResolvedValue(mockInventoryItem),
            update: vi.fn().mockResolvedValue({})
          }
        })
      })

      const result = await inventoryService.releaseReservation('res1')

      expect(result).toBe(true)
      expect(mockEmit).toHaveBeenCalledWith('inventory:reservationReleased', {
        inventoryItemId: 'inv1',
        reservationId: 'res1',
        quantity: 20,
        reason: 'Order cancelled'
      })
    })

    it('should throw error when reservation not found', async () => {
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          inventoryReservation: {
            findUnique: vi.fn().mockResolvedValue(null)
          }
        })
      })

      await expect(
        inventoryService.releaseReservation('nonexistent')
      ).rejects.toThrow(AppError)
    })
  })

  describe('fulfillReservation', () => {
    const mockReservation = {
      id: 'res1',
      inventoryItemId: 'inv1',
      quantity: 20,
      reason: 'Order fulfillment'
    }

    const mockInventoryItem = {
      id: 'inv1',
      quantity: 100,
      reservedQuantity: 20,
      availableQuantity: 80
    }

    it('should fulfill reservation completely and delete it', async () => {
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          inventoryReservation: {
            findUnique: vi.fn().mockResolvedValue(mockReservation),
            delete: vi.fn().mockResolvedValue({})
          },
          inventoryItem: {
            findUnique: vi.fn().mockResolvedValue(mockInventoryItem),
            update: vi.fn().mockResolvedValue({})
          },
          inventoryAdjustment: {
            create: vi.fn().mockResolvedValue({})
          }
        })
      })

      const result = await inventoryService.fulfillReservation('res1', 20)

      expect(result).toBe(true)
      expect(mockEmit).toHaveBeenCalledWith('inventory:reservationFulfilled', {
        inventoryItemId: 'inv1',
        reservationId: 'res1',
        quantityFulfilled: 20,
        remainingQuantity: 0
      })
    })

    it('should fulfill reservation partially and update it', async () => {
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          inventoryReservation: {
            findUnique: vi.fn().mockResolvedValue(mockReservation),
            update: vi.fn().mockResolvedValue({})
          },
          inventoryItem: {
            findUnique: vi.fn().mockResolvedValue(mockInventoryItem),
            update: vi.fn().mockResolvedValue({})
          },
          inventoryAdjustment: {
            create: vi.fn().mockResolvedValue({})
          }
        })
      })

      const result = await inventoryService.fulfillReservation('res1', 10)

      expect(result).toBe(true)
      expect(mockEmit).toHaveBeenCalledWith('inventory:reservationFulfilled', {
        inventoryItemId: 'inv1',
        reservationId: 'res1',
        quantityFulfilled: 10,
        remainingQuantity: 10
      })
    })

    it('should throw error when fulfilling more than reserved', async () => {
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          inventoryReservation: {
            findUnique: vi.fn().mockResolvedValue(mockReservation)
          }
        })
      })

      await expect(
        inventoryService.fulfillReservation('res1', 25) // More than reserved (20)
      ).rejects.toThrow(AppError)
    })
  })

  describe('createAdjustment', () => {
    const mockInventoryItem = {
      id: 'inv1',
      quantity: 50,
      reservedQuantity: 5,
      availableQuantity: 45,
      averageCost: { toNumber: () => 10.50 }
    }

    it('should create INCREASE adjustment', async () => {
      const mockAdjustment = {
        id: 'adj1',
        inventoryItemId: 'inv1',
        type: AdjustmentType.INCREASE,
        quantityChange: 25
      }

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          inventoryItem: {
            findUnique: vi.fn().mockResolvedValue(mockInventoryItem),
            update: vi.fn().mockResolvedValue({})
          },
          inventoryAdjustment: {
            create: vi.fn().mockResolvedValue(mockAdjustment)
          }
        })
      })

      const result = await inventoryService.createAdjustment({
        inventoryItemId: 'inv1',
        type: AdjustmentType.INCREASE,
        quantityChange: 25,
        reason: 'Stock replenishment',
        userId: 'user1'
      })

      expect(result).toEqual(mockAdjustment)
      expect(mockEmit).toHaveBeenCalledWith('inventory:adjusted', {
        inventoryItemId: 'inv1',
        adjustmentId: 'adj1',
        type: AdjustmentType.INCREASE,
        oldQuantity: 50,
        newQuantity: 75,
        quantityChange: 25,
        reason: 'Stock replenishment',
        userId: 'user1'
      })
    })

    it('should create DECREASE adjustment', async () => {
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          inventoryItem: {
            findUnique: vi.fn().mockResolvedValue(mockInventoryItem),
            update: vi.fn().mockResolvedValue({})
          },
          inventoryAdjustment: {
            create: vi.fn().mockResolvedValue({
              id: 'adj1',
              type: AdjustmentType.DECREASE
            })
          }
        })
      })

      await inventoryService.createAdjustment({
        inventoryItemId: 'inv1',
        type: AdjustmentType.DECREASE,
        quantityChange: 10,
        reason: 'Damaged goods',
        userId: 'user1'
      })

      expect(mockEmit).toHaveBeenCalledWith('inventory:adjusted', expect.objectContaining({
        oldQuantity: 50,
        newQuantity: 40,
        quantityChange: 10 // For DECREASE: oldQuantity - newQuantity = 50 - 40 = 10
      }))
    })

    it('should create SET adjustment', async () => {
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          inventoryItem: {
            findUnique: vi.fn().mockResolvedValue(mockInventoryItem),
            update: vi.fn().mockResolvedValue({})
          },
          inventoryAdjustment: {
            create: vi.fn().mockResolvedValue({
              id: 'adj1',
              type: AdjustmentType.SET
            })
          }
        })
      })

      await inventoryService.createAdjustment({
        inventoryItemId: 'inv1',
        type: AdjustmentType.SET,
        quantityChange: 100,
        reason: 'Physical count',
        userId: 'user1'
      })

      expect(mockEmit).toHaveBeenCalledWith('inventory:adjusted', expect.objectContaining({
        oldQuantity: 50,
        newQuantity: 100,
        quantityChange: 50
      }))
    })

    it('should prevent negative quantities on DECREASE', async () => {
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          inventoryItem: {
            findUnique: vi.fn().mockResolvedValue(mockInventoryItem),
            update: vi.fn().mockResolvedValue({})
          },
          inventoryAdjustment: {
            create: vi.fn().mockResolvedValue({
              id: 'adj1',
              type: AdjustmentType.DECREASE
            })
          }
        })
      })

      await inventoryService.createAdjustment({
        inventoryItemId: 'inv1',
        type: AdjustmentType.DECREASE,
        quantityChange: 100, // More than current quantity (50)
        reason: 'Test',
        userId: 'user1'
      })

      expect(mockEmit).toHaveBeenCalledWith('inventory:adjusted', expect.objectContaining({
        oldQuantity: 50,
        newQuantity: 0, // Should be clamped to 0
        quantityChange: 50 // For DECREASE: oldQuantity - newQuantity = 50 - 0 = 50
      }))
    })
  })

  describe('createTransfer', () => {
    const mockFromLocation = { id: 'loc1', name: 'Warehouse A' }
    const mockToLocation = { id: 'loc2', name: 'Warehouse B' }
    const mockInventoryItem = {
      id: 'inv1',
      availableQuantity: 100
    }

    it('should create transfer with valid locations and inventory', async () => {
      const mockTransfer = {
        id: 'transfer1',
        fromLocationId: 'loc1',
        toLocationId: 'loc2',
        status: TransferStatus.PENDING
      }

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          location: {
            findUnique: vi.fn()
              .mockResolvedValueOnce(mockFromLocation)
              .mockResolvedValueOnce(mockToLocation)
          },
          inventoryTransfer: {
            create: vi.fn().mockResolvedValue(mockTransfer)
          },
          inventoryItem: {
            findFirst: vi.fn().mockResolvedValue(mockInventoryItem)
          },
          inventoryTransferItem: {
            create: vi.fn().mockResolvedValue({})
          }
        }
        
        // Mock the createReservation call
        inventoryService.createReservation = vi.fn().mockResolvedValue({})
        
        return callback(mockTx)
      })

      const result = await inventoryService.createTransfer({
        fromLocationId: 'loc1',
        toLocationId: 'loc2',
        items: [
          { productId: 'prod1', quantity: 10 }
        ],
        notes: 'Transfer test',
        userId: 'user1'
      })

      expect(result).toEqual(mockTransfer)
      expect(mockEmit).toHaveBeenCalledWith('inventory:transferCreated', {
        transferId: 'transfer1',
        fromLocationId: 'loc1',
        toLocationId: 'loc2',
        items: [{ productId: 'prod1', quantity: 10 }],
        userId: 'user1'
      })
    })

    it('should throw error when locations are the same', async () => {
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          location: {
            findUnique: vi.fn()
              .mockResolvedValueOnce(mockFromLocation)
              .mockResolvedValueOnce(mockFromLocation) // Same location
          }
        })
      })

      await expect(
        inventoryService.createTransfer({
          fromLocationId: 'loc1',
          toLocationId: 'loc1', // Same as from
          items: [{ productId: 'prod1', quantity: 10 }],
          userId: 'user1'
        })
      ).rejects.toThrow(AppError)
    })

    it('should throw error when location not found', async () => {
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          location: {
            findUnique: vi.fn()
              .mockResolvedValueOnce(null) // From location not found
              .mockResolvedValueOnce(mockToLocation)
          }
        })
      })

      await expect(
        inventoryService.createTransfer({
          fromLocationId: 'nonexistent',
          toLocationId: 'loc2',
          items: [{ productId: 'prod1', quantity: 10 }],
          userId: 'user1'
        })
      ).rejects.toThrow(AppError)
    })

    it('should throw error when insufficient inventory', async () => {
      const lowInventoryItem = { ...mockInventoryItem, availableQuantity: 5 }

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          location: {
            findUnique: vi.fn()
              .mockResolvedValueOnce(mockFromLocation)
              .mockResolvedValueOnce(mockToLocation)
          },
          inventoryTransfer: {
            create: vi.fn().mockResolvedValue({ id: 'transfer1' })
          },
          inventoryItem: {
            findFirst: vi.fn().mockResolvedValue(lowInventoryItem)
          }
        })
      })

      await expect(
        inventoryService.createTransfer({
          fromLocationId: 'loc1',
          toLocationId: 'loc2',
          items: [{ productId: 'prod1', quantity: 10 }], // More than available (5)
          userId: 'user1'
        })
      ).rejects.toThrow(AppError)
    })
  })

  describe('bulkUpdateStockLevels', () => {
    it('should process multiple updates and return results', async () => {
      const updates = [
        { inventoryItemId: 'inv1', quantity: 100, reason: 'Restock' },
        { inventoryItemId: 'inv2', quantity: 50, reason: 'Adjustment' }
      ]

      // Mock successful updates
      inventoryService.updateStockLevel = vi.fn()
        .mockResolvedValueOnce({ id: 'inv1', quantity: 100 })
        .mockResolvedValueOnce({ id: 'inv2', quantity: 50 })

      const results = await inventoryService.bulkUpdateStockLevels(updates, 'user1')

      expect(results).toHaveLength(2)
      expect(results[0]).toEqual({
        success: true,
        inventoryItemId: 'inv1',
        result: { id: 'inv1', quantity: 100 }
      })
      expect(results[1]).toEqual({
        success: true,
        inventoryItemId: 'inv2',
        result: { id: 'inv2', quantity: 50 }
      })
    })

    it('should handle partial failures gracefully', async () => {
      const updates = [
        { inventoryItemId: 'inv1', quantity: 100, reason: 'Restock' },
        { inventoryItemId: 'invalid', quantity: 50, reason: 'Adjustment' }
      ]

      // Mock one success and one failure
      inventoryService.updateStockLevel = vi.fn()
        .mockResolvedValueOnce({ id: 'inv1', quantity: 100 })
        .mockRejectedValueOnce(new Error('Inventory item not found'))

      const results = await inventoryService.bulkUpdateStockLevels(updates, 'user1')

      expect(results).toHaveLength(2)
      expect(results[0].success).toBe(true)
      expect(results[1].success).toBe(false)
      expect(results[1].error).toBe('Inventory item not found')
    })
  })

  describe('getLowStockItems', () => {
    it('should retrieve items below threshold', async () => {
      const mockLowStockItems = [
        {
          id: 'inv1',
          quantity: 5,
          lowStockThreshold: 10,
          product: { name: 'Low Stock Product' },
          location: { name: 'Main Warehouse' }
        }
      ]

      mockPrisma.inventoryItem.findMany.mockResolvedValue(mockLowStockItems)

      const result = await inventoryService.getLowStockItems('loc1')

      expect(mockPrisma.inventoryItem.findMany).toHaveBeenCalledWith({
        where: {
          quantity: { lte: 'lowStockThreshold' },
          locationId: 'loc1'
        },
        include: expect.any(Object),
        orderBy: expect.any(Array)
      })

      expect(result).toEqual(mockLowStockItems)
    })

    it('should retrieve all low stock items when no location specified', async () => {
      mockPrisma.inventoryItem.findMany.mockResolvedValue([])

      await inventoryService.getLowStockItems()

      expect(mockPrisma.inventoryItem.findMany).toHaveBeenCalledWith({
        where: {
          quantity: { lte: 'lowStockThreshold' }
        },
        include: expect.any(Object),
        orderBy: expect.any(Array)
      })
    })
  })

  describe('cleanupExpiredReservations', () => {
    it('should release expired reservations', async () => {
      const expiredReservations = [
        { id: 'res1', expiresAt: new Date('2023-01-01') },
        { id: 'res2', expiresAt: new Date('2023-01-02') }
      ]

      mockPrisma.inventoryReservation.findMany.mockResolvedValue(expiredReservations)
      inventoryService.releaseReservation = vi.fn().mockResolvedValue(true)

      const result = await inventoryService.cleanupExpiredReservations()

      expect(result).toBe(2)
      expect(inventoryService.releaseReservation).toHaveBeenCalledTimes(2)
      expect(inventoryService.releaseReservation).toHaveBeenCalledWith('res1')
      expect(inventoryService.releaseReservation).toHaveBeenCalledWith('res2')
    })

    it('should return 0 when no expired reservations', async () => {
      mockPrisma.inventoryReservation.findMany.mockResolvedValue([])

      const result = await inventoryService.cleanupExpiredReservations()

      expect(result).toBe(0)
    })
  })

  describe('ensureInventoryItem', () => {
    it('should return existing inventory item', async () => {
      const existingItem = {
        id: 'inv1',
        productId: 'prod1',
        variantId: null,
        locationId: 'loc1'
      }

      mockPrisma.inventoryItem.findFirst.mockResolvedValue(existingItem)

      const result = await inventoryService.ensureInventoryItem('prod1', null, 'loc1')

      expect(result).toEqual(existingItem)
      expect(mockPrisma.inventoryItem.create).not.toHaveBeenCalled()
    })

    it('should create new inventory item when not exists', async () => {
      const newItem = {
        id: 'inv1',
        productId: 'prod1',
        variantId: null,
        locationId: 'loc1',
        quantity: 0,
        availableQuantity: 0
      }

      mockPrisma.inventoryItem.findFirst.mockResolvedValue(null)
      mockPrisma.inventoryItem.create.mockResolvedValue(newItem)

      const result = await inventoryService.ensureInventoryItem('prod1', null, 'loc1')

      expect(result).toEqual(newItem)
      expect(mockPrisma.inventoryItem.create).toHaveBeenCalledWith({
        data: {
          productId: 'prod1',
          variantId: null,
          locationId: 'loc1',
          quantity: 0,
          availableQuantity: 0
        }
      })
    })
  })
})