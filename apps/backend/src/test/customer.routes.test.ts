import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import express from 'express'
import customerRoutes from '../routes/customers.js'
import { customerService } from '../services/customer.service.js'
import { authenticate } from '../middleware/auth.js'
import { errorHandler } from '../middleware/error-handler.js'

// Mock the customer service
vi.mock('../services/customer.service.js')

// Mock auth middleware
vi.mock('../middleware/auth.js', () => ({
  authenticate: vi.fn((req, res, next) => {
    req.user = { id: 'user-1', email: 'test@example.com' }
    next()
  }),
  authRateLimit: () => (req, res, next) => {
    next()
  },
  requireTwoFactor: (req, res, next) => {
    next()
  },
}))

// Mock validation middleware
vi.mock('../middleware/validation.js', () => ({
  validate: vi.fn(() => (req, res, next) => next()),
  xssProtection: vi.fn(() => (req, res, next) => next()),
  validateFileUpload: vi.fn(() => (req, res, next) => next()),
  validateRateLimit: vi.fn(() => (req, res, next) => next()),
  validateRequest: vi.fn(() => (req, res, next) => next()),
}))

const app = express()
app.use(express.json())
app.use('/api/v1/customers', customerRoutes)
app.use(errorHandler)

describe('Customer Routes', () => {
  const mockCustomer = {
    id: 'customer-1',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+1234567890',
    status: 'ACTIVE',
    loyaltyPoints: 100,
    loyaltyTier: 'bronze',
    totalSpent: 500,
    totalOrders: 5,
    lifetimeValue: 1000,
    marketingOptIn: true,
    emailOptIn: true,
    smsOptIn: false,
    tags: ['vip'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null,
    addresses: [],
    segmentMembers: [],
    interactions: [],
    loyaltyTransactions: [],
    _count: { orders: 5 },
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
        search: 'john',
        page: '1',
        limit: '20',
      })
    })

    it('should handle search with filters', async () => {
      vi.mocked(customerService.searchCustomers).mockResolvedValue(
        mockSearchResult
      )

      const response = await request(app)
        .get('/api/v1/customers')
        .query({
          search: 'john',
          status: 'active',
          segmentId: 'segment-1',
          acceptsMarketing: 'true',
          totalSpentMin: '100',
          totalSpentMax: '1000',
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(customerService.searchCustomers).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'john',
          status: 'active',
          segmentId: 'segment-1',
          acceptsMarketing: true,
          totalSpentMin: 100,
          totalSpentMax: 1000,
        })
      )
    })

    it('should handle service errors', async () => {
      vi.mocked(customerService.searchCustomers).mockRejectedValue(
        new Error('Service error')
      )

      await request(app).get('/api/v1/customers').expect(500)
    })
  })

  describe('GET /api/v1/customers/:id', () => {
    it('should get customer by ID successfully', async () => {
      vi.mocked(customerService.getCustomerById).mockResolvedValue(mockCustomer)

      const response = await request(app)
        .get('/api/v1/customers/customer-1')
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        data: mockCustomer,
      })

      expect(customerService.getCustomerById).toHaveBeenCalledWith(
        'customer-1',
        false
      )
    })

    it('should get customer with timeline', async () => {
      vi.mocked(customerService.getCustomerById).mockResolvedValue(mockCustomer)

      await request(app)
        .get('/api/v1/customers/customer-1')
        .query({ includeTimeline: 'true' })
        .expect(200)

      expect(customerService.getCustomerById).toHaveBeenCalledWith(
        'customer-1',
        true
      )
    })

    it('should return 404 if customer not found', async () => {
      vi.mocked(customerService.getCustomerById).mockResolvedValue(null)

      await request(app).get('/api/v1/customers/nonexistent').expect(404)
    })
  })

  describe('GET /api/v1/customers/:id/timeline', () => {
    const mockTimeline = [
      {
        id: 'order_order-1',
        type: 'order',
        title: 'Order ORD-001',
        description: 'Order for $100 with 1 items',
        date: new Date('2023-01-01').toISOString(),
        metadata: { orderId: 'order-1' },
      },
    ]

    it('should get customer timeline successfully', async () => {
      vi.mocked(customerService.getCustomerTimeline).mockResolvedValue(
        mockTimeline
      )

      const response = await request(app)
        .get('/api/v1/customers/customer-1/timeline')
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        data: mockTimeline,
      })

      expect(customerService.getCustomerTimeline).toHaveBeenCalledWith(
        'customer-1',
        100
      )
    })

    it('should handle custom limit', async () => {
      vi.mocked(customerService.getCustomerTimeline).mockResolvedValue(
        mockTimeline
      )

      await request(app)
        .get('/api/v1/customers/customer-1/timeline')
        .query({ limit: '50' })
        .expect(200)

      expect(customerService.getCustomerTimeline).toHaveBeenCalledWith(
        'customer-1',
        50
      )
    })
  })

  describe('POST /api/v1/customers', () => {
    const createCustomerData = {
      email: 'new@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
      phone: '+1987654321',
      acceptsMarketing: true,
      acceptsSmsMarketing: false,
      preferences: {
        language: 'en',
        currency: 'USD',
        emailMarketing: true,
      },
      addresses: [
        {
          type: 'both',
          firstName: 'Jane',
          lastName: 'Smith',
          address1: '123 Main St',
          city: 'New York',
          country: 'US',
          zip: '10001',
          isDefault: true,
        },
      ],
    }

    it('should create customer successfully', async () => {
      vi.mocked(customerService.createCustomer).mockResolvedValue(mockCustomer)

      const response = await request(app)
        .post('/api/v1/customers')
        .send(createCustomerData)
        .expect(201)

      expect(response.body).toMatchObject({
        success: true,
        data: mockCustomer,
      })

      expect(customerService.createCustomer).toHaveBeenCalledWith(
        createCustomerData,
        'user-1'
      )
    })

    it('should validate required fields', async () => {
      const invalidData = {
        email: 'invalid-email',
        firstName: '',
        lastName: 'Smith',
      }

      await request(app).post('/api/v1/customers').send(invalidData).expect(400)
    })

    it('should handle service errors', async () => {
      vi.mocked(customerService.createCustomer).mockRejectedValue(
        new Error('Service error')
      )

      await request(app)
        .post('/api/v1/customers')
        .send(createCustomerData)
        .expect(500)
    })
  })

  describe('PUT /api/v1/customers/:id', () => {
    const updateData = {
      firstName: 'John Updated',
      email: 'updated@example.com',
    }

    it('should update customer successfully', async () => {
      const updatedCustomer = { ...mockCustomer, ...updateData }
      vi.mocked(customerService.updateCustomer).mockResolvedValue(
        updatedCustomer
      )

      const response = await request(app)
        .put('/api/v1/customers/customer-1')
        .send(updateData)
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        data: updatedCustomer,
      })

      expect(customerService.updateCustomer).toHaveBeenCalledWith(
        'customer-1',
        { ...updateData, id: 'customer-1' },
        'user-1'
      )
    })

    it('should validate update data', async () => {
      const invalidData = {
        email: 'invalid-email',
      }

      await request(app)
        .put('/api/v1/customers/customer-1')
        .send(invalidData)
        .expect(400)
    })
  })

  describe('DELETE /api/v1/customers/:id', () => {
    it('should delete customer successfully', async () => {
      vi.mocked(customerService.deleteCustomer).mockResolvedValue(undefined)

      await request(app).delete('/api/v1/customers/customer-1').expect(204)

      expect(customerService.deleteCustomer).toHaveBeenCalledWith(
        'customer-1',
        'user-1'
      )
    })

    it('should handle service errors', async () => {
      vi.mocked(customerService.deleteCustomer).mockRejectedValue(
        new Error('Service error')
      )

      await request(app).delete('/api/v1/customers/customer-1').expect(500)
    })
  })

  describe('POST /api/v1/customers/:id/interactions', () => {
    const interactionData = {
      type: 'email',
      direction: 'inbound',
      subject: 'Support request',
      content: 'Customer needs help with order',
      status: 'sent',
    }

    const mockInteraction = {
      id: 'interaction-1',
      customerId: 'customer-1',
      type: 'EMAIL',
      channel: 'inbound',
      subject: 'Support request',
      content: 'Customer needs help with order',
      outcome: 'sent',
      createdAt: new Date().toISOString(),
    }

    it('should add interaction successfully', async () => {
      vi.mocked(customerService.addInteraction).mockResolvedValue(
        mockInteraction
      )

      const response = await request(app)
        .post('/api/v1/customers/customer-1/interactions')
        .send(interactionData)
        .expect(201)

      expect(response.body).toMatchObject({
        success: true,
        data: mockInteraction,
      })

      expect(customerService.addInteraction).toHaveBeenCalledWith(
        'customer-1',
        interactionData,
        'user-1'
      )
    })

    it('should validate interaction data', async () => {
      const invalidData = {
        type: 'invalid-type',
        content: '',
      }

      await request(app)
        .post('/api/v1/customers/customer-1/interactions')
        .send(invalidData)
        .expect(400)
    })
  })

  describe('POST /api/v1/customers/:id/loyalty/points', () => {
    const loyaltyData = {
      points: 100,
      description: 'Order bonus',
      referenceType: 'order',
      referenceId: 'order-1',
    }

    it('should add loyalty points successfully', async () => {
      vi.mocked(customerService.addLoyaltyPoints).mockResolvedValue(undefined)

      const response = await request(app)
        .post('/api/v1/customers/customer-1/loyalty/points')
        .send(loyaltyData)
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        data: { message: 'Loyalty points added successfully' },
      })

      expect(customerService.addLoyaltyPoints).toHaveBeenCalledWith(
        'customer-1',
        100,
        'Order bonus',
        'order',
        'order-1',
        'user-1'
      )
    })

    it('should validate loyalty points data', async () => {
      const invalidData = {
        points: -10,
        description: '',
      }

      await request(app)
        .post('/api/v1/customers/customer-1/loyalty/points')
        .send(invalidData)
        .expect(400)
    })
  })

  describe('POST /api/v1/customers/:id/loyalty/redeem', () => {
    const redeemData = {
      points: 50,
      description: 'Discount redemption',
      referenceType: 'order',
      referenceId: 'order-1',
    }

    it('should redeem loyalty points successfully', async () => {
      vi.mocked(customerService.redeemLoyaltyPoints).mockResolvedValue(
        undefined
      )

      const response = await request(app)
        .post('/api/v1/customers/customer-1/loyalty/redeem')
        .send(redeemData)
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        data: { message: 'Loyalty points redeemed successfully' },
      })

      expect(customerService.redeemLoyaltyPoints).toHaveBeenCalledWith(
        'customer-1',
        50,
        'Discount redemption',
        'order',
        'order-1',
        'user-1'
      )
    })
  })

  describe('GET /api/v1/customers/:id/lifetime-value', () => {
    it('should calculate lifetime value successfully', async () => {
      vi.mocked(customerService.calculateLifetimeValue).mockResolvedValue(1500)

      const response = await request(app)
        .get('/api/v1/customers/customer-1/lifetime-value')
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        data: { lifetimeValue: 1500 },
      })

      expect(customerService.calculateLifetimeValue).toHaveBeenCalledWith(
        'customer-1'
      )
    })
  })

  describe('GET /api/v1/customers/:id/export', () => {
    const mockExportData = {
      personalInfo: {
        id: 'customer-1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      },
      preferences: {},
      addresses: [],
      orderHistory: [],
      loyaltyProgram: {},
      segments: [],
      interactions: [],
    }

    it('should export customer data successfully', async () => {
      vi.mocked(customerService.exportCustomerData).mockResolvedValue(
        mockExportData
      )

      const response = await request(app)
        .get('/api/v1/customers/customer-1/export')
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        data: mockExportData,
      })

      expect(customerService.exportCustomerData).toHaveBeenCalledWith(
        'customer-1'
      )
    })
  })

  describe('POST /api/v1/customers/segments', () => {
    const segmentData = {
      name: 'VIP Customers',
      description: 'High value customers',
      conditions: [
        {
          field: 'totalSpent',
          operator: 'greater_than',
          value: 1000,
        },
      ],
      isActive: true,
    }

    const mockSegment = {
      id: 'segment-1',
      name: 'VIP Customers',
      description: 'High value customers',
      rules: segmentData.conditions,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    it('should create segment successfully', async () => {
      vi.mocked(customerService.createSegment).mockResolvedValue(mockSegment)

      const response = await request(app)
        .post('/api/v1/customers/segments')
        .send(segmentData)
        .expect(201)

      expect(response.body).toMatchObject({
        success: true,
        data: mockSegment,
      })

      expect(customerService.createSegment).toHaveBeenCalledWith(
        segmentData,
        'user-1'
      )
    })

    it('should validate segment data', async () => {
      const invalidData = {
        name: '',
        conditions: [],
      }

      await request(app)
        .post('/api/v1/customers/segments')
        .send(invalidData)
        .expect(400)
    })
  })

  describe('GET /api/v1/customers/analytics', () => {
    const mockAnalytics = {
      totalCustomers: 100,
      newCustomers: 20,
      returningCustomers: 80,
      averageOrderValue: 150,
      customerLifetimeValue: 1000,
      churnRate: 5,
      retentionRate: 95,
      segmentDistribution: [],
      geographicDistribution: [],
      loyaltyTierDistribution: [],
    }

    it('should get analytics successfully', async () => {
      vi.mocked(customerService.getAnalytics).mockResolvedValue(mockAnalytics)

      const response = await request(app)
        .get('/api/v1/customers/analytics')
        .query({
          groupBy: 'month',
          'metrics[]': ['total_customers', 'new_customers'],
        })
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        data: mockAnalytics,
      })

      expect(customerService.getAnalytics).toHaveBeenCalledWith(
        expect.objectContaining({
          groupBy: 'month',
        })
      )
    })
  })

  describe('POST /api/v1/customers/bulk/update', () => {
    const bulkUpdateData = {
      customerIds: ['customer-1', 'customer-2'],
      updates: {
        status: 'active',
        acceptsMarketing: true,
      },
    }

    it('should bulk update customers successfully', async () => {
      vi.mocked(customerService.bulkUpdateCustomers).mockResolvedValue({
        updated: 2,
      })

      const response = await request(app)
        .post('/api/v1/customers/bulk/update')
        .send(bulkUpdateData)
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        data: { updated: 2 },
      })

      expect(customerService.bulkUpdateCustomers).toHaveBeenCalledWith(
        bulkUpdateData,
        'user-1'
      )
    })

    it('should validate bulk update data', async () => {
      const invalidData = {
        customerIds: [],
        updates: {},
      }

      await request(app)
        .post('/api/v1/customers/bulk/update')
        .send(invalidData)
        .expect(400)
    })
  })

  describe('POST /api/v1/customers/import', () => {
    const importData = {
      customers: [
        {
          email: 'import@example.com',
          firstName: 'Import',
          lastName: 'Test',
          acceptsMarketing: true,
        },
      ],
      options: {
        updateExisting: false,
        skipInvalid: true,
        sendWelcomeEmail: true,
      },
    }

    const mockImportResult = {
      imported: 1,
      updated: 0,
      skipped: 0,
      errors: [],
    }

    it('should import customers successfully', async () => {
      vi.mocked(customerService.importCustomers).mockResolvedValue(
        mockImportResult
      )

      const response = await request(app)
        .post('/api/v1/customers/import')
        .send(importData)
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        data: mockImportResult,
      })

      expect(customerService.importCustomers).toHaveBeenCalledWith(
        importData,
        'user-1'
      )
    })

    it('should validate import data', async () => {
      const invalidData = {
        customers: [
          {
            email: 'invalid-email',
            firstName: '',
          },
        ],
      }

      await request(app)
        .post('/api/v1/customers/import')
        .send(invalidData)
        .expect(400)
    })
  })

  describe('Authentication', () => {
    it('should require authentication for all routes', async () => {
      // Mock auth middleware to reject
      vi.mocked(authenticate).mockImplementation((_req, res, _next) => {
        res.status(401).json({ error: 'Unauthorized' })
      })

      await request(app).get('/api/v1/customers').expect(401)

      await request(app).post('/api/v1/customers').send({}).expect(401)

      await request(app)
        .put('/api/v1/customers/customer-1')
        .send({})
        .expect(401)

      await request(app).delete('/api/v1/customers/customer-1').expect(401)
    })
  })
})
