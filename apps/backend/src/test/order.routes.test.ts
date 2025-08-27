import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import { OrderService } from '../services/order.service.js'
import { OrderStatus, PaymentStatus } from '@prisma/client'

// Mock the OrderService
vi.mock('../services/order.service.js')

// Mock auth middleware
vi.mock('../middleware/auth.js', () => ({
  authenticate: vi.fn((req: any, res: any, next: any) => {
    req.user = { id: 'user-1', email: 'test@example.com' }
    next()
  }),
  authRateLimit: () => (req: any, res: any, next: any) => {
    next()
  },
  requireTwoFactor: (req: any, res: any, next: any) => {
    next()
  }
}))

// Import the real routes
import { createOrderRouter } from '../routes/orders.js'

describe('Order Routes', () => {
  let app: any
  let mockOrderService: any

  beforeEach(() => {
    // Create a simple Express app for testing
    const express = require('express')
    app = express()
    app.use(express.json())

    mockOrderService = {
      createOrder: vi.fn().mockImplementation((orderData: any) => {
        // Check if this is the error test case
        if (orderData.items && orderData.items[0] && orderData.items[0].quantity > 1) {
          return Promise.reject(new Error('Insufficient inventory'))
        }
        return Promise.resolve({
          id: 'order-1',
          orderNumber: 'ORD-20250815-0001',
          customerId: 'customer-1',
          status: OrderStatus.PENDING,
          totalAmount: 59.98,
          items: [],
        })
      }),
      getOrderById: vi.fn().mockImplementation((id: string) => {
        if (id === 'nonexistent') {
          return Promise.reject(new Error('Order not found'))
        }
        return Promise.resolve({
          id: 'order-1',
          orderNumber: 'ORD-20250815-0001',
          status: 'PENDING'
        })
      }),
      getOrders: vi.fn().mockResolvedValue({
        orders: [
          {
            id: 'order-1',
            orderNumber: 'ORD-20250815-0001',
            status: 'PENDING',
            totalAmount: 59.98,
          },
          {
            id: 'order-2',
            orderNumber: 'ORD-20250815-0002',
            status: 'CONFIRMED',
            totalAmount: 129.99,
          },
        ],
        pagination: {
          limit: 20,
          page: 1,
          pages: 1,
          total: 2,
        },
      }),
      updateOrder: vi.fn().mockResolvedValue({
        id: 'order-1',
        notes: 'Updated notes',
        orderNumber: 'ORD-20250815-0001',
        status: 'CONFIRMED',
      }),
      cancelOrder: vi.fn().mockResolvedValue({
        id: 'order-1',
        orderNumber: 'ORD-20250815-0001',
        status: 'CANCELLED',
        cancelledAt: '2025-08-26T03:01:37.981Z',
      }),
      processPayment: vi.fn().mockResolvedValue({
        id: 'payment-1',
        orderId: 'order-1',
        amount: 59.98,
        status: PaymentStatus.COMPLETED,
      }),
      createFulfillment: vi.fn().mockResolvedValue({
        id: 'fulfillment-1',
        orderId: 'order-1',
        status: 'PENDING',
        trackingNumber: 'TRACK123',
      }),
      shipFulfillment: vi.fn().mockResolvedValue({
        id: 'fulfillment-1',
        orderId: 'order-1',
        status: 'SHIPPED',
        shippedAt: '2025-08-26T03:21:44.104Z',
      }),
      createReturn: vi.fn().mockResolvedValue({
        id: 'return-1',
        orderId: 'order-1',
        returnNumber: 'RET-20250815-0001',
        status: 'REQUESTED',
      }),
      processReturn: vi.fn().mockResolvedValue({
        id: 'return-1',
        orderId: 'order-1',
        status: 'APPROVED',
        refundAmount: 50,
      }),
      getOrderAnalytics: vi.fn().mockResolvedValue({
        totalOrders: 100,
        totalRevenue: 10000,
        averageOrderValue: 100,
        ordersByStatus: {
          PENDING: 10,
          CONFIRMED: 20,
        },
        ordersByMonth: [{ month: '2025-08', orders: 50, revenue: 5000 }],
        topProducts: [
          {
            productId: 'product-1',
            productName: 'Product 1',
            quantity: 100,
            revenue: 2000,
          },
        ],
        topCustomers: [
          {
            customerId: 'customer-1',
            customerName: 'John Doe',
            orders: 5,
            revenue: 500,
          },
        ],
      }),
    }

    vi.mocked(OrderService).mockImplementation(() => mockOrderService)

    // Add middleware to set req.user for all requests
    app.use((req, res, next) => {
      req.user = { id: 'user-1' }
      next()
    })
    
    // Mock the authenticate middleware
    app.use((req, res, next) => {
      // Skip authentication for tests
      next()
    })

    // Use the real routes
    app.use('/api/orders', createOrderRouter(mockOrderService))
  })

  describe('POST /api/orders', () => {
    const validOrderData = {
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

    const mockCreatedOrder = {
      id: 'order-1',
      orderNumber: 'ORD-20250815-0001',
      customerId: 'customer-1',
      status: OrderStatus.PENDING,
      totalAmount: 59.98,
      items: [],
    }

    it('should create order successfully', async () => {
      // Reset and explicitly set the mock
      mockOrderService.createOrder.mockReset()
      mockOrderService.createOrder.mockResolvedValue(mockCreatedOrder)

      const response = await request(app)
        .post('/api/orders')
        .send(validOrderData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockCreatedOrder)
      expect(mockOrderService.createOrder).toHaveBeenCalledWith(
        validOrderData,
        'user-1'
      )
    })

    it('should validate required fields', async () => {
      const invalidData = {
        customerId: 'customer-1',
        // Missing items
      }

      const response = await request(app)
        .post('/api/orders')
        .send(invalidData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(mockOrderService.createOrder).not.toHaveBeenCalled()
    })

    it('should require either customerId or guestEmail', async () => {
      const invalidData = {
        items: [
          {
            productId: 'product-1',
            quantity: 2,
          },
        ],
        // Missing customerId and guestEmail
      }

      const response = await request(app)
        .post('/api/orders')
        .send(invalidData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(mockOrderService.createOrder).not.toHaveBeenCalled()
    })

    it('should validate item structure', async () => {
      const invalidData = {
        customerId: 'customer-1',
        items: [
          {
            quantity: 2,
            // Missing productId and variantId
          },
        ],
      }

      const response = await request(app)
        .post('/api/orders')
        .send(invalidData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(mockOrderService.createOrder).not.toHaveBeenCalled()
    })

    it('should handle service errors', async () => {
      mockOrderService.createOrder.mockRejectedValue(
        new Error('Insufficient inventory')
      )

      const response = await request(app)
        .post('/api/orders')
        .send(validOrderData)
        .expect(500)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Insufficient inventory')
    })

    it('should create guest order', async () => {
      const guestOrderData = {
        guestEmail: 'guest@example.com',
        items: [
          {
            productId: 'product-1',
            quantity: 1,
          },
        ],
      }

      const mockGuestOrder = {
        ...mockCreatedOrder,
        customerId: null,
        guestEmail: 'guest@example.com',
      }

      mockOrderService.createOrder.mockResolvedValue(mockGuestOrder)

      const response = await request(app)
        .post('/api/orders')
        .send(guestOrderData)
        .expect(201)

      expect(response.body.data.guestEmail).toBe('guest@example.com')
      expect(response.body.data.customerId).toBeNull()
    })
  })

  describe('GET /api/orders', () => {
    const mockOrdersResponse = {
      orders: [
        {
          id: 'order-1',
          orderNumber: 'ORD-20250815-0001',
          status: OrderStatus.PENDING,
          totalAmount: 59.98,
        },
        {
          id: 'order-2',
          orderNumber: 'ORD-20250815-0002',
          status: OrderStatus.CONFIRMED,
          totalAmount: 129.99,
        },
      ],
      pagination: {
        page: 1,
        limit: 20,
        total: 2,
        pages: 1,
      },
    }

    it('should get orders with default pagination', async () => {
      mockOrderService.getOrders.mockResolvedValue(mockOrdersResponse)

      const response = await request(app).get('/api/orders').expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockOrdersResponse)
      expect(mockOrderService.getOrders).toHaveBeenCalledWith(
        {},
        1,
        20,
        'createdAt',
        'desc'
      )
    })

    it('should handle query parameters', async () => {
      mockOrderService.getOrders.mockResolvedValue(mockOrdersResponse)

      const _response = await request(app)
        .get('/api/orders')
        .query({
          status: [OrderStatus.PENDING, OrderStatus.CONFIRMED],
          page: '2',
          limit: '10',
          search: 'test',
          sortBy: 'orderNumber',
          sortOrder: 'asc',
        })
        .expect(200)

      expect(mockOrderService.getOrders).toHaveBeenCalledWith(
        {
          status: [OrderStatus.PENDING, OrderStatus.CONFIRMED],
          search: 'test',
        },
        2,
        10,
        'orderNumber',
        'asc'
      )
    })

    it('should handle date filters', async () => {
      mockOrderService.getOrders.mockResolvedValue(mockOrdersResponse)

      const dateFrom = '2025-08-01T00:00:00.000Z'
      const dateTo = '2025-08-31T23:59:59.999Z'

      const _response = await request(app)
        .get('/api/orders')
        .query({
          dateFrom,
          dateTo,
        })
        .expect(200)

      expect(mockOrderService.getOrders).toHaveBeenCalledWith(
        {
          dateFrom: new Date(dateFrom),
          dateTo: new Date(dateTo),
        },
        1,
        20,
        'createdAt',
        'desc'
      )
    })
  })

  describe('GET /api/orders/:id', () => {
    const mockOrder = {
      id: 'order-1',
      orderNumber: 'ORD-20250815-0001',
      status: OrderStatus.PENDING,
      items: [],
      payments: [],
      fulfillments: [],
      returns: [],
    }

    it('should get order by id', async () => {
      mockOrderService.getOrderById.mockResolvedValue(mockOrder)

      const response = await request(app).get('/api/orders/order-1').expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockOrder)
      expect(mockOrderService.getOrderById).toHaveBeenCalledWith('order-1')
    })

    it('should return 404 if order not found', async () => {
      mockOrderService.getOrderById.mockResolvedValue(null)

      const response = await request(app)
        .get('/api/orders/nonexistent')
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Order not found')
    })
  })

  describe('PUT /api/orders/:id', () => {
    const mockUpdatedOrder = {
      id: 'order-1',
      orderNumber: 'ORD-20250815-0001',
      status: OrderStatus.CONFIRMED,
      notes: 'Updated notes',
    }

    it('should update order successfully', async () => {
      mockOrderService.updateOrder.mockResolvedValue(mockUpdatedOrder)

      const updateData = {
        status: OrderStatus.CONFIRMED,
        notes: 'Updated notes',
      }

      const response = await request(app)
        .put('/api/orders/order-1')
        .send(updateData)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockUpdatedOrder)
      expect(mockOrderService.updateOrder).toHaveBeenCalledWith(
        'order-1',
        updateData,
        'user-1'
      )
    })

    it('should validate update data', async () => {
      const invalidData = {
        status: 'INVALID_STATUS',
      }

      const response = await request(app)
        .put('/api/orders/order-1')
        .send(invalidData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(mockOrderService.updateOrder).not.toHaveBeenCalled()
    })
  })

  describe('POST /api/orders/:id/payments', () => {
    const mockPayment = {
      id: 'payment-1',
      orderId: 'order-1',
      amount: 100.0,
      status: PaymentStatus.COMPLETED,
    }

    it('should process payment successfully', async () => {
      mockOrderService.processPayment.mockResolvedValue(mockPayment)

      const paymentData = {
        amount: 100.0,
        currency: 'USD',
        method: 'CREDIT_CARD', // Assuming PaymentMethod is not needed for this mock
        gateway: 'stripe',
      }

      const response = await request(app)
        .post('/api/orders/order-1/payments')
        .send(paymentData)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockPayment)
      expect(mockOrderService.processPayment).toHaveBeenCalledWith(
        'order-1',
        paymentData,
        'user-1'
      )
    })

    it('should validate payment data', async () => {
      const invalidData = {
        amount: -100, // Negative amount
        currency: 'USD',
        method: 'CREDIT_CARD', // Assuming PaymentMethod is not needed for this mock
        gateway: 'stripe',
      }

      const response = await request(app)
        .post('/api/orders/order-1/payments')
        .send(invalidData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(mockOrderService.processPayment).not.toHaveBeenCalled()
    })
  })

  describe('POST /api/orders/:id/fulfillments', () => {
    const mockFulfillment = {
      id: 'fulfillment-1',
      orderId: 'order-1',
      status: 'PENDING', // Assuming FulfillmentStatus is not needed for this mock
      trackingNumber: 'TRACK123',
    }

    it('should create fulfillment successfully', async () => {
      mockOrderService.createFulfillment.mockResolvedValue(mockFulfillment)

      const fulfillmentData = {
        items: [
          {
            orderItemId: 'item-1',
            quantity: 2,
          },
        ],
        trackingNumber: 'TRACK123',
      }

      const response = await request(app)
        .post('/api/orders/order-1/fulfillments')
        .send(fulfillmentData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockFulfillment)
      expect(mockOrderService.createFulfillment).toHaveBeenCalledWith(
        'order-1',
        fulfillmentData,
        'user-1'
      )
    })

    it('should validate fulfillment data', async () => {
      const invalidData = {
        items: [], // Empty items array
      }

      const response = await request(app)
        .post('/api/orders/order-1/fulfillments')
        .send(invalidData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(mockOrderService.createFulfillment).not.toHaveBeenCalled()
    })
  })

  describe('POST /api/orders/:id/fulfillments/:fulfillmentId/ship', () => {
    const mockShippedFulfillment = {
      id: 'fulfillment-1',
      orderId: 'order-1',
      status: 'SHIPPED', // Assuming FulfillmentStatus is not needed for this mock
      shippedAt: '2025-08-26T03:21:44.104Z',
    }

    it('should ship fulfillment successfully', async () => {
      mockOrderService.shipFulfillment.mockResolvedValue(mockShippedFulfillment)

      const response = await request(app)
        .post('/api/orders/order-1/fulfillments/fulfillment-1/ship')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockShippedFulfillment)
      expect(mockOrderService.shipFulfillment).toHaveBeenCalledWith(
        'fulfillment-1',
        {},
        'user-1'
      )
    })
  })

  describe('POST /api/orders/:id/returns', () => {
    const mockReturn = {
      id: 'return-1',
      orderId: 'order-1',
      returnNumber: 'RET-20250815-0001',
      status: 'REQUESTED', // Assuming ReturnStatus is not needed for this mock
    }

    it('should create return successfully', async () => {
      mockOrderService.createReturn.mockResolvedValue(mockReturn)

      const returnData = {
        items: [
          {
            orderItemId: 'item-1',
            quantity: 1,
            reason: 'Defective',
          },
        ],
        reason: 'Product defective',
      }

      const response = await request(app)
        .post('/api/orders/order-1/returns')
        .send(returnData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockReturn)
      expect(mockOrderService.createReturn).toHaveBeenCalledWith(
        'order-1',
        returnData,
        'user-1'
      )
    })

    it('should validate return data', async () => {
      const invalidData = {
        items: [
          {
            orderItemId: 'item-1',
            quantity: 0, // Invalid quantity
          },
        ],
      }

      const response = await request(app)
        .post('/api/orders/order-1/returns')
        .send(invalidData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(mockOrderService.createReturn).not.toHaveBeenCalled()
    })
  })

  describe('POST /api/orders/:id/returns/:returnId/process', () => {
    const mockProcessedReturn = {
      id: 'return-1',
      orderId: 'order-1',
      status: 'APPROVED', // Assuming ReturnStatus is not needed for this mock
      refundAmount: 50.0,
    }

    it('should approve return successfully', async () => {
      mockOrderService.processReturn.mockResolvedValue(mockProcessedReturn)

      const processData = {
        approve: true,
        refundAmount: 50.0,
      }

      const response = await request(app)
        .post('/api/orders/order-1/returns/return-1/process')
        .send(processData)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockProcessedReturn)
      expect(mockOrderService.processReturn).toHaveBeenCalledWith(
        'order-1',
        'return-1',
        true,
        { refundAmount: 50 },
        'user-1'
      )
    })

    it('should reject return successfully', async () => {
      const mockRejectedReturn = {
        ...mockProcessedReturn,
        status: 'REJECTED', // Assuming ReturnStatus is not needed for this mock
      }

      mockOrderService.processReturn.mockResolvedValue(mockRejectedReturn)

      const processData = {
        approve: false,
      }

      const response = await request(app)
        .post('/api/orders/order-1/returns/return-1/process')
        .send(processData)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(mockOrderService.processReturn).toHaveBeenCalledWith(
        'order-1',
        'return-1',
        false,
        { refundAmount: undefined },
        'user-1'
      )
    })

    it('should validate approve field', async () => {
      const invalidData = {
        // Missing approve field
        refundAmount: 50.0,
      }

      const response = await request(app)
        .post('/api/orders/order-1/returns/return-1/process')
        .send(invalidData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe(
        'approve field is required and must be boolean'
      )
      expect(mockOrderService.processReturn).not.toHaveBeenCalled()
    })
  })

  describe('POST /api/orders/:id/cancel', () => {
    const mockCancelledOrder = {
      id: 'order-1',
      orderNumber: 'ORD-20250815-0001',
      status: 'CANCELLED',
      cancelledAt: '2025-08-26T03:01:37.981Z',
    }

    it('should cancel order successfully', async () => {
      mockOrderService.cancelOrder.mockResolvedValue(mockCancelledOrder)

      const cancelData = {
        reason: 'Customer request',
      }

      const response = await request(app)
        .post('/api/orders/order-1/cancel')
        .send(cancelData)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockCancelledOrder)
      expect(mockOrderService.cancelOrder).toHaveBeenCalledWith(
        'order-1',
        'Customer request',
        'user-1'
      )
    })

    it('should cancel order without reason', async () => {
      mockOrderService.cancelOrder.mockResolvedValue(mockCancelledOrder)

      const response = await request(app)
        .post('/api/orders/order-1/cancel')
        .send({})
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(mockOrderService.cancelOrder).toHaveBeenCalledWith(
        'order-1',
        undefined,
        'user-1'
      )
    })
  })

  describe('GET /api/orders/analytics', () => {
    const mockAnalytics = {
      totalOrders: 100,
      totalRevenue: 10000,
      averageOrderValue: 100,
      ordersByStatus: {
        [OrderStatus.PENDING]: 10,
        [OrderStatus.CONFIRMED]: 20,
      },
      ordersByMonth: [{ month: '2025-08', orders: 50, revenue: 5000 }],
      topProducts: [
        {
          productId: 'product-1',
          productName: 'Product 1',
          quantity: 100,
          revenue: 2000,
        },
      ],
      topCustomers: [
        {
          customerId: 'customer-1',
          customerName: 'John Doe',
          orders: 5,
          revenue: 500,
        },
      ],
    }

    it('should get order analytics', async () => {
      mockOrderService.getOrderAnalytics.mockResolvedValue(mockAnalytics)

      const response = await request(app)
        .get('/api/orders/analytics')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockAnalytics)
      expect(mockOrderService.getOrderAnalytics).toHaveBeenCalledWith(
        undefined,
        undefined,
        undefined
      )
    })

    it('should handle date and customer filters', async () => {
      mockOrderService.getOrderAnalytics.mockResolvedValue(mockAnalytics)

      const dateFrom = '2025-08-01T00:00:00.000Z'
      const dateTo = '2025-08-31T23:59:59.999Z'
      const customerId = 'customer-1'

      const _response = await request(app)
        .get('/api/orders/analytics')
        .query({
          dateFrom,
          dateTo,
          customerId,
        })
        .expect(200)

      expect(mockOrderService.getOrderAnalytics).toHaveBeenCalledWith(
        new Date(dateFrom),
        new Date(dateTo),
        customerId
      )
    })
  })
})
