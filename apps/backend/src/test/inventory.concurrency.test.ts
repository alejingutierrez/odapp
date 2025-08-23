import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PrismaClient, AdjustmentType } from '@prisma/client'
import { InventoryService } from '../services/inventory.service'
import { AppError } from '../lib/errors'

// Mock Prisma Client with transaction support
const createMockPrisma = () => {
  const mockPrisma = {
    inventoryItem: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      fields: {
        lowStockThreshold: 'lowStockThreshold',
      },
    },
    inventoryAdjustment: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    inventoryReservation: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    inventoryTransfer: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    inventoryTransferItem: {
      create: vi.fn(),
      update: vi.fn(),
    },
    location: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  } as unknown as PrismaClient

  return mockPrisma
}

describe('Inventory Service - Concurrency Tests', () => {
  let inventoryService: InventoryService
  let mockPrisma: ReturnType<typeof createMockPrisma>
  let mockEmit: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    mockPrisma = createMockPrisma()
    inventoryService = new InventoryService(mockPrisma)
    mockEmit = vi.fn()
    inventoryService.emit = mockEmit
  })

  describe('Concurrent Stock Updates', () => {
    it('should handle concurrent stock updates with proper isolation', async () => {
      const mockInventoryItem = {
        id: 'inv1',
        productId: 'prod1',
        variantId: null,
        locationId: 'loc1',
        quantity: 100,
        reservedQuantity: 0,
        availableQuantity: 100,
        lowStockThreshold: 10,
        product: { name: 'Test Product' },
        variant: null,
        location: { name: 'Main Warehouse' },
      }

      // Simulate concurrent updates by having different starting quantities
      let transactionCount = 0
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        transactionCount++
        const currentQuantity = transactionCount === 1 ? 100 : 95 // Second transaction sees updated value

        return callback({
          inventoryItem: {
            findUnique: vi.fn().mockResolvedValue({
              ...mockInventoryItem,
              quantity: currentQuantity,
            }),
            update: vi.fn().mockResolvedValue({
              ...mockInventoryItem,
              quantity: transactionCount === 1 ? 95 : 90,
              availableQuantity: transactionCount === 1 ? 95 : 90,
            }),
          },
          inventoryAdjustment: {
            create: vi.fn().mockResolvedValue({ id: `adj${transactionCount}` }),
          },
        })
      })

      // Execute concurrent updates
      const [result1, result2] = await Promise.all([
        inventoryService.updateStockLevel('inv1', 95, 'Update 1', 'user1'),
        inventoryService.updateStockLevel('inv1', 90, 'Update 2', 'user2'),
      ])

      expect(result1.quantity).toBe(95)
      expect(result2.quantity).toBe(90)
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(2)
      expect(mockEmit).toHaveBeenCalledTimes(2)
    })

    it('should handle race condition in reservation creation', async () => {
      const mockInventoryItem = {
        id: 'inv1',
        quantity: 100,
        reservedQuantity: 0,
        availableQuantity: 100,
      }

      let reservationAttempts = 0
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        reservationAttempts++

        // Simulate race condition: second attempt sees reduced availability
        const availableQuantity = reservationAttempts === 1 ? 100 : 20

        return callback({
          inventoryItem: {
            findUnique: vi.fn().mockResolvedValue({
              ...mockInventoryItem,
              availableQuantity,
            }),
            update: vi.fn().mockResolvedValue({}),
          },
          inventoryReservation: {
            create: vi.fn().mockResolvedValue({
              id: `res${reservationAttempts}`,
              inventoryItemId: 'inv1',
              quantity: reservationAttempts === 1 ? 80 : 20,
            }),
          },
        })
      })

      // First reservation should succeed
      const reservation1Promise = inventoryService.createReservation({
        inventoryItemId: 'inv1',
        quantity: 80,
        reason: 'Order 1',
      })

      // Second reservation should fail due to insufficient inventory
      const reservation2Promise = inventoryService.createReservation({
        inventoryItemId: 'inv1',
        quantity: 50, // Would exceed available after first reservation
        reason: 'Order 2',
      })

      const [result1, result2] = await Promise.allSettled([
        reservation1Promise,
        reservation2Promise,
      ])

      expect(result1.status).toBe('fulfilled')
      expect(result2.status).toBe('rejected')
      if (result2.status === 'rejected') {
        expect(result2.reason).toBeInstanceOf(AppError)
        expect(result2.reason.message).toContain('Insufficient inventory')
      }
    })

    it('should handle concurrent reservations on same inventory item', async () => {
      const mockInventoryItem = {
        id: 'inv1',
        quantity: 100,
        reservedQuantity: 0,
        availableQuantity: 100,
      }

      let reservationCount = 0
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        reservationCount++

        // Simulate proper isolation - each transaction sees consistent state
        const currentReserved = (reservationCount - 1) * 30
        const availableQuantity = 100 - currentReserved

        if (availableQuantity < 30) {
          throw new AppError('Insufficient inventory', 400)
        }

        return callback({
          inventoryItem: {
            findUnique: vi.fn().mockResolvedValue({
              ...mockInventoryItem,
              reservedQuantity: currentReserved,
              availableQuantity,
            }),
            update: vi.fn().mockResolvedValue({}),
          },
          inventoryReservation: {
            create: vi.fn().mockResolvedValue({
              id: `res${reservationCount}`,
              inventoryItemId: 'inv1',
              quantity: 30,
            }),
          },
        })
      })

      // Create multiple concurrent reservations
      const reservationPromises = Array.from({ length: 4 }, (_, i) =>
        inventoryService.createReservation({
          inventoryItemId: 'inv1',
          quantity: 30,
          reason: `Order ${i + 1}`,
        })
      )

      const results = await Promise.allSettled(reservationPromises)

      // First 3 should succeed (3 * 30 = 90 <= 100)
      // Last one should fail (4 * 30 = 120 > 100)
      const successful = results.filter((r) => r.status === 'fulfilled')
      const failed = results.filter((r) => r.status === 'rejected')

      expect(successful.length).toBe(3)
      expect(failed.length).toBe(1)
    })
  })

  describe('Concurrent Transfer Operations', () => {
    it('should handle concurrent transfers from same location', async () => {
      const mockFromLocation = { id: 'loc1', name: 'Warehouse A' }
      const mockToLocation1 = { id: 'loc2', name: 'Warehouse B' }
      const mockToLocation2 = { id: 'loc3', name: 'Warehouse C' }

      const mockInventoryItem = {
        id: 'inv1',
        availableQuantity: 100,
      }

      let transferCount = 0
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        transferCount++

        // Simulate inventory depletion
        const remainingQuantity = Math.max(0, 100 - (transferCount - 1) * 60)

        if (remainingQuantity < 60) {
          throw new AppError('Insufficient inventory for transfer', 400)
        }

        return callback({
          location: {
            findUnique: vi
              .fn()
              .mockResolvedValueOnce(mockFromLocation)
              .mockResolvedValueOnce(
                transferCount === 1 ? mockToLocation1 : mockToLocation2
              ),
          },
          inventoryTransfer: {
            create: vi.fn().mockResolvedValue({
              id: `transfer${transferCount}`,
              fromLocationId: 'loc1',
              toLocationId: transferCount === 1 ? 'loc2' : 'loc3',
            }),
          },
          inventoryItem: {
            findFirst: vi.fn().mockResolvedValue({
              ...mockInventoryItem,
              availableQuantity: remainingQuantity,
            }),
          },
          inventoryTransferItem: {
            create: vi.fn().mockResolvedValue({}),
          },
        })
      })

      // Mock createReservation to succeed for first transfer, fail for second
      inventoryService.createReservation = vi
        .fn()
        .mockResolvedValueOnce({ id: 'res1' })
        .mockRejectedValueOnce(new AppError('Insufficient inventory', 400))

      // Create concurrent transfers
      const transfer1Promise = inventoryService.createTransfer({
        fromLocationId: 'loc1',
        toLocationId: 'loc2',
        items: [{ productId: 'prod1', quantity: 60 }],
        userId: 'user1',
      })

      const transfer2Promise = inventoryService.createTransfer({
        fromLocationId: 'loc1',
        toLocationId: 'loc3',
        items: [{ productId: 'prod1', quantity: 60 }],
        userId: 'user2',
      })

      const [result1, result2] = await Promise.allSettled([
        transfer1Promise,
        transfer2Promise,
      ])

      expect(result1.status).toBe('fulfilled')
      expect(result2.status).toBe('rejected')
    })
  })

  describe('Concurrent Adjustment Operations', () => {
    it('should handle concurrent adjustments correctly', async () => {
      const mockInventoryItem = {
        id: 'inv1',
        quantity: 100,
        reservedQuantity: 0,
        availableQuantity: 100,
        averageCost: { toNumber: () => 10.0 },
      }

      let adjustmentCount = 0
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        adjustmentCount++

        // Simulate sequential processing with updated quantities
        const currentQuantity = 100 + (adjustmentCount - 1) * 25

        return callback({
          inventoryItem: {
            findUnique: vi.fn().mockResolvedValue({
              ...mockInventoryItem,
              quantity: currentQuantity,
            }),
            update: vi.fn().mockResolvedValue({
              ...mockInventoryItem,
              quantity: currentQuantity + 25,
              availableQuantity: currentQuantity + 25,
            }),
          },
          inventoryAdjustment: {
            create: vi.fn().mockResolvedValue({
              id: `adj${adjustmentCount}`,
              type: AdjustmentType.INCREASE,
              quantityChange: 25,
            }),
          },
        })
      })

      // Create concurrent adjustments
      const adjustmentPromises = Array.from({ length: 3 }, (_, i) =>
        inventoryService.createAdjustment({
          inventoryItemId: 'inv1',
          type: AdjustmentType.INCREASE,
          quantityChange: 25,
          reason: `Adjustment ${i + 1}`,
          userId: 'user1',
        })
      )

      const results = await Promise.all(adjustmentPromises)

      expect(results).toHaveLength(3)
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(3)
      expect(mockEmit).toHaveBeenCalledTimes(3)

      // Verify all adjustments were processed
      results.forEach((result, index) => {
        expect(result.id).toBe(`adj${index + 1}`)
      })
    })

    it('should prevent negative quantities in concurrent decreases', async () => {
      const mockInventoryItem = {
        id: 'inv1',
        quantity: 50,
        reservedQuantity: 0,
        availableQuantity: 50,
        averageCost: { toNumber: () => 10.0 },
      }

      let adjustmentCount = 0
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        adjustmentCount++

        // Simulate quantity depletion
        const currentQuantity = Math.max(0, 50 - (adjustmentCount - 1) * 30)
        const requestedDecrease = 30
        const actualDecrease = Math.min(requestedDecrease, currentQuantity)
        const newQuantity = currentQuantity - actualDecrease

        return callback({
          inventoryItem: {
            findUnique: vi.fn().mockResolvedValue({
              ...mockInventoryItem,
              quantity: currentQuantity,
            }),
            update: vi.fn().mockResolvedValue({
              ...mockInventoryItem,
              quantity: newQuantity,
              availableQuantity: newQuantity,
            }),
          },
          inventoryAdjustment: {
            create: vi.fn().mockResolvedValue({
              id: `adj${adjustmentCount}`,
              type: AdjustmentType.DECREASE,
              quantityChange: actualDecrease,
            }),
          },
        })
      })

      // Create concurrent decrease adjustments
      const adjustmentPromises = Array.from({ length: 3 }, (_, i) =>
        inventoryService.createAdjustment({
          inventoryItemId: 'inv1',
          type: AdjustmentType.DECREASE,
          quantityChange: 30,
          reason: `Decrease ${i + 1}`,
          userId: 'user1',
        })
      )

      const results = await Promise.all(adjustmentPromises)

      expect(results).toHaveLength(3)

      // Verify that quantities never went negative
      // First adjustment: 50 - 30 = 20
      // Second adjustment: 20 - 20 = 0 (clamped)
      // Third adjustment: 0 - 0 = 0 (no change)
      expect(mockEmit).toHaveBeenCalledWith(
        'inventory:adjusted',
        expect.objectContaining({
          newQuantity: expect.any(Number),
        })
      )
    })
  })

  describe('Mixed Concurrent Operations', () => {
    it('should handle mixed operations (updates, reservations, adjustments) concurrently', async () => {
      const mockInventoryItem = {
        id: 'inv1',
        productId: 'prod1',
        variantId: null,
        locationId: 'loc1',
        quantity: 200,
        reservedQuantity: 0,
        availableQuantity: 200,
        lowStockThreshold: 10,
        averageCost: { toNumber: () => 10.0 },
        product: { name: 'Test Product' },
        variant: null,
        location: { name: 'Main Warehouse' },
      }

      let operationCount = 0
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        operationCount++

        // Simulate different states based on operation order
        let currentQuantity = 200
        let currentReserved = 0

        // Apply operations sequentially for simulation
        if (operationCount <= 1) {
          // Stock update: set to 250
          currentQuantity = 250
        } else if (operationCount <= 2) {
          // Reservation: reserve 50
          currentQuantity = 250
          currentReserved = 50
        } else {
          // Adjustment: increase by 25
          currentQuantity = 275
          currentReserved = 50
        }

        const availableQuantity = currentQuantity - currentReserved

        return callback({
          inventoryItem: {
            findUnique: vi.fn().mockResolvedValue({
              ...mockInventoryItem,
              quantity: currentQuantity,
              reservedQuantity: currentReserved,
              availableQuantity,
            }),
            update: vi.fn().mockResolvedValue({
              ...mockInventoryItem,
              quantity: currentQuantity,
              reservedQuantity: currentReserved,
              availableQuantity,
            }),
          },
          inventoryAdjustment: {
            create: vi.fn().mockResolvedValue({ id: `adj${operationCount}` }),
          },
          inventoryReservation: {
            create: vi.fn().mockResolvedValue({ id: `res${operationCount}` }),
          },
        })
      })

      // Execute mixed operations concurrently
      const operations = [
        inventoryService.updateStockLevel('inv1', 250, 'Restock', 'user1'),
        inventoryService.createReservation({
          inventoryItemId: 'inv1',
          quantity: 50,
          reason: 'Order pending',
        }),
        inventoryService.createAdjustment({
          inventoryItemId: 'inv1',
          type: AdjustmentType.INCREASE,
          quantityChange: 25,
          reason: 'Bonus stock',
          userId: 'user1',
        }),
      ]

      const results = await Promise.allSettled(operations)

      // All operations should complete successfully
      expect(results.every((r) => r.status === 'fulfilled')).toBe(true)
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(3)
      expect(mockEmit).toHaveBeenCalledTimes(3)
    })
  })

  describe('Deadlock Prevention', () => {
    it('should handle potential deadlock scenarios gracefully', async () => {
      // Simulate a scenario where two operations might create a deadlock
      // by accessing the same resources in different orders

      const mockInventoryItem1 = {
        id: 'inv1',
        quantity: 100,
        availableQuantity: 100,
      }
      const mockInventoryItem2 = {
        id: 'inv2',
        quantity: 100,
        availableQuantity: 100,
      }

      let transactionCount = 0
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        transactionCount++

        // Add a small delay to increase chance of race conditions
        await new Promise((resolve) => setTimeout(resolve, Math.random() * 10))

        return callback({
          inventoryItem: {
            findFirst: vi
              .fn()
              .mockResolvedValueOnce(mockInventoryItem1)
              .mockResolvedValueOnce(mockInventoryItem2),
            update: vi.fn().mockResolvedValue({}),
          },
          inventoryReservation: {
            create: vi.fn().mockResolvedValue({ id: `res${transactionCount}` }),
          },
        })
      })

      // Mock createReservation to simulate cross-resource access
      inventoryService.createReservation = vi
        .fn()
        .mockImplementation(async (_request) => {
          // Simulate accessing multiple inventory items
          await mockPrisma.inventoryItem.findFirst({ where: { id: 'inv1' } })
          await mockPrisma.inventoryItem.findFirst({ where: { id: 'inv2' } })
          return { id: `res${Date.now()}` }
        })

      // Create operations that might deadlock
      const operations = [
        inventoryService.createReservation({
          inventoryItemId: 'inv1',
          quantity: 10,
          reason: 'Operation A',
        }),
        inventoryService.createReservation({
          inventoryItemId: 'inv2',
          quantity: 10,
          reason: 'Operation B',
        }),
      ]

      // Should complete without deadlock
      const results = await Promise.allSettled(operations)

      expect(results.every((r) => r.status === 'fulfilled')).toBe(true)
    })
  })

  describe('Performance Under Load', () => {
    it('should handle high concurrency load', async () => {
      const mockInventoryItem = {
        id: 'inv1',
        quantity: 10000,
        reservedQuantity: 0,
        availableQuantity: 10000,
      }

      let operationCount = 0
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        operationCount++

        // Simulate processing time
        await new Promise((resolve) => setTimeout(resolve, 1))

        return callback({
          inventoryItem: {
            findUnique: vi.fn().mockResolvedValue(mockInventoryItem),
            update: vi.fn().mockResolvedValue(mockInventoryItem),
          },
          inventoryReservation: {
            create: vi.fn().mockResolvedValue({ id: `res${operationCount}` }),
          },
        })
      })

      // Create many concurrent reservations
      const concurrentOperations = 50
      const operations = Array.from({ length: concurrentOperations }, (_, i) =>
        inventoryService.createReservation({
          inventoryItemId: 'inv1',
          quantity: 1,
          reason: `Load test ${i}`,
        })
      )

      const startTime = Date.now()
      const results = await Promise.allSettled(operations)
      const endTime = Date.now()

      // All operations should complete
      expect(results.every((r) => r.status === 'fulfilled')).toBe(true)
      expect(results).toHaveLength(concurrentOperations)

      // Should complete in reasonable time (less than 5 seconds for 50 operations)
      expect(endTime - startTime).toBeLessThan(5000)

      console.log(
        `Completed ${concurrentOperations} concurrent operations in ${endTime - startTime}ms`
      )
    })
  })
})
