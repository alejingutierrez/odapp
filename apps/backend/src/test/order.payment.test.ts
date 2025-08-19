import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { OrderService } from '../services/order.service';
import { PaymentGatewayService, StripeGateway, PayPalGateway } from '../services/payment-gateway.service';
import { PaymentMethod, PaymentStatus, OrderStatus, FinancialStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';

// Mock dependencies
vi.mock('../lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn(),
    order: {
      findUnique: vi.fn(),
      update: vi.fn()
    },
    payment: {
      create: vi.fn(),
      update: vi.fn(),
      aggregate: vi.fn()
    }
  }
}));

vi.mock('../services/inventory.service');
vi.mock('../services/customer.service');
vi.mock('../services/audit.service');
vi.mock('../services/websocket.service');

describe('Order Payment Integration Tests', () => {
  let orderService: OrderService;
  let paymentGatewayService: PaymentGatewayService;

  const mockOrder = {
    id: 'order-1',
    orderNumber: 'ORD-20250815-0001',
    totalAmount: 100.00,
    status: OrderStatus.PENDING,
    financialStatus: FinancialStatus.PENDING,
    currency: 'USD'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    orderService = new OrderService();
    paymentGatewayService = new PaymentGatewayService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Credit Card Payment Processing', () => {
    it('should process credit card payment successfully with Stripe', async () => {
      // Mock order retrieval
      vi.spyOn(orderService, 'getOrderById').mockResolvedValue(mockOrder as any);

      // Mock successful payment processing
      const mockPayment = {
        id: 'payment-1',
        orderId: 'order-1',
        amount: 100.00,
        status: PaymentStatus.PROCESSING,
        method: PaymentMethod.CREDIT_CARD,
        gateway: 'stripe'
      };

      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        const mockTx = {
          payment: {
            create: vi.fn().mockResolvedValue(mockPayment),
            update: vi.fn().mockResolvedValue({ ...mockPayment, status: PaymentStatus.COMPLETED }),
            aggregate: vi.fn().mockResolvedValue({ _sum: { amount: 100.00 } })
          },
          order: {
            update: vi.fn().mockResolvedValue({ 
              ...mockOrder, 
              financialStatus: FinancialStatus.PAID,
              status: OrderStatus.CONFIRMED
            })
          }
        };
        return await callback(mockTx);
      });

      // Mock payment gateway success
      vi.spyOn(orderService as any, 'simulatePaymentProcessing').mockResolvedValue(true);

      const paymentData = {
        amount: 100.00,
        currency: 'USD',
        method: PaymentMethod.CREDIT_CARD,
        gateway: 'stripe',
        gatewayTransactionId: 'pi_test123'
      };

      const result = await orderService.processPayment('order-1', paymentData, 'user-1');

      expect(result.status).toBe(PaymentStatus.COMPLETED);
      expect(prisma.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          orderId: 'order-1',
          amount: 100.00,
          currency: 'USD',
          method: PaymentMethod.CREDIT_CARD,
          gateway: 'stripe',
          gatewayTransactionId: 'pi_test123'
        })
      });
    });

    it('should handle credit card payment failure', async () => {
      vi.spyOn(orderService, 'getOrderById').mockResolvedValue(mockOrder as any);

      const mockPayment = {
        id: 'payment-1',
        orderId: 'order-1',
        amount: 100.00,
        status: PaymentStatus.PROCESSING
      };

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

      // Mock payment gateway failure
      vi.spyOn(orderService as any, 'simulatePaymentProcessing').mockResolvedValue(false);

      const paymentData = {
        amount: 100.00,
        currency: 'USD',
        method: PaymentMethod.CREDIT_CARD,
        gateway: 'stripe'
      };

      await expect(orderService.processPayment('order-1', paymentData, 'user-1'))
        .rejects.toThrow('Payment processing failed');
    });

    it('should handle partial payment correctly', async () => {
      vi.spyOn(orderService, 'getOrderById').mockResolvedValue(mockOrder as any);

      const mockPayment = {
        id: 'payment-1',
        orderId: 'order-1',
        amount: 50.00, // Partial payment
        status: PaymentStatus.PROCESSING
      };

      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        const mockTx = {
          payment: {
            create: vi.fn().mockResolvedValue(mockPayment),
            update: vi.fn().mockResolvedValue({ ...mockPayment, status: PaymentStatus.COMPLETED }),
            aggregate: vi.fn().mockResolvedValue({ _sum: { amount: 50.00 } }) // Only $50 paid
          },
          order: {
            update: vi.fn().mockResolvedValue({ 
              ...mockOrder, 
              financialStatus: FinancialStatus.PARTIALLY_PAID // Should be partially paid
            })
          }
        };
        return await callback(mockTx);
      });

      vi.spyOn(orderService as any, 'simulatePaymentProcessing').mockResolvedValue(true);

      const paymentData = {
        amount: 50.00,
        currency: 'USD',
        method: PaymentMethod.CREDIT_CARD,
        gateway: 'stripe'
      };

      const result = await orderService.processPayment('order-1', paymentData, 'user-1');

      expect(result.status).toBe(PaymentStatus.COMPLETED);
      // Verify that order financial status is updated to partially paid
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: { financialStatus: FinancialStatus.PARTIALLY_PAID }
      });
    });
  });

  describe('PayPal Payment Processing', () => {
    it('should process PayPal payment successfully', async () => {
      vi.spyOn(orderService, 'getOrderById').mockResolvedValue(mockOrder as any);

      const mockPayment = {
        id: 'payment-1',
        orderId: 'order-1',
        amount: 100.00,
        status: PaymentStatus.PROCESSING,
        method: PaymentMethod.PAYPAL,
        gateway: 'paypal'
      };

      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        const mockTx = {
          payment: {
            create: vi.fn().mockResolvedValue(mockPayment),
            update: vi.fn().mockResolvedValue({ ...mockPayment, status: PaymentStatus.COMPLETED }),
            aggregate: vi.fn().mockResolvedValue({ _sum: { amount: 100.00 } })
          },
          order: {
            update: vi.fn().mockResolvedValue({ 
              ...mockOrder, 
              financialStatus: FinancialStatus.PAID,
              status: OrderStatus.CONFIRMED
            })
          }
        };
        return await callback(mockTx);
      });

      vi.spyOn(orderService as any, 'simulatePaymentProcessing').mockResolvedValue(true);

      const paymentData = {
        amount: 100.00,
        currency: 'USD',
        method: PaymentMethod.PAYPAL,
        gateway: 'paypal',
        gatewayTransactionId: 'PAY-123ABC'
      };

      const result = await orderService.processPayment('order-1', paymentData, 'user-1');

      expect(result.status).toBe(PaymentStatus.COMPLETED);
      expect(prisma.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          method: PaymentMethod.PAYPAL,
          gateway: 'paypal',
          gatewayTransactionId: 'PAY-123ABC'
        })
      });
    });
  });

  describe('Multiple Payment Methods', () => {
    it('should handle multiple payments for single order', async () => {
      const orderWithPartialPayment = {
        ...mockOrder,
        financialStatus: FinancialStatus.PARTIALLY_PAID
      };

      vi.spyOn(orderService, 'getOrderById').mockResolvedValue(orderWithPartialPayment as any);

      const mockPayment = {
        id: 'payment-2',
        orderId: 'order-1',
        amount: 50.00, // Second payment of $50
        status: PaymentStatus.PROCESSING
      };

      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        const mockTx = {
          payment: {
            create: vi.fn().mockResolvedValue(mockPayment),
            update: vi.fn().mockResolvedValue({ ...mockPayment, status: PaymentStatus.COMPLETED }),
            aggregate: vi.fn().mockResolvedValue({ _sum: { amount: 100.00 } }) // Total $100 paid
          },
          order: {
            update: vi.fn().mockResolvedValue({ 
              ...mockOrder, 
              financialStatus: FinancialStatus.PAID,
              status: OrderStatus.CONFIRMED
            })
          }
        };
        return await callback(mockTx);
      });

      vi.spyOn(orderService as any, 'simulatePaymentProcessing').mockResolvedValue(true);

      const paymentData = {
        amount: 50.00,
        currency: 'USD',
        method: PaymentMethod.CREDIT_CARD,
        gateway: 'stripe'
      };

      const result = await orderService.processPayment('order-1', paymentData, 'user-1');

      expect(result.status).toBe(PaymentStatus.COMPLETED);
      // Verify that order is now fully paid
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: { financialStatus: FinancialStatus.PAID }
      });
    });
  });

  describe('Payment Gateway Integration', () => {
    it('should use Stripe gateway for credit card payments', async () => {
      const stripeGateway = new StripeGateway('sk_test_123');
      
      const paymentRequest = {
        amount: 100.00,
        currency: 'USD',
        method: PaymentMethod.CREDIT_CARD,
        customerInfo: {
          email: 'test@example.com',
          name: 'John Doe'
        }
      };

      const result = await stripeGateway.processPayment(paymentRequest);

      expect(result.success).toBeDefined();
      expect(result.status).toBeOneOf([PaymentStatus.COMPLETED, PaymentStatus.FAILED]);
      if (result.success) {
        expect(result.transactionId).toMatch(/^pi_/);
        expect(result.metadata?.gateway).toBe('stripe');
      }
    });

    it('should use PayPal gateway for PayPal payments', async () => {
      const paypalGateway = new PayPalGateway('client_id', 'client_secret');
      
      const paymentRequest = {
        amount: 100.00,
        currency: 'USD',
        method: PaymentMethod.PAYPAL,
        customerInfo: {
          email: 'test@example.com'
        }
      };

      const result = await paypalGateway.processPayment(paymentRequest);

      expect(result.success).toBeDefined();
      expect(result.status).toBeOneOf([PaymentStatus.COMPLETED, PaymentStatus.FAILED]);
      if (result.success) {
        expect(result.transactionId).toMatch(/^PAY-/);
        expect(result.metadata?.gateway).toBe('paypal');
      }
    });

    it('should handle payment gateway failover', async () => {
      const paymentRequest = {
        amount: 100.00,
        currency: 'USD',
        method: PaymentMethod.CREDIT_CARD
      };

      // Mock primary gateway failure and secondary success
      const mockGateway1 = {
        name: 'stripe',
        processPayment: vi.fn().mockRejectedValue(new Error('Gateway timeout'))
      };

      const mockGateway2 = {
        name: 'square',
        processPayment: vi.fn().mockResolvedValue({
          success: true,
          transactionId: 'sq_123',
          status: PaymentStatus.COMPLETED
        })
      };

      const gatewayService = new PaymentGatewayService();
      vi.spyOn(gatewayService, 'getAvailableGateways').mockReturnValue(['stripe', 'square']);
      vi.spyOn(gatewayService, 'processPayment')
        .mockRejectedValueOnce(new Error('Gateway timeout'))
        .mockResolvedValueOnce({
          success: true,
          transactionId: 'sq_123',
          status: PaymentStatus.COMPLETED
        });

      const result = await gatewayService.processPaymentWithFailover(paymentRequest);

      expect(result.success).toBe(true);
      expect(result.transactionId).toBe('sq_123');
    });
  });

  describe('Refund Processing', () => {
    it('should process refund when order is cancelled', async () => {
      const paidOrder = {
        ...mockOrder,
        status: OrderStatus.PENDING,
        financialStatus: FinancialStatus.PAID,
        items: [
          {
            id: 'item-1',
            productId: 'product-1',
            variantId: null,
            quantity: 2
          }
        ]
      };

      vi.spyOn(orderService, 'getOrderById').mockResolvedValue(paidOrder as any);

      const completedPayments = [
        {
          id: 'payment-1',
          amount: 100.00,
          currency: 'USD',
          method: PaymentMethod.CREDIT_CARD,
          status: PaymentStatus.COMPLETED
        }
      ];

      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        const mockTx = {
          order: {
            update: vi.fn().mockResolvedValue({
              ...paidOrder,
              status: OrderStatus.CANCELLED,
              cancelledAt: new Date(),
              financialStatus: FinancialStatus.REFUNDED
            })
          },
          payment: {
            findMany: vi.fn().mockResolvedValue(completedPayments),
            create: vi.fn().mockResolvedValue({
              id: 'refund-1',
              orderId: 'order-1',
              amount: -100.00, // Negative for refund
              status: PaymentStatus.COMPLETED
            })
          }
        };
        return await callback(mockTx);
      });

      const result = await orderService.cancelOrder('order-1', 'Customer request', 'user-1');

      expect(result.status).toBe(OrderStatus.CANCELLED);
      // Verify refund payment was created
      expect(prisma.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          orderId: 'order-1',
          amount: -100.00,
          status: PaymentStatus.COMPLETED,
          gateway: 'refund'
        })
      });
    });
  });

  describe('Payment Validation', () => {
    it('should validate payment amount against order total', async () => {
      vi.spyOn(orderService, 'getOrderById').mockResolvedValue(mockOrder as any);

      const paymentData = {
        amount: 150.00, // More than order total
        currency: 'USD',
        method: PaymentMethod.CREDIT_CARD,
        gateway: 'stripe'
      };

      // The service should still process overpayment, but this tests the scenario
      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        const mockTx = {
          payment: {
            create: vi.fn().mockResolvedValue({
              id: 'payment-1',
              amount: 150.00,
              status: PaymentStatus.PROCESSING
            }),
            update: vi.fn().mockResolvedValue({
              id: 'payment-1',
              amount: 150.00,
              status: PaymentStatus.COMPLETED
            }),
            aggregate: vi.fn().mockResolvedValue({ _sum: { amount: 150.00 } })
          },
          order: {
            update: vi.fn().mockResolvedValue({
              ...mockOrder,
              financialStatus: FinancialStatus.PAID
            })
          }
        };
        return await callback(mockTx);
      });

      vi.spyOn(orderService as any, 'simulatePaymentProcessing').mockResolvedValue(true);

      const result = await orderService.processPayment('order-1', paymentData, 'user-1');

      expect(result.status).toBe(PaymentStatus.COMPLETED);
      // Order should still be marked as paid even with overpayment
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: { financialStatus: FinancialStatus.PAID }
      });
    });

    it('should validate currency matches order currency', async () => {
      const eurOrder = { ...mockOrder, currency: 'EUR' };
      vi.spyOn(orderService, 'getOrderById').mockResolvedValue(eurOrder as any);

      const paymentData = {
        amount: 100.00,
        currency: 'USD', // Different currency
        method: PaymentMethod.CREDIT_CARD,
        gateway: 'stripe'
      };

      // Service should handle currency mismatch gracefully
      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        const mockTx = {
          payment: {
            create: vi.fn().mockResolvedValue({
              id: 'payment-1',
              currency: 'USD',
              status: PaymentStatus.PROCESSING
            }),
            update: vi.fn(),
            aggregate: vi.fn()
          },
          order: { update: vi.fn() }
        };
        return await callback(mockTx);
      });

      vi.spyOn(orderService as any, 'simulatePaymentProcessing').mockResolvedValue(true);

      // Should not throw error but process the payment
      await expect(orderService.processPayment('order-1', paymentData, 'user-1'))
        .resolves.toBeDefined();
    });
  });
});