import {
  createCustomerSchema,
  updateCustomerSchema,
  customerQuerySchema,
  customerCommunicationSchema,
} from '@oda/shared'
import { Router } from 'express'

import { sendSuccess, sendCreated, sendNoContent } from '../lib/api-response.js'
import { ApiError } from '../lib/errors.js'
import { authenticate } from '../middleware/auth.js'
import { validate } from '../middleware/validation.js'
import { customerService } from '../services/customer.service.js'

const router: Router = Router()

// Apply authentication to all routes
router.use(authenticate)

/**
 * @swagger
 * /api/v1/customers:
 *   get:
 *     summary: Search customers with advanced filtering
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for name, email, or phone
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, blocked]
 *         description: Customer status filter
 *       - in: query
 *         name: segmentId
 *         schema:
 *           type: string
 *         description: Filter by customer segment
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Customers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     customers:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Customer'
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 */
router.get(
  '/',
  validate({ query: customerQuerySchema }),
  async (req, res, next) => {
    try {
      const result = await customerService.searchCustomers(req.query)
      sendSuccess(res, result)
    } catch (error) {
      next(error)
    }
  }
)

/**
 * @swagger
 * /api/v1/customers/{id}:
 *   get:
 *     summary: Get customer by ID with 360° view
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID
 *       - in: query
 *         name: includeTimeline
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include customer timeline
 *     responses:
 *       200:
 *         description: Customer retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Customer'
 *       404:
 *         description: Customer not found
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const includeTimeline = req.query.includeTimeline === 'true'

    const customer = await customerService.getCustomerById(id, includeTimeline)
    if (!customer) {
      throw new ApiError(404, 'Customer not found')
    }

    sendSuccess(res, customer)
  } catch (error) {
    next(error)
  }
})

/**
 * @swagger
 * /api/v1/customers/{id}/timeline:
 *   get:
 *     summary: Get customer timeline for 360° view
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 500
 *           default: 100
 *         description: Maximum number of timeline events
 *     responses:
 *       200:
 *         description: Customer timeline retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       type:
 *                         type: string
 *                         enum: [order, interaction, loyalty, segment_change, profile_update]
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       date:
 *                         type: string
 *                         format: date-time
 *                       metadata:
 *                         type: object
 */
router.get('/:id/timeline', async (req, res, next) => {
  try {
    const { id } = req.params
    const limit = parseInt(req.query.limit as string) || 100

    const timeline = await customerService.getCustomerTimeline(id, limit)
    sendSuccess(res, timeline)
  } catch (error) {
    next(error)
  }
})

/**
 * @swagger
 * /api/v1/customers:
 *   post:
 *     summary: Create new customer
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCustomer'
 *     responses:
 *       201:
 *         description: Customer created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Customer'
 *       409:
 *         description: Customer with email already exists
 */
router.post(
  '/',
  validate({ body: createCustomerSchema }),
  async (req, res, next) => {
    try {
      const customer = await customerService.createCustomer(
        req.body,
        req.user?.id
      )
      sendCreated(res, customer)
    } catch (error) {
      next(error)
    }
  }
)

/**
 * @swagger
 * /api/v1/customers/{id}:
 *   put:
 *     summary: Update customer
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCustomer'
 *     responses:
 *       200:
 *         description: Customer updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Customer'
 *       404:
 *         description: Customer not found
 */
router.put(
  '/:id',
  validate({ body: updateCustomerSchema }),
  async (req, res, next) => {
    try {
      const { id } = req.params
      const customer = await customerService.updateCustomer(
        id,
        { ...req.body, id },
        req.user?.id
      )
      sendSuccess(res, customer)
    } catch (error) {
      next(error)
    }
  }
)

/**
 * @swagger
 * /api/v1/customers/{id}:
 *   delete:
 *     summary: Delete customer (soft delete)
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID
 *     responses:
 *       204:
 *         description: Customer deleted successfully
 *       404:
 *         description: Customer not found
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    await customerService.deleteCustomer(id, req.user?.id)
    sendNoContent(res)
  } catch (error) {
    next(error)
  }
})

/**
 * @swagger
 * /api/v1/customers/{id}/interactions:
 *   post:
 *     summary: Add customer interaction
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CustomerCommunication'
 *     responses:
 *       201:
 *         description: Interaction added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 */
router.post(
  '/:id/interactions',
  validate({ body: customerCommunicationSchema }),
  async (req, res, next) => {
    try {
      const { id } = req.params
      const interaction = await customerService.addInteraction(
        id,
        req.body,
        req.user?.id
      )
      sendCreated(res, interaction)
    } catch (error) {
      next(error)
    }
  }
)

/**
 * @swagger
 * /api/v1/customers/{id}/loyalty/points:
 *   post:
 *     summary: Add loyalty points to customer
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - points
 *               - description
 *             properties:
 *               points:
 *                 type: integer
 *                 minimum: 1
 *               description:
 *                 type: string
 *               referenceType:
 *                 type: string
 *               referenceId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Loyalty points added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
router.post('/:id/loyalty/points', async (req, res, next) => {
  try {
    const { id } = req.params
    const { points, description, referenceType, referenceId } = req.body

    await customerService.addLoyaltyPoints(
      id,
      points,
      description,
      referenceType,
      referenceId,
      req.user?.id
    )
    sendSuccess(res, { message: 'Loyalty points added successfully' })
  } catch (error) {
    next(error)
  }
})

/**
 * @swagger
 * /api/v1/customers/{id}/loyalty/redeem:
 *   post:
 *     summary: Redeem loyalty points
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - points
 *               - description
 *             properties:
 *               points:
 *                 type: integer
 *                 minimum: 1
 *               description:
 *                 type: string
 *               referenceType:
 *                 type: string
 *               referenceId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Loyalty points redeemed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Insufficient loyalty points
 */
router.post('/:id/loyalty/redeem', async (req, res, next) => {
  try {
    const { id } = req.params
    const { points, description, referenceType, referenceId } = req.body

    await customerService.redeemLoyaltyPoints(
      id,
      points,
      description,
      referenceType,
      referenceId,
      req.user?.id
    )
    sendSuccess(res, { message: 'Loyalty points redeemed successfully' })
  } catch (error) {
    next(error)
  }
})

/**
 * @swagger
 * /api/v1/customers/{id}/lifetime-value:
 *   get:
 *     summary: Calculate customer lifetime value
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Customer lifetime value calculated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     lifetimeValue:
 *                       type: number
 */
router.get('/:id/lifetime-value', async (req, res, next) => {
  try {
    const { id } = req.params
    const lifetimeValue = await customerService.calculateLifetimeValue(id)
    sendSuccess(res, { lifetimeValue })
  } catch (error) {
    next(error)
  }
})

/**
 * @swagger
 * /api/v1/customers/{id}/export:
 *   get:
 *     summary: Export customer data for GDPR compliance
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Customer data exported successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   description: Complete customer data export
 */
router.get('/:id/export', async (req, res, next) => {
  try {
    const { id } = req.params
    const exportData = await customerService.exportCustomerData(id)
    sendSuccess(res, exportData)
  } catch (error) {
    next(error)
  }
})

// Customer Segments Routes

/**
 * @swagger
 * /api/v1/customers/segments:
 *   get:
 *     summary: Get all customer segments
 *     tags: [Customer Segments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Customer segments retrieved successfully
 */
/*
router.get('/segments', async (req, res, next) => {
  try {
    // This would be implemented in the customer service
    sendSuccess(res, [])
  } catch (error) {
    next(error)
  }
})
*/

/**
 * @swagger
 * /api/v1/customers/segments:
 *   post:
 *     summary: Create customer segment
 *     tags: [Customer Segments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CustomerSegment'
 *     responses:
 *       201:
 *         description: Customer segment created successfully
 */
/*
router.post('/segments', validate({ body: customerSegmentSchema }), async (req, res, next) => {
  try {
    const segment = await customerService.createSegment(req.body, req.user?.id)
    sendCreated(res, segment)
  } catch (error) {
    next(error)
  }
})
*/

// Analytics Routes

/**
 * @swagger
 * /api/v1/customers/analytics:
 *   get:
 *     summary: Get customer analytics
 *     tags: [Customer Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dateRange
 *         schema:
 *           type: object
 *         description: Date range for analytics
 *       - in: query
 *         name: segmentId
 *         schema:
 *           type: string
 *         description: Filter by segment
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [day, week, month, quarter, year]
 *           default: month
 *         description: Group analytics by time period
 *     responses:
 *       200:
 *         description: Customer analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalCustomers:
 *                       type: integer
 *                     newCustomers:
 *                       type: integer
 *                     returningCustomers:
 *                       type: integer
 *                     averageOrderValue:
 *                       type: number
 *                     customerLifetimeValue:
 *                       type: number
 *                     churnRate:
 *                       type: number
 *                     retentionRate:
 *                       type: number
 */
/*
router.get('/analytics', validate({ query: customerAnalyticsSchema }), async (req, res, next) => {
  try {
    const analytics = await customerService.getAnalytics(req.query)
    sendSuccess(res, analytics)
  } catch (error) {
    next(error)
  }
})
*/

// Bulk Operations Routes

/**
 * @swagger
 * /api/v1/customers/bulk/update:
 *   post:
 *     summary: Bulk update customers
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BulkCustomerUpdate'
 *     responses:
 *       200:
 *         description: Customers updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     updated:
 *                       type: integer
 */
/*
router.post('/bulk/update', validate({ body: bulkCustomerUpdateSchema }), async (req, res, next) => {
  try {
    const result = await customerService.bulkUpdateCustomers(req.body, req.user?.id)
    sendSuccess(res, result)
  } catch (error) {
    next(error)
  }
})
*/

/**
 * @swagger
 * /api/v1/customers/import:
 *   post:
 *     summary: Import customers with deduplication
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CustomerImport'
 *     responses:
 *       200:
 *         description: Customers imported successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     imported:
 *                       type: integer
 *                     updated:
 *                       type: integer
 *                     skipped:
 *                       type: integer
 *                     errors:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           row:
 *                             type: integer
 *                           error:
 *                             type: string
 */
/*
router.post('/import', validate({ body: customerImportSchema }), async (req, res, next) => {
  try {
    const result = await customerService.importCustomers(req.body, req.user?.id)
    sendSuccess(res, result)
  } catch (error) {
    next(error)
  }
})
*/

export default router
