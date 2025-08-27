import express, { type Express } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import { vi } from 'vitest'

import authRoutes from '../routes/auth'
import twoFactorRoutes from '../routes/two-factor'
import productRoutes from '../routes/products'
import customerRoutes from '../routes/customers'
import orderRoutes from '../routes/orders'
import inventoryRoutes from '../routes/inventory'
import shopifyRoutes from '../routes/shopify'
import cacheRoutes from '../routes/cache'
import categoriesRoutes from '../routes/categories'
import collectionsRoutes from '../routes/collections'
import healthRoutes from '../routes/health'

// Mock all services and dependencies
vi.mock('../lib/cache/cache-manager.js')
vi.mock('../services/product.service.js')
vi.mock('../services/customer.service.js')
vi.mock('../services/order.service.js')
vi.mock('../services/inventory.service.js')
vi.mock('../services/shopify.service.js')
vi.mock('../services/search.service.js')
vi.mock('../services/image.service.js')
vi.mock('../services/analytics.service.js')
vi.mock('../services/audit.service.js')
vi.mock('../services/import-export.service.js')
vi.mock('../services/payment-gateway.service.js')
vi.mock('../services/shipping.service.js')
vi.mock('../services/websocket.service.js')

// Mock auth middleware
vi.mock('../middleware/auth.js', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    authRateLimit: vi.fn(() => (req: any, res: any, next: any) => next()),
    authenticate: vi.fn(() => (req: any, res: any, next: any) => next()),
    requireAuth: vi.fn(() => (req: any, res: any, next: any) => next()),
    requirePermission: vi.fn(() => (req: any, res: any, next: any) => next()),
    requireAnyPermission: vi.fn(() => (req: any, res: any, next: any) => next()),
    requireRole: vi.fn(() => (req: any, res: any, next: any) => next()),
    requireAnyRole: vi.fn(() => (req: any, res: any, next: any) => next()),
  }
})

// Mock validation middleware
vi.mock('../middleware/validation.js', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    validate: vi.fn(() => (req: any, res: any, next: any) => next()),
  }
})

// Mock Prisma
vi.mock('../lib/prisma.js', () => ({
  prisma: {
    product: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      count: vi.fn(),
      delete: vi.fn(),
    },
    productVariant: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    category: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    collection: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    orderItem: {
      count: vi.fn(),
    },
    location: {
      findFirst: vi.fn(),
    },
    inventoryItem: {
      createMany: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    collectionProduct: {
      createMany: vi.fn(),
    },
    customer: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    order: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    user: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    syncStatus: {
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    webhookLog: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    payment: {
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    smsVerificationCode: {
      create: vi.fn(),
      deleteMany: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    userSession: {
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    userBackupCode: {
      create: vi.fn(),
      findFirst: vi.fn(),
      deleteMany: vi.fn(),
      update: vi.fn(),
    },
    userRole: {
      create: vi.fn(),
      findMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

// Note: auth middleware is already mocked above

// Create test app without starting server
export function createTestApp(): Express {
  const app: Express = express()

  // Security middleware
  app.use(helmet())
  app.use(
    cors({
      origin: ['http://localhost:3000'],
      credentials: true,
    })
  )

  // General middleware
  app.use(compression())
  app.use(express.json({ limit: '10mb' }))
  app.use(express.urlencoded({ extended: true }))

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: 'test',
      version: '1.0.0',
    })
  })

  // API routes
  app.get('/api/v1', (req, res) => {
    res.json({
      message: 'Oda Fashion Platform API',
      version: '1.0.0',
      environment: 'test',
    })
  })

  // All API routes
  app.use('/api/auth', authRoutes)
  app.use('/api/two-factor', twoFactorRoutes)
  app.use('/api/products', productRoutes)
  app.use('/api/customers', customerRoutes)
  app.use('/api/orders', orderRoutes)
  app.use('/api/inventory', inventoryRoutes)
  app.use('/api/shopify', shopifyRoutes)
  app.use('/api/cache', cacheRoutes)
  app.use('/api/categories', categoriesRoutes)
  app.use('/api/collections', collectionsRoutes)
  app.use('/api/health', healthRoutes)

  // Error handling middleware
  app.use(
    (
      err: Error,
      req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ) => {
      console.error(err.stack)
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: err.message || 'Internal Server Error',
        },
      })
    }
  )

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Route not found',
      },
    })
  })

  return app
}

// Helper function to setup common mocks
export function setupCommonMocks() {
  const { prisma } = require('../lib/prisma.js')
  
  // Setup default mock implementations
  prisma.product.findMany.mockResolvedValue([])
  prisma.product.findFirst.mockResolvedValue(null)
  prisma.product.create.mockResolvedValue({ id: 'product-1', name: 'Test Product' })
  prisma.product.update.mockResolvedValue({ id: 'product-1', name: 'Updated Product' })
  prisma.product.updateMany.mockResolvedValue({ count: 1 })
  prisma.product.count.mockResolvedValue(0)
  prisma.product.delete.mockResolvedValue({ id: 'product-1' })
  
  prisma.customer.findMany.mockResolvedValue([])
  prisma.customer.findFirst.mockResolvedValue(null)
  prisma.customer.create.mockResolvedValue({ id: 'customer-1', email: 'test@example.com' })
  prisma.customer.update.mockResolvedValue({ id: 'customer-1', email: 'updated@example.com' })
  prisma.customer.count.mockResolvedValue(0)
  
  prisma.order.findMany.mockResolvedValue([])
  prisma.order.findFirst.mockResolvedValue(null)
  prisma.order.create.mockResolvedValue({ id: 'order-1', status: 'pending' })
  prisma.order.update.mockResolvedValue({ id: 'order-1', status: 'completed' })
  prisma.order.count.mockResolvedValue(0)
  
  prisma.user.findFirst.mockResolvedValue({ id: 'user-1', email: 'test@example.com' })
  prisma.user.findMany.mockResolvedValue([])
  
  prisma.location.findFirst.mockResolvedValue({ id: 'location-1', name: 'Default Location', isDefault: true })
  
  prisma.$transaction.mockImplementation(async (callback) => {
    return await callback(prisma)
  })
}
