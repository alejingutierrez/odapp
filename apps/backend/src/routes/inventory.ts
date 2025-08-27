import { AdjustmentType } from '@prisma/client'
import { Router } from 'express'
import { z } from 'zod'

import { sendSuccess, sendCreated } from '../lib/api-response'
import { authenticate } from '../middleware/auth'
import { validate } from '../middleware/validation'
import { errorHandler } from '../middleware/error-handler'
import { InventoryService } from '../services/inventory.service'
import { WebSocketService } from '../services/websocket.service'

// Factory function for creating router with injected dependencies
export function createInventoryRouter(inventoryService?: InventoryService, webSocketService?: WebSocketService) {
  const router: Router = Router()
  const service = inventoryService || new InventoryService()
  const _wsService = webSocketService || new WebSocketService()

  // Validation schemas
  const inventoryQuerySchema = z.object({
    locationId: z.string().optional(),
    productIds: z
      .string()
      .optional()
      .transform((val) => (val ? val.split(',') : undefined)),
    lowStockOnly: z
      .string()
      .optional()
      .transform((val) => (val === 'true')),
    includeZeroStock: z
      .string()
      .optional()
      .transform((val) => (val === 'true')),
  })

  const updateStockSchema = z.object({
    quantity: z.number().int().positive('Quantity must be positive'),
    reason: z.string().min(1, 'Reason is required'),
  })

  const bulkUpdateSchema = z.object({
    updates: z.array(
      z.object({
        inventoryItemId: z.string(),
        quantity: z.number().int().min(0),
        reason: z.string().optional(),
      })
    ).min(1, 'At least one update is required'),
  })

  const createReservationSchema = z.object({
    quantity: z.number().int().positive('Quantity must be positive'),
    reason: z.string().min(1, 'Reason is required'),
    referenceId: z.string().optional(),
    expiresAt: z.string().datetime().optional(),
  })

  const fulfillReservationSchema = z.object({
    quantityFulfilled: z.number().int().positive('Quantity fulfilled must be positive'),
  })

  const adjustmentSchema = z.object({
    type: z.enum(['INCREASE', 'DECREASE', 'SET'], {
      errorMap: () => ({ message: 'Type must be INCREASE, DECREASE, or SET' })
    }),
    quantityChange: z.number().int().nonnegative('Quantity change cannot be negative'),
    reason: z.string().min(1, 'Reason is required'),
    notes: z.string().optional(),
    unitCost: z.number().optional(),
    referenceType: z.string().optional(),
    referenceId: z.string().optional(),
  })

const createTransferSchema = z.object({
  body: z.object({
    fromLocationId: z.string(),
    toLocationId: z.string(),
    items: z
      .array(
        z.object({
          productId: z.string().optional(),
          variantId: z.string().optional(),
          quantity: z.number().int().min(1),
        })
      )
      .min(1),
    notes: z.string().optional(),
  }),
})

const shipTransferSchema = z.object({
  body: z.object({
    trackingNumber: z.string().optional(),
  }),
})

const receiveTransferSchema = z.object({
  body: z.object({
    receivedItems: z
      .array(
        z.object({
          transferItemId: z.string(),
          quantityReceived: z.number().int().min(0),
        })
      )
      .min(1),
  }),
})

const updateThresholdSchema = z.object({
  body: z.object({
    threshold: z.number().int().min(0),
  }),
})

const reportFiltersSchema = z.object({
  query: z.object({
    locationIds: z
      .string()
      .optional()
      .transform((val) => (val ? val.split(',') : undefined)),
    productIds: z
      .string()
      .optional()
      .transform((val) => (val ? val.split(',') : undefined)),
    lowStockOnly: z
      .string()
      .optional()
      .transform((val) => val === 'true'),
    dateFrom: z
      .string()
      .optional()
      .transform((val) => (val ? new Date(val) : undefined)),
    dateTo: z
      .string()
      .optional()
      .transform((val) => (val ? new Date(val) : undefined)),
  }),
})



// ============================================================================
// INVENTORY TRACKING ROUTES
// ============================================================================

/**
 * @swagger
 * /api/v1/inventory:
 *   get:
 *     summary: Get inventory items
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: locationId
 *         schema:
 *           type: string
 *         description: Filter by location ID
 *       - in: query
 *         name: productIds
 *         schema:
 *           type: string
 *         description: Comma-separated product/variant IDs
 *       - in: query
 *         name: lowStockOnly
 *         schema:
 *           type: boolean
 *         description: Show only low stock items
 *       - in: query
 *         name: includeZeroStock
 *         schema:
 *           type: boolean
 *         description: Include items with zero stock
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Inventory items retrieved successfully
 */
router.get('/', authenticate, validate({ query: inventoryQuerySchema }), async (req, res, next) => {
  try {
    const { locationId, productIds, lowStockOnly, includeZeroStock } =
      req.query as Record<string, unknown>

    let inventory
    if (locationId) {
      inventory = await service.getInventoryByLocation(locationId as string, {
        productIds: productIds as string[] | undefined,
        lowStockOnly: lowStockOnly as boolean | undefined,
        includeZeroStock: includeZeroStock as boolean | undefined,
      })
    } else {
      // Get all inventory with pagination
      // This would need to be implemented in the service
      inventory = await service.getInventoryReport({
        productIds: productIds as string[] | undefined,
        lowStockOnly: lowStockOnly as boolean | undefined,
      })
    }

    sendSuccess(res, inventory)
  } catch (error) {
    next(error)
  }
})

/**
 * @swagger
 * /api/v1/inventory/product/{productId}:
 *   get:
 *     summary: Get inventory for a specific product
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: variantId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product inventory retrieved successfully
 */
router.get('/product/:productId', authenticate, async (req, res, next) => {
  try {
    const { productId } = req.params
    const { variantId } = req.query as Record<string, unknown>

    const inventory = await service.getInventoryByProduct(
      productId,
      variantId as string | undefined
    )
    const totals = await service.getTotalInventory(
      productId,
      variantId as string | undefined
    )

    sendSuccess(res, {
      inventory,
      totals,
    })
  } catch (error) {
    next(error)
  }
})

/**
 * @swagger
 * /api/v1/inventory/{inventoryItemId}/stock:
 *   put:
 *     summary: Update stock level
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: inventoryItemId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 0
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Stock level updated successfully
 */
router.put('/:inventoryItemId/stock', authenticate, validate({ body: updateStockSchema }), async (req, res, next) => {
  try {
    const { inventoryItemId } = req.params
    const { quantity, reason } = req.body
    const userId = (req as { user: { id: string } }).user.id

    const updatedItem = await service.updateStockLevel(
      inventoryItemId,
      quantity,
      reason,
      userId
    )

    sendSuccess(res, updatedItem)
  } catch (error) {
    next(error)
  }
})

/**
 * @swagger
 * /api/v1/inventory/bulk-update:
 *   put:
 *     summary: Bulk update stock levels
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - updates
 *             properties:
 *               updates:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - inventoryItemId
 *                     - quantity
 *                   properties:
 *                     inventoryItemId:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *                       minimum: 0
 *                     reason:
 *                       type: string
 *     responses:
 *       200:
 *         description: Bulk update completed
 */
router.put(
  '/bulk-update',
  authenticate,
  validate({ body: bulkUpdateSchema }),
  async (req, res, next) => {
    try {
      const { updates } = req.body
      const userId = (req as { user: { id: string } }).user.id

      const results = await service.bulkUpdateStockLevels(
        updates,
        userId
      )

      const successCount = results.filter((r) => r.success).length
      const errorCount = results.filter((r) => !r.success).length

      sendSuccess(res, {
        results,
        summary: {
          total: results.length,
          successful: successCount,
          failed: errorCount,
        },
      })
    } catch (error) {
      next(error)
    }
  }
)

// ============================================================================
// RESERVATIONS ROUTES
// ============================================================================

/**
 * @swagger
 * /api/v1/inventory/{inventoryItemId}/reservations:
 *   post:
 *     summary: Create inventory reservation
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: inventoryItemId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *               - reason
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *               reason:
 *                 type: string
 *               referenceId:
 *                 type: string
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Reservation created successfully
 */
router.post(
  '/:inventoryItemId/reservations',
  authenticate,
  validate({ body: createReservationSchema }),
  async (req, res, next) => {
    try {
      const { inventoryItemId } = req.params
      const { quantity, reason, referenceId, expiresAt } = req.body

      const reservation = await service.createReservation({
        inventoryItemId,
        quantity,
        reason,
        referenceId,
        expiresAt,
      })

      sendCreated(res, reservation)
    } catch (error) {
      next(error)
    }
  }
)

/**
 * @swagger
 * /api/v1/inventory/reservations/{reservationId}:
 *   delete:
 *     summary: Release inventory reservation
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reservationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Reservation released successfully
 */
router.delete(
  '/reservations/:reservationId',
  authenticate,
  async (req, res, next) => {
    try {
      const { reservationId } = req.params

      await service.releaseReservation(reservationId)

      sendSuccess(res, null)
    } catch (error) {
      next(error)
    }
  }
)

/**
 * @swagger
 * /api/v1/inventory/reservations/{reservationId}/fulfill:
 *   post:
 *     summary: Fulfill inventory reservation
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reservationId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantityFulfilled
 *             properties:
 *               quantityFulfilled:
 *                 type: integer
 *                 minimum: 1
 *     responses:
 *       200:
 *         description: Reservation fulfilled successfully
 */
router.post(
  '/reservations/:reservationId/fulfill',
  authenticate,
  validate({ body: fulfillReservationSchema }),
  async (req, res, next) => {
    try {
      const { reservationId } = req.params
      const { quantityFulfilled } = req.body

      await service.fulfillReservation(
        reservationId,
        quantityFulfilled
      )

      sendSuccess(res, null)
    } catch (error) {
      next(error)
    }
  }
)

// ============================================================================
// ADJUSTMENTS ROUTES
// ============================================================================

/**
 * @swagger
 * /api/v1/inventory/{inventoryItemId}/adjustments:
 *   post:
 *     summary: Create inventory adjustment
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: inventoryItemId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - quantityChange
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [INCREASE, DECREASE, SET]
 *               quantityChange:
 *                 type: integer
 *                 minimum: 0
 *               reason:
 *                 type: string
 *               notes:
 *                 type: string
 *               unitCost:
 *                 type: number
 *               referenceType:
 *                 type: string
 *               referenceId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Adjustment created successfully
 */
router.post(
  '/:inventoryItemId/adjustments',
  authenticate,
  validate({ body: adjustmentSchema }),
  async (req, res, next) => {
    try {
      const { inventoryItemId } = req.params
      const {
        type,
        quantityChange,
        reason,
        notes,
        unitCost,
        referenceType,
        referenceId,
      } = req.body
      const userId = (req as { user: { id: string } }).user.id

      const adjustment = await service.createAdjustment({
        inventoryItemId,
        type: type as AdjustmentType,
        quantityChange,
        reason,
        notes,
        unitCost,
        referenceType,
        referenceId,
        userId,
      })

      sendCreated(res, adjustment)
    } catch (error) {
      next(error)
    }
  }
)

/**
 * @swagger
 * /api/v1/inventory/{inventoryItemId}/history:
 *   get:
 *     summary: Get inventory movement history
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: inventoryItemId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Movement history retrieved successfully
 */
router.get(
  '/:inventoryItemId/history',
  authenticate,
  async (req, res, next) => {
    try {
      const { inventoryItemId } = req.params
      const { dateFrom, dateTo } = req.query as Record<string, unknown>

      const history = await service.getInventoryMovementHistory(
        inventoryItemId,
        dateFrom && typeof dateFrom === 'string' ? new Date(dateFrom) : undefined,
        dateTo && typeof dateTo === 'string' ? new Date(dateTo) : undefined
      )

      sendSuccess(res, history)
    } catch (error) {
      next(error)
    }
  }
)

// ============================================================================
// TRANSFERS ROUTES
// ============================================================================

/**
 * @swagger
 * /api/v1/inventory/transfers:
 *   post:
 *     summary: Create inventory transfer
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fromLocationId
 *               - toLocationId
 *               - items
 *             properties:
 *               fromLocationId:
 *                 type: string
 *               toLocationId:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                     variantId:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *                       minimum: 1
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Transfer created successfully
 */
router.post(
  '/transfers',
  authenticate,
  validate({ body: createTransferSchema.shape.body }),
  async (req, res, next) => {
    try {
      const { fromLocationId, toLocationId, items, notes } = req.body
      const userId = (req as { user: { id: string } }).user.id

      const transfer = await service.createTransfer({
        fromLocationId,
        toLocationId,
        items,
        notes,
        userId,
      })

      sendCreated(res, transfer)
    } catch (error) {
      next(error)
    }
  }
)

/**
 * @swagger
 * /api/v1/inventory/transfers/{transferId}/ship:
 *   post:
 *     summary: Ship inventory transfer
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transferId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               trackingNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: Transfer shipped successfully
 */
router.post(
  '/transfers/:transferId/ship',
  authenticate,
  validate({ body: shipTransferSchema.shape.body }),
  async (req, res, next) => {
    try {
      const { transferId } = req.params
      const { trackingNumber } = req.body
      const userId = (req as { user: { id: string } }).user.id

      await service.shipTransfer(transferId, trackingNumber, userId)

      sendSuccess(res, null)
    } catch (error) {
      next(error)
    }
  }
)

/**
 * @swagger
 * /api/v1/inventory/transfers/{transferId}/receive:
 *   post:
 *     summary: Receive inventory transfer
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transferId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - receivedItems
 *             properties:
 *               receivedItems:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - transferItemId
 *                     - quantityReceived
 *                   properties:
 *                     transferItemId:
 *                       type: string
 *                     quantityReceived:
 *                       type: integer
 *                       minimum: 0
 *     responses:
 *       200:
 *         description: Transfer received successfully
 */
router.post(
  '/transfers/:transferId/receive',
  authenticate,
  validate({ body: receiveTransferSchema.shape.body }),
  async (req, res, next) => {
    try {
      const { transferId } = req.params
      const { receivedItems } = req.body
      const userId = (req as { user: { id: string } }).user.id

      await service.receiveTransfer(transferId, receivedItems, userId)

      sendSuccess(res, null)
    } catch (error) {
      next(error)
    }
  }
)

// ============================================================================
// LOW STOCK & ALERTS ROUTES
// ============================================================================

/**
 * @swagger
 * /api/v1/inventory/low-stock:
 *   get:
 *     summary: Get low stock items
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: locationId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Low stock items retrieved successfully
 */
router.get('/low-stock', authenticate, async (req, res, next) => {
  try {
    const { locationId } = req.query as Record<string, unknown>

    const lowStockItems = await service.getLowStockItems(locationId as string | undefined)

    sendSuccess(res, lowStockItems)
  } catch (error) {
    next(error)
  }
})

/**
 * @swagger
 * /api/v1/inventory/{inventoryItemId}/threshold:
 *   put:
 *     summary: Update low stock threshold
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: inventoryItemId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - threshold
 *             properties:
 *               threshold:
 *                 type: integer
 *                 minimum: 0
 *     responses:
 *       200:
 *         description: Threshold updated successfully
 */
router.put(
  '/:inventoryItemId/threshold',
  authenticate,
  validate({ body: updateThresholdSchema.shape.body }),
  async (req, res, next) => {
    try {
      const { inventoryItemId } = req.params
      const { threshold } = req.body

      const updatedItem = await service.updateLowStockThreshold(
        inventoryItemId,
        threshold
      )

      sendSuccess(res, updatedItem)
    } catch (error) {
      next(error)
    }
  }
)

// ============================================================================
// REPORTING & ANALYTICS ROUTES
// ============================================================================

/**
 * @swagger
 * /api/v1/inventory/reports:
 *   get:
 *     summary: Get inventory report
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: locationIds
 *         schema:
 *           type: string
 *         description: Comma-separated location IDs
 *       - in: query
 *         name: productIds
 *         schema:
 *           type: string
 *         description: Comma-separated product IDs
 *       - in: query
 *         name: lowStockOnly
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Inventory report generated successfully
 */
router.get(
  '/reports',
  authenticate,
  validate({ query: reportFiltersSchema.shape.query }),
  async (req, res, next) => {
    try {
      const { locationIds, productIds, lowStockOnly, dateFrom, dateTo } =
        req.query as Record<string, unknown>

      const report = await service.getInventoryReport({
        locationIds: locationIds as string[] | undefined,
        productIds: productIds as string[] | undefined,
        lowStockOnly: lowStockOnly as boolean | undefined,
        dateFrom: dateFrom as Date | undefined,
        dateTo: dateTo as Date | undefined,
      })

      sendSuccess(res, report)
    } catch (error) {
      next(error)
    }
  }
)

/**
 * @swagger
 * /api/v1/inventory/trends:
 *   get:
 *     summary: Get inventory trends
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: locationId
 *         schema:
 *           type: string
 *       - in: query
 *         name: productIds
 *         schema:
 *           type: string
 *         description: Comma-separated product IDs
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: Inventory trends retrieved successfully
 */
router.get('/trends', authenticate, async (req, res, next) => {
  try {
    const { locationId, productIds, days } = req.query as Record<
      string,
      unknown
    >

    const trends = await service.getInventoryTrends(
      locationId as string | undefined,
      productIds && typeof productIds === 'string' ? productIds.split(',') : undefined,
      days && typeof days === 'string' ? parseInt(days) : 30
    )

    sendSuccess(res, trends)
  } catch (error) {
    next(error)
  }
})

// ============================================================================
// UTILITY ROUTES
// ============================================================================

/**
 * @swagger
 * /api/v1/inventory/cleanup-reservations:
 *   post:
 *     summary: Cleanup expired reservations
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Expired reservations cleaned up
 */
router.post('/cleanup-reservations', authenticate, async (req, res, next) => {
  try {
    const cleanedCount = await service.cleanupExpiredReservations()

    res.json({
      success: true,
      data: { cleanedCount },
      message: `Cleaned up ${cleanedCount} expired reservations`
    })
  } catch (error) {
    next(error)
  }
})

  // Add error handler middleware
  router.use((error: unknown, req: any, res: any, next: any) => {
    return errorHandler(error, req, res, next)
  })

  return router
}

export default createInventoryRouter()
