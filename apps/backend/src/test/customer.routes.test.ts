import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import express from 'express'
import { z } from 'zod'

// Set required environment variables for route imports
process.env.DATABASE_URL ||= 'postgres://localhost:5432/test'
process.env.REDIS_URL ||= 'redis://localhost:6379'
process.env.ELASTICSEARCH_URL ||= 'http://localhost:9200'
process.env.RABBITMQ_URL ||= 'amqp://localhost'
process.env.S3_ENDPOINT ||= 'http://localhost:9000'
process.env.S3_ACCESS_KEY ||= 'key'
process.env.S3_SECRET_KEY ||= 'secret'
process.env.S3_BUCKET_NAME ||= 'bucket'
process.env.JWT_SECRET ||= 'secretsecretsecretsecretsecretsecret'
process.env.CORS_ORIGINS ||= '*'
process.env.SMTP_HOST ||= 'smtp.example.com'
process.env.SMTP_PORT ||= '587'
process.env.SMTP_FROM ||= 'test@example.com'
process.env.SESSION_SECRET ||= '12345678901234567890123456789012'
process.env.ALLOWED_FILE_TYPES ||= 'image/jpeg,image/png'

// Mock shared schema exports
vi.mock(
  '@oda/shared',
  () => {
    const empty = z.object({})
    const query = z.object({
      page: z.coerce.number().min(1).default(1),
      limit: z.coerce.number().min(1).max(100).default(20),
      sortOrder: z.enum(['asc', 'desc']).default('desc'),
    })
    return {
      createCustomerSchema: empty,
      updateCustomerSchema: empty,
      customerQuerySchema: query,
      customerCommunicationSchema: empty,
    }
  },
  { virtual: true }
)

// Mock the customer service with dynamic methods
vi.mock('../services/customer.service.js', () => {
  const handlers: Record<string | symbol, any> = {}
  return {
    customerService: new Proxy(
      {},
      {
        get: (_target, prop) => {
          if (!handlers[prop]) {
            handlers[prop] = vi.fn()
          }
          return handlers[prop]
        },
      }
    ),
  }
})

// Mock auth middleware
vi.mock('../middleware/auth.js', () => ({
  authenticate: vi.fn((req, res, next) => {
    req.user = { id: 'user-1', email: 'test@example.com' }
    next()
  }),
  authRateLimit: () => (req, res, next) => next(),
  requireTwoFactor: (req, res, next) => next(),
}))

// Mock validation middleware but keep actual validate implementation
vi.mock('../middleware/validation.js', async () => {
  const actual = await vi.importActual<any>('../middleware/validation.js')
  return {
    ...actual,
    xssProtection: vi.fn(() => (req, res, next) => next()),
    validateFileUpload: vi.fn(() => (req, res, next) => next()),
    validateRateLimit: vi.fn(() => (req, res, next) => next()),
    validateRequest: vi.fn(() => (req, res, next) => next()),
  }
})

// Dynamically import modules after environment and mocks are set
const { customerService } = await import('../services/customer.service.js')
const customerRoutes = (await import('../routes/customers.js')).default
const { errorHandler } = await import('../middleware/error-handler.js')

const app = express()
app.use(express.json())
app.use('/api/v1/customers', customerRoutes)
app.use(errorHandler)

describe('Customer Routes', () => {
  const mockCustomer = {
    id: 'customer-1',
    email: 'test@example.com',
  }

  const mockSearchResult = {
    customers: [mockCustomer],
    total: 1,
    page: 1,
    limit: 20,
    totalPages: 1,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/v1/customers', () => {
    it('should search customers successfully', async () => {
      vi.mocked(customerService.searchCustomers).mockResolvedValue(
        mockSearchResult
      )

      const response = await request(app)
        .get('/api/v1/customers')
        .query({ search: 'john', page: 1, limit: 20 })
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        data: mockSearchResult,
      })

      expect(customerService.searchCustomers).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        sortOrder: 'desc',
      })
    })

    it('should handle service errors', async () => {
      vi.mocked(customerService.searchCustomers).mockRejectedValue(
        new Error('Service error')
      )

      await request(app).get('/api/v1/customers').expect(500)
    })
  })
})
