import { logger } from './logger'
import {
  ProductConflict,
  CustomerConflict,
  ConflictResolution,
  ShopifyProduct,
  ShopifyCustomer,
} from '../types/shopify'

export class ConflictResolver {
  async detectProductConflict(
    localProduct: Record<string, unknown>,
    shopifyProduct: ShopifyProduct
  ): Promise<ProductConflict | null> {
    const conflictFields: string[] = []

    // Check for data conflicts
    if (localProduct.title !== shopifyProduct.title) {
      conflictFields.push('title')
    }

    if (localProduct.description !== shopifyProduct.body_html) {
      conflictFields.push('description')
    }

    if (localProduct.vendor !== shopifyProduct.vendor) {
      conflictFields.push('vendor')
    }

    if (localProduct.productType !== shopifyProduct.product_type) {
      conflictFields.push('productType')
    }

    // Check variant conflicts
    const localVariants = (localProduct.variants as unknown[]) || []
    const shopifyVariants = shopifyProduct.variants || []

    if (localVariants.length !== shopifyVariants.length) {
      conflictFields.push('variants')
    } else {
      for (let i = 0; i < localVariants.length; i++) {
        const localVariant = localVariants[i] as Record<string, unknown>
        const shopifyVariant = shopifyVariants[i]

        if (localVariant.price !== parseFloat(shopifyVariant.price)) {
          conflictFields.push(`variants[${i}].price`)
        }

        if (localVariant.sku !== shopifyVariant.sku) {
          conflictFields.push(`variants[${i}].sku`)
        }
      }
    }

    // Check timestamp conflicts
    const localUpdated = new Date(localProduct.updatedAt as string)
          const shopifyUpdated = new Date(shopifyProduct.updated_at as string)

    let conflictType: 'data' | 'timestamp' | 'version' = 'data'

    if (conflictFields.length === 0) {
      return null // No conflict
    }

    if (Math.abs(localUpdated.getTime() - shopifyUpdated.getTime()) > 60000) {
      // 1 minute threshold
      conflictType = 'timestamp'
    }

    return {
      localProduct,
      shopifyProduct,
      conflictFields,
      conflictType,
    }
  }

  async resolveProductConflict(
    conflict: ProductConflict
  ): Promise<ConflictResolution> {
    const { localProduct, shopifyProduct, conflictFields, conflictType } =
      conflict

    logger.info(`Resolving product conflict for ${localProduct.id}:`, {
      conflictFields,
      conflictType,
    })

    // Resolution strategy based on conflict type and fields
    if (conflictType === 'timestamp') {
      const localUpdated = new Date(localProduct.updatedAt as any)
      
      // Safely handle shopifyProduct.updated_at which is unknown type
      const updatedAt = shopifyProduct.updated_at as any
      const dateString = String(updatedAt || Date.now())
      const shopifyUpdated = new Date(dateString)

      if (shopifyUpdated > localUpdated) {
        // Shopify is newer, use Shopify data
        return {
          action: 'overwrite',
          mergedData: this.mapShopifyProductToLocal(shopifyProduct),
          reason: 'Shopify data is more recent',
        }
      } else {
        // Local is newer, skip sync
        return {
          action: 'skip',
          reason: 'Local data is more recent',
        }
      }
    }

    // For data conflicts, attempt to merge
    if (this.canMergeProductConflict(conflictFields)) {
      const mergedData = await this.mergeProductData(
        localProduct,
        shopifyProduct,
        conflictFields
      )
      return {
        action: 'merge',
        mergedData,
        reason: 'Merged non-conflicting fields',
      }
    }

    // For critical conflicts, prefer Shopify as source of truth
    if (this.hasCriticalProductConflicts(conflictFields)) {
      return {
        action: 'overwrite',
        mergedData: this.mapShopifyProductToLocal(shopifyProduct),
        reason: 'Critical conflicts detected, using Shopify as source of truth',
      }
    }

    // Default to skip for safety
    return {
      action: 'skip',
      reason: 'Unable to resolve conflicts safely',
    }
  }

  async detectCustomerConflict(
    localCustomer: Record<string, unknown>,
    shopifyCustomer: ShopifyCustomer
  ): Promise<CustomerConflict | null> {
    const conflictFields: string[] = []

    // Check for data conflicts
    if (localCustomer.firstName !== shopifyCustomer.first_name) {
      conflictFields.push('firstName')
    }

    if (localCustomer.lastName !== shopifyCustomer.last_name) {
      conflictFields.push('lastName')
    }

    if (localCustomer.email !== shopifyCustomer.email) {
      conflictFields.push('email')
    }

    if (localCustomer.phone !== shopifyCustomer.phone) {
      conflictFields.push('phone')
    }

    // Check for duplicate detection
    let conflictType: 'data' | 'timestamp' | 'duplicate' = 'data'

    if (
      localCustomer.email === shopifyCustomer.email &&
      localCustomer.shopifyId !== shopifyCustomer.id.toString()
    ) {
      conflictType = 'duplicate'
      conflictFields.push('duplicate_email')
    }

    if (conflictFields.length === 0) {
      return null // No conflict
    }

    return {
      localCustomer,
      shopifyCustomer,
      conflictFields,
      conflictType,
    }
  }

  async resolveCustomerConflict(
    conflict: CustomerConflict
  ): Promise<ConflictResolution> {
    const { localCustomer, shopifyCustomer, conflictFields, conflictType } =
      conflict

    logger.info(`Resolving customer conflict for ${localCustomer.id}:`, {
      conflictFields,
      conflictType,
    })

    if (conflictType === 'duplicate') {
      // Handle duplicate customers
      const mergedData = await this.deduplicateCustomers(
        localCustomer,
        shopifyCustomer
      )
      return {
        action: 'merge',
        mergedData,
        reason: 'Merged duplicate customer records',
      }
    }

    // For data conflicts, prefer Shopify data for customer info
    if (this.canMergeCustomerConflict(conflictFields)) {
      const mergedData = await this.mergeCustomerData(
        localCustomer,
        shopifyCustomer,
        conflictFields
      )
      return {
        action: 'merge',
        mergedData,
        reason: 'Merged customer data',
      }
    }

    return {
      action: 'overwrite',
      mergedData: this.mapShopifyCustomerToLocal(shopifyCustomer),
      reason: 'Using Shopify customer data',
    }
  }

  private canMergeProductConflict(conflictFields: string[]): boolean {
    const nonMergeableFields = ['sku', 'variants']
    return !conflictFields.some((field) =>
      nonMergeableFields.some((nonMergeable) => field.includes(nonMergeable))
    )
  }

  private hasCriticalProductConflicts(conflictFields: string[]): boolean {
    const criticalFields = ['sku', 'variants']
    return conflictFields.some((field) =>
      criticalFields.some((critical) => field.includes(critical))
    )
  }

  private async mergeProductData(
    localProduct: Record<string, unknown>,
    shopifyProduct: ShopifyProduct,
    conflictFields: string[]
  ): Promise<Record<string, unknown>> {
    const merged = { ...localProduct }

    // Merge non-conflicting fields from Shopify
    if (!conflictFields.includes('title')) {
      merged.title = shopifyProduct.title
    }

    if (!conflictFields.includes('description')) {
      merged.description = shopifyProduct.body_html
    }

    if (!conflictFields.includes('vendor')) {
      merged.vendor = shopifyProduct.vendor
    }

    // Always update Shopify-specific fields
    merged.shopifyId = shopifyProduct.id.toString()
          merged.shopifyUpdatedAt = new Date(shopifyProduct.updated_at as string)

    return merged
  }

  private canMergeCustomerConflict(conflictFields: string[]): boolean {
    const nonMergeableFields = ['email']
    return !conflictFields.some((field) => nonMergeableFields.includes(field))
  }

  private async mergeCustomerData(
    localCustomer: Record<string, unknown>,
    shopifyCustomer: ShopifyCustomer,
    conflictFields: string[]
  ): Promise<Record<string, unknown>> {
    const merged = { ...localCustomer }

    // Prefer Shopify data for most fields
    merged.firstName = shopifyCustomer.first_name
    merged.lastName = shopifyCustomer.last_name
    merged.phone = shopifyCustomer.phone
    merged.acceptsMarketing = shopifyCustomer.accepts_marketing

    // Keep local email if there's a conflict (to avoid duplicates)
    if (!conflictFields.includes('email')) {
      merged.email = shopifyCustomer.email
    }

    // Always update Shopify-specific fields
    merged.shopifyId = shopifyCustomer.id.toString()
          merged.shopifyUpdatedAt = new Date(shopifyCustomer.updated_at as string)

    return merged
  }

  private async deduplicateCustomers(
    localCustomer: Record<string, unknown>,
    shopifyCustomer: ShopifyCustomer
  ): Promise<Record<string, unknown>> {
    // Merge customer data, preferring the most complete information
    const merged = {
      ...localCustomer,
      firstName: shopifyCustomer.first_name || localCustomer.firstName,
      lastName: shopifyCustomer.last_name || localCustomer.lastName,
      phone: shopifyCustomer.phone || localCustomer.phone,
      acceptsMarketing: shopifyCustomer.accepts_marketing,
      shopifyId: shopifyCustomer.id.toString(),
      shopifyUpdatedAt: new Date(shopifyCustomer.updated_at as string),
      // Merge order counts and spending
      ordersCount: Math.max(
        (localCustomer.ordersCount as number) || 0,
        shopifyCustomer.orders_count
      ),
      totalSpent: Math.max(
        parseFloat((localCustomer.totalSpent as string) || '0'),
        parseFloat(shopifyCustomer.total_spent || '0')
      ),
    }

    logger.info(
      `Deduplicated customer: ${localCustomer.email} (local: ${localCustomer.id}, shopify: ${shopifyCustomer.id})`
    )

    return merged
  }

  private mapShopifyProductToLocal(
    shopifyProduct: ShopifyProduct
  ): Record<string, unknown> {
    return {
      title: shopifyProduct.title,
      description: shopifyProduct.body_html,
      vendor: shopifyProduct.vendor,
      productType: shopifyProduct.product_type,
      status: shopifyProduct.status,
      tags: shopifyProduct.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      shopifyId: shopifyProduct.id.toString(),
      shopifyUpdatedAt: new Date(shopifyProduct.updated_at as string),
      variants: shopifyProduct.variants.map((variant) => ({
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
        inventoryQuantity: variant.inventory_quantity,
      })),
      images: shopifyProduct.images.map((image) => ({
        src: image.src,
        alt: image.alt,
        position: image.position,
        shopifyId: image.id.toString(),
      })),
    }
  }

  private mapShopifyCustomerToLocal(
    shopifyCustomer: ShopifyCustomer
  ): Record<string, unknown> {
    return {
      firstName: shopifyCustomer.first_name,
      lastName: shopifyCustomer.last_name,
      email: shopifyCustomer.email,
      phone: shopifyCustomer.phone,
      acceptsMarketing: shopifyCustomer.accepts_marketing,
      ordersCount: shopifyCustomer.orders_count,
      totalSpent: parseFloat(shopifyCustomer.total_spent || '0'),
      tags: shopifyCustomer.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      shopifyId: shopifyCustomer.id.toString(),
      shopifyUpdatedAt: new Date(shopifyCustomer.updated_at as string),
      addresses:
        shopifyCustomer.addresses?.map((address) => ({
          firstName: address.first_name,
          lastName: address.last_name,
          company: address.company,
          address1: address.address1,
          address2: address.address2,
          city: address.city,
          province: address.province,
          country: address.country,
          zip: address.zip,
          phone: address.phone,
          isDefault: address.default,
          shopifyId: address.id.toString(),
        })) || [],
    }
  }
}
