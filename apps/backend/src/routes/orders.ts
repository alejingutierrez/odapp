import {
  OrderStatus,
  FinancialStatus,
  FulfillmentStatus,
  PaymentMethod,
} from '@prisma/client'
import { Router } from 'express'
import { z } from 'zod'

import { sendSuccess, sendError } from '../lib/api-response.js'
import { logger } from '../lib/logger'
import { authenticate } from '../middleware/auth.js'
import { validate } from '../middleware/validation.js'
import { errorHandler } from '../middleware/error-handler.js'
import {
  OrderService,
  CreateOrderRequest,
  UpdateOrderRequest,
  ProcessPaymentRequest,
  CreateFulfillmentRequest,
  CreateReturnRequest,
  OrderFilters,
} from '../services/order.service'

// Factory function for creating router with injected dependencies
export function createOrderRouter(orderService?: OrderService) {
  const router = Router()
  const service = orderService || new OrderService()

  // Validation schemas
  const createOrderSchema = z
    .object({
      customerId: z.string().optional(),
      guestEmail: z.string().email().optional(),
      guestPhone: z.string().optional(),
      items: z
        .array(
          z.object({
            productId: z.string(),
            variantId: z.string().optional(),
            quantity: z.number().int().positive(),
            price: z.number().positive().optional(),
          })
        )
        .min(1),
      currency: z.string().optional(),
      shippingAddress: z.any().optional(),
      billingAddress: z.any().optional(),
      notes: z.string().optional(),
    })
    .refine((data) => data.customerId || data.guestEmail, {
      message: 'Either customerId or guestEmail must be provided',
    })

  const updateOrderSchema = z
    .object({
      status: z.nativeEnum(OrderStatus).optional(),
      notes: z.string().optional(),
      priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
      tags: z.array(z.string()).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided for update',
    })

  const processPaymentSchema = z.object({
    amount: z.number().positive(),
    currency: z.string(),
    method: z.nativeEnum(PaymentMethod),
    gateway: z.string(),
    gatewayTransactionId: z.string().optional(),
    metadata: z.any().optional(),
  })

  const createFulfillmentSchema = z.object({
    items: z
      .array(
        z.object({
          orderItemId: z.string(),
          quantity: z.number().int().positive(),
        })
      )
      .min(1),
    trackingNumber: z.string().optional(),
    trackingUrl: z.string().optional(),
    carrier: z.string().optional(),
    service: z.string().optional(),
  })

  const createReturnSchema = z.object({
    items: z
      .array(
        z.object({
          orderItemId: z.string(),
          quantity: z.number().int().positive(),
          reason: z.string().optional(),
          condition: z.string().optional(),
        })
      )
      .min(1),
    reason: z.string().optional(),
    notes: z.string().optional(),
  })

  const orderFiltersSchema = z.object({
    status: z.array(z.nativeEnum(OrderStatus)).optional(),
    financialStatus: z.array(z.nativeEnum(FinancialStatus)).optional(),
    fulfillmentStatus: z.array(z.nativeEnum(FulfillmentStatus)).optional(),
    customerId: z.string().optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
    search: z.string().optional(),
    tags: z.array(z.string()).optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  })

  /**
   * @swagger
   * components:
   *   schemas:
   *     Order:
   *       type: object
   *       properties:
   *         id:
   *           type: string
   *         orderNumber:
   *           type: string
   *         customerId:
   *           type: string
   *         status:
   *           type: string
   *           enum: [PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED, REFUNDED]
   *         financialStatus:
   *           type: string
   *           enum: [PENDING, AUTHORIZED, PARTIALLY_PAID, PAID, PARTIALLY_REFUNDED, REFUNDED, VOIDED]
   *         fulfillmentStatus:
   *           type: string
   *           enum: [UNFULFILLED, PENDING, SHIPPED, DELIVERED, CANCELLED]
   *         subtotal:
   *           type: number
   *         taxAmount:
   *           type: number
   *         shippingAmount:
   *           type: number
   *         discountAmount:
   *           type: number
   *         totalAmount:
   *           type: number
   *         currency:
   *           type: string
   *         orderDate:
   *           type: string
   *           format: date-time
   *         items:
   *           type: array
   *           items:
   *             $ref: '#/components/schemas/OrderItem'
   *     OrderItem:
   *       type: object
   *       properties:
   *         id:
   *           type: string
   *         productId:
   *           type: string
   *         variantId:
   *           type: string
   *         name:
   *           type: string
   *         sku:
   *           type: string
   *         quantity:
   *           type: integer
   *         price:
   *           type: number
   *         totalPrice:
   *           type: number
   */

  /**
   * @swagger
   * /api/orders:
   *   post:
   *     summary: Create a new order
   *     tags: [Orders]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - items
   *             properties:
   *               customerId:
   *                 type: string
   *               guestEmail:
   *                 type: string
   *               guestPhone:
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
   *                     price:
   *                       type: number
   *     responses:
   *       201:
   *         description: Order created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Order'
   */
  router.post(
    '/',
    authenticate,
    validate({ body: createOrderSchema }),
    async (req, res) => {
      try {
        const orderData: CreateOrderRequest = req.body
        const userId = req.user?.id

        const order = await service.createOrder(orderData, userId)

        logger.info('Order created via API', { orderId: order.id, userId })

        res.status(201).json({ success: true, data: order })
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error'
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const statusCode = (error as any)?.statusCode || 500
        logger.error('Error creating order', {
          error: errorMessage,
          body: req.body,
        })
        res.status(statusCode).json({ success: false, message: errorMessage })
      }
    }
  )

  /**
   * @swagger
   * /api/orders:
   *   get:
   *     summary: Get orders with filters and pagination
   *     tags: [Orders]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: status
   *         schema:
   *           type: array
   *           items:
   *             type: string
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 20
   *     responses:
   *       200:
   *         description: Orders retrieved successfully
   */
  router.get('/', authenticate, async (req, res) => {
    try {
      const validatedQuery = orderFiltersSchema.parse(req.query)

      const filters: OrderFilters = {}
      if (validatedQuery.status) filters.status = validatedQuery.status
      if (validatedQuery.financialStatus)
        filters.financialStatus = validatedQuery.financialStatus
      if (validatedQuery.fulfillmentStatus)
        filters.fulfillmentStatus = validatedQuery.fulfillmentStatus
      if (validatedQuery.customerId)
        filters.customerId = validatedQuery.customerId
      if (validatedQuery.dateFrom)
        filters.dateFrom = new Date(validatedQuery.dateFrom)
      if (validatedQuery.dateTo)
        filters.dateTo = new Date(validatedQuery.dateTo)
      if (validatedQuery.search) filters.search = validatedQuery.search
      if (validatedQuery.tags) filters.tags = validatedQuery.tags

      const page = validatedQuery.page || 1
      const limit = validatedQuery.limit || 20
      const sortBy = validatedQuery.sortBy || 'createdAt'
      const sortOrder = validatedQuery.sortOrder || 'desc'

      const result = await service.getOrders(
        filters,
        page,
        limit,
        sortBy,
        sortOrder
      )

      res.json({ success: true, data: result })
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const statusCode = (error as any)?.statusCode || 500
      logger.error('Error retrieving orders', {
        error: errorMessage,
        query: req.query,
      })
      res.status(statusCode).json({ success: false, message: errorMessage })
    }
  })

  /**
   * @swagger
   * /api/orders/analytics:
   *   get:
   *     summary: Get order analytics
   *     tags: [Orders]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: dateFrom
   *         schema:
   *           type: string
   *           format: date-time
   *       - in: query
   *         name: dateTo
   *         schema:
   *           type: string
   *           format: date-time
   *       - in: query
   *         name: customerId
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Order analytics retrieved successfully
   */
  router.get('/analytics', authenticate, async (req, res) => {
    try {
      const { dateFrom, dateTo, customerId } = req.query

      const analytics = await service.getOrderAnalytics(
        dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo ? new Date(dateTo as string) : undefined,
        customerId as string
      )

      res.json({ success: true, data: analytics })
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const statusCode = (error as any)?.statusCode || 500
      logger.error('Error retrieving order analytics', {
        error: errorMessage,
        query: req.query,
      })
      res.status(statusCode).json({ success: false, message: errorMessage })
    }
  })

  /**
   * @swagger
   * /api/orders/{id}:
   *   get:
   *     summary: Get order by ID
   *     tags: [Orders]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Order retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Order'
   */
  router.get('/:id', authenticate, async (req, res) => {
    try {
      const { id } = req.params
      const order = await service.getOrderById(id)

      if (!order) {
        return res
          .status(404)
          .json({ success: false, message: 'Order not found' })
      }

      res.json({ success: true, data: order })
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const statusCode = (error as any)?.statusCode || 500
      logger.error('Error retrieving order', {
        error: errorMessage,
        orderId: req.params.id,
      })
      res
        .status(statusCode)
        .json(sendError(res, 'ORDER_RETRIEVAL_ERROR', errorMessage, statusCode))
    }
  })

  /**
   * @swagger
   * /api/orders/{id}:
   *   put:
   *     summary: Update order
   *     tags: [Orders]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               status:
   *                 type: string
   *               notes:
   *                 type: string
   *     responses:
   *       200:
   *         description: Order updated successfully
   */
  router.put(
    '/:id',
    authenticate,
    validate({ body: updateOrderSchema }),
    async (req, res) => {
      try {
        const { id } = req.params
        const updateData: UpdateOrderRequest = req.body
        const userId = req.user?.id

        const order = await service.updateOrder(id, updateData, userId)

        logger.info('Order updated via API', {
          orderId: id,
          userId,
          changes: Object.keys(updateData),
        })

        res.json({ success: true, data: order })
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error'
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const statusCode = (error as any)?.statusCode || 500
        logger.error('Error updating order', {
          error: errorMessage,
          orderId: req.params.id,
        })
        res.status(statusCode).json({ success: false, message: errorMessage })
      }
    }
  )

  /**
   * @swagger
   * /api/orders/{id}/payments:
   *   post:
   *     summary: Process payment for order
   *     tags: [Orders]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
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
   *               - amount
   *               - currency
   *               - method
   *               - gateway
   *             properties:
   *               amount:
   *                 type: number
   *               currency:
   *                 type: string
   *               method:
   *                 type: string
   *               gateway:
   *                 type: string
   *     responses:
   *       200:
   *         description: Payment processed successfully
   */
  router.post(
    '/:id/payments',
    authenticate,
    validate({ body: processPaymentSchema }),
    async (req, res) => {
      try {
        const { id } = req.params
        const paymentData: ProcessPaymentRequest = req.body
        const userId = req.user?.id

        const payment = await service.processPayment(id, paymentData, userId)

        logger.info('Payment processed via API', {
          orderId: id,
          paymentId: payment.id,
          userId,
        })

        res.json({ success: true, data: payment })
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error'
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const statusCode = (error as any)?.statusCode || 500
        logger.error('Error processing payment', {
          error: errorMessage,
          orderId: req.params.id,
        })
        res.status(statusCode).json({ success: false, message: errorMessage })
      }
    }
  )

  /**
   * @swagger
   * /api/orders/{id}/fulfillments:
   *   post:
   *     summary: Create fulfillment for order
   *     tags: [Orders]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
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
   *               - items
   *             properties:
   *               items:
   *                 type: array
   *                 items:
   *                   type: object
   *                   properties:
   *                     orderItemId:
   *                       type: string
   *                     quantity:
   *                       type: integer
   *     responses:
   *       201:
   *         description: Fulfillment created successfully
   */
  router.post(
    '/:id/fulfillments',
    authenticate,
    validate({ body: createFulfillmentSchema }),
    async (req, res) => {
      try {
        const { id } = req.params
        const fulfillmentData: CreateFulfillmentRequest = req.body
        const userId = req.user?.id

        const fulfillment = await service.createFulfillment(
          id,
          fulfillmentData,
          userId
        )

        logger.info('Fulfillment created via API', {
          orderId: id,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          fulfillmentId: (fulfillment as any)?.id,
          userId,
        })

        res.status(201).json({ success: true, data: fulfillment })
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error'
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const statusCode = (error as any)?.statusCode || 500
        logger.error('Error creating fulfillment', {
          error: errorMessage,
          orderId: req.params.id,
        })
        res.status(statusCode).json({ success: false, message: errorMessage })
      }
    }
  )

  /**
   * @swagger
   * /api/orders/{id}/fulfillments/{fulfillmentId}/ship:
   *   post:
   *     summary: Ship fulfillment
   *     tags: [Orders]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *       - in: path
   *         name: fulfillmentId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Fulfillment shipped successfully
   */
  router.post(
    '/:id/fulfillments/:fulfillmentId/ship',
    authenticate,
    async (req, res) => {
      try {
        const { fulfillmentId } = req.params
        const userId = req.user?.id

        const fulfillment = await service.shipFulfillment(
          fulfillmentId,
          {},
          userId
        )

        logger.info('Fulfillment shipped via API', { fulfillmentId, userId })

        res.json(
          sendSuccess(res, fulfillment, 'Fulfillment shipped successfully')
        )
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error'
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const statusCode = (error as any)?.statusCode || 500
        logger.error('Error shipping fulfillment', {
          error: errorMessage,
          fulfillmentId: req.params.fulfillmentId,
        })
        sendError(res, 'FULFILLMENT_SHIPPING_ERROR', errorMessage, statusCode)
      }
    }
  )

  /**
   * @swagger
   * /api/orders/{id}/returns:
   *   post:
   *     summary: Create return for order
   *     tags: [Orders]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
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
   *               - items
   *             properties:
   *               items:
   *                 type: array
   *                 items:
   *                   type: object
   *                   properties:
   *                     orderItemId:
   *                       type: string
   *                     quantity:
   *                       type: integer
   *                     reason:
   *                       type: string
   *     responses:
   *       201:
   *         description: Return created successfully
   */
  router.post(
    '/:id/returns',
    authenticate,
    validate({ body: createReturnSchema }),
    async (req, res) => {
      try {
        const { id } = req.params
        const returnData: CreateReturnRequest = req.body
        const userId = req.user?.id

        const returnRecord = await service.createReturn(id, returnData, userId)

        logger.info('Return created via API', {
          orderId: id,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          returnId: (returnRecord as any)?.id,
          userId,
        })

        res.status(201).json({ success: true, data: returnRecord })
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error'
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const statusCode = (error as any)?.statusCode || 500
        logger.error('Error creating return', {
          error: errorMessage,
          orderId: req.params.id,
        })
        res.status(statusCode).json({ success: false, message: errorMessage })
      }
    }
  )

  /**
   * @swagger
   * /api/orders/{id}/returns/{returnId}/process:
   *   post:
   *     summary: Process return (approve/reject)
   *     tags: [Orders]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *       - in: path
   *         name: returnId
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
   *               - approve
   *             properties:
   *               approve:
   *                 type: boolean
   *               refundAmount:
   *                 type: number
   *     responses:
   *       200:
   *         description: Return processed successfully
   */
  router.post(
    '/:id/returns/:returnId/process',
    authenticate,
    async (req, res) => {
      try {
        const { returnId } = req.params
        const { approve, refundAmount } = req.body
        const userId = req.user?.id

        if (typeof approve !== 'boolean') {
          return res.status(400).json({
            success: false,
            message: 'approve field is required and must be boolean',
          })
        }

        const returnRecord = await service.processReturn(
          req.params.id,
          returnId,
          approve,
          { refundAmount },
          userId
        )

        logger.info('Return processed via API', {
          returnId,
          approve,
          refundAmount,
          userId,
        })

        res.json({ success: true, data: returnRecord })
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error'
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const statusCode = (error as any)?.statusCode || 500
        logger.error('Error processing return', {
          error: errorMessage,
          returnId: req.params.returnId,
        })
        res.status(statusCode).json({ success: false, message: errorMessage })
      }
    }
  )

  /**
   * @swagger
   * /api/orders/{id}/cancel:
   *   post:
   *     summary: Cancel order
   *     tags: [Orders]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               reason:
   *                 type: string
   *     responses:
   *       200:
   *         description: Order cancelled successfully
   */
  router.post('/:id/cancel', authenticate, async (req, res) => {
    try {
      const { id } = req.params
      const { reason } = req.body
      const userId = req.user?.id

      const order = await service.cancelOrder(id, reason, userId)

      logger.info('Order cancelled via API', { orderId: id, reason, userId })

      res.json({ success: true, data: order })
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const statusCode = (error as any)?.statusCode || 500
      logger.error('Error cancelling order', {
        error: errorMessage,
        orderId: req.params.id,
      })
      res.status(statusCode).json({ success: false, message: errorMessage })
    }
  })

  // Add error handler middleware
  router.use((error: unknown, req: any, res: any) => {
    return errorHandler(error, req, res)
  })

  return router
}

export default createOrderRouter()
