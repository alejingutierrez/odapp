import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import app from '../index'
import {
  OrderStatus,
  FinancialStatus,
  FulfillmentStatus,
  PaymentMethod,
} from '@prisma/client'

// Mock authentication middleware
vi.mock('../middleware/auth', () => ({
  authMiddleware: (req: unknown, res: unknown, next: unknown) => {
    const reqTyped = req as { user: unknown }
    const nextTyped = next as () => void
    reqTyped.user = {
      id: 'test-user',
      email: 'test@example.com',
    }
    nextTyped()
  },
}))

// Mock Prisma
vi.mock('../lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn(),
    order: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      groupBy: vi.fn(),
      aggregate: vi.fn(),
      findFirst: vi.fn(),
    },
    customer: {
      findUnique: vi.fn(),
    },
    product: {
      findUnique: vi.fn(),
    },
    productVariant: {
      findUnique: vi.fn(),
    },
    customerAddress: {
      create: vi.fn(),
    },
    payment: {
      create: vi.fn(),
      update: vi.fn(),
      aggregate: vi.fn(),
    },
    fulfillment: {
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
    },
    return: {
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    $queryRaw: vi.fn(),
  },
}))

// Mock other services
vi.mock('../services/inventory.service', () => ({
  InventoryService: vi.fn().mockImplementation(() => ({
    getAvailableQuantity: vi.fn().mockResolvedValue(10),
    createReservation: vi.fn().mockResolvedValue(true),
    releaseReservation: vi.fn().mockResolvedValue(true),
    adjustInventory: vi.fn().mockResolvedValue(true),
  })),
}))

vi.mock('../services/customer.service', () => ({
  CustomerService: vi.fn().mockImplementation(() => ({
    updateOrderStatistics: vi.fn().mockResolvedValue(true),
  })),
}))

vi.mock('../services/audit.service', () => ({
  AuditService: vi.fn().mockImplementation(() => ({
    log: vi.fn().mockResolvedValue(true),
  })),
}))

vi.mock('../services/websocket.service', () => ({
  WebSocketService: {
    getInstance: vi.fn().mockReturnValue({
      broadcast: vi.fn(),
    }),
  },
}))

describe('Order Management Integration Tests', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
  })

  describe('POST /api/v1/orders', () => {
    it('should create a new order successfully', async () => {
      const mockOrder = {
        id: 'order-1',
        orderNumber: 'ORD-20250815-0001',
        customerId: 'customer-1',
        status: OrderStatus.PENDING,
        financialStatus: FinancialStatus.PENDING,
        fulfillmentStatus: FulfillmentStatus.UNFULFILLED,
        subtotal: 59.98,
        taxAmount: 0,
        shippingAmount: 0,
        discountAmount: 0,
        totalAmount: 59.98,
        currency: 'USD',
        items: [],
      }

      const mockCustomer = { id: 'customer-1', email: 'test@example.com' }
      const mockProduct = {
        id: 'product-1',
        name: 'Test Product',
        price: 29.99,
        sku: 'TEST-001',
        trackQuantity: true,
      }

      const { prisma } = await import('../lib/prisma')

      // Mock transaction
      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        const mockTx = {
          customer: { findUnique: vi.fn().mockResolvedValue(mockCustomer) },
          product: { findUnique: vi.fn().mockResolvedValue(mockProduct) },
          productVariant: { findUnique: vi.fn() },
          order: {
            create: vi.fn().mockResolvedValue(mockOrder),
            findFirst: vi.fn().mockResolvedValue(null),
          },
          customerAddress: { create: vi.fn() },
        }
        return await callback(mockTx)
      })

      const orderData = {
        customerId: 'customer-1',
        items: [
          {
            productId: 'product-1',
            quantity: 2,
            price: 29.99,
          },
        ],
        currency: 'USD',
      }

      const response = await request(app)
        .post('/api/v1/orders')
        .send(orderData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.orderNumber).toBe('ORD-20250815-0001')
      expect(response.body.data.totalAmount).toBe(59.98)
    })

    it('should validate required fields', async () => {
      const invalidData = {
        customerId: 'customer-1',
        // Missing items
      }

      const response = await request(app)
        .post('/api/v1/orders')
        .send(invalidData)
        .expect(400)

      expect(response.body.success).toBe(false)
    })

    it('should create guest order', async () => {
      const mockOrder = {
        id: 'order-1',
        orderNumber: 'ORD-20250815-0001',
        customerId: null,
        guestEmail: 'guest@example.com',
        status: OrderStatus.PENDING,
        totalAmount: 29.99,
      }

      const mockProduct = {
        id: 'product-1',
        name: 'Test Product',
        price: 29.99,
        trackQuantity: true,
      }

      const { prisma } = await import('../lib/prisma')

      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        const mockTx = {
          customer: { findUnique: vi.fn() },
          product: { findUnique: vi.fn().mockResolvedValue(mockProduct) },
          productVariant: { findUnique: vi.fn() },
          order: {
            create: vi.fn().mockResolvedValue(mockOrder),
            findFirst: vi.fn().mockResolvedValue(null),
          },
          customerAddress: { create: vi.fn() },
        }
        return await callback(mockTx)
      })

      const orderData = {
        guestEmail: 'guest@example.com',
        items: [
          {
            productId: 'product-1',
            quantity: 1,
          },
        ],
      }

      const response = await request(app)
        .post('/api/v1/orders')
        .send(orderData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.guestEmail).toBe('guest@example.com')
      expect(response.body.data.customerId).toBeNull()
    })
  })

  describe('GET /api/v1/orders', () => {
    it('should retrieve orders with pagination', async () => {
      const { prisma } = await import('../lib/prisma')

      const mockOrders = [
        {
          id: 'order-1',
          orderNumber: 'ORD-20250815-0001',
          status: OrderStatus.PENDING,
          totalAmount: 59.98,
        },
      ]

      vi.mocked(prisma.order.findMany).mockResolvedValue(mockOrders as unknown)
      vi.mocked(prisma.order.count).mockResolvedValue(1)

      const response = await request(app).get('/api/v1/orders').expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.orders).toHaveLength(1)
      expect(response.body.data.pagination.total).toBe(1)
    })

    it('should handle query filters', async () => {
      const { prisma } = await import('../lib/prisma')

      vi.mocked(prisma.order.findMany).mockResolvedValue([])
      vi.mocked(prisma.order.count).mockResolvedValue(0)

      const response = await request(app)
        .get('/api/v1/orders')
        .query({
          status: [OrderStatus.PENDING],
          page: '1',
          limit: '10',
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { in: [OrderStatus.PENDING] },
          }),
          skip: 0,
          take: 10,
        })
      )
    })
  })

  describe('GET /api/v1/orders/:id', () => {
    it('should retrieve order by ID', async () => {
      const { prisma } = await import('../lib/prisma')

      const mockOrder = {
        id: 'order-1',
        orderNumber: 'ORD-20250815-0001',
        status: OrderStatus.PENDING,
        items: [],
        payments: [],
        fulfillments: [],
        returns: [],
      }

      vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder as any)

      const response = await request(app)
        .get('/api/v1/orders/order-1')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.id).toBe('order-1')
    })

    it('should return 404 for non-existent order', async () => {
      const { prisma } = await import('../lib/prisma')

      vi.mocked(prisma.order.findUnique).mockResolvedValue(null)

      const response = await request(app)
        .get('/api/v1/orders/nonexistent')
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Order not found')
    })
  })

  describe('POST /api/v1/orders/:id/payments', () => {
    it('should process payment successfully', async () => {
      const { prisma } = await import('../lib/prisma')

      const mockOrder = {
        id: 'order-1',
        totalAmount: 100.0,
        status: OrderStatus.PENDING,
      }

      const mockPayment = {
        id: 'payment-1',
        orderId: 'order-1',
        amount: 100.0,
        status: 'COMPLETED',
      }

      vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder as unknown)
      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        const mockTx = {
          payment: {
            create: vi.fn().mockResolvedValue(mockPayment),
            update: vi
              .fn()
              .mockResolvedValue({ ...mockPayment, status: 'COMPLETED' }),
            aggregate: vi.fn().mockResolvedValue({ _sum: { amount: 100.0 } }),
          },
          order: {
            update: vi.fn().mockResolvedValue({
              ...mockOrder,
              financialStatus: FinancialStatus.PAID,
            }),
          },
        }
        return await callback(mockTx)
      })

      const paymentData = {
        amount: 100.0,
        currency: 'USD',
        method: PaymentMethod.CREDIT_CARD,
        gateway: 'stripe',
      }

      const response = await request(app)
        .post('/api/v1/orders/order-1/payments')
        .send(paymentData)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.status).toBe('COMPLETED')
    })
  })

  describe('GET /api/v1/orders/analytics', () => {
    it('should return order analytics', async () => {
      const { prisma } = await import('../lib/prisma')

      const _mockAnalytics = {
        totalOrders: 100,
        totalRevenue: 10000,
        averageOrderValue: 100,
        ordersByStatus: {
          [OrderStatus.PENDING]: 10,
          [OrderStatus.CONFIRMED]: 20,
        },
        ordersByMonth: [],
        topProducts: [],
        topCustomers: [],
      }

      vi.mocked(prisma.order.count).mockResolvedValue(100)
      vi.mocked(prisma.order.aggregate).mockResolvedValue({
        _sum: { totalAmount: 10000 },
      } as unknown)
      vi.mocked(prisma.order.groupBy).mockResolvedValue([
        { status: OrderStatus.PENDING, _count: { status: 10 } },
        { status: OrderStatus.CONFIRMED, _count: { status: 20 } },
      ] as unknown)
      vi.mocked(prisma.$queryRaw).mockResolvedValue([])

      const response = await request(app)
        .get('/api/v1/orders/analytics')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.totalOrders).toBe(100)
      expect(response.body.data.totalRevenue).toBe(10000)
      expect(response.body.data.averageOrderValue).toBe(100)
    })
  })
})
