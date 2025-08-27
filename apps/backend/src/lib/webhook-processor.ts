import crypto from 'crypto'

import { PrismaClient } from '@prisma/client'

import {
  WebhookEvent,
  ShopifyProduct,
  ShopifyOrder,
  ShopifyCustomer,
} from '../types/shopify'

import { logger } from './logger'

export class WebhookProcessor {
  constructor(private _prisma: PrismaClient) {}

  async process(event: WebhookEvent): Promise<void> {
    logger.info(`Processing webhook: ${event.topic}`, {
      shop: event.shop_domain,
      timestamp: event.timestamp,
    })

    try {
      // Verify webhook authenticity
      if (!this.verifyWebhook(event)) {
        throw new Error('Webhook verification failed')
      }

      // Process based on topic
      switch (event.topic) {
        case 'products/create':
        case 'products/update':
          await this.handleProductWebhook(event)
          break

        case 'products/delete':
          await this.handleProductDeleteWebhook(event)
          break

        case 'orders/create':
        case 'orders/updated':
          await this.handleOrderWebhook(event)
          break

        case 'orders/delete':
          await this.handleOrderDeleteWebhook(event)
          break

        case 'customers/create':
        case 'customers/update':
          await this.handleCustomerWebhook(event)
          break

        case 'customers/delete':
          await this.handleCustomerDeleteWebhook(event)
          break

        case 'inventory_levels/update':
          await this.handleInventoryWebhook(event)
          break

        case 'app/uninstalled':
          await this.handleAppUninstallWebhook(event)
          break

        default:
          logger.warn(`Unhandled webhook topic: ${event.topic}`)
      }

      // Log successful processing
      await this.logWebhookEvent(event, 'processed')
    } catch (error) {
      logger.error(`Webhook processing failed for ${event.topic}:`, error)
      await this.logWebhookEvent(event, 'failed', error as Error)
      throw error
    }
  }

  private verifyWebhook(event: WebhookEvent): boolean {
    const webhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET
    if (!webhookSecret) {
      logger.warn(
        'Shopify webhook secret not configured, skipping verification'
      )
      return true // Allow in development
    }

    const hmacHeader = event.headers?.['x-shopify-hmac-sha256']
    if (!hmacHeader) {
      logger.error('Missing HMAC header in webhook')
      return false
    }

    const body = JSON.stringify(event.payload)
    const calculatedHmac = crypto
      .createHmac('sha256', webhookSecret)
      .update(body, 'utf8')
      .digest('base64')

    const providedHmac = Buffer.from(hmacHeader, 'base64')
    const expectedHmac = Buffer.from(calculatedHmac, 'base64')

    if (providedHmac.length !== expectedHmac.length) {
      logger.error('Webhook HMAC verification failed: length mismatch')
      return false
    }

    const isValid = crypto.timingSafeEqual(providedHmac, expectedHmac)

    if (!isValid) {
      logger.error('Webhook HMAC verification failed')
    }

    return isValid
  }

  private async handleProductWebhook(event: WebhookEvent): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shopifyProduct: ShopifyProduct = event.payload as any

    try {
      // Find existing product
      const existingProduct = await this._prisma.product.findFirst({
        where: { shopifyId: shopifyProduct.id.toString() },
        include: { variants: true, images: true },
      })

      if (existingProduct) {
        // Update existing product
        await this.updateProductFromWebhook(existingProduct.id, shopifyProduct)
        logger.info(`Updated product from webhook: ${shopifyProduct.id}`)
      } else {
        // Create new product
        await this.createProductFromWebhook(shopifyProduct)
        logger.info(`Created product from webhook: ${shopifyProduct.id}`)
      }
    } catch (error) {
      logger.error(
        `Failed to process product webhook for ${shopifyProduct.id}:`,
        error
      )
      throw error
    }
  }

  private async handleProductDeleteWebhook(event: WebhookEvent): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shopifyProduct: ShopifyProduct = event.payload as any

    try {
      const existingProduct = await this._prisma.product.findFirst({
        where: { shopifyId: shopifyProduct.id.toString() },
      })

      if (existingProduct) {
        // Soft delete or mark as archived
        await this._prisma.product.update({
          where: { id: existingProduct.id },
          data: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            status: 'ARCHIVED' as any,
            deletedAt: new Date(),
            // syncStatus: 'synced', // Removed - not a valid field
          },
        })

        logger.info(`Archived product from webhook: ${shopifyProduct.id}`)
      }
    } catch (error) {
      logger.error(
        `Failed to process product delete webhook for ${shopifyProduct.id}:`,
        error
      )
      throw error
    }
  }

  private async handleOrderWebhook(event: WebhookEvent): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shopifyOrder: ShopifyOrder = event.payload as any

    try {
      // Find existing order
      const existingOrder = await this._prisma.order.findFirst({
        where: { shopifyId: shopifyOrder.id.toString() },
      })

      if (existingOrder) {
        // Update existing order
        await this.updateOrderFromWebhook(existingOrder.id, shopifyOrder)
        logger.info(`Updated order from webhook: ${shopifyOrder.id}`)
      } else {
        // Create new order
        await this.createOrderFromWebhook(shopifyOrder)
        logger.info(`Created order from webhook: ${shopifyOrder.id}`)
      }
    } catch (error) {
      logger.error(
        `Failed to process order webhook for ${shopifyOrder.id}:`,
        error
      )
      throw error
    }
  }

  private async handleOrderDeleteWebhook(event: WebhookEvent): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shopifyOrder: ShopifyOrder = event.payload as any

    try {
      const existingOrder = await this._prisma.order.findFirst({
        where: { shopifyId: shopifyOrder.id.toString() },
      })

      if (existingOrder) {
        // Mark order as cancelled
        await this._prisma.order.update({
          where: { id: existingOrder.id },
          data: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            status: 'CANCELLED' as any,
            cancelledAt: new Date(),
            // syncStatus: 'synced', // Removed - not a valid field
          },
        })

        logger.info(`Cancelled order from webhook: ${shopifyOrder.id}`)
      }
    } catch (error) {
      logger.error(
        `Failed to process order delete webhook for ${shopifyOrder.id}:`,
        error
      )
      throw error
    }
  }

  private async handleCustomerWebhook(event: WebhookEvent): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shopifyCustomer: ShopifyCustomer = event.payload as any

    try {
      // Find existing customer
      const existingCustomer = await this._prisma.customer.findFirst({
        where: {
          OR: [
            { shopifyId: shopifyCustomer.id.toString() },
            { email: shopifyCustomer.email },
          ],
        },
      })

      if (existingCustomer) {
        // Update existing customer
        await this.updateCustomerFromWebhook(
          existingCustomer.id,
          shopifyCustomer
        )
        logger.info(`Updated customer from webhook: ${shopifyCustomer.id}`)
      } else {
        // Create new customer
        await this.createCustomerFromWebhook(shopifyCustomer)
        logger.info(`Created customer from webhook: ${shopifyCustomer.id}`)
      }
    } catch (error) {
      logger.error(
        `Failed to process customer webhook for ${shopifyCustomer.id}:`,
        error
      )
      throw error
    }
  }

  private async handleCustomerDeleteWebhook(
    event: WebhookEvent
  ): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shopifyCustomer: ShopifyCustomer = event.payload as any

    try {
      const existingCustomer = await this._prisma.customer.findFirst({
        where: { shopifyId: shopifyCustomer.id.toString() },
      })

      if (existingCustomer) {
        // Soft delete customer (GDPR compliance)
        await this._prisma.customer.update({
          where: { id: existingCustomer.id },
          data: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            status: 'DELETED' as any,
            deletedAt: new Date(),
            // Anonymize personal data
            firstName: 'Deleted',
            lastName: 'Customer',
            email: `deleted-${existingCustomer.id}@example.com`,
            phone: null,
            // syncStatus: 'synced', // Removed - not a valid field
          },
        })

        logger.info(`Deleted customer from webhook: ${shopifyCustomer.id}`)
      }
    } catch (error) {
      logger.error(
        `Failed to process customer delete webhook for ${shopifyCustomer.id}:`,
        error
      )
      throw error
    }
  }

  private async handleInventoryWebhook(event: WebhookEvent): Promise<void> {
    const inventoryLevel = event.payload

    try {
      // Find the variant by inventory item ID
      const variant = await this._prisma.productVariant.findFirst({
        where: {
          // shopifyInventoryItemId: inventoryLevel.inventory_item_id.toString(), // Removed - not a valid field
        },
        include: { product: true },
      })

      if (variant) {
        // Update inventory
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (this._prisma as any).inventory.upsert({
          where: { productVariantId: variant.id },
          update: {
            quantity: inventoryLevel.available,
            lastSyncAt: new Date(),
            syncStatus: 'synced',
          },
          create: {
            productVariantId: variant.id,
            quantity: inventoryLevel.available,
            location: 'shopify',
            lastSyncAt: new Date(),
            syncStatus: 'synced',
          },
        })

        logger.info(`Updated inventory from webhook for variant: ${variant.id}`)
      }
    } catch (error) {
      logger.error(`Failed to process inventory webhook:`, error)
      throw error
    }
  }

  private async handleAppUninstallWebhook(event: WebhookEvent): Promise<void> {
    try {
      // Mark all sync statuses as disconnected
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (this._prisma as any).syncStatus.updateMany({
        where: { status: { in: ['pending', 'running'] } },
        data: { status: 'failed', completedAt: new Date() },
      })

      // Log the uninstall
      logger.warn(`Shopify app uninstalled for shop: ${event.shop_domain}`)

      // Could trigger cleanup processes here
    } catch (error) {
      logger.error('Failed to process app uninstall webhook:', error)
      throw error
    }
  }

  private async createProductFromWebhook(
    shopifyProduct: ShopifyProduct
  ): Promise<void> {
    await this._prisma.product.create({
      data: {
        name: shopifyProduct.title || 'Untitled Product', // Added required field
        slug: `product-${shopifyProduct.id}`, // Added required field
        price: shopifyProduct.variants[0]?.price
          ? parseFloat(shopifyProduct.variants[0].price)
          : 0, // Added required field
        description: shopifyProduct.body_html,
        // vendor: shopifyProduct.vendor, // Removed - not a valid field
        // productType: shopifyProduct.product_type, // Removed - not a valid field
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        status: shopifyProduct.status as any,
        // tags: shopifyProduct.tags
        //   .split(',')
        //   .map((tag) => tag.trim())
        //   .filter(Boolean), // Removed - not a valid field
        shopifyId: shopifyProduct.id.toString(),
        // shopifyUpdatedAt: new Date(shopifyProduct.updated_at), // Removed - not a valid field
        // syncStatus: 'synced', // Removed - not a valid field
        variants: {
          create: shopifyProduct.variants.map((variant) => ({
            title: variant.title,
            price: parseFloat(variant.price),
            compareAtPrice: variant.compare_at_price
              ? parseFloat(variant.compare_at_price)
              : null,
            sku: variant.sku,
            barcode: variant.barcode,
            weight: variant.weight,
            weightUnit: variant.weight_unit,
            requiresShipping: variant.requires_shipping,
            taxable: variant.taxable,
            shopifyId: variant.id.toString(),
            // shopifyInventoryItemId: variant.inventory_item_id.toString(), // Removed - not a valid field
          })),
        },
        images: {
          create: shopifyProduct.images.map((image) => ({
            url: image.src, // Changed from src to url
            alt: image.alt,
            position: image.position,
            shopifyId: image.id.toString(),
          })),
        },
      },
    })
  }

  private async updateProductFromWebhook(
    productId: string,
    shopifyProduct: ShopifyProduct
  ): Promise<void> {
    await this._prisma.product.update({
      where: { id: productId },
      data: {
        // title: shopifyProduct.title, // Removed - not a valid field for update
        description: shopifyProduct.body_html,
        // vendor: shopifyProduct.vendor, // Removed - not a valid field
        // productType: shopifyProduct.product_type, // Removed - not a valid field
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        status: shopifyProduct.status as any,
        // tags: shopifyProduct.tags
        //   .split(',')
        //   .map((tag) => tag.trim())
        //   .filter(Boolean), // Removed - not a valid field
        // shopifyUpdatedAt: new Date(shopifyProduct.updated_at), // Removed - not a valid field
        // syncStatus: 'synced', // Removed - not a valid field
        lastSyncedAt: new Date(),
      },
    })
  }

  private async createOrderFromWebhook(
    shopifyOrder: ShopifyOrder
  ): Promise<void> {
    // Find or create customer first
    let customer = null
    if (shopifyOrder.customer) {
      customer = await this._prisma.customer.findFirst({
        where: { shopifyId: shopifyOrder.customer.id.toString() },
      })

      if (!customer) {
        customer = await this.createCustomerFromWebhook(shopifyOrder.customer)
      }
    }

    await this._prisma.order.create({
      data: {
        orderNumber: shopifyOrder.order_number.toString(),
        currency: shopifyOrder.currency,
        subtotal: parseFloat(shopifyOrder.subtotal_price || '0'),
        taxAmount: parseFloat(shopifyOrder.total_tax || '0'),
        shippingAmount: parseFloat(
          shopifyOrder.total_shipping_price_set?.shop_money?.amount || '0'
        ),
        totalAmount: parseFloat(shopifyOrder.total_price || '0'),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        financialStatus: shopifyOrder.financial_status as any,

        fulfillmentStatus:
          shopifyOrder.fulfillment_status || ('unfulfilled' as any),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        customerId: (customer as any)?.id,
        shopifyId: shopifyOrder.id.toString(),
        items: {
          create: shopifyOrder.line_items.map((item) => ({
            name: item.title, // Changed from title to name
            quantity: item.quantity,
            price: parseFloat(item.price),
            totalPrice: parseFloat(item.price) * item.quantity, // Required field
            sku: item.sku,
            variantTitle: item.variant_title,
            productId: item.product_id.toString(),
            variantId: item.variant_id.toString(),
          })),
        },
      },
    })
  }

  private async updateOrderFromWebhook(
    orderId: string,
    shopifyOrder: ShopifyOrder
  ): Promise<void> {
    await this._prisma.order.update({
      where: { id: orderId },
      data: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        financialStatus: shopifyOrder.financial_status as any,

        fulfillmentStatus:
          shopifyOrder.fulfillment_status || ('unfulfilled' as any),
        // syncStatus: 'synced', // Removed - not a valid field
        lastSyncedAt: new Date(),
      },
    })
  }

  private async createCustomerFromWebhook(
    shopifyCustomer: ShopifyCustomer
  ): Promise<unknown> {
    return await this._prisma.customer.create({
      data: {
        firstName: shopifyCustomer.first_name,
        lastName: shopifyCustomer.last_name,
        email: shopifyCustomer.email,
        phone: shopifyCustomer.phone,
        // acceptsMarketing: shopifyCustomer.accepts_marketing, // Removed - not a valid field
        // ordersCount: shopifyCustomer.orders_count, // Removed - not a valid field
        totalSpent: parseFloat(shopifyCustomer.total_spent || '0'),
        tags: shopifyCustomer.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
        shopifyId: shopifyCustomer.id.toString(),
        // shopifyCreatedAt: new Date(shopifyCustomer.created_at), // Removed - not a valid field
        // syncStatus: 'synced', // Removed - not a valid field
      },
    })
  }

  private async updateCustomerFromWebhook(
    customerId: string,
    shopifyCustomer: ShopifyCustomer
  ): Promise<void> {
    await this._prisma.customer.update({
      where: { id: customerId },
      data: {
        firstName: shopifyCustomer.first_name,
        lastName: shopifyCustomer.last_name,
        phone: shopifyCustomer.phone,
        // acceptsMarketing: shopifyCustomer.accepts_marketing, // Removed - not a valid field
        // ordersCount: shopifyCustomer.orders_count, // Removed - not a valid field
        totalSpent: parseFloat(shopifyCustomer.total_spent || '0'),
        tags: shopifyCustomer.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
        // shopifyUpdatedAt: new Date(shopifyCustomer.updated_at), // Removed - not a valid field
        // syncStatus: 'synced', // Removed - not a valid field
        lastSyncedAt: new Date(),
      },
    })
  }

  private async logWebhookEvent(
    event: WebhookEvent,
    status: 'processed' | 'failed',
    error?: Error
  ): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (this._prisma as any).webhookLog.create({
        data: {
          topic: event.topic,
          shopDomain: event.shop_domain,
          status,
          payload: event.payload,
          headers: event.headers,
          error: error?.message,
          processedAt: new Date(),
        },
      })
    } catch (logError) {
      logger.error('Failed to log webhook event:', logError)
    }
  }
}
