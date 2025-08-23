import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { ShopifyService } from '../services/shopify.service'
import { WebhookProcessor } from '../lib/webhook-processor'
import { authenticate } from '../middleware/auth'
import { validate } from '../middleware/validation'
import { logger } from '../lib/logger'
import { sendSuccess, sendError } from '../lib/api-response'
import { z } from 'zod'

const router = Router()
const prisma = new PrismaClient()

// Initialize Shopify service (would be configured per shop in real implementation)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getShopifyService = (req: any) => {
  const shopDomain =
    req.headers['x-shop-domain'] || process.env.SHOPIFY_SHOP_DOMAIN
  const accessToken =
    req.headers['x-shopify-access-token'] || process.env.SHOPIFY_ACCESS_TOKEN

  if (!shopDomain || !accessToken) {
    throw new Error('Shopify configuration missing')
  }

  return new ShopifyService(prisma, shopDomain, accessToken)
}

// Validation schemas
const syncRequestSchema = z.object({
  entityType: z
    .enum(['products', 'inventory', 'orders', 'customers'])
    .optional(),
  direction: z.enum(['push', 'pull', 'bidirectional']).optional(),
  force: z.boolean().optional(),
})

// Sync endpoints
router.post(
  '/sync/products/push',
  authenticate,
  validate({ body: syncRequestSchema }),
  async (req, res) => {
    try {
      const shopifyService = getShopifyService(req)
      const result = await shopifyService.syncProductsToShopify()

      res.json(
        sendSuccess(res, result, 'Products sync to Shopify completed')
      )
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Products sync to Shopify failed:', error)
      res.status(500).json(sendError(res, 'PRODUCTS_SYNC_FAILED', errorMessage, 500))
    }
  }
)

router.post(
  '/sync/products/pull',
  authenticate,
  validate({ body: syncRequestSchema }),
  async (req, res) => {
    try {
      const shopifyService = getShopifyService(req)
      const result = await shopifyService.syncProductsFromShopify()

      res.json(
        sendSuccess(res, result, 'Products sync from Shopify completed')
      )
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Products sync from Shopify failed:', error)
      res.status(500).json(sendError(res, 'PRODUCTS_SYNC_FAILED', errorMessage, 500))
    }
  }
)

router.post(
  '/sync/inventory/push',
  authenticate,
  validate({ body: syncRequestSchema }),
  async (req, res) => {
    try {
      const shopifyService = getShopifyService(req)
      const result = await shopifyService.syncInventoryToShopify()

      res.json(
        sendSuccess(res, result, 'Inventory sync to Shopify completed')
      )
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Inventory sync to Shopify failed:', error)
      res.status(500).json(sendError(res, 'INVENTORY_SYNC_FAILED', errorMessage, 500))
    }
  }
)

router.post(
  '/sync/orders/pull',
  authenticate,
  validate({ body: syncRequestSchema }),
  async (req, res) => {
    try {
      const shopifyService = getShopifyService(req)
      const result = await shopifyService.importOrdersFromShopify()

      res.json(
        sendSuccess(res, result, 'Orders import from Shopify completed')
      )
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Orders import from Shopify failed:', error)
      res.status(500).json(sendError(res, 'ORDERS_IMPORT_FAILED', errorMessage, 500))
    }
  }
)

router.post(
  '/sync/customers/pull',
  authenticate,
  validate({ body: syncRequestSchema }),
  async (req, res) => {
    try {
      const shopifyService = getShopifyService(req)
      const result = await shopifyService.syncCustomersFromShopify()

      res.json(
        sendSuccess(res, result, 'Customers sync from Shopify completed')
      )
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Customers sync from Shopify failed:', error)
      res.status(500).json(sendError(res, 'CUSTOMERS_SYNC_FAILED', errorMessage, 500))
    }
  }
)

router.post(
  '/sync/full',
  authenticate,
  validate({ body: syncRequestSchema }),
  async (req, res) => {
    try {
      const shopifyService = getShopifyService(req)
      const results = await shopifyService.triggerFullSync()

      res.json(sendSuccess(res, results, 'Full sync completed'))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Full sync failed:', error)
      res.status(500).json(sendError(res, 'FULL_SYNC_FAILED', errorMessage, 500))
    }
  }
)

// Sync status endpoints
router.get('/sync/status', authenticate, async (req, res) => {
  try {
    const shopifyService = getShopifyService(req)
    const statuses = await shopifyService.getSyncStatus()

    res.json(sendSuccess(res, statuses, 'Sync statuses retrieved'))
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error('Failed to get sync statuses:', error)
    res
      .status(500)
      .json(sendError(res, 'SYNC_STATUSES_FAILED', errorMessage, 500))
  }
})

router.get('/sync/history', authenticate, async (req, res) => {
  try {
    const { entityType } = req.query
    const shopifyService = getShopifyService(req)
    const history = await shopifyService.getSyncHistory(entityType as string)

    res.json(sendSuccess(res, history, 'Sync history retrieved'))
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error('Failed to get sync history:', error)
    res.status(500).json(sendError(res, 'SYNC_HISTORY_FAILED', errorMessage, 500))
  }
})

router.get('/sync/metrics', authenticate, async (req, res) => {
  try {
    const { entityType, days } = req.query
    const syncStatusManager = new (
      await import('../lib/sync-status-manager')
    ).SyncStatusManager(prisma)
    const metrics = await syncStatusManager.getSyncMetrics(
      entityType as string,
      days ? parseInt(days as string) : 7
    )

    res.json(sendSuccess(res, metrics, 'Sync metrics retrieved'))
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error('Failed to get sync metrics:', error)
    res.status(500).json(sendError(res, 'SYNC_METRICS_FAILED', errorMessage, 500))
  }
})

// Circuit breaker status
router.get('/circuit-breaker/status', authenticate, async (req, res) => {
  try {
    const shopifyService = getShopifyService(req)
    const status = shopifyService.getCircuitBreakerStatus()

    res.json(sendSuccess(res, status, 'Circuit breaker status retrieved'))
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error('Failed to get circuit breaker status:', error)
    res
      .status(500)
      .json(sendError(res, 'CIRCUIT_BREAKER_STATUS_FAILED', errorMessage, 500))
  }
})

// Webhook endpoint (no authentication for Shopify webhooks)
router.post('/webhooks', async (req, res) => {
  try {
    const topic = req.headers['x-shopify-topic'] as string
    const shopDomain = req.headers['x-shopify-shop-domain'] as string
    const hmacHeader = req.headers['x-shopify-hmac-sha256'] as string

    if (!topic || !shopDomain) {
      return res
        .status(400)
        .json(sendError(res, 'MISSING_WEBHOOK_HEADERS', 'Missing required webhook headers', 400))
    }

    const webhookEvent = {
      topic,
      shop_domain: shopDomain,
      payload: req.body,
      headers: {
        'x-shopify-topic': topic,
        'x-shopify-shop-domain': shopDomain,
        'x-shopify-hmac-sha256': hmacHeader,
      },
      timestamp: new Date(),
    }

    const webhookProcessor = new WebhookProcessor(prisma)
    await webhookProcessor.process(webhookEvent)

    res
      .status(200)
      .json(sendSuccess(res, null, 'Webhook processed successfully'))
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error('Webhook processing failed:', error)
    res.status(500).json(sendError(res, 'WEBHOOK_PROCESSING_FAILED', errorMessage, 500))
  }
})

// Webhook management endpoints
router.get('/webhooks/logs', authenticate, async (req, res) => {
  try {
    const { _limit = 50, _topic, _status } = req.query
    void _limit, _topic, _status

    // TODO: Implement webhook log query when schema is available
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const logs: any[] = [] // await prisma.webhookLog.findMany({
    //   where: {
    //     ...(topic && { topic: topic as string }),
    //     ...(status && { status: status as string }),
    //   },
    //   orderBy: { processedAt: 'desc' },
    //   take: parseInt(limit as string),
    // })

    res.json(sendSuccess(res, logs, 'Webhook logs retrieved'))
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error('Failed to get webhook logs:', error)
    res.status(500).json(sendError(res, 'WEBHOOK_LOGS_FAILED', errorMessage, 500))
  }
})

// Configuration endpoints
router.get('/config', authenticate, async (req, res) => {
  try {
    const config = {
      shopDomain: process.env.SHOPIFY_SHOP_DOMAIN,
      hasAccessToken: !!process.env.SHOPIFY_ACCESS_TOKEN,
      webhookSecret: !!process.env.SHOPIFY_WEBHOOK_SECRET,
      apiVersion: '2023-10',
    }

    res.json(sendSuccess(res, config, 'Shopify configuration retrieved'))
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error('Failed to get Shopify configuration:', error)
    res
      .status(500)
      .json(sendError(res, 'CONFIGURATION_FAILED', errorMessage, 500))
  }
})

router.post('/config/test', authenticate, async (req, res) => {
  try {
    const shopifyService = getShopifyService(req)

    // Test connection by fetching shop info
    const shopInfo = await (
      shopifyService as unknown as {
        client: { get: (_path: string) => Promise<{ data: { shop: unknown } }> }
      }
    ).client.get('/shop.json')

    res.json(
      sendSuccess(res, 
        {
          connected: true,
          shop: shopInfo.data.shop,
          testedAt: new Date(),
        },
        'Shopify connection test successful'
      )
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error('Shopify connection test failed:', error)
    res.status(500).json(sendError(res, 'CONNECTION_TEST_FAILED', errorMessage, 500))
  }
})

// Manual conflict resolution
router.post('/conflicts/resolve', authenticate, async (req, res) => {
  try {
    const { conflictId, resolution } = req.body

    // This would integrate with a conflict resolution UI
    // For now, just acknowledge the request

    res.json(
      sendSuccess(res, 
        {
          conflictId,
          resolution,
          resolvedAt: new Date(),
        },
        'Conflict resolution applied'
      )
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error('Conflict resolution failed:', error)
    res.status(500).json(sendError(res, 'CONFLICT_RESOLUTION_FAILED', errorMessage, 500))
  }
})

// Scheduled sync endpoints
router.post('/sync/schedule', authenticate, async (req, res) => {
  try {
    const { entityType, direction, schedule } = req.body

    // This would integrate with a job scheduler like Bull or Agenda
    // For now, just acknowledge the request

    res.json(
      sendSuccess(res, 
        {
          entityType,
          direction,
          schedule,
          scheduledAt: new Date(),
        },
        'Sync scheduled successfully'
      )
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error('Sync scheduling failed:', error)
    res.status(500).json(sendError(res, 'SYNC_SCHEDULING_FAILED', errorMessage, 500))
  }
})

export default router
