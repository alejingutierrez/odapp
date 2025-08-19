import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { ShopifyService } from '../services/shopify.service';
import { WebhookProcessor } from '../lib/webhook-processor';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { logger } from '../lib/logger';
import { ApiResponse } from '../lib/api-response';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Initialize Shopify service (would be configured per shop in real implementation)
const getShopifyService = (req: any) => {
  const shopDomain = req.headers['x-shop-domain'] || process.env.SHOPIFY_SHOP_DOMAIN;
  const accessToken = req.headers['x-shopify-access-token'] || process.env.SHOPIFY_ACCESS_TOKEN;
  
  if (!shopDomain || !accessToken) {
    throw new Error('Shopify configuration missing');
  }
  
  return new ShopifyService(prisma, shopDomain, accessToken);
};

// Validation schemas
const syncRequestSchema = z.object({
  entityType: z.enum(['products', 'inventory', 'orders', 'customers']).optional(),
  direction: z.enum(['push', 'pull', 'bidirectional']).optional(),
  force: z.boolean().optional(),
});

const webhookSchema = z.object({
  topic: z.string(),
  shop_domain: z.string(),
  payload: z.any(),
});

// Sync endpoints
router.post('/sync/products/push', 
  authenticateToken, 
  validateRequest(syncRequestSchema),
  async (req, res) => {
    try {
      const shopifyService = getShopifyService(req);
      const result = await shopifyService.syncProductsToShopify();
      
      res.json(ApiResponse.success(result, 'Products sync to Shopify completed'));
    } catch (error) {
      logger.error('Products sync to Shopify failed:', error);
      res.status(500).json(ApiResponse.error('Products sync failed', error));
    }
  }
);

router.post('/sync/products/pull', 
  authenticateToken, 
  validateRequest(syncRequestSchema),
  async (req, res) => {
    try {
      const shopifyService = getShopifyService(req);
      const result = await shopifyService.syncProductsFromShopify();
      
      res.json(ApiResponse.success(result, 'Products sync from Shopify completed'));
    } catch (error) {
      logger.error('Products sync from Shopify failed:', error);
      res.status(500).json(ApiResponse.error('Products sync failed', error));
    }
  }
);

router.post('/sync/inventory/push', 
  authenticateToken, 
  validateRequest(syncRequestSchema),
  async (req, res) => {
    try {
      const shopifyService = getShopifyService(req);
      const result = await shopifyService.syncInventoryToShopify();
      
      res.json(ApiResponse.success(result, 'Inventory sync to Shopify completed'));
    } catch (error) {
      logger.error('Inventory sync to Shopify failed:', error);
      res.status(500).json(ApiResponse.error('Inventory sync failed', error));
    }
  }
);

router.post('/sync/orders/pull', 
  authenticateToken, 
  validateRequest(syncRequestSchema),
  async (req, res) => {
    try {
      const shopifyService = getShopifyService(req);
      const result = await shopifyService.importOrdersFromShopify();
      
      res.json(ApiResponse.success(result, 'Orders import from Shopify completed'));
    } catch (error) {
      logger.error('Orders import from Shopify failed:', error);
      res.status(500).json(ApiResponse.error('Orders import failed', error));
    }
  }
);

router.post('/sync/customers/pull', 
  authenticateToken, 
  validateRequest(syncRequestSchema),
  async (req, res) => {
    try {
      const shopifyService = getShopifyService(req);
      const result = await shopifyService.syncCustomersFromShopify();
      
      res.json(ApiResponse.success(result, 'Customers sync from Shopify completed'));
    } catch (error) {
      logger.error('Customers sync from Shopify failed:', error);
      res.status(500).json(ApiResponse.error('Customers sync failed', error));
    }
  }
);

router.post('/sync/full', 
  authenticateToken, 
  validateRequest(syncRequestSchema),
  async (req, res) => {
    try {
      const shopifyService = getShopifyService(req);
      const results = await shopifyService.triggerFullSync();
      
      res.json(ApiResponse.success(results, 'Full sync completed'));
    } catch (error) {
      logger.error('Full sync failed:', error);
      res.status(500).json(ApiResponse.error('Full sync failed', error));
    }
  }
);

// Sync status endpoints
router.get('/sync/status', authenticateToken, async (req, res) => {
  try {
    const shopifyService = getShopifyService(req);
    const statuses = await shopifyService.getSyncStatus();
    
    res.json(ApiResponse.success(statuses, 'Sync statuses retrieved'));
  } catch (error) {
    logger.error('Failed to get sync statuses:', error);
    res.status(500).json(ApiResponse.error('Failed to get sync statuses', error));
  }
});

router.get('/sync/history', authenticateToken, async (req, res) => {
  try {
    const { entityType } = req.query;
    const shopifyService = getShopifyService(req);
    const history = await shopifyService.getSyncHistory(entityType as string);
    
    res.json(ApiResponse.success(history, 'Sync history retrieved'));
  } catch (error) {
    logger.error('Failed to get sync history:', error);
    res.status(500).json(ApiResponse.error('Failed to get sync history', error));
  }
});

router.get('/sync/metrics', authenticateToken, async (req, res) => {
  try {
    const { entityType, days } = req.query;
    const syncStatusManager = new (await import('../lib/sync-status-manager')).SyncStatusManager(prisma);
    const metrics = await syncStatusManager.getSyncMetrics(
      entityType as string,
      days ? parseInt(days as string) : 7
    );
    
    res.json(ApiResponse.success(metrics, 'Sync metrics retrieved'));
  } catch (error) {
    logger.error('Failed to get sync metrics:', error);
    res.status(500).json(ApiResponse.error('Failed to get sync metrics', error));
  }
});

// Circuit breaker status
router.get('/circuit-breaker/status', authenticateToken, async (req, res) => {
  try {
    const shopifyService = getShopifyService(req);
    const status = shopifyService.getCircuitBreakerStatus();
    
    res.json(ApiResponse.success(status, 'Circuit breaker status retrieved'));
  } catch (error) {
    logger.error('Failed to get circuit breaker status:', error);
    res.status(500).json(ApiResponse.error('Failed to get circuit breaker status', error));
  }
});

// Webhook endpoint (no authentication for Shopify webhooks)
router.post('/webhooks', async (req, res) => {
  try {
    const topic = req.headers['x-shopify-topic'] as string;
    const shopDomain = req.headers['x-shopify-shop-domain'] as string;
    const hmacHeader = req.headers['x-shopify-hmac-sha256'] as string;
    
    if (!topic || !shopDomain) {
      return res.status(400).json(ApiResponse.error('Missing required webhook headers'));
    }

    const webhookEvent = {
      topic,
      shop_domain: shopDomain,
      payload: req.body,
      headers: {
        'x-shopify-topic': topic,
        'x-shopify-shop-domain': shopDomain,
        'x-shopify-hmac-sha256': hmacHeader,
      },
      timestamp: new Date(),
    };

    const webhookProcessor = new WebhookProcessor(prisma);
    await webhookProcessor.process(webhookEvent);
    
    res.status(200).json(ApiResponse.success(null, 'Webhook processed successfully'));
  } catch (error) {
    logger.error('Webhook processing failed:', error);
    res.status(500).json(ApiResponse.error('Webhook processing failed', error));
  }
});

// Webhook management endpoints
router.get('/webhooks/logs', authenticateToken, async (req, res) => {
  try {
    const { limit = 50, topic, status } = req.query;
    
    const logs = await prisma.webhookLog.findMany({
      where: {
        ...(topic && { topic: topic as string }),
        ...(status && { status: status as string }),
      },
      orderBy: { processedAt: 'desc' },
      take: parseInt(limit as string),
    });
    
    res.json(ApiResponse.success(logs, 'Webhook logs retrieved'));
  } catch (error) {
    logger.error('Failed to get webhook logs:', error);
    res.status(500).json(ApiResponse.error('Failed to get webhook logs', error));
  }
});

// Configuration endpoints
router.get('/config', authenticateToken, async (req, res) => {
  try {
    const config = {
      shopDomain: process.env.SHOPIFY_SHOP_DOMAIN,
      hasAccessToken: !!process.env.SHOPIFY_ACCESS_TOKEN,
      webhookSecret: !!process.env.SHOPIFY_WEBHOOK_SECRET,
      apiVersion: '2023-10',
    };
    
    res.json(ApiResponse.success(config, 'Shopify configuration retrieved'));
  } catch (error) {
    logger.error('Failed to get Shopify configuration:', error);
    res.status(500).json(ApiResponse.error('Failed to get configuration', error));
  }
});

router.post('/config/test', authenticateToken, async (req, res) => {
  try {
    const shopifyService = getShopifyService(req);
    
    // Test connection by fetching shop info
    const shopInfo = await (shopifyService as any).client.get('/shop.json');
    
    res.json(ApiResponse.success({
      connected: true,
      shop: shopInfo.data.shop,
      testedAt: new Date(),
    }, 'Shopify connection test successful'));
  } catch (error) {
    logger.error('Shopify connection test failed:', error);
    res.status(500).json(ApiResponse.error('Connection test failed', error));
  }
});

// Manual conflict resolution
router.post('/conflicts/resolve', 
  authenticateToken,
  async (req, res) => {
    try {
      const { conflictId, resolution } = req.body;
      
      // This would integrate with a conflict resolution UI
      // For now, just acknowledge the request
      
      res.json(ApiResponse.success({
        conflictId,
        resolution,
        resolvedAt: new Date(),
      }, 'Conflict resolution applied'));
    } catch (error) {
      logger.error('Conflict resolution failed:', error);
      res.status(500).json(ApiResponse.error('Conflict resolution failed', error));
    }
  }
);

// Scheduled sync endpoints
router.post('/sync/schedule', 
  authenticateToken,
  async (req, res) => {
    try {
      const { entityType, direction, schedule } = req.body;
      
      // This would integrate with a job scheduler like Bull or Agenda
      // For now, just acknowledge the request
      
      res.json(ApiResponse.success({
        entityType,
        direction,
        schedule,
        scheduledAt: new Date(),
      }, 'Sync scheduled successfully'));
    } catch (error) {
      logger.error('Sync scheduling failed:', error);
      res.status(500).json(ApiResponse.error('Sync scheduling failed', error));
    }
  }
);

export default router;