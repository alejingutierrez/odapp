import { createServer } from 'http'

import compression from 'compression'
import * as cors from 'cors'
import express, { type Express } from 'express'
import helmet from 'helmet'

// Import configuration and utilities
import { env } from './config/env'
import {
  initializeRedis,
  shutdownRedis,
  cacheWarming,
  cacheMonitoring,
} from './lib/cache/index.js'
import { EmailService } from './lib/email'
import logger from './lib/logger'
import { prisma } from './lib/prisma'
import { setupSwagger } from './lib/swagger'
import {
  apiVersion,
  backwardCompatibility,
  contentNegotiation,
} from './middleware/api-version'
import { errorHandler, notFoundHandler } from './middleware/error-handler'
import {
  requestId,
  httpLogger,
  detailedLogger,
  performanceLogger,
} from './middleware/request-logger'
import {
  corsOptions,
  helmetOptions,
  generalRateLimit,
  authRateLimit,
  securityHeaders,
  sanitizeRequest,
  configureTrustedProxies,
} from './middleware/security'
import authRoutes from './routes/auth'
import cacheRoutes from './routes/cache'
import customerRoutes from './routes/customers'
import healthRoutes from './routes/health'
import { createInventoryRouter } from './routes/inventory'
import { createOrderRouter } from './routes/orders'
import shopifyRoutes from './routes/shopify'
import simpleRoutes from './routes/simple.js'
import twoFactorRoutes from './routes/two-factor'
import { InventorySchedulerService } from './services/inventory-scheduler.service'
import { InventoryService } from './services/inventory.service'
import { WebSocketService } from './services/websocket.service'

// Import Swagger setup

const app: Express = express()
const server = createServer(app)

// Initialize services
const inventoryService = new InventoryService(prisma)
const webSocketService = new WebSocketService(server, prisma, inventoryService)
const inventoryScheduler = new InventorySchedulerService(
  prisma,
  inventoryService,
  webSocketService
)

// Initialize inventory routes with services
// (Now handled via factory pattern in routes)

// Configure trusted proxies
configureTrustedProxies(app)

// Request ID and logging middleware (must be first)
app.use(requestId)
app.use(httpLogger)

// Security middleware
app.use(helmet(helmetOptions))
app.use(cors.default(corsOptions))
app.use(securityHeaders)
app.use(sanitizeRequest)

// Performance and monitoring middleware
app.use(performanceLogger)

// General middleware
app.use(compression())
app.use(
  express.json({
    limit: '10mb',
    strict: true,
    type: 'application/json',
  })
)
app.use(
  express.urlencoded({
    extended: true,
    limit: '10mb',
    parameterLimit: 1000,
  })
)

// Detailed logging in development
if (env.NODE_ENV === 'development') {
  app.use(detailedLogger)
}

// API versioning middleware
app.use('/api', backwardCompatibility)
app.use('/api', apiVersion)
app.use('/api', contentNegotiation)

// Rate limiting
app.use('/api/', generalRateLimit)
app.use('/api/:version/auth', authRateLimit)

// Initialize services
EmailService.initialize().catch((error) => {
  logger.error('Failed to initialize email service', { error: error.message })
})

// Initialize Redis cache
initializeRedis().catch((error) => {
  logger.error('Failed to initialize Redis cache', { error: error.message })
})

// Setup Swagger documentation
setupSwagger(app)

// Health check routes (no versioning needed)
app.use('/health', healthRoutes)

// API root endpoint
app.get('/api/v1', (req, res) => {
  res.json({
    success: true,
    data: {
      message: 'Oda Fashion Platform API',
      version: '1.0.0',
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
      documentation: `${env.API_BASE_URL}/api-docs`,
    },
    meta: {
      version: req.apiVersion,
      timestamp: new Date().toISOString(),
    },
  })
})

// Authentication routes
app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/two-factor', twoFactorRoutes)

// Cache management routes
app.use('/api/v1/cache', cacheRoutes)

// Inventory management routes
app.use('/api/v1/inventory', createInventoryRouter(inventoryService, webSocketService))

// Customer management routes
app.use('/api/v1/customers', customerRoutes)

// Order management routes
app.use('/api/v1/orders', createOrderRouter())

// Shopify integration routes
app.use('/api/v1/shopify', shopifyRoutes)

// Simple routes for development
app.use('/api/v1', simpleRoutes)

// 404 handler (must be before error handler)
app.use(notFoundHandler)

// Global error handling middleware (must be last)
app.use(errorHandler)

// Start server only if not in test environment
if (env.NODE_ENV !== 'test') {
  server.listen(env.API_PORT, env.API_HOST, () => {
    logger.info('Server started', {
      url: env.API_BASE_URL,
      environment: env.NODE_ENV,
      healthCheck: `${env.API_BASE_URL}/health`,
      documentation: `${env.API_BASE_URL}/api-docs`,
      websocket: 'enabled',
      connectedClients: webSocketService.getConnectedSocketsCount(),
    })

    // Start inventory scheduled jobs
    inventoryScheduler.startAll()
  })

  // Graceful shutdown
  const gracefulShutdown = async (signal: string) => {
    logger.info(`${signal} received, shutting down gracefully`)

    // Stop inventory scheduled jobs
    inventoryScheduler.stopAll()

    // Stop cache warming and monitoring
    cacheWarming.stop()
    cacheMonitoring.stop()

    // Shutdown Redis connection
    await shutdownRedis()

    // Close Prisma connection
    await prisma.$disconnect()

    server.close(() => {
      logger.info('Server closed')
      process.exit(0)
    })
  }

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
  process.on('SIGINT', () => gracefulShutdown('SIGINT'))

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', {
      error: error.message,
      stack: error.stack,
    })
    process.exit(1)
  })

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection', { reason, promise })
    process.exit(1)
  })
}

export default app
