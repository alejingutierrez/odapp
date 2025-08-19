import { Router } from 'express'
import { databaseHealthChecker } from '../lib/database-health.js'
import { getDatabaseMetrics } from '../lib/prisma.js'
import { databasePool } from '../lib/database-pool.js'
import { sendSuccess, sendError } from '../lib/api-response.js'
import { asyncHandler } from '../middleware/error-handler'
import logger from '../lib/logger'

const router: Router = Router()

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Basic health check endpoint
 *     description: Returns the health status of the API and its dependencies
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy or degraded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       503:
 *         description: Service is unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/InternalError'
 */
router.get('/', asyncHandler(async (req, res) => {
  const healthResult = await databaseHealthChecker.performHealthCheck()
  
  const response = {
    status: healthResult.status,
    timestamp: healthResult.timestamp,
    service: 'oda-backend',
    version: process.env.APP_VERSION || '1.0.0',
    uptime: Math.round(process.uptime()),
    checks: healthResult.checks,
  }

  const statusCode = healthResult.status === 'healthy' ? 200 : 
                    healthResult.status === 'degraded' ? 200 : 503

  if (statusCode === 503) {
    return sendError(
      res,
      'SERVICE_UNHEALTHY',
      'Service is unhealthy',
      503,
      response,
      req.requestId
    )
  }

  return sendSuccess(res, response, undefined, statusCode)
}))

/**
 * @swagger
 * /health/detailed:
 *   get:
 *     summary: Detailed health check with metrics
 *     description: Returns comprehensive health status including system metrics
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Detailed health information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       503:
 *         description: Service is unhealthy
 */
router.get('/detailed', asyncHandler(async (req, res) => {
  const [healthResult, dbMetrics, poolStats] = await Promise.all([
    databaseHealthChecker.performHealthCheck(),
    getDatabaseMetrics().catch(() => null),
    databasePool.healthCheck(),
  ])

  const response = {
    status: healthResult.status,
    timestamp: healthResult.timestamp,
    service: 'oda-backend',
    version: process.env.APP_VERSION || '1.0.0',
    uptime: Math.round(process.uptime()),
    environment: process.env.NODE_ENV,
    checks: healthResult.checks,
    metrics: {
      database: dbMetrics,
      connectionPool: poolStats,
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024),
      },
      cpu: process.cpuUsage(),
    },
  }

  const statusCode = healthResult.status === 'healthy' ? 200 : 
                    healthResult.status === 'degraded' ? 200 : 503

  if (statusCode === 503) {
    return sendError(
      res,
      'SERVICE_UNHEALTHY',
      'Service is unhealthy',
      503,
      response,
      req.requestId
    )
  }

  return sendSuccess(res, response, undefined, statusCode)
}))

/**
 * @swagger
 * /health/database:
 *   get:
 *     summary: Database-specific health check
 *     description: Returns health status specifically for database connections
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Database health information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       503:
 *         description: Database is unhealthy
 */
router.get('/database', asyncHandler(async (req, res) => {
  const healthResult = await databaseHealthChecker.performHealthCheck()
  
  // Record health check result
  await databaseHealthChecker.recordHealthCheck(healthResult)
  
  const response = {
    status: healthResult.status,
    timestamp: healthResult.timestamp,
    checks: healthResult.checks,
    metrics: healthResult.metrics,
  }

  const statusCode = healthResult.status === 'healthy' ? 200 : 
                    healthResult.status === 'degraded' ? 200 : 503

  if (statusCode === 503) {
    return sendError(
      res,
      'DATABASE_UNHEALTHY',
      'Database is unhealthy',
      503,
      response,
      req.requestId
    )
  }

  return sendSuccess(res, response, undefined, statusCode)
}))

/**
 * @swagger
 * /health/ready:
 *   get:
 *     summary: Readiness probe endpoint
 *     description: Returns 200 if the service is ready to accept traffic (Kubernetes readiness probe)
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is ready
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       503:
 *         description: Service is not ready
 */
router.get('/ready', asyncHandler(async (_req, res) => {
  const isReady = await databasePool.healthCheck()
  
  if (isReady.healthy) {
    return sendSuccess(res, {
      status: 'ready',
      timestamp: new Date().toISOString(),
    })
  } else {
    return sendError(
      res,
      'SERVICE_NOT_READY',
      'Service is not ready',
      503,
      { error: isReady.error }
    )
  }
}))

/**
 * @swagger
 * /health/live:
 *   get:
 *     summary: Liveness probe endpoint
 *     description: Returns 200 if the service is alive (Kubernetes liveness probe)
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is alive
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.get('/live', (_req, res) => {
  return sendSuccess(res, {
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
  })
})

export default router