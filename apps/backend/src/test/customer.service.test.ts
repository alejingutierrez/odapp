import { describe, it, expect, beforeEach, vi } from 'vitest'
import { customerService } from '../services/customer.service.js'
import { AppError } from '../lib/errors.js'
import { cacheManager } from '../lib/cache/index.js'
import { auditService } from '../services/audit.service.js'
import { emailService } from '../lib/email.js'

// Mock dependencies
vi.mock('../lib/cache/index.js')
vi.mock('../services/audit.service.js')
vi.mock('../lib/email.js')

// Mock prisma
const mockPrisma = {
  customer: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    count: vi.fn(),
    aggregate: vi.fn(),
    groupBy: vi.fn(),
  },
  customerSegment: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
  },
  customerSegmentMember: {
    findUnique: vi.fn(),
    create: vi.fn(),
    createMany: vi.fn(),
    delete: vi.fn(),
    groupBy: vi.fn(),
  },
  customerInteraction: {
    create: vi.fn(),
  },
  loyaltyTransaction: {
    create: vi.fn(),
  },
  customerAddress: {
    groupBy: vi.fn(),
  },
  order: {
    findMany: vi.fn(),
    aggregate: vi.fn(),
  },
  auditLog: {
    findMany: vi.fn(),
  },
  $transaction: vi.fn(),
}

vi.mock('../lib/prisma', () => ({
  prisma: mockPrisma,
}))

describe('CustomerService', () => {
  const mockUser = { id: 'user-1' }

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
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    addresses: [],
    segmentMembers: [],
    interactions: [],
    loyaltyTransactions: [],
    _count: { orders: 5 },
  }

  const mockCreateCustomerData = {
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
        type: 'both' as const,
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

  beforeEach(() => {
    vi.clearAllMocks()

    // Setup default mock implementations
    vi.mocked(cacheManager.get).mockResolvedValue(null)
    vi.mocked(cacheManager.set).mockResolvedValue(undefined)
    vi.mocked(cacheManager.del).mockResolvedValue(undefined)
    vi.mocked(auditService.log).mockResolvedValue(undefined)
    vi.mocked(emailService.sendWelcomeEmail).mockResolvedValue(undefined)
  })

  describe('getCustomerById', () => {
    it('should return customer from cache if available', async () => {
      vi.mocked(cacheManager.get).mockResolvedValue(mockCustomer)

      const result = await customerService.getCustomerById('customer-1')

      expect(result).toEqual(mockCustomer)
      expect(cacheManager.get).toHaveBeenCalledWith('customer:customer-1:full')
      expect(mockPrisma.customer.findUnique).not.toHaveBeenCalled()
    })

    it('should fetch customer from database and cache it', async () => {
      vi.mocked(cacheManager.get).mockResolvedValue(null)
      mockPrisma.customer.findUnique.mockResolvedValue(mockCustomer)

      const result = await customerService.getCustomerById('customer-1')

      expect(result).toEqual(mockCustomer)
      expect(mockPrisma.customer.findUnique).toHaveBeenCalledWith({
        where: { id: 'customer-1', deletedAt: null },
        include: expect.objectContaining({
          addresses: { orderBy: { isDefault: 'desc' } },
          segmentMembers: { include: { segment: true } },
          interactions: { orderBy: { createdAt: 'desc' }, take: 50 },
          loyaltyTransactions: { orderBy: { createdAt: 'desc' }, take: 100 },
          _count: { select: { orders: true } },
        }),
      })
      expect(cacheManager.set).toHaveBeenCalledWith(
        'customer:customer-1:full',
        mockCustomer,
        300
      )
    })

    it('should return null if customer not found', async () => {
      vi.mocked(cacheManager.get).mockResolvedValue(null)
      mockPrisma.customer.findUnique.mockResolvedValue(null)

      const result = await customerService.getCustomerById('nonexistent')

      expect(result).toBeNull()
    })

    it('should handle database errors', async () => {
      vi.mocked(cacheManager.get).mockResolvedValue(null)
      mockPrisma.customer.findUnique.mockRejectedValue(
        new Error('Database error')
      )

      await expect(
        customerService.getCustomerById('customer-1')
      ).rejects.toThrow(AppError)
    })
  })

  describe('getCustomerTimeline', () => {
    const mockOrders = [
      {
        id: 'order-1',
        orderNumber: 'ORD-001',
        totalAmount: 100,
        status: 'COMPLETED',
        orderDate: new Date('2023-01-01'),
        items: [{ name: 'Product 1', quantity: 1 }],
      },
    ]

    const mockInteractions = [
      {
        id: 'interaction-1',
        type: 'EMAIL',
        channel: 'support',
        subject: 'Support inquiry',
        content: 'Customer needs help',
        outcome: 'resolved',
        createdAt: new Date('2023-01-02'),
      },
    ]

    const mockLoyaltyTransactions = [
      {
        id: 'loyalty-1',
        type: 'EARNED',
        points: 50,
        description: 'Order bonus',
        referenceType: 'order',
        referenceId: 'order-1',
        createdAt: new Date('2023-01-03'),
      },
    ]

    beforeEach(() => {
      mockPrisma.order.findMany.mockResolvedValue(mockOrders)
      mockPrisma.customerInteraction.findMany.mockResolvedValue(
        mockInteractions
      )
      mockPrisma.loyaltyTransaction.findMany.mockResolvedValue(
        mockLoyaltyTransactions
      )
      mockPrisma.auditLog.findMany.mockResolvedValue([])
    })

    it('should return timeline from cache if available', async () => {
      const mockTimeline = [
        {
          id: 'order_order-1',
          type: 'order',
          title: 'Order ORD-001',
          description: 'Order for $100 with 1 items',
          date: new Date('2023-01-01'),
          metadata: expect.any(Object),
        },
      ]
      vi.mocked(cacheManager.get).mockResolvedValue(mockTimeline)

      const result = await customerService.getCustomerTimeline('customer-1')

      expect(result).toEqual(mockTimeline)
      expect(cacheManager.get).toHaveBeenCalledWith(
        'customer:customer-1:timeline'
      )
    })

    it('should fetch and build timeline from database', async () => {
      vi.mocked(cacheManager.get).mockResolvedValue(null)

      const result = await customerService.getCustomerTimeline(
        'customer-1',
        100
      )

      expect(result).toHaveLength(3) // 1 order + 1 interaction + 1 loyalty transaction
      expect(result[0]).toMatchObject({
        type: 'loyalty',
        title: 'Earned 50 points',
      })
      expect(result[1]).toMatchObject({
        type: 'interaction',
        title: 'Email support',
      })
      expect(result[2]).toMatchObject({
        type: 'order',
        title: 'Order ORD-001',
      })

      expect(cacheManager.set).toHaveBeenCalledWith(
        'customer:customer-1:timeline',
        result,
        300
      )
    })

    it('should limit timeline events', async () => {
      vi.mocked(cacheManager.get).mockResolvedValue(null)

      const result = await customerService.getCustomerTimeline('customer-1', 2)

      expect(result).toHaveLength(2)
    })
  })

  describe('searchCustomers', () => {
    const mockSearchResult = {
      customers: [mockCustomer],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    }

    beforeEach(() => {
      mockPrisma.customer.findMany.mockResolvedValue([mockCustomer])
      mockPrisma.customer.count.mockResolvedValue(1)
    })

    it('should search customers with basic query', async () => {
      const query = { search: 'john', page: 1, limit: 20 }

      const result = await customerService.searchCustomers(query)

      expect(result).toEqual(mockSearchResult)
      expect(mockPrisma.customer.findMany).toHaveBeenCalledWith({
        where: {
          deletedAt: null,
          OR: [
            { firstName: { contains: 'john', mode: 'insensitive' } },
            { lastName: { contains: 'john', mode: 'insensitive' } },
            { email: { contains: 'john', mode: 'insensitive' } },
            { phone: { contains: 'john' } },
          ],
        },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
      })
    })

    it('should apply status filter', async () => {
      const query = { status: 'active' as const, page: 1, limit: 20 }

      await customerService.searchCustomers(query)

      expect(mockPrisma.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'ACTIVE',
          }),
        })
      )
    })

    it('should apply segment filter', async () => {
      const query = { segmentId: 'segment-1', page: 1, limit: 20 }

      await customerService.searchCustomers(query)

      expect(mockPrisma.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            segmentMembers: {
              some: { segmentId: 'segment-1' },
            },
          }),
        })
      )
    })

    it('should apply total spent range filter', async () => {
      const query = {
        totalSpentMin: 100,
        totalSpentMax: 1000,
        page: 1,
        limit: 20,
      }

      await customerService.searchCustomers(query)

      expect(mockPrisma.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            totalSpent: {
              gte: 100,
              lte: 1000,
            },
          }),
        })
      )
    })

    it('should handle sorting', async () => {
      const query = {
        sortBy: 'totalSpent',
        sortOrder: 'asc' as const,
        page: 1,
        limit: 20,
      }

      await customerService.searchCustomers(query)

      expect(mockPrisma.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { totalSpent: 'asc' },
        })
      )
    })
  })

  describe('createCustomer', () => {
    beforeEach(() => {
      mockPrisma.customer.findUnique.mockResolvedValue(null) // No existing customer
      mockPrisma.customer.create.mockResolvedValue(mockCustomer)
    })

    it('should create customer successfully', async () => {
      const result = await customerService.createCustomer(
        mockCreateCustomerData,
        mockUser.id
      )

      expect(result).toEqual(mockCustomer)
      expect(mockPrisma.customer.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: 'new@example.com',
          firstName: 'Jane',
          lastName: 'Smith',
          phone: '+1987654321',
          marketingOptIn: true,
          smsOptIn: false,
          addresses: {
            create: expect.arrayContaining([
              expect.objectContaining({
                firstName: 'Jane',
                lastName: 'Smith',
                address1: '123 Main St',
                city: 'New York',
                country: 'US',
                postalCode: '10001',
                isDefault: true,
                type: 'BOTH',
              }),
            ]),
          },
        }),
        include: expect.any(Object),
      })
      expect(auditService.log).toHaveBeenCalledWith({
        action: 'customer_created',
        entity: 'customer',
        entityId: mockCustomer.id,
        newValues: mockCustomer,
        userId: mockUser.id,
      })
    })

    it('should throw error if customer with email already exists', async () => {
      mockPrisma.customer.findUnique.mockResolvedValue(mockCustomer)

      await expect(
        customerService.createCustomer(mockCreateCustomerData, mockUser.id)
      ).rejects.toThrow(
        new AppError('Customer with this email already exists', 409)
      )
    })

    it('should handle database errors', async () => {
      mockPrisma.customer.create.mockRejectedValue(new Error('Database error'))

      await expect(
        customerService.createCustomer(mockCreateCustomerData, mockUser.id)
      ).rejects.toThrow(AppError)
    })
  })

  describe('updateCustomer', () => {
    const updateData = {
      id: 'customer-1',
      firstName: 'John Updated',
      email: 'updated@example.com',
    }

    beforeEach(() => {
      mockPrisma.customer.findUnique
        .mockResolvedValueOnce(mockCustomer) // For getCustomerById
        .mockResolvedValueOnce(null) // For email uniqueness check
      mockPrisma.customer.update.mockResolvedValue({
        ...mockCustomer,
        ...updateData,
      })
    })

    it('should update customer successfully', async () => {
      const result = await customerService.updateCustomer(
        'customer-1',
        updateData,
        mockUser.id
      )

      expect(result).toEqual({ ...mockCustomer, ...updateData })
      expect(mockPrisma.customer.update).toHaveBeenCalledWith({
        where: { id: 'customer-1' },
        data: expect.objectContaining({
          firstName: 'John Updated',
          email: 'updated@example.com',
          updatedAt: expect.any(Date),
        }),
        include: expect.any(Object),
      })
      expect(auditService.log).toHaveBeenCalledWith({
        action: 'customer_updated',
        entity: 'customer',
        entityId: 'customer-1',
        oldValues: mockCustomer,
        newValues: { ...mockCustomer, ...updateData },
        userId: mockUser.id,
      })
    })

    it('should throw error if customer not found', async () => {
      mockPrisma.customer.findUnique.mockResolvedValueOnce(null)

      await expect(
        customerService.updateCustomer('nonexistent', updateData, mockUser.id)
      ).rejects.toThrow(new AppError('Customer not found', 404))
    })

    it('should throw error if email already exists', async () => {
      mockPrisma.customer.findUnique
        .mockResolvedValueOnce(mockCustomer)
        .mockResolvedValueOnce({ ...mockCustomer, id: 'other-customer' }) // Email exists

      await expect(
        customerService.updateCustomer('customer-1', updateData, mockUser.id)
      ).rejects.toThrow(
        new AppError('Customer with this email already exists', 409)
      )
    })
  })

  describe('deleteCustomer', () => {
    beforeEach(() => {
      mockPrisma.customer.findUnique.mockResolvedValue(mockCustomer)
      mockPrisma.customer.update.mockResolvedValue({
        ...mockCustomer,
        deletedAt: new Date(),
      })
    })

    it('should soft delete customer successfully', async () => {
      await customerService.deleteCustomer('customer-1', mockUser.id)

      expect(mockPrisma.customer.update).toHaveBeenCalledWith({
        where: { id: 'customer-1' },
        data: {
          deletedAt: expect.any(Date),
          email: expect.stringContaining('test@example.com_deleted_'),
        },
      })
      expect(auditService.log).toHaveBeenCalledWith({
        action: 'customer_deleted',
        entity: 'customer',
        entityId: 'customer-1',
        oldValues: mockCustomer,
        userId: mockUser.id,
      })
    })

    it('should throw error if customer not found', async () => {
      mockPrisma.customer.findUnique.mockResolvedValue(null)

      await expect(
        customerService.deleteCustomer('nonexistent', mockUser.id)
      ).rejects.toThrow(new AppError('Customer not found', 404))
    })
  })

  describe('addInteraction', () => {
    const interactionData = {
      type: 'email' as const,
      direction: 'inbound' as const,
      subject: 'Support request',
      content: 'Customer needs help with order',
      status: 'sent' as const,
    }

    const mockInteraction = {
      id: 'interaction-1',
      customerId: 'customer-1',
      type: 'EMAIL',
      channel: 'inbound',
      subject: 'Support request',
      content: 'Customer needs help with order',
      outcome: 'sent',
      createdBy: mockUser.id,
      createdAt: new Date(),
    }

    beforeEach(() => {
      mockPrisma.customerInteraction.create.mockResolvedValue(mockInteraction)
    })

    it('should add interaction successfully', async () => {
      const result = await customerService.addInteraction(
        'customer-1',
        interactionData,
        mockUser.id
      )

      expect(result).toEqual(mockInteraction)
      expect(mockPrisma.customerInteraction.create).toHaveBeenCalledWith({
        data: {
          customerId: 'customer-1',
          type: 'EMAIL',
          channel: 'inbound',
          subject: 'Support request',
          content: 'Customer needs help with order',
          outcome: 'sent',
          createdBy: mockUser.id,
        },
      })
      expect(auditService.log).toHaveBeenCalledWith({
        action: 'interaction_added',
        entity: 'customer_interaction',
        entityId: mockInteraction.id,
        newValues: mockInteraction,
        userId: mockUser.id,
      })
    })
  })

  describe('addLoyaltyPoints', () => {
    beforeEach(() => {
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          loyaltyTransaction: {
            create: vi.fn().mockResolvedValue({}),
          },
          customer: {
            update: vi.fn().mockResolvedValue({}),
          },
        })
      })
    })

    it('should add loyalty points successfully', async () => {
      await customerService.addLoyaltyPoints(
        'customer-1',
        100,
        'Order bonus',
        'order',
        'order-1',
        mockUser.id
      )

      expect(mockPrisma.$transaction).toHaveBeenCalled()
    })
  })

  describe('redeemLoyaltyPoints', () => {
    beforeEach(() => {
      mockPrisma.customer.findUnique.mockResolvedValue(mockCustomer)
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          loyaltyTransaction: {
            create: vi.fn().mockResolvedValue({}),
          },
          customer: {
            update: vi.fn().mockResolvedValue({}),
          },
        })
      })
    })

    it('should redeem loyalty points successfully', async () => {
      await customerService.redeemLoyaltyPoints(
        'customer-1',
        50,
        'Discount redemption',
        'order',
        'order-1',
        mockUser.id
      )

      expect(mockPrisma.$transaction).toHaveBeenCalled()
    })

    it('should throw error if insufficient points', async () => {
      mockPrisma.customer.findUnique.mockResolvedValue({
        ...mockCustomer,
        loyaltyPoints: 10, // Less than requested 50
      })

      await expect(
        customerService.redeemLoyaltyPoints(
          'customer-1',
          50,
          'Discount',
          undefined,
          undefined,
          mockUser.id
        )
      ).rejects.toThrow(new AppError('Insufficient loyalty points', 400))
    })

    it('should throw error if customer not found', async () => {
      mockPrisma.customer.findUnique.mockResolvedValue(null)

      await expect(
        customerService.redeemLoyaltyPoints(
          'nonexistent',
          50,
          'Discount',
          undefined,
          undefined,
          mockUser.id
        )
      ).rejects.toThrow(new AppError('Customer not found', 404))
    })
  })

  describe('calculateLifetimeValue', () => {
    const mockCustomerWithOrders = {
      ...mockCustomer,
      orders: [
        {
          totalAmount: 100,
          orderDate: new Date('2023-01-01'),
        },
        {
          totalAmount: 200,
          orderDate: new Date('2023-02-01'),
        },
        {
          totalAmount: 150,
          orderDate: new Date('2023-03-01'),
        },
      ],
    }

    beforeEach(() => {
      mockPrisma.customer.findUnique.mockResolvedValue(mockCustomerWithOrders)
      mockPrisma.customer.update.mockResolvedValue(mockCustomerWithOrders)
    })

    it('should calculate lifetime value correctly', async () => {
      const result = await customerService.calculateLifetimeValue('customer-1')

      expect(result).toBeGreaterThan(0)
      expect(mockPrisma.customer.update).toHaveBeenCalledWith({
        where: { id: 'customer-1' },
        data: { lifetimeValue: expect.any(Number) },
      })
    })

    it('should return 0 for customer with no orders', async () => {
      mockPrisma.customer.findUnique.mockResolvedValue({
        ...mockCustomer,
        orders: [],
      })

      const result = await customerService.calculateLifetimeValue('customer-1')

      expect(result).toBe(0)
    })

    it('should return 0 if customer not found', async () => {
      mockPrisma.customer.findUnique.mockResolvedValue(null)

      const result = await customerService.calculateLifetimeValue('nonexistent')

      expect(result).toBe(0)
    })
  })

  describe('getAnalytics', () => {
    const mockAnalyticsParams = {
      dateRange: {
        startDate: '2023-01-01',
        endDate: '2023-12-31',
      },
      groupBy: 'month' as const,
      metrics: ['total_customers', 'new_customers'] as const,
    }

    beforeEach(() => {
      mockPrisma.customer.count.mockResolvedValue(100)
      mockPrisma.customer.aggregate.mockResolvedValue({
        _avg: {
          averageOrderValue: 150,
          lifetimeValue: 1000,
        },
      })
      mockPrisma.customerSegmentMember.groupBy.mockResolvedValue([])
      mockPrisma.customerAddress.groupBy.mockResolvedValue([])
      mockPrisma.customer.groupBy.mockResolvedValue([])
    })

    it('should return customer analytics', async () => {
      const result = await customerService.getAnalytics(mockAnalyticsParams)

      expect(result).toMatchObject({
        totalCustomers: expect.any(Number),
        newCustomers: expect.any(Number),
        returningCustomers: expect.any(Number),
        averageOrderValue: expect.any(Number),
        customerLifetimeValue: expect.any(Number),
        churnRate: expect.any(Number),
        retentionRate: expect.any(Number),
        segmentDistribution: expect.any(Array),
        geographicDistribution: expect.any(Array),
        loyaltyTierDistribution: expect.any(Array),
      })
    })
  })

  describe('bulkUpdateCustomers', () => {
    const bulkUpdateData = {
      customerIds: ['customer-1', 'customer-2'],
      updates: {
        status: 'active' as const,
        acceptsMarketing: true,
      },
    }

    beforeEach(() => {
      mockPrisma.customer.updateMany.mockResolvedValue({ count: 2 })
    })

    it('should bulk update customers successfully', async () => {
      const result = await customerService.bulkUpdateCustomers(
        bulkUpdateData,
        mockUser.id
      )

      expect(result).toEqual({ updated: 2 })
      expect(mockPrisma.customer.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['customer-1', 'customer-2'] },
          deletedAt: null,
        },
        data: {
          status: 'ACTIVE',
          marketingOptIn: true,
        },
      })
      expect(auditService.log).toHaveBeenCalledWith({
        action: 'customers_bulk_updated',
        entity: 'customer',
        entityId: 'bulk',
        newValues: {
          customerIds: ['customer-1', 'customer-2'],
          updates: bulkUpdateData.updates,
          count: 2,
        },
        userId: mockUser.id,
      })
    })
  })

  describe('exportCustomerData', () => {
    const mockCustomerWithFullData = {
      ...mockCustomer,
      addresses: [
        {
          type: 'BOTH',
          firstName: 'John',
          lastName: 'Doe',
          address1: '123 Main St',
          city: 'New York',
          country: 'US',
          postalCode: '10001',
          isDefault: true,
        },
      ],
      orders: [
        {
          orderNumber: 'ORD-001',
          orderDate: new Date('2023-01-01'),
          status: 'COMPLETED',
          totalAmount: 100,
          currency: 'USD',
          items: [
            {
              name: 'Product 1',
              sku: 'SKU-001',
              quantity: 1,
              price: 100,
            },
          ],
          payments: [],
        },
      ],
      interactions: [
        {
          type: 'EMAIL',
          channel: 'support',
          subject: 'Support request',
          createdAt: new Date('2023-01-02'),
        },
      ],
      loyaltyTransactions: [
        {
          type: 'EARNED',
          points: 50,
          description: 'Order bonus',
          createdAt: new Date('2023-01-01'),
        },
      ],
      segmentMembers: [
        {
          segment: {
            name: 'VIP Customers',
          },
          addedAt: new Date('2023-01-01'),
        },
      ],
    }

    beforeEach(() => {
      mockPrisma.customer.findUnique.mockResolvedValue(mockCustomerWithFullData)
    })

    it('should export customer data successfully', async () => {
      const result = await customerService.exportCustomerData('customer-1')

      expect(result).toMatchObject({
        personalInfo: expect.objectContaining({
          id: 'customer-1',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
        }),
        preferences: expect.any(Object),
        addresses: expect.any(Array),
        orderHistory: expect.any(Array),
        loyaltyProgram: expect.any(Object),
        segments: expect.any(Array),
        interactions: expect.any(Array),
      })

      expect(auditService.log).toHaveBeenCalledWith({
        action: 'customer_data_exported',
        entity: 'customer',
        entityId: 'customer-1',
        newValues: { exportedAt: expect.any(Date) },
      })
    })

    it('should throw error if customer not found', async () => {
      mockPrisma.customer.findUnique.mockResolvedValue(null)

      await expect(
        customerService.exportCustomerData('nonexistent')
      ).rejects.toThrow(new AppError('Customer not found', 404))
    })
  })

  describe('importCustomers', () => {
    const importData = {
      customers: [mockCreateCustomerData],
      options: {
        updateExisting: false,
        skipInvalid: true,
        sendWelcomeEmail: true,
      },
    }

    beforeEach(() => {
      mockPrisma.customer.findUnique.mockResolvedValue(null) // No existing customer
      mockPrisma.customer.create.mockResolvedValue(mockCustomer)
    })

    it('should import customers successfully', async () => {
      const result = await customerService.importCustomers(
        importData,
        mockUser.id
      )

      expect(result).toEqual({
        imported: 1,
        updated: 0,
        skipped: 0,
        errors: [],
      })

      expect(emailService.sendWelcomeEmail).toHaveBeenCalledWith(
        mockCustomer.email,
        { firstName: mockCustomer.firstName }
      )

      expect(auditService.log).toHaveBeenCalledWith({
        action: 'customers_imported',
        entity: 'customer',
        entityId: 'bulk',
        newValues: {
          imported: 1,
          updated: 0,
          skipped: 0,
          errorCount: 0,
        },
        userId: mockUser.id,
      })
    })

    it('should skip existing customers when updateExisting is false', async () => {
      mockPrisma.customer.findUnique.mockResolvedValue(mockCustomer) // Existing customer

      const result = await customerService.importCustomers(
        importData,
        mockUser.id
      )

      expect(result).toEqual({
        imported: 0,
        updated: 0,
        skipped: 1,
        errors: [],
      })
    })

    it('should update existing customers when updateExisting is true', async () => {
      mockPrisma.customer.findUnique.mockResolvedValue(mockCustomer) // Existing customer
      mockPrisma.customer.update.mockResolvedValue(mockCustomer)

      const importDataWithUpdate = {
        ...importData,
        options: { ...importData.options, updateExisting: true },
      }

      const result = await customerService.importCustomers(
        importDataWithUpdate,
        mockUser.id
      )

      expect(result).toEqual({
        imported: 0,
        updated: 1,
        skipped: 0,
        errors: [],
      })
    })

    it('should handle errors gracefully when skipInvalid is true', async () => {
      mockPrisma.customer.create.mockRejectedValue(
        new Error('Validation error')
      )

      const result = await customerService.importCustomers(
        importData,
        mockUser.id
      )

      expect(result).toEqual({
        imported: 0,
        updated: 0,
        skipped: 1,
        errors: [{ row: 1, error: 'Validation error' }],
      })
    })
  })

  describe('createSegment', () => {
    const segmentData = {
      name: 'VIP Customers',
      description: 'High value customers',
      conditions: [
        {
          field: 'totalSpent',
          operator: 'greater_than' as const,
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
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    beforeEach(() => {
      mockPrisma.customerSegment.create.mockResolvedValue(mockSegment)
      mockPrisma.customer.findMany.mockResolvedValue([mockCustomer])
      mockPrisma.customerSegmentMember.createMany.mockResolvedValue({
        count: 1,
      })
    })

    it('should create segment successfully', async () => {
      const result = await customerService.createSegment(
        segmentData,
        mockUser.id
      )

      expect(result).toEqual(mockSegment)
      expect(mockPrisma.customerSegment.create).toHaveBeenCalledWith({
        data: {
          name: 'VIP Customers',
          description: 'High value customers',
          rules: segmentData.conditions,
          isActive: true,
        },
      })
      expect(auditService.log).toHaveBeenCalledWith({
        action: 'segment_created',
        entity: 'customer_segment',
        entityId: mockSegment.id,
        newValues: mockSegment,
        userId: mockUser.id,
      })
    })
  })
})
