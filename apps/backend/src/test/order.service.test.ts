import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { OrderService } from '../services/order.service';
import { InventoryService } from '../services/inventory.service';
import { CustomerService } from '../services/customer.service';
import { AuditService } from '../services/audit.service';
import { WebSocketService } from '../services/websocket.service';
import { prisma } from '../lib/prisma';
import { OrderStatus, FinancialStatus, FulfillmentStatus, PaymentStatus, PaymentMethod, ReturnStatus } from '@prisma/client';

// Mock dependencies
vi.mock('../services/inventory.service');
vi.mock('../services/customer.service');
vi.mock('../services/audit.service');
vi.mock('../services/websocket.service');
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
      findFirst: vi.fn()
    },
    customer: {
      findUnique: vi.fn()
    },
    productVariant: {
      findUnique: vi.fn()
    },
    product: {
      findUnique: vi.fn()
    },
    customerAddress: {
      create: vi.fn()
    },
    orderItem: {
      findMany: vi.fn(),
      update: vi.fn()
    },
    payment: {
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
      aggregate: vi.fn()
    },
    fulfillment: {
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn()
    },
    return: {
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn()
    },
    $queryRaw: vi.fn()
  }
}));

describe('OrderService', () => {
  let orderService: OrderService;
  let mockInventoryService: any;
  let mockCustomerService: any;
  let mockAuditService: any;
  let mockWebSocketService: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockInventoryService = {
      getAvailableQuantity: vi.fn(),
      createReservation: vi.fn(),
      releaseReservation: vi.fn(),
      adjustInventory: vi.fn()
    };
    
    mockCustomerService = {
      updateOrderStatistics: vi.fn()
    };
    
    mockAuditService = {
      log: vi.fn()
    };
    
    mockWebSocketService = {
      broadcast: vi.fn()
    };

    // Mock the constructors
    vi.mocked(InventoryService).mockImplementation(() => mockInventoryService);
    vi.mocked(CustomerService).mockImplementation(() => mockCustomerService);
    vi.mocked(AuditService).mockImplementation(() => mockAuditService);
    vi.mocked(WebSocketService.getInstance).mockReturnValue(mockWebSocketService);

    orderService = new OrderService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createOrder', () => {
    const mockOrderData = {
      customerId: 'customer-1',
      items: [
        {
          productId: 'product-1',
          quantity: 2,
          price: 29.99
        }
      ],
      currency: 'USD'
    };

    const mockProduct = {
      id: 'product-1',
      name: 'Test Product',
      price: 29.99,
      sku: 'TEST-001',
      trackQuantity: true
    };

    const mockCustomer = {
      id: 'customer-1',
      email: 'test@example.com'
    };

    const mockCreatedOrder = {
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
      items: [
        {
          id: 'item-1',
          productId: 'product-1',
          name: 'Test Product',
          sku: 'TEST-001',
          quantity: 2,
          price: 29.99,
          totalPrice: 59.98
        }
      ]
    };

    beforeEach(() => {
      // Mock transaction
      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        const mockTx = {
          customer: { findUnique: vi.fn().mockResolvedValue(mockCustomer) },
          product: { findUnique: vi.fn().mockResolvedValue(mockProduct) },
          productVariant: { findUnique: vi.fn() },
          order: { 
            create: vi.fn().mockResolvedValue(mockCreatedOrder),
            findFirst: vi.fn().mockResolvedValue(null)
          },
          customerAddress: { create: vi.fn() }
        };
        return await callback(mockTx);
      });

      mockInventoryService.getAvailableQuantity.mockResolvedValue(10);
      mockInventoryService.createReservation.mockResolvedValue(true);
      mockCustomerService.updateOrderStatistics.mockResolvedValue(true);
      mockAuditService.log.mockResolvedValue(true);
    });

    it('should create order successfully', async () => {
      const result = await orderService.createOrder(mockOrderData, 'user-1');

      expect(result).toEqual(mockCreatedOrder);
      expect(mockInventoryService.getAvailableQuantity).toHaveBeenCalledWith('product-1', undefined);
      expect(mockInventoryService.createReservation).toHaveBeenCalledWith(
        'product-1',
        undefined,
        2,
        'Order ORD-20250815-0001',
        'order-1'
      );
      expect(mockCustomerService.updateOrderStatistics).toHaveBeenCalledWith('customer-1', expect.any(Object));
      expect(mockAuditService.log).toHaveBeenCalledWith(
        'order.created',
        'Order',
        'order-1',
        null,
        mockCreatedOrder,
        'user-1'
      );
      expect(mockWebSocketService.broadcast).toHaveBeenCalledWith('order.created', expect.any(Object));
    });

    it('should throw error if customer not found', async () => {
      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        const mockTx = {
          customer: { findUnique: vi.fn().mockResolvedValue(null) },
          product: { findUnique: vi.fn() },
          productVariant: { findUnique: vi.fn() },
          order: { create: vi.fn(), findFirst: vi.fn() },
          customerAddress: { create: vi.fn() }
        };
        return await callback(mockTx);
      });

      await expect(orderService.createOrder(mockOrderData, 'user-1')).rejects.toThrow('Customer not found');
    });

    it('should throw error if product not found', async () => {
      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        const mockTx = {
          customer: { findUnique: vi.fn().mockResolvedValue(mockCustomer) },
          product: { findUnique: vi.fn().mockResolvedValue(null) },
          productVariant: { findUnique: vi.fn() },
          order: { create: vi.fn(), findFirst: vi.fn() },
          customerAddress: { create: vi.fn() }
        };
        return await callback(mockTx);
      });

      await expect(orderService.createOrder(mockOrderData, 'user-1')).rejects.toThrow('Product not found: product-1');
    });

    it('should throw error if insufficient inventory', async () => {
      mockInventoryService.getAvailableQuantity.mockResolvedValue(1);

      await expect(orderService.createOrder(mockOrderData, 'user-1')).rejects.toThrow('Insufficient inventory');
    });

    it('should create guest order without customer', async () => {
      const guestOrderData = {
        guestEmail: 'guest@example.com',
        items: mockOrderData.items,
        currency: 'USD'
      };

      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        const mockTx = {
          customer: { findUnique: vi.fn() },
          product: { findUnique: vi.fn().mockResolvedValue(mockProduct) },
          productVariant: { findUnique: vi.fn() },
          order: { 
            create: vi.fn().mockResolvedValue({ ...mockCreatedOrder, customerId: null, guestEmail: 'guest@example.com' }),
            findFirst: vi.fn().mockResolvedValue(null)
          },
          customerAddress: { create: vi.fn() }
        };
        return await callback(mockTx);
      });

      const result = await orderService.createOrder(guestOrderData, 'user-1');

      expect(result.customerId).toBeNull();
      expect(result.guestEmail).toBe('guest@example.com');
      expect(mockCustomerService.updateOrderStatistics).not.toHaveBeenCalled();
    });
  });

  describe('getOrderById', () => {
    const mockOrder = {
      id: 'order-1',
      orderNumber: 'ORD-20250815-0001',
      status: OrderStatus.PENDING,
      items: [],
      customer: null,
      payments: [],
      fulfillments: [],
      returns: []
    };

    it('should return order when found', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder as any);

      const result = await orderService.getOrderById('order-1');

      expect(result).toEqual(mockOrder);
      expect(prisma.order.findUnique).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        include: expect.any(Object)
      });
    });

    it('should return null when order not found', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue(null);

      const result = await orderService.getOrderById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('updateOrder', () => {
    const mockExistingOrder = {
      id: 'order-1',
      orderNumber: 'ORD-20250815-0001',
      status: OrderStatus.PENDING
    };

    const mockUpdatedOrder = {
      ...mockExistingOrder,
      status: OrderStatus.CONFIRMED,
      notes: 'Updated notes'
    };

    beforeEach(() => {
      vi.spyOn(orderService, 'getOrderById').mockResolvedValue(mockExistingOrder as any);
      vi.mocked(prisma.order.update).mockResolvedValue(mockUpdatedOrder as any);
    });

    it('should update order successfully', async () => {
      const updateData = {
        status: OrderStatus.CONFIRMED,
        notes: 'Updated notes'
      };

      const result = await orderService.updateOrder('order-1', updateData, 'user-1');

      expect(result).toEqual(mockUpdatedOrder);
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: {
          ...updateData,
          updatedAt: expect.any(Date)
        },
        include: expect.any(Object)
      });
      expect(mockAuditService.log).toHaveBeenCalled();
      expect(mockWebSocketService.broadcast).toHaveBeenCalledWith('order.status.updated', expect.any(Object));
    });

    it('should throw error if order not found', async () => {
      vi.spyOn(orderService, 'getOrderById').mockResolvedValue(null);

      await expect(orderService.updateOrder('nonexistent', {}, 'user-1')).rejects.toThrow('Order not found');
    });
  });

  describe('processPayment', () => {
    const mockOrder = {
      id: 'order-1',
      orderNumber: 'ORD-20250815-0001',
      totalAmount: 100.00,
      status: OrderStatus.PENDING
    };

    const mockPayment = {
      id: 'payment-1',
      orderId: 'order-1',
      amount: 100.00,
      status: PaymentStatus.PROCESSING
    };

    beforeEach(() => {
      vi.spyOn(orderService, 'getOrderById').mockResolvedValue(mockOrder as any);
      vi.spyOn(orderService as any, 'simulatePaymentProcessing').mockResolvedValue(true);
    });

    it('should process payment successfully', async () => {
      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        const mockTx = {
          payment: {
            create: vi.fn().mockResolvedValue(mockPayment),
            update: vi.fn().mockResolvedValue({ ...mockPayment, status: PaymentStatus.COMPLETED }),
            aggregate: vi.fn().mockResolvedValue({ _sum: { amount: 100.00 } })
          },
          order: {
            update: vi.fn().mockResolvedValue({ ...mockOrder, status: OrderStatus.CONFIRMED })
          }
        };
        return await callback(mockTx);
      });

      const paymentData = {
        amount: 100.00,
        currency: 'USD',
        method: PaymentMethod.CREDIT_CARD,
        gateway: 'stripe'
      };

      const result = await orderService.processPayment('order-1', paymentData, 'user-1');

      expect(result.status).toBe(PaymentStatus.COMPLETED);
      expect(mockAuditService.log).toHaveBeenCalled();
      expect(mockWebSocketService.broadcast).toHaveBeenCalledWith('payment.processed', expect.any(Object));
    });

    it('should handle payment failure', async () => {
      vi.spyOn(orderService as any, 'simulatePaymentProcessing').mockResolvedValue(false);

      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        const mockTx = {
          payment: {
            create: vi.fn().mockResolvedValue(mockPayment),
            update: vi.fn().mockResolvedValue({ ...mockPayment, status: PaymentStatus.FAILED }),
            aggregate: vi.fn()
          },
          order: { update: vi.fn() }
        };
        return await callback(mockTx);
      });

      const paymentData = {
        amount: 100.00,
        currency: 'USD',
        method: PaymentMethod.CREDIT_CARD,
        gateway: 'stripe'
      };

      await expect(orderService.processPayment('order-1', paymentData, 'user-1')).rejects.toThrow('Payment processing failed');
    });
  });

  describe('createFulfillment', () => {
    const mockOrder = {
      id: 'order-1',
      orderNumber: 'ORD-20250815-0001',
      items: [
        {
          id: 'item-1',
          productId: 'product-1',
          quantity: 2,
          quantityFulfilled: 0,
          name: 'Test Product'
        }
      ]
    };

    const mockFulfillment = {
      id: 'fulfillment-1',
      orderId: 'order-1',
      status: FulfillmentStatus.PENDING,
      items: []
    };

    beforeEach(() => {
      vi.spyOn(orderService, 'getOrderById').mockResolvedValue(mockOrder as any);
    });

    it('should create fulfillment successfully', async () => {
      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        const mockTx = {
          fulfillment: {
            create: vi.fn().mockResolvedValue(mockFulfillment)
          },
          orderItem: {
            update: vi.fn(),
            findMany: vi.fn().mockResolvedValue([
              { id: 'item-1', quantity: 2, quantityFulfilled: 2 }
            ])
          },
          order: {
            update: vi.fn()
          }
        };
        return await callback(mockTx);
      });

      const fulfillmentData = {
        items: [
          {
            orderItemId: 'item-1',
            quantity: 2
          }
        ],
        trackingNumber: 'TRACK123'
      };

      const result = await orderService.createFulfillment('order-1', fulfillmentData, 'user-1');

      expect(result).toEqual(mockFulfillment);
      expect(mockInventoryService.adjustInventory).toHaveBeenCalledWith(
        'product-1',
        undefined,
        -2,
        'DECREASE',
        expect.stringContaining('Fulfilled for order'),
        'order',
        'order-1'
      );
      expect(mockAuditService.log).toHaveBeenCalled();
      expect(mockWebSocketService.broadcast).toHaveBeenCalledWith('fulfillment.created', expect.any(Object));
    });

    it('should throw error if order item not found', async () => {
      const fulfillmentData = {
        items: [
          {
            orderItemId: 'nonexistent-item',
            quantity: 1
          }
        ]
      };

      await expect(orderService.createFulfillment('order-1', fulfillmentData, 'user-1')).rejects.toThrow('Order item not found');
    });

    it('should throw error if quantity exceeds remaining', async () => {
      const fulfillmentData = {
        items: [
          {
            orderItemId: 'item-1',
            quantity: 3 // More than available (2)
          }
        ]
      };

      await expect(orderService.createFulfillment('order-1', fulfillmentData, 'user-1')).rejects.toThrow('Cannot fulfill 3 items');
    });
  });

  describe('createReturn', () => {
    const mockOrder = {
      id: 'order-1',
      orderNumber: 'ORD-20250815-0001',
      items: [
        {
          id: 'item-1',
          productId: 'product-1',
          quantity: 2,
          quantityFulfilled: 2,
          quantityReturned: 0,
          name: 'Test Product'
        }
      ]
    };

    const mockReturn = {
      id: 'return-1',
      orderId: 'order-1',
      returnNumber: 'RET-20250815-0001',
      status: ReturnStatus.REQUESTED,
      items: []
    };

    beforeEach(() => {
      vi.spyOn(orderService, 'getOrderById').mockResolvedValue(mockOrder as any);
    });

    it('should create return successfully', async () => {
      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        const mockTx = {
          return: {
            create: vi.fn().mockResolvedValue(mockReturn),
            findFirst: vi.fn().mockResolvedValue(null)
          }
        };
        return await callback(mockTx);
      });

      const returnData = {
        items: [
          {
            orderItemId: 'item-1',
            quantity: 1,
            reason: 'Defective'
          }
        ],
        reason: 'Product defective'
      };

      const result = await orderService.createReturn('order-1', returnData, 'user-1');

      expect(result).toEqual(mockReturn);
      expect(mockAuditService.log).toHaveBeenCalled();
      expect(mockWebSocketService.broadcast).toHaveBeenCalledWith('return.created', expect.any(Object));
    });

    it('should throw error if return quantity exceeds returnable', async () => {
      const returnData = {
        items: [
          {
            orderItemId: 'item-1',
            quantity: 3 // More than fulfilled (2)
          }
        ]
      };

      await expect(orderService.createReturn('order-1', returnData, 'user-1')).rejects.toThrow('Cannot return 3 items');
    });
  });

  describe('cancelOrder', () => {
    const mockOrder = {
      id: 'order-1',
      orderNumber: 'ORD-20250815-0001',
      status: OrderStatus.PENDING,
      items: [
        {
          id: 'item-1',
          productId: 'product-1',
          variantId: null,
          quantity: 2
        }
      ]
    };

    beforeEach(() => {
      vi.spyOn(orderService, 'getOrderById').mockResolvedValue(mockOrder as any);
    });

    it('should cancel order successfully', async () => {
      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        const mockTx = {
          order: {
            update: vi.fn().mockResolvedValue({
              ...mockOrder,
              status: OrderStatus.CANCELLED,
              cancelledAt: new Date()
            })
          },
          payment: {
            findMany: vi.fn().mockResolvedValue([]),
            create: vi.fn()
          }
        };
        return await callback(mockTx);
      });

      const result = await orderService.cancelOrder('order-1', 'Customer request', 'user-1');

      expect(result.status).toBe(OrderStatus.CANCELLED);
      expect(mockInventoryService.releaseReservation).toHaveBeenCalledWith(
        'product-1',
        null,
        'Order ORD-20250815-0001',
        'order-1'
      );
      expect(mockAuditService.log).toHaveBeenCalled();
      expect(mockWebSocketService.broadcast).toHaveBeenCalledWith('order.cancelled', expect.any(Object));
    });

    it('should throw error if order is already shipped', async () => {
      vi.spyOn(orderService, 'getOrderById').mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.SHIPPED
      } as any);

      await expect(orderService.cancelOrder('order-1', 'reason', 'user-1')).rejects.toThrow('Cannot cancel shipped or delivered order');
    });
  });

  describe('getOrderAnalytics', () => {
    const mockAnalyticsData = {
      totalOrders: 100,
      totalRevenue: { _sum: { totalAmount: 10000 } },
      ordersByStatus: [
        { status: OrderStatus.PENDING, _count: { status: 10 } },
        { status: OrderStatus.CONFIRMED, _count: { status: 20 } }
      ],
      ordersByMonth: [
        { month: '2025-08', orders: 50, revenue: 5000 }
      ],
      topProducts: [
        { productId: 'product-1', productName: 'Product 1', quantity: 100, revenue: 2000 }
      ],
      topCustomers: [
        { customerId: 'customer-1', customerName: 'John Doe', orders: 5, revenue: 500 }
      ]
    };

    beforeEach(() => {
      vi.mocked(prisma.order.count).mockResolvedValue(mockAnalyticsData.totalOrders);
      vi.mocked(prisma.order.aggregate).mockResolvedValue(mockAnalyticsData.totalRevenue as any);
      vi.mocked(prisma.order.groupBy).mockResolvedValue(mockAnalyticsData.ordersByStatus as any);
      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce(mockAnalyticsData.ordersByMonth)
        .mockResolvedValueOnce(mockAnalyticsData.topProducts)
        .mockResolvedValueOnce(mockAnalyticsData.topCustomers);
    });

    it('should return order analytics', async () => {
      const result = await orderService.getOrderAnalytics();

      expect(result.totalOrders).toBe(100);
      expect(result.totalRevenue).toBe(10000);
      expect(result.averageOrderValue).toBe(100);
      expect(result.ordersByStatus).toEqual({
        [OrderStatus.PENDING]: 10,
        [OrderStatus.CONFIRMED]: 20
      });
      expect(result.ordersByMonth).toEqual(mockAnalyticsData.ordersByMonth);
      expect(result.topProducts).toEqual(mockAnalyticsData.topProducts);
      expect(result.topCustomers).toEqual(mockAnalyticsData.topCustomers);
    });

    it('should handle date filters', async () => {
      const dateFrom = new Date('2025-08-01');
      const dateTo = new Date('2025-08-31');

      await orderService.getOrderAnalytics(dateFrom, dateTo);

      expect(prisma.order.count).toHaveBeenCalledWith({
        where: {
          orderDate: {
            gte: dateFrom,
            lte: dateTo
          }
        }
      });
    });

    it('should handle customer filter', async () => {
      await orderService.getOrderAnalytics(undefined, undefined, 'customer-1');

      expect(prisma.order.count).toHaveBeenCalledWith({
        where: {
          customerId: 'customer-1'
        }
      });
    });
  });
});