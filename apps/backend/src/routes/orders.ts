import { Router } from 'express';
import { OrderService, CreateOrderRequest, UpdateOrderRequest, ProcessPaymentRequest, CreateFulfillmentRequest, CreateReturnRequest, OrderFilters } from '../services/order.service';
// import { sendSuccess, sendError, sendNotFound, sendCreated, sendPaginated } from '../lib/api-response.js';
import type { ApiResponse } from '../lib/api-response.js';
import { logger } from '../lib/logger';
import { z } from 'zod';
import { OrderStatus, FinancialStatus, FulfillmentStatus, PaymentMethod } from '@prisma/client';

const router = Router();
const orderService = new OrderService();

// Validation schemas
const _createOrderSchema = z.object({
  customerId: z.string().optional(),
  guestEmail: z.string().email().optional(),
  guestPhone: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().optional(),
    variantId: z.string().optional(),
    quantity: z.number().int().positive(),
    price: z.number().positive().optional()
  })).min(1),
  billingAddress: z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    company: z.string().optional(),
    address1: z.string(),
    address2: z.string().optional(),
    city: z.string(),
    state: z.string().optional(),
    country: z.string(),
    postalCode: z.string().optional(),
    phone: z.string().optional()
  }).optional(),
  shippingAddress: z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    company: z.string().optional(),
    address1: z.string(),
    address2: z.string().optional(),
    city: z.string(),
    state: z.string().optional(),
    country: z.string(),
    postalCode: z.string().optional(),
    phone: z.string().optional()
  }).optional(),
  shippingMethod: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  currency: z.string().optional()
}).refine(data => data.customerId || data.guestEmail, {
  message: "Either customerId or guestEmail must be provided"
}).refine(data => data.items.every(item => item.productId || item.variantId), {
  message: "Each item must have either productId or variantId"
});

const _updateOrderSchema = z.object({
  status: z.nativeEnum(OrderStatus).optional(),
  financialStatus: z.nativeEnum(FinancialStatus).optional(),
  fulfillmentStatus: z.nativeEnum(FulfillmentStatus).optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  shippingMethod: z.string().optional(),
  trackingNumber: z.string().optional(),
  trackingUrl: z.string().optional()
});

const processPaymentSchema = z.object({
  amount: z.number().positive(),
  currency: z.string(),
  method: z.nativeEnum(PaymentMethod),
  gateway: z.string(),
  gatewayTransactionId: z.string().optional(),
  metadata: z.any().optional()
});

const createFulfillmentSchema = z.object({
  items: z.array(z.object({
    orderItemId: z.string(),
    quantity: z.number().int().positive()
  })).min(1),
  trackingNumber: z.string().optional(),
  trackingUrl: z.string().optional(),
  carrier: z.string().optional(),
  service: z.string().optional()
});

const createReturnSchema = z.object({
  items: z.array(z.object({
    orderItemId: z.string(),
    quantity: z.number().int().positive(),
    reason: z.string().optional(),
    condition: z.string().optional()
  })).min(1),
  reason: z.string().optional(),
  notes: z.string().optional()
});

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
  sortOrder: z.enum(['asc', 'desc']).optional()
});

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
router.post('/', async (req, res) => {
  try {
    const orderData: CreateOrderRequest = req.body;
    const userId = req.user?.id;

    const order = await orderService.createOrder(orderData, userId);

    logger.info('Order created via API', { orderId: order.id, userId });

    res.status(201).json(ApiResponse.success(order, 'Order created successfully'));
  } catch (error) {
    logger.error('Error creating order', { error: error.message, body: req.body });
    res.status(error.statusCode || 500).json(ApiResponse.error(error.message));
  }
});

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
router.get('/', authMiddleware, async (req, res) => {
  try {
    const validatedQuery = orderFiltersSchema.parse(req.query);
    
    const filters: OrderFilters = {};
    if (validatedQuery.status) filters.status = validatedQuery.status;
    if (validatedQuery.financialStatus) filters.financialStatus = validatedQuery.financialStatus;
    if (validatedQuery.fulfillmentStatus) filters.fulfillmentStatus = validatedQuery.fulfillmentStatus;
    if (validatedQuery.customerId) filters.customerId = validatedQuery.customerId;
    if (validatedQuery.dateFrom) filters.dateFrom = new Date(validatedQuery.dateFrom);
    if (validatedQuery.dateTo) filters.dateTo = new Date(validatedQuery.dateTo);
    if (validatedQuery.search) filters.search = validatedQuery.search;
    if (validatedQuery.tags) filters.tags = validatedQuery.tags;

    const page = validatedQuery.page || 1;
    const limit = validatedQuery.limit || 20;
    const sortBy = validatedQuery.sortBy || 'createdAt';
    const sortOrder = validatedQuery.sortOrder || 'desc';

    const result = await orderService.getOrders(filters, page, limit, sortBy, sortOrder);

    res.json(ApiResponse.success(result, 'Orders retrieved successfully'));
  } catch (error) {
    logger.error('Error retrieving orders', { error: error.message, query: req.query });
    res.status(error.statusCode || 500).json(ApiResponse.error(error.message));
  }
});

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
router.get('/analytics', authMiddleware, async (req, res) => {
  try {
    const { dateFrom, dateTo, customerId } = req.query;

    const analytics = await orderService.getOrderAnalytics(
      dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo ? new Date(dateTo as string) : undefined,
      customerId as string
    );

    res.json(ApiResponse.success(analytics, 'Order analytics retrieved successfully'));
  } catch (error) {
    logger.error('Error retrieving order analytics', { error: error.message, query: req.query });
    res.status(error.statusCode || 500).json(ApiResponse.error(error.message));
  }
});

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
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const order = await orderService.getOrderById(id);

    if (!order) {
      return res.status(404).json(ApiResponse.error('Order not found'));
    }

    res.json(ApiResponse.success(order, 'Order retrieved successfully'));
  } catch (error) {
    logger.error('Error retrieving order', { error: error.message, orderId: req.params.id });
    res.status(error.statusCode || 500).json(ApiResponse.error(error.message));
  }
});

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
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData: UpdateOrderRequest = req.body;
    const userId = req.user?.id;

    const order = await orderService.updateOrder(id, updateData, userId);

    logger.info('Order updated via API', { orderId: id, userId, changes: Object.keys(updateData) });

    res.json(ApiResponse.success(order, 'Order updated successfully'));
  } catch (error) {
    logger.error('Error updating order', { error: error.message, orderId: req.params.id });
    res.status(error.statusCode || 500).json(ApiResponse.error(error.message));
  }
});

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
router.post('/:id/payments', authMiddleware, validateRequest(processPaymentSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const paymentData: ProcessPaymentRequest = req.body;
    const userId = req.user?.id;

    const payment = await orderService.processPayment(id, paymentData, userId);

    logger.info('Payment processed via API', { orderId: id, paymentId: payment.id, userId });

    res.json(ApiResponse.success(payment, 'Payment processed successfully'));
  } catch (error) {
    logger.error('Error processing payment', { error: error.message, orderId: req.params.id });
    res.status(error.statusCode || 500).json(ApiResponse.error(error.message));
  }
});

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
router.post('/:id/fulfillments', authMiddleware, validateRequest(createFulfillmentSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const fulfillmentData: CreateFulfillmentRequest = req.body;
    const userId = req.user?.id;

    const fulfillment = await orderService.createFulfillment(id, fulfillmentData, userId);

    logger.info('Fulfillment created via API', { orderId: id, fulfillmentId: fulfillment.id, userId });

    res.status(201).json(ApiResponse.success(fulfillment, 'Fulfillment created successfully'));
  } catch (error) {
    logger.error('Error creating fulfillment', { error: error.message, orderId: req.params.id });
    res.status(error.statusCode || 500).json(ApiResponse.error(error.message));
  }
});

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
router.post('/:id/fulfillments/:fulfillmentId/ship', authMiddleware, async (req, res) => {
  try {
    const { fulfillmentId } = req.params;
    const userId = req.user?.id;

    const fulfillment = await orderService.shipFulfillment(fulfillmentId, userId);

    logger.info('Fulfillment shipped via API', { fulfillmentId, userId });

    res.json(ApiResponse.success(fulfillment, 'Fulfillment shipped successfully'));
  } catch (error) {
    logger.error('Error shipping fulfillment', { error: error.message, fulfillmentId: req.params.fulfillmentId });
    res.status(error.statusCode || 500).json(ApiResponse.error(error.message));
  }
});

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
router.post('/:id/returns', authMiddleware, validateRequest(createReturnSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const returnData: CreateReturnRequest = req.body;
    const userId = req.user?.id;

    const returnRecord = await orderService.createReturn(id, returnData, userId);

    logger.info('Return created via API', { orderId: id, returnId: returnRecord.id, userId });

    res.status(201).json(ApiResponse.success(returnRecord, 'Return created successfully'));
  } catch (error) {
    logger.error('Error creating return', { error: error.message, orderId: req.params.id });
    res.status(error.statusCode || 500).json(ApiResponse.error(error.message));
  }
});

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
router.post('/:id/returns/:returnId/process', authMiddleware, async (req, res) => {
  try {
    const { returnId } = req.params;
    const { approve, refundAmount } = req.body;
    const userId = req.user?.id;

    if (typeof approve !== 'boolean') {
      return res.status(400).json(ApiResponse.error('approve field is required and must be boolean'));
    }

    const returnRecord = await orderService.processReturn(returnId, approve, refundAmount, userId);

    logger.info('Return processed via API', { returnId, approve, refundAmount, userId });

    res.json(ApiResponse.success(returnRecord, 'Return processed successfully'));
  } catch (error) {
    logger.error('Error processing return', { error: error.message, returnId: req.params.returnId });
    res.status(error.statusCode || 500).json(ApiResponse.error(error.message));
  }
});

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
router.post('/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user?.id;

    const order = await orderService.cancelOrder(id, reason, userId);

    logger.info('Order cancelled via API', { orderId: id, reason, userId });

    res.json(ApiResponse.success(order, 'Order cancelled successfully'));
  } catch (error) {
    logger.error('Error cancelling order', { error: error.message, orderId: req.params.id });
    res.status(error.statusCode || 500).json(ApiResponse.error(error.message));
  }
});

export default router;