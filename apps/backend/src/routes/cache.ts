import { Router, type Request, type Response } from 'express'
import {
  cacheManager,
  cacheMonitoring,
  cacheWarming,
  redisClient,
} from '../lib/cache/index.js'
import { authenticate, requirePermission } from '../middleware/auth.js'
import { sendSuccess, sendError } from '../lib/api-response.js'
import logger from '../lib/logger.js'

const router = Router()

/**
 * @swagger
 * /api/v1/cache/health:
 *   get:
 *     summary: Get cache system health status
 *     tags: [Cache]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cache health status
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
 *                     status:
 *                       type: string
 *                       enum: [healthy, warning, critical]
 *                     issues:
 *                       type: array
 *                       items:
 *                         type: string
 *                     redis:
 *                       type: object
 *                       properties:
 *                         connected:
 *                           type: boolean
 *                         ping:
 *                           type: string
 *                     metrics:
 *                       type: object
 */
router.get(
  '/health',
  authenticate,
  requirePermission('cache:read'),
  async (req: Request, res: Response) => {
    try {
      const health = cacheMonitoring.getHealthStatus()

      // Test Redis connection
      const redisHealth = {
        connected: false,
        ping: null as string | null,
        error: null as string | null,
      }

      try {
        redisHealth.connected = redisClient.isReady()
        if (redisHealth.connected) {
          redisHealth.ping = await redisClient.ping()
        }
      } catch (error) {
        redisHealth.error = (error as Error).message
      }

      const httpStatus = health.status === 'critical' ? 503 : 200

      return sendSuccess(
        res,
        {
          status: health.status,
          issues: health.issues,
          redis: redisHealth,
          metrics: health.metrics,
        },
        undefined,
        httpStatus
      )
    } catch (error) {
      logger.error('Cache health check failed', { error })
      return sendError(res, 'INTERNAL_ERROR', 'Cache health check failed', 500)
    }
  }
)

/**
 * @swagger
 * /api/v1/cache/stats:
 *   get:
 *     summary: Get cache statistics
 *     tags: [Cache]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cache statistics
 */
router.get(
  '/stats',
  authenticate,
  requirePermission('cache:read'),
  async (req: Request, res: Response) => {
    try {
      const stats = cacheManager.getStats()
      const metrics = await cacheMonitoring.collectMetrics()

      return sendSuccess(res, {
        current: stats,
        detailed: metrics,
        timestamp: Date.now(),
      })
    } catch (error) {
      logger.error('Failed to get cache stats', { error })
      return sendError(
        res,
        'INTERNAL_ERROR',
        'Failed to get cache statistics',
        500
      )
    }
  }
)

/**
 * @swagger
 * /api/v1/cache/metrics:
 *   get:
 *     summary: Get cache metrics history
 *     tags: [Cache]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Number of metrics entries to return
 *     responses:
 *       200:
 *         description: Cache metrics history
 */
router.get(
  '/metrics',
  authenticate,
  requirePermission('cache:read'),
  (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100
      const metrics = cacheMonitoring.getMetricsHistory(limit)

      return sendSuccess(res, {
        metrics,
        count: metrics.length,
        timestamp: Date.now(),
      })
    } catch (error) {
      logger.error('Failed to get cache metrics', { error })
      return sendError(
        res,
        'INTERNAL_ERROR',
        'Failed to get cache metrics',
        500
      )
    }
  }
)

/**
 * @swagger
 * /api/v1/cache/alerts:
 *   get:
 *     summary: Get cache alerts
 *     tags: [Cache]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of alerts to return
 *     responses:
 *       200:
 *         description: Cache alerts
 */
router.get(
  '/alerts',
  authenticate,
  requirePermission('cache:read'),
  (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50
      const alerts = cacheMonitoring.getAlerts(limit)

      return sendSuccess(res, {
        alerts,
        count: alerts.length,
        timestamp: Date.now(),
      })
    } catch (error) {
      logger.error('Failed to get cache alerts', { error })
      return sendError(res, 'INTERNAL_ERROR', 'Failed to get cache alerts', 500)
    }
  }
)

/**
 * @swagger
 * /api/v1/cache/warm:
 *   post:
 *     summary: Trigger cache warming
 *     tags: [Cache]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cache warming triggered
 */
router.post(
  '/warm',
  authenticate,
  requirePermission('cache:write'),
  async (req: Request, res: Response) => {
    try {
      // Trigger cache warming asynchronously
      cacheWarming.warmCache().catch((error) => {
        logger.error('Cache warming failed', { error })
      })

      return sendSuccess(res, {
        message: 'Cache warming triggered',
        timestamp: Date.now(),
      })
    } catch (error) {
      logger.error('Failed to trigger cache warming', { error })
      return sendError(
        res,
        'INTERNAL_ERROR',
        'Failed to trigger cache warming',
        500
      )
    }
  }
)

/**
 * @swagger
 * /api/v1/cache/clear:
 *   delete:
 *     summary: Clear cache
 *     tags: [Cache]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: namespace
 *         schema:
 *           type: string
 *         description: Namespace to clear (optional, clears all if not specified)
 *     responses:
 *       200:
 *         description: Cache cleared
 */
router.delete(
  '/clear',
  authenticate,
  requirePermission('cache:write'),
  async (req: Request, res: Response) => {
    try {
      const namespace = req.query.namespace as string | undefined

      await cacheManager.clear(namespace)

      return sendSuccess(res, {
        message: namespace
          ? `Cache cleared for namespace: ${namespace}`
          : 'All cache cleared',
        namespace,
        timestamp: Date.now(),
      })
    } catch (error) {
      logger.error('Failed to clear cache', {
        error,
        namespace: req.query.namespace,
      })
      return sendError(res, 'INTERNAL_ERROR', 'Failed to clear cache', 500)
    }
  }
)

/**
 * @swagger
 * /api/v1/cache/invalidate:
 *   post:
 *     summary: Invalidate cache by tags
 *     tags: [Cache]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Tags to invalidate
 *             required:
 *               - tags
 *     responses:
 *       200:
 *         description: Cache invalidated
 */
router.post(
  '/invalidate',
  authenticate,
  requirePermission('cache:write'),
  async (req: Request, res: Response) => {
    try {
      const { tags } = req.body

      if (!Array.isArray(tags) || tags.length === 0) {
        return sendError(res, 'VALIDATION_ERROR', 'Tags array is required', 400)
      }

      await cacheManager.invalidateByTags(tags)

      return sendSuccess(res, {
        message: 'Cache invalidated by tags',
        tags,
        timestamp: Date.now(),
      })
    } catch (error) {
      logger.error('Failed to invalidate cache by tags', {
        error,
        tags: req.body.tags,
      })
      return sendError(res, 'INTERNAL_ERROR', 'Failed to invalidate cache', 500)
    }
  }
)

/**
 * @swagger
 * /api/v1/cache/key/{key}:
 *   get:
 *     summary: Get specific cache key
 *     tags: [Cache]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: Cache key to retrieve
 *       - in: query
 *         name: namespace
 *         schema:
 *           type: string
 *           default: default
 *         description: Cache namespace
 *     responses:
 *       200:
 *         description: Cache value
 *       404:
 *         description: Key not found
 */
router.get(
  '/key/:key',
  authenticate,
  requirePermission('cache:read'),
  async (req: Request, res: Response) => {
    try {
      const { key } = req.params
      const namespace = (req.query.namespace as string) || 'default'

      const value = await cacheManager.get(key, { namespace })

      if (value === null) {
        return sendError(res, 'NOT_FOUND', 'Cache key not found', 404)
      }

      return sendSuccess(res, {
        key,
        namespace,
        value,
        timestamp: Date.now(),
      })
    } catch (error) {
      logger.error('Failed to get cache key', { error, key: req.params.key })
      return sendError(res, 'INTERNAL_ERROR', 'Failed to get cache key', 500)
    }
  }
)

/**
 * @swagger
 * /api/v1/cache/key/{key}:
 *   delete:
 *     summary: Delete specific cache key
 *     tags: [Cache]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: Cache key to delete
 *       - in: query
 *         name: namespace
 *         schema:
 *           type: string
 *           default: default
 *         description: Cache namespace
 *     responses:
 *       200:
 *         description: Key deleted
 */
router.delete(
  '/key/:key',
  authenticate,
  requirePermission('cache:write'),
  async (req: Request, res: Response) => {
    try {
      const { key } = req.params
      const namespace = (req.query.namespace as string) || 'default'

      await cacheManager.del(key, namespace)

      return sendSuccess(res, {
        message: 'Cache key deleted',
        key,
        namespace,
        timestamp: Date.now(),
      })
    } catch (error) {
      logger.error('Failed to delete cache key', { error, key: req.params.key })
      return sendError(res, 'INTERNAL_ERROR', 'Failed to delete cache key', 500)
    }
  }
)

export default router
