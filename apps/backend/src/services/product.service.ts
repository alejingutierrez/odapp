import { EventEmitter } from 'events'

import {
  CreateProduct,
  UpdateProduct,
  ProductQuery,
  BulkProductUpdate,
  BulkProductDelete,
} from '@oda/shared'
import {
  PrismaClient,
  Product,
  ProductVariant,
  ProductImage,
  Category,
  Collection,
  ProductStatus,
  Prisma,
} from '@prisma/client'

import { CacheManager } from '../lib/cache/cache-manager.js'
import { NotFoundError, BusinessLogicError } from '../lib/errors.js'
import { logger } from '../lib/logger.js'

import { AnalyticsService } from './analytics.service.js'
import { AuditService } from './audit.service.js'
import { ImageService } from './image.service.js'
import { SearchService } from './search.service.js'

export interface ProductWithRelations extends Product {
  variants: ProductVariant[]
  images: ProductImage[]
  category?: Category | null
  collections?: { collection: Collection }[]
  _count?: {
    variants: number
    images: number
    collections: number
  }
}

export interface ProductSearchResult {
  products: ProductWithRelations[]
  total: number
  facets?: {
    categories: { id: string; name: string; count: number }[]
    brands: { name: string; count: number }[]
    priceRanges: { min: number; max: number; count: number }[]
    status: { status: string; count: number }[]
  }
}

export interface ProductAnalytics {
  totalProducts: number
  activeProducts: number
  draftProducts: number
  archivedProducts: number
  totalVariants: number
  averagePrice: number
  topCategories: { categoryId: string; categoryName: string; count: number }[]
  topBrands: { brand: string; count: number }[]
  recentlyCreated: number
  recentlyUpdated: number
}

export class ProductService extends EventEmitter {
  constructor(
    private _prisma: PrismaClient,
    private _cache: CacheManager,
    private _searchService: SearchService,
    private _imageService: ImageService,
    private _analyticsService: AnalyticsService,
    private _auditService: AuditService
  ) {
    super()
  }

  // ============================================================================
  // PRODUCT CRUD OPERATIONS
  // ============================================================================

  async createProduct(
    data: CreateProduct,
    userId?: string
  ): Promise<ProductWithRelations> {
    logger.info('Creating product', { name: data.name, userId })

    try {
      // Validate business rules
      await this.validateProductData(data)

      // Check for duplicate SKUs
      if (data.variants?.length) {
        await this.validateVariantSkus(data.variants)
      }

      // Generate unique slug if needed
      const slug = await this.generateUniqueSlug(data.slug || data.name)

      const product = await this._prisma.$transaction(async (tx) => {
        // Create product
        const newProduct = await tx.product.create({
          data: {
            name: data.name,
            slug,
            description: data.description,
            shortDescription: data.shortDescription,
            status: (data.status?.toUpperCase() as ProductStatus) || 'DRAFT',
            brand: data.vendor,
            material: data.productType,
            price: data.variants?.[0]?.price || 0,
            compareAtPrice: data.variants?.[0]?.compareAtPrice,
            costPrice: data.variants?.[0]?.cost,
            metaTitle: data.seo?.title,
            metaDescription: data.seo?.description,
            categoryId: data.categoryId,
            variants: {
              create:
                data.variants?.map((variant) => ({
                  name:
                    variant.size && variant.color
                      ? `${variant.size} / ${variant.color}`
                      : undefined,
                  sku: variant.sku,
                  option1Name: 'Size',
                  option1Value: variant.size,
                  option2Name: 'Color',
                  option2Value: variant.color,
                  option3Name: variant.material ? 'Material' : undefined,
                  option3Value: variant.material,
                  price: variant.price,
                  compareAtPrice: variant.compareAtPrice,
                  costPrice: variant.cost,
                  weight: variant.weight,
                  dimensions: variant.dimensions
                    ? JSON.stringify(variant.dimensions)
                    : undefined,
                  barcode: variant.barcode,
                })) || [],
            },
            images: {
              create:
                data.images?.map((image, index) => ({
                  url: image.url,
                  altText: image.altText,
                  sortOrder: image.position || index,
                  width: image.width,
                  height: image.height,
                })) || [],
            },
            attributes: {
              create: Object.entries(data.metafields || {}).map(
                ([name, value]) => ({
                  name,
                  value: String(value),
                })
              ),
            },
          },
          include: {
            variants: true,
            images: {
              orderBy: { sortOrder: 'asc' },
            },
            category: true,
            collections: {
              include: { collection: true },
            },
            _count: {
              select: {
                variants: true,
                images: true,
                collections: true,
              },
            },
          },
        })

        // Create collection associations
        if (data.collectionIds?.length) {
          await tx.collectionProduct.createMany({
            data: data.collectionIds.map((collectionId, index) => ({
              collectionId,
              productId: newProduct.id,
              sortOrder: index,
            })),
          })
        }

        // Create initial inventory records
        if (newProduct.variants.length) {
          const defaultLocation = await tx.location.findFirst({
            where: { isDefault: true },
          })

          if (defaultLocation) {
            await tx.inventoryItem.createMany({
              data: newProduct.variants.map((variant) => ({
                productId: newProduct.id,
                variantId: variant.id,
                locationId: defaultLocation.id,
                quantity: 0,
                availableQuantity: 0,
                lowStockThreshold: 5,
              })),
            })
          }
        }

        return newProduct
      })

      // Index in search engine
      await this._searchService.indexProduct(product)

      // Clear related caches
      await this.invalidateProductCaches()

      // Emit event
      this.emit('product.created', { product, userId })

      // Audit log
      await this._auditService.log({
        action: 'CREATE',
        entity: 'Product',
        entityId: product.id,
        newValues: product,
        userId,
      })

      logger.info('Product created successfully', {
        productId: product.id,
        name: product.name,
        userId,
      })

      return product
    } catch (error) {
      logger.error('Failed to create product', { error, data, userId })
      throw error
    }
  }

  async getProduct(
    id: string,
    includeInactive = false
  ): Promise<ProductWithRelations | null> {
    const cacheKey = `product:${id}:${includeInactive}`

    // Try cache first
    const cached = await this._cache.get<ProductWithRelations>(cacheKey)
    if (cached) {
      return cached
    }

    const product = await this._prisma.product.findFirst({
      where: {
        id,
        ...(includeInactive ? {} : { isActive: true, deletedAt: null }),
      },
      include: {
        variants: {
          where: { isActive: true },
          orderBy: { createdAt: 'asc' },
        },
        images: {
          orderBy: { sortOrder: 'asc' },
        },
        category: true,
        collections: {
          include: { collection: true },
        },
        attributes: true,
        _count: {
          select: {
            variants: true,
            images: true,
            collections: true,
          },
        },
      },
    })

    if (product) {
      // Cache for 5 minutes
      await this._cache.set(cacheKey, product, { ttl: 300 })
    }

    return product
  }

  async updateProduct(
    id: string,
    data: Partial<UpdateProduct>,
    userId?: string
  ): Promise<ProductWithRelations> {
    logger.info('Updating product', { productId: id, userId })

    try {
      // Get existing product
      const existingProduct = await this.getProduct(id, true)
      if (!existingProduct) {
        throw new NotFoundError('Product')
      }

      // Validate business rules
      if (data.variants) {
        await this.validateVariantSkus(data.variants, id)
      }

      // Generate unique slug if name changed
      let slug = data.slug
      if (data.name && data.name !== existingProduct.name) {
        slug = await this.generateUniqueSlug(data.name, id)
      }

      const updatedProduct = await this._prisma.$transaction(async (tx) => {
        // Update product
        const product = await tx.product.update({
          where: { id },
          data: {
            ...(data.name && { name: data.name }),
            ...(slug && { slug }),
            ...(data.description !== undefined && {
              description: data.description,
            }),
            ...(data.shortDescription !== undefined && {
              shortDescription: data.shortDescription,
            }),
            ...(data.status && {
              status: data.status.toUpperCase() as ProductStatus,
            }),
            ...(data.vendor !== undefined && { brand: data.vendor }),
            ...(data.productType !== undefined && {
              material: data.productType,
            }),
            ...(data.categoryId !== undefined && {
              categoryId: data.categoryId,
            }),
            ...(data.seo?.title !== undefined && { metaTitle: data.seo.title }),
            ...(data.seo?.description !== undefined && {
              metaDescription: data.seo.description,
            }),
            updatedAt: new Date(),
          },
          include: {
            variants: true,
            images: {
              orderBy: { sortOrder: 'asc' },
            },
            category: true,
            collections: {
              include: { collection: true },
            },
            _count: {
              select: {
                variants: true,
                images: true,
                collections: true,
              },
            },
          },
        })

        // Update variants if provided
        if (data.variants) {
          // Delete existing variants not in the update
          const variantIds = data.variants
            .filter((v) => v.id)
            .map((v) => v.id as string)
          if (variantIds.length > 0) {
            await tx.productVariant.deleteMany({
              where: {
                productId: id,
                id: { notIn: variantIds },
              },
            })
          }

          // Upsert variants
          for (const variant of data.variants) {
            if (variant.id) {
              // Update existing variant
              await tx.productVariant.update({
                where: { id: variant.id },
                data: {
                  name:
                    variant.size && variant.color
                      ? `${variant.size} / ${variant.color}`
                      : undefined,
                  sku: variant.sku,
                  option1Value: variant.size,
                  option2Value: variant.color,
                  option3Value: variant.material,
                  price: variant.price,
                  compareAtPrice: variant.compareAtPrice,
                  costPrice: variant.cost,
                  weight: variant.weight,
                  dimensions: variant.dimensions
                    ? JSON.stringify(variant.dimensions)
                    : undefined,
                  barcode: variant.barcode,
                },
              })
            } else {
              // Create new variant
              await tx.productVariant.create({
                data: {
                  productId: id,
                  name:
                    variant.size && variant.color
                      ? `${variant.size} / ${variant.color}`
                      : undefined,
                  sku: variant.sku,
                  option1Name: 'Size',
                  option1Value: variant.size,
                  option2Name: 'Color',
                  option2Value: variant.color,
                  option3Name: variant.material ? 'Material' : undefined,
                  option3Value: variant.material,
                  price: variant.price,
                  compareAtPrice: variant.compareAtPrice,
                  costPrice: variant.cost,
                  weight: variant.weight,
                  dimensions: variant.dimensions
                    ? JSON.stringify(variant.dimensions)
                    : undefined,
                  barcode: variant.barcode,
                },
              })
            }
          }
        }

        // Update collection associations if provided
        if (data.collectionIds !== undefined) {
          await tx.collectionProduct.deleteMany({
            where: { productId: id },
          })

          if (data.collectionIds.length > 0) {
            await tx.collectionProduct.createMany({
              data: data.collectionIds.map((collectionId, index) => ({
                collectionId,
                productId: id,
                sortOrder: index,
              })),
            })
          }
        }

        return product
      })

      // Update search index
      await this._searchService.indexProduct(updatedProduct)

      // Clear caches
      await this.invalidateProductCaches(id)

      // Emit event
      this.emit('product.updated', {
        product: updatedProduct,
        previousProduct: existingProduct,
        userId,
      })

      // Audit log
      await this._auditService.log({
        action: 'UPDATE',
        entity: 'Product',
        entityId: id,
        oldValues: existingProduct as unknown as Record<string, unknown>,
        newValues: updatedProduct as unknown as Record<string, unknown>,
        userId,
      })

      logger.info('Product updated successfully', { productId: id, userId })

      return updatedProduct
    } catch (error) {
      logger.error('Failed to update product', { error, productId: id, userId })
      throw error
    }
  }

  async deleteProduct(id: string, userId?: string): Promise<void> {
    logger.info('Deleting product', { productId: id, userId })

    try {
      const product = await this.getProduct(id, true)
      if (!product) {
        throw new NotFoundError('Product')
      }

      // Check if product has orders
      const orderCount = await this._prisma.orderItem.count({
        where: {
          OR: [{ productId: id }, { variant: { productId: id } }],
        },
      })

      if (orderCount > 0) {
        throw new BusinessLogicError(
          'Cannot delete product with existing orders. Archive it instead.'
        )
      }

      await this._prisma.$transaction(async (tx) => {
        // Soft delete product
        await tx.product.update({
          where: { id },
          data: {
            deletedAt: new Date(),
            isActive: false,
          },
        })

        // Soft delete variants
        await tx.productVariant.updateMany({
          where: { productId: id },
          data: { isActive: false },
        })
      })

      // Remove from search index
      await this._searchService.removeProduct(id)

      // Clear caches
      await this.invalidateProductCaches(id)

      // Emit event
      this.emit('product.deleted', { product, userId })

      // Audit log
      await this._auditService.log({
        action: 'DELETE',
        entity: 'Product',
        entityId: id,
        oldValues: product as unknown as Record<string, unknown>,
        userId,
      })

      logger.info('Product deleted successfully', { productId: id, userId })
    } catch (error) {
      logger.error('Failed to delete product', { error, productId: id, userId })
      throw error
    }
  }

  // ============================================================================
  // PRODUCT SEARCH AND FILTERING
  // ============================================================================

  async searchProducts(query: ProductQuery): Promise<ProductSearchResult> {
    const cacheKey = `products:search:${JSON.stringify(query)}`

    // Try cache first for non-real-time queries
    if (!query.inStock) {
      const cached = await this._cache.get<ProductSearchResult>(cacheKey)
      if (cached) {
        return cached
      }
    }

    try {
      // Use Elasticsearch for advanced search if available
      if (
        this._searchService.isAvailable() &&
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ((query as any).search || query.tags?.length)
      ) {
        return await this._searchService.searchProducts(query)
      }

      // Fallback to database search
      return await this.searchProductsInDatabase(query)
    } catch (error) {
      logger.error('Product search failed', { error, query })
      // Fallback to database search
      return await this.searchProductsInDatabase(query)
    }
  }

  private async searchProductsInDatabase(
    query: ProductQuery
  ): Promise<ProductSearchResult> {
    const {
      q: searchQuery,
      status,
      categoryId,
      collectionId,
      vendor,
      productType,
      priceMin,
      priceMax,
      inStock,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query

    // Build where clause
    const where: Prisma.ProductWhereInput = {
      isActive: true,
      deletedAt: null,
      ...(searchQuery && {
        OR: [
          { name: { contains: searchQuery, mode: 'insensitive' } },
          { description: { contains: searchQuery, mode: 'insensitive' } },
          { brand: { contains: searchQuery, mode: 'insensitive' } },
          {
            variants: {
              some: { sku: { contains: searchQuery, mode: 'insensitive' } },
            },
          },
        ],
      }),
      ...(status && { status: status.toUpperCase() as ProductStatus }),
      ...(categoryId && { categoryId }),
      ...(vendor && { brand: { contains: vendor, mode: 'insensitive' } }),
      ...(productType && {
        material: { contains: productType, mode: 'insensitive' },
      }),
      ...(priceMin !== undefined && { price: { gte: priceMin } }),
      ...(priceMax !== undefined && { price: { lte: priceMax } }),
      ...(collectionId && {
        collections: { some: { collectionId } },
      }),
      ...(inStock && {
        variants: {
          some: {
            inventory: {
              some: {
                availableQuantity: { gt: 0 },
              },
            },
          },
        },
      }),
    }

    // Build order by
    const orderBy: Prisma.ProductOrderByWithRelationInput = {}
    if (sortBy === 'name') orderBy.name = sortOrder
    else if (sortBy === 'price') orderBy.price = sortOrder
    else if (sortBy === 'createdAt') orderBy.createdAt = sortOrder
    else if (sortBy === 'updatedAt') orderBy.updatedAt = sortOrder

    const [products, total] = await Promise.all([
      this._prisma.product.findMany({
        where,
        include: {
          variants: {
            where: { isActive: true },
            orderBy: { createdAt: 'asc' },
          },
          images: {
            orderBy: { sortOrder: 'asc' },
          },
          category: true,
          collections: {
            include: { collection: true },
          },
          _count: {
            select: {
              variants: true,
              images: true,
              collections: true,
            },
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this._prisma.product.count({ where }),
    ])

    const result = { products, total }

    // Cache results for 2 minutes
    const cacheKey = `products:search:${JSON.stringify(query)}`
    await this._cache.set(cacheKey, result, { ttl: 120 })

    return result
  }

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  async bulkUpdateProducts(
    data: BulkProductUpdate,
    userId?: string
  ): Promise<{ updatedCount: number }> {
    logger.info('Bulk updating products', {
      productCount: data.productIds.length,
      updates: data.updates,
      userId,
    })

    try {
      // Validate all products exist
      const existingProducts = await this._prisma.product.findMany({
        where: {
          id: { in: data.productIds },
          deletedAt: null,
        },
        select: { id: true, name: true },
      })

      if (existingProducts.length !== data.productIds.length) {
        const foundIds = existingProducts.map((p) => p.id)
        const missingIds = data.productIds.filter(
          (id) => !foundIds.includes(id)
        )
        throw new NotFoundError(`Products: ${missingIds.join(', ')}`)
      }

      const updatedCount = await this._prisma.product.updateMany({
        where: {
          id: { in: data.productIds },
        },
        data: {
          ...(data.updates.status && {
            status: data.updates.status.toUpperCase() as ProductStatus,
          }),
          ...(data.updates.categoryId !== undefined && {
            categoryId: data.updates.categoryId,
          }),
          ...(data.updates.vendor !== undefined && {
            brand: data.updates.vendor,
          }),
          ...(data.updates.productType !== undefined && {
            material: data.updates.productType,
          }),
          updatedAt: new Date(),
        },
      })

      // Update collection associations if provided
      if (data.updates.tags) {
        // This would require a more complex implementation
        // For now, we'll skip tag updates in bulk operations
      }

      // Clear caches
      await this.invalidateProductCaches()

      // Emit event
      this.emit('products.bulk.updated', {
        productIds: data.productIds,
        updates: data.updates,
        updatedCount: updatedCount.count,
        userId,
      })

      // Audit log
      await this._auditService.log({
        action: 'BULK_UPDATE',
        entity: 'Product',
        entityId: data.productIds.join(','),
        newValues: data.updates,
        userId,
      })

      logger.info('Bulk update completed', {
        updatedCount: updatedCount.count,
        userId,
      })

      return { updatedCount: updatedCount.count }
    } catch (error) {
      logger.error('Bulk update failed', { error, data, userId })
      throw error
    }
  }

  async bulkDeleteProducts(
    data: BulkProductDelete,
    userId?: string
  ): Promise<{ deletedCount: number }> {
    logger.info('Bulk deleting products', {
      productCount: data.productIds.length,
      userId,
    })

    try {
      // Check if any products have orders
      const productsWithOrders = await this._prisma.orderItem.findMany({
        where: {
          OR: [
            { productId: { in: data.productIds } },
            { variant: { productId: { in: data.productIds } } },
          ],
        },
        select: { productId: true, product: { select: { name: true } } },
        distinct: ['productId'],
      })

      if (productsWithOrders.length > 0) {
        const productNames = productsWithOrders
          .map((item) => item.product?.name)
          .filter(Boolean)
          .join(', ')
        throw new BusinessLogicError(
          `Cannot delete products with existing orders: ${productNames}. Archive them instead.`
        )
      }

      const deletedCount = await this._prisma.product.updateMany({
        where: {
          id: { in: data.productIds },
          deletedAt: null,
        },
        data: {
          deletedAt: new Date(),
          isActive: false,
        },
      })

      // Soft delete variants
      await this._prisma.productVariant.updateMany({
        where: { productId: { in: data.productIds } },
        data: { isActive: false },
      })

      // Remove from search index
      await Promise.all(
        data.productIds.map((id) => this._searchService.removeProduct(id))
      )

      // Clear caches
      await this.invalidateProductCaches()

      // Emit event
      this.emit('products.bulk.deleted', {
        productIds: data.productIds,
        deletedCount: deletedCount.count,
        userId,
      })

      // Audit log
      await this._auditService.log({
        action: 'BULK_DELETE',
        entity: 'Product',
        entityId: data.productIds.join(','),
        userId,
      })

      logger.info('Bulk delete completed', {
        deletedCount: deletedCount.count,
        userId,
      })

      return { deletedCount: deletedCount.count }
    } catch (error) {
      logger.error('Bulk delete failed', { error, data, userId })
      throw error
    }
  }

  // ============================================================================
  // ANALYTICS AND REPORTING
  // ============================================================================

  async getProductAnalytics(): Promise<ProductAnalytics> {
    const cacheKey = 'products:analytics'

    // Try cache first
    const cached = await this._cache.get<ProductAnalytics>(cacheKey)
    if (cached) {
      return cached
    }

    const [
      totalProducts,
      statusCounts,
      totalVariants,
      avgPrice,
      topCategories,
      topBrands,
      recentCounts,
    ] = await Promise.all([
      // Total products
      this._prisma.product.count({
        where: { deletedAt: null },
      }),

      // Status counts
      this._prisma.product.groupBy({
        by: ['status'],
        where: { deletedAt: null },
        _count: { id: true },
      }),

      // Total variants
      this._prisma.productVariant.count({
        where: {
          isActive: true,
          product: { deletedAt: null },
        },
      }),

      // Average price
      this._prisma.product.aggregate({
        where: {
          deletedAt: null,
          isActive: true,
        },
        _avg: { price: true },
      }),

      // Top categories
      this._prisma.product.groupBy({
        by: ['categoryId'],
        where: {
          deletedAt: null,
          categoryId: { not: null },
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),

      // Top brands
      this._prisma.product.groupBy({
        by: ['brand'],
        where: {
          deletedAt: null,
          brand: { not: null },
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),

      // Recent counts
      Promise.all([
        this._prisma.product.count({
          where: {
            deletedAt: null,
            createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          },
        }),
        this._prisma.product.count({
          where: {
            deletedAt: null,
            updatedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          },
        }),
      ]),
    ])

    // Get category names for top categories
    const categoryIds = topCategories
      .filter((cat) => cat.categoryId)
      .map((cat) => cat.categoryId as string)

    const categories =
      categoryIds.length > 0
        ? await this._prisma.category.findMany({
            where: { id: { in: categoryIds } },
            select: { id: true, name: true },
          })
        : []

    const analytics: ProductAnalytics = {
      totalProducts,
      activeProducts:
        statusCounts.find((s) => s.status === 'ACTIVE')?._count.id || 0,
      draftProducts:
        statusCounts.find((s) => s.status === 'DRAFT')?._count.id || 0,
      archivedProducts:
        statusCounts.find((s) => s.status === 'ARCHIVED')?._count.id || 0,
      totalVariants,
      averagePrice: Number(avgPrice._avg.price) || 0,
      topCategories: topCategories.map((cat) => ({
        categoryId: cat.categoryId as string,
        categoryName:
          categories.find((c) => c.id === cat.categoryId)?.name || 'Unknown',
        count: cat._count.id,
      })),
      topBrands: topBrands.map((brand) => ({
        brand: brand.brand as string,
        count: brand._count.id,
      })),
      recentlyCreated: recentCounts[0],
      recentlyUpdated: recentCounts[1],
    }

    // Cache for 10 minutes
    await this._cache.set(cacheKey, analytics, { ttl: 600 })

    return analytics
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private async validateProductData(data: CreateProduct): Promise<void> {
    // Validate required fields
    if (!data.name?.trim()) {
      throw new Error('Product name is required')
    }

    if (!data.variants?.length) {
      throw new Error('At least one variant is required')
    }

    // Validate category exists
    if (data.categoryId) {
      const category = await this._prisma.category.findFirst({
        where: { id: data.categoryId, isActive: true },
      })
      if (!category) {
        throw new Error('Category not found')
      }
    }

    // Validate collections exist
    if (data.collectionIds?.length) {
      const collections = await this._prisma.collection.findMany({
        where: {
          id: { in: data.collectionIds },
          isActive: true,
        },
      })
      if (collections.length !== data.collectionIds.length) {
        throw new Error('One or more collections not found')
      }
    }
  }

  private async validateVariantSkus(
    variants: Record<string, unknown>[],
    excludeProductId?: string
  ): Promise<void> {
    const skus = variants.map((v) => v.sku as string).filter(Boolean)
    if (skus.length === 0) return

    // Check for duplicates within the variants
    const duplicates = skus.filter((sku, index) => skus.indexOf(sku) !== index)
    if (duplicates.length > 0) {
      throw new Error(`Duplicate SKUs found: ${duplicates.join(', ')}`)
    }

    // Check for existing SKUs in database
    const existingVariants = await this._prisma.productVariant.findMany({
      where: {
        sku: { in: skus },
        isActive: true,
        ...(excludeProductId && {
          product: { id: { not: excludeProductId } },
        }),
      },
      select: { sku: true },
    })

    if (existingVariants.length > 0) {
      const existingSkus = existingVariants.map((v) => v.sku)
      throw new Error(`SKUs already exist: ${existingSkus.join(', ')}`)
    }
  }

  private async generateUniqueSlug(
    name: string,
    excludeId?: string
  ): Promise<string> {
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    let slug = baseSlug
    let counter = 1

    while (counter < 1000) {
      // Prevent infinite loop
      const existing = await this._prisma.product.findFirst({
        where: {
          slug,
          deletedAt: null,
          ...(excludeId && { id: { not: excludeId } }),
        },
      })

      if (!existing) break

      slug = `${baseSlug}-${counter}`
      counter++
    }

    return slug
  }

  private async invalidateProductCaches(productId?: string): Promise<void> {
    const patterns = [
      'products:*',
      'product:*',
      'categories:*',
      'collections:*',
    ]

    if (productId) {
      patterns.push(`product:${productId}:*`)
    }

    // Note: deletePattern is not available in current CacheManager
    // Using individual delete operations instead
    await Promise.all(patterns.map((pattern) => this._cache.del(pattern)))
  }
}
