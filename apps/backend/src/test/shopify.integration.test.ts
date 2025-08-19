import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { ShopifyService } from '../services/shopify.service';
import { WebhookProcessor } from '../lib/webhook-processor';
import { CircuitBreaker } from '../lib/circuit-breaker';
import { RateLimiter } from '../lib/rate-limiter';
import { RetryManager } from '../lib/retry-manager';
import { SyncStatusManager } from '../lib/sync-status-manager';
import { ConflictResolver } from '../lib/conflict-resolver';
import { 
  mockShopifyProduct, 
  mockShopifyOrder, 
  mockShopifyCustomer,
  mockWebhookEvent,
  mockSyncResult 
} from './mocks/shopify-mocks';

// Mock external dependencies
vi.mock('axios');
vi.mock('@prisma/client');
vi.mock('../lib/logger');

describe('Shopify Integration Tests', () => {
  let prisma: PrismaClient;
  let shopifyService: ShopifyService;
  let webhookProcessor: WebhookProcessor;

  beforeEach(() => {
    vi.clearAllMocks();
    
    prisma = new PrismaClient() as any;
    shopifyService = new ShopifyService(prisma, 'test-shop', 'test-token');
    webhookProcessor = new WebhookProcessor(prisma);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('End-to-End Product Sync', () => {
    it('should complete full product sync workflow', async () => {
      // Arrange
      const mockProducts = [
        {
          id: '1',
          title: 'Test Product',
          sku: 'TEST-001',
          syncStatus: 'pending',
          variants: [{ sku: 'TEST-001-V1' }],
          images: [],
          collections: [],
        },
      ];

      // Mock database operations
      (prisma.syncStatus.create as any).mockResolvedValue({ id: 'sync-1' });
      (prisma.product.findMany as any).mockResolvedValue(mockProducts);
      (prisma.product.update as any).mockResolvedValue({});
      (prisma.syncStatus.update as any).mockResolvedValue({});

      // Mock Shopify API responses
      const mockAxiosInstance = {
        get: vi.fn().mockResolvedValue({
          data: { products: [] },
          headers: {},
        }),
        post: vi.fn().mockResolvedValue({}),
        put: vi.fn().mockResolvedValue({}),
      };

      // Mock the service's client
      (shopifyService as any).client = mockAxiosInstance;

      // Act
      const result = await shopifyService.syncProductsToShopify();

      // Assert
      expect(result.successful).toBe(1);
      expect(result.failed).toBe(0);
      expect(result.total).toBe(1);
      
      // Verify sync status was tracked
      expect(prisma.syncStatus.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          entityType: 'products',
          direction: 'push',
          status: 'running',
        }),
      });
      
      expect(prisma.syncStatus.update).toHaveBeenCalledWith({
        where: { id: 'sync-1' },
        data: expect.objectContaining({
          status: 'completed',
          successful: 1,
          failed: 0,
          total: 1,
        }),
      });
    });

    it('should handle product conflicts during sync', async () => {
      // Arrange
      const localProduct = {
        id: '1',
        title: 'Local Product Title',
        updatedAt: new Date('2023-01-01'),
        variants: [],
        images: [],
        collections: [],
      };

      const shopifyProduct = {
        ...mockShopifyProduct,
        title: 'Shopify Product Title',
        updated_at: '2023-01-02T00:00:00Z',
      };

      (prisma.syncStatus.create as any).mockResolvedValue({ id: 'sync-1' });
      (prisma.product.findMany as any).mockResolvedValue([localProduct]);
      (prisma.product.update as any).mockResolvedValue({});
      (prisma.syncStatus.update as any).mockResolvedValue({});

      const mockAxiosInstance = {
        get: vi.fn().mockResolvedValue({
          data: { products: [shopifyProduct] },
          headers: {},
        }),
      };

      (shopifyService as any).client = mockAxiosInstance;

      // Mock conflict resolution
      const conflictResolver = new ConflictResolver();
      vi.spyOn(conflictResolver, 'detectProductConflict').mockResolvedValue({
        localProduct,
        shopifyProduct,
        conflictFields: ['title'],
        conflictType: 'timestamp',
      });
      
      vi.spyOn(conflictResolver, 'resolveProductConflict').mockResolvedValue({
        action: 'overwrite',
        mergedData: { title: shopifyProduct.title },
        reason: 'Shopify data is more recent',
      });

      (shopifyService as any).conflictResolver = conflictResolver;

      // Act
      const result = await shopifyService.syncProductsToShopify();

      // Assert
      expect(result.successful).toBe(1);
      expect(conflictResolver.detectProductConflict).toHaveBeenCalled();
      expect(conflictResolver.resolveProductConflict).toHaveBeenCalled();
    });
  });

  describe('Webhook Processing Integration', () => {
    it('should process product webhook and update database', async () => {
      // Arrange
      const productWebhook = {
        ...mockWebhookEvent,
        topic: 'products/create',
        payload: mockShopifyProduct,
      };

      (prisma.product.findFirst as any).mockResolvedValue(null);
      (prisma.product.create as any).mockResolvedValue({});
      (prisma.webhookLog.create as any).mockResolvedValue({});

      // Mock webhook verification
      process.env.SHOPIFY_WEBHOOK_SECRET = 'test-secret';

      // Act
      await webhookProcessor.process(productWebhook);

      // Assert
      expect(prisma.product.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: mockShopifyProduct.title,
          shopifyId: mockShopifyProduct.id.toString(),
          syncStatus: 'synced',
        }),
      });

      expect(prisma.webhookLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          topic: 'products/create',
          status: 'processed',
        }),
      });
    });

    it('should process order webhook and create order with customer', async () => {
      // Arrange
      const orderWebhook = {
        ...mockWebhookEvent,
        topic: 'orders/create',
        payload: mockShopifyOrder,
      };

      (prisma.order.findFirst as any).mockResolvedValue(null);
      (prisma.customer.findFirst as any).mockResolvedValue(null);
      (prisma.customer.create as any).mockResolvedValue({ id: 'customer-1' });
      (prisma.order.create as any).mockResolvedValue({});
      (prisma.webhookLog.create as any).mockResolvedValue({});

      // Act
      await webhookProcessor.process(orderWebhook);

      // Assert
      expect(prisma.customer.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: mockShopifyOrder.customer.email,
          shopifyId: mockShopifyOrder.customer.id.toString(),
          syncStatus: 'synced',
        }),
      });

      expect(prisma.order.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          orderNumber: mockShopifyOrder.order_number.toString(),
          customerId: 'customer-1',
          shopifyId: mockShopifyOrder.id.toString(),
          syncStatus: 'synced',
        }),
      });
    });

    it('should handle webhook verification failure', async () => {
      // Arrange
      const invalidWebhook = {
        ...mockWebhookEvent,
        headers: {
          ...mockWebhookEvent.headers,
          'x-shopify-hmac-sha256': 'invalid-hmac',
        },
      };

      process.env.SHOPIFY_WEBHOOK_SECRET = 'test-secret';

      // Act & Assert
      await expect(webhookProcessor.process(invalidWebhook)).rejects.toThrow('Webhook verification failed');
    });
  });

  describe('Circuit Breaker Integration', () => {
    it('should open circuit breaker after consecutive failures', async () => {
      // Arrange
      const circuitBreaker = new CircuitBreaker({
        failureThreshold: 3,
        recoveryTimeout: 60000,
        monitoringPeriod: 10000,
      });

      const failingOperation = vi.fn().mockRejectedValue(new Error('API Error'));

      // Act - Trigger failures
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failingOperation);
        } catch (error) {
          // Expected to fail
        }
      }

      // Assert
      const status = circuitBreaker.getStatus();
      expect(status.state).toBe('open');
      expect(status.failureCount).toBe(3);

      // Verify circuit breaker blocks further calls
      await expect(circuitBreaker.execute(failingOperation)).rejects.toThrow('Circuit breaker is open');
    });

    it('should transition to half-open and recover', async () => {
      // Arrange
      const circuitBreaker = new CircuitBreaker({
        failureThreshold: 2,
        recoveryTimeout: 100, // Short timeout for testing
        monitoringPeriod: 10000,
      });

      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'))
        .mockResolvedValueOnce('Success');

      // Act - Trigger failures to open circuit
      try { await circuitBreaker.execute(operation); } catch {}
      try { await circuitBreaker.execute(operation); } catch {}

      expect(circuitBreaker.getStatus().state).toBe('open');

      // Wait for recovery timeout
      await new Promise(resolve => setTimeout(resolve, 150));

      // Execute successful operation
      const result = await circuitBreaker.execute(operation);

      // Assert
      expect(result).toBe('Success');
      expect(circuitBreaker.getStatus().state).toBe('closed');
    });
  });

  describe('Rate Limiting Integration', () => {
    it('should respect rate limits and wait when necessary', async () => {
      // Arrange
      const rateLimiter = new RateLimiter({
        maxRequests: 2,
        windowMs: 1000,
        burstLimit: 2,
      });

      const startTime = Date.now();

      // Act - Make requests that exceed rate limit
      await rateLimiter.waitForToken(); // Request 1
      await rateLimiter.waitForToken(); // Request 2
      await rateLimiter.waitForToken(); // Request 3 - should wait

      const endTime = Date.now();

      // Assert - Should have waited for rate limit reset
      expect(endTime - startTime).toBeGreaterThan(900); // Almost 1 second
    });

    it('should update rate limits from Shopify headers', async () => {
      // Arrange
      const rateLimiter = new RateLimiter({
        maxRequests: 40,
        windowMs: 1000,
        burstLimit: 80,
      });

      // Act
      rateLimiter.updateFromHeaders({
        'x-shopify-shop-api-call-limit': '35/40',
        'x-shopify-api-request-bucket-leak-rate': '2',
      });

      // Assert
      const status = rateLimiter.getStatus();
      expect(status.remaining).toBe(5); // 40 - 35
    });
  });

  describe('Retry Manager Integration', () => {
    it('should retry failed operations with exponential backoff', async () => {
      // Arrange
      const retryManager = new RetryManager({
        maxRetries: 3,
        baseDelay: 100,
        maxDelay: 1000,
        backoffFactor: 2,
      });

      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockRejectedValueOnce(new Error('Another temporary error'))
        .mockResolvedValueOnce('Success');

      const startTime = Date.now();

      // Act
      const result = await retryManager.execute(operation);
      const endTime = Date.now();

      // Assert
      expect(result).toBe('Success');
      expect(operation).toHaveBeenCalledTimes(3);
      expect(endTime - startTime).toBeGreaterThan(300); // Should have waited for retries
    });

    it('should not retry non-retryable errors', async () => {
      // Arrange
      const retryManager = new RetryManager({
        maxRetries: 3,
        baseDelay: 100,
        maxDelay: 1000,
        backoffFactor: 2,
      });

      const operation = vi.fn().mockRejectedValue(new Error('Unauthorized'));

      // Act & Assert
      await expect(retryManager.execute(operation)).rejects.toThrow('Unauthorized');
      expect(operation).toHaveBeenCalledTimes(1); // Should not retry
    });
  });

  describe('Sync Status Management Integration', () => {
    it('should track sync lifecycle correctly', async () => {
      // Arrange
      const syncStatusManager = new SyncStatusManager(prisma);
      
      (prisma.syncStatus.create as any).mockResolvedValue({ id: 'sync-1' });
      (prisma.syncStatus.update as any).mockResolvedValue({});

      // Act
      const syncId = await syncStatusManager.startSync('products', 'pull');
      await syncStatusManager.updateSyncProgress(syncId, {
        successful: 5,
        failed: 1,
        total: 10,
      });
      await syncStatusManager.completeSync(syncId, {
        successful: 9,
        failed: 1,
        total: 10,
      });

      // Assert
      expect(prisma.syncStatus.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          entityType: 'products',
          direction: 'pull',
          status: 'running',
        }),
      });

      expect(prisma.syncStatus.update).toHaveBeenCalledWith({
        where: { id: syncId },
        data: expect.objectContaining({
          successful: 5,
          failed: 1,
          total: 10,
        }),
      });

      expect(prisma.syncStatus.update).toHaveBeenCalledWith({
        where: { id: syncId },
        data: expect.objectContaining({
          status: 'completed',
          successful: 9,
          failed: 1,
          total: 10,
        }),
      });
    });

    it('should calculate sync metrics correctly', async () => {
      // Arrange
      const syncStatusManager = new SyncStatusManager(prisma);
      
      const mockSyncs = [
        {
          status: 'completed',
          startedAt: new Date('2023-01-01T00:00:00Z'),
          completedAt: new Date('2023-01-01T00:05:00Z'), // 5 minutes
        },
        {
          status: 'completed',
          startedAt: new Date('2023-01-01T01:00:00Z'),
          completedAt: new Date('2023-01-01T01:03:00Z'), // 3 minutes
        },
        {
          status: 'failed',
          startedAt: new Date('2023-01-01T02:00:00Z'),
          completedAt: new Date('2023-01-01T02:01:00Z'), // 1 minute
        },
      ];

      (prisma.syncStatus.findMany as any).mockResolvedValue(mockSyncs);

      // Act
      const metrics = await syncStatusManager.getSyncMetrics('products', 7);

      // Assert
      expect(metrics.totalSyncs).toBe(3);
      expect(metrics.successfulSyncs).toBe(2);
      expect(metrics.failedSyncs).toBe(1);
      expect(metrics.successRate).toBe(66.66666666666666);
      expect(metrics.averageDuration).toBe(180000); // 3 minutes average
    });
  });

  describe('Full Integration Scenario', () => {
    it('should handle complete sync workflow with all components', async () => {
      // Arrange - Set up all mocks for a complete workflow
      (prisma.syncStatus.create as any).mockResolvedValue({ id: 'sync-1' });
      (prisma.syncStatus.update as any).mockResolvedValue({});
      (prisma.product.findMany as any).mockResolvedValue([]);
      (prisma.inventory.findMany as any).mockResolvedValue([]);
      (prisma.syncStatus.findFirst as any).mockResolvedValue(null);

      const mockAxiosInstance = {
        get: vi.fn().mockResolvedValue({
          data: { products: [], orders: [], customers: [] },
          headers: {},
        }),
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() },
        },
      };

      (shopifyService as any).client = mockAxiosInstance;

      // Act
      const results = await shopifyService.triggerFullSync();

      // Assert
      expect(results).toHaveProperty('products');
      expect(results).toHaveProperty('inventory');
      expect(results).toHaveProperty('orders');
      expect(results).toHaveProperty('customers');

      // Verify all sync types were initiated
      expect(prisma.syncStatus.create).toHaveBeenCalledTimes(4);
      expect(prisma.syncStatus.update).toHaveBeenCalledTimes(4);
    });
  });
});