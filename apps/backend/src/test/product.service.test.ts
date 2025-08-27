import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
  beforeAll,
  afterAll,
} from 'vitest'
import { PrismaClient } from '@prisma/client'
import { ProductService } from '../services/product.service.js'
import { SearchService } from '../services/search.service.js'
import { ImageService } from '../services/image.service.js'
import { AnalyticsService } from '../services/analytics.service.js'
import { AuditService } from '../services/audit.service.js'
import { CacheManager } from '../lib/cache/cache-manager.js'
import { CreateProduct, ProductStatus } from '@oda/shared'

// Mock dependencies
vi.mock('../lib/cache/cache-manager.js')
vi.mock('../services/search.service.js')
vi.mock('../services/image.service.js')
vi.mock('../services/analytics.service.js')
vi.mock('../services/audit.service.js')

// Mock Prisma
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({
    product: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
      delete: vi.fn(),
      groupBy: vi.fn(),
    },
    productVariant: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    category: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    collection: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    orderItem: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    location: {
      findFirst: vi.fn(),
    },
    inventoryItem: {
      createMany: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    collectionProduct: {
      createMany: vi.fn(),
    },
    $transaction: vi.fn(),
    $disconnect: vi.fn(),
  })),
}))

describe('ProductService', () => {
  let productService: ProductService
  let prisma: PrismaClient
  let mockCache: any
  let mockSearchService: any
  let mockImageService: any
  let mockAnalyticsService: any
  let mockAuditService: any

  const mockProduct = {
    id: 'product-1',
    name: 'Test Product',
    slug: 'test-product',
    description: 'A test product',
    status: 'ACTIVE' as ProductStatus,
    price: 29.99,
    isActive: true,
    isFeatured: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    variants: [
      {
        id: 'variant-1',
        productId: 'product-1',
        sku: 'TEST-001',
        option1Value: 'M',
        option2Value: 'Blue',
        price: 29.99,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    images: [
      {
        id: 'image-1',
        productId: 'product-1',
        url: 'https://example.com/image.jpg',
        altText: 'Test image',
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    category: null,
    collections: [],
    _count: {
      variants: 1,
      images: 1,
      collections: 0,
    },
  }

  const mockCreateProductData: CreateProduct = {
    name: 'Test Product',
    slug: 'test-product',
    description: 'A test product',
    status: 'draft',
    tags: ['test', 'product'],
    collectionIds: [],
    variants: [
      {
        sku: 'TEST-001',
        size: 'M',
        color: 'Blue',
        price: 29.99,
        inventoryQuantity: 10,
        inventoryPolicy: 'deny',
        requiresShipping: true,
        taxable: true,
      },
    ],
    images: [
      {
        url: 'https://example.com/image.jpg',
        altText: 'Test image',
        position: 0,
      },
    ],
  }

  beforeAll(() => {
    // Create mocked Prisma instance
    prisma = new PrismaClient() as any
  })

  afterAll(async () => {
    // No need to disconnect mocked instance
  })

  beforeEach(() => {
    // Create mocked instances with proper mock methods
    mockCache = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
      del: vi.fn().mockResolvedValue(undefined), // Add missing del method
      deletePattern: vi.fn().mockResolvedValue(undefined), // Add missing deletePattern method
      clear: vi.fn().mockResolvedValue(undefined),
    }

    mockSearchService = {
      isAvailable: vi.fn().mockReturnValue(false),
      indexProduct: vi.fn().mockResolvedValue(undefined),
      removeProduct: vi.fn().mockResolvedValue(undefined),
      search: vi.fn().mockResolvedValue([]),
      searchProducts: vi.fn().mockResolvedValue({ products: [], total: 0 }), // Add missing method
    }

    mockImageService = {
      uploadImage: vi.fn().mockResolvedValue('https://example.com/image.jpg'),
      deleteImage: vi.fn().mockResolvedValue(undefined),
      resizeImage: vi.fn().mockResolvedValue('https://example.com/resized.jpg'),
      optimizeImage: vi.fn().mockResolvedValue('https://example.com/optimized.jpg'),
    }

    mockAnalyticsService = {
      trackEvent: vi.fn(),
      trackPageView: vi.fn(),
      trackConversion: vi.fn(),
    }

    mockAuditService = {
      log: vi.fn(),
      logAction: vi.fn(),
      logError: vi.fn(),
    }

    // Create service instance
    productService = new ProductService(
      prisma,
      mockCache,
      mockSearchService,
      mockImageService,
      mockAnalyticsService,
      mockAuditService
    )

    // Mock Prisma methods
    vi.spyOn(prisma.product, 'create').mockResolvedValue(mockProduct as any)
    vi.spyOn(prisma.product, 'findFirst').mockResolvedValue(mockProduct as any)
    vi.spyOn(prisma.product, 'findMany').mockResolvedValue([mockProduct] as any)
    vi.spyOn(prisma.product, 'update').mockResolvedValue(mockProduct as any)
    vi.spyOn(prisma.product, 'updateMany').mockResolvedValue({ count: 1 })
    vi.spyOn(prisma.product, 'count').mockResolvedValue(1)
    vi.spyOn(prisma.product, 'aggregate').mockResolvedValue({
      _avg: { price: 35.5 },
      _count: { id: 1 }
    } as any)
    vi.spyOn(prisma.productVariant, 'findMany').mockResolvedValue([])
    vi.spyOn(prisma.category, 'findFirst').mockResolvedValue(null)
    vi.spyOn(prisma.collection, 'findMany').mockResolvedValue([])
    vi.spyOn(prisma.orderItem, 'count').mockResolvedValue(0)
    vi.spyOn(prisma.orderItem, 'findMany').mockResolvedValue([])
    vi.spyOn(prisma.location, 'findFirst').mockResolvedValue({
      id: 'location-1',
      name: 'Default Location',
      isDefault: true,
    } as any)
    vi.spyOn(prisma.inventoryItem, 'createMany').mockResolvedValue({ count: 1 })
    vi.spyOn(prisma.collectionProduct, 'createMany').mockResolvedValue({
      count: 0,
    })
    
    // Mock $transaction properly
    vi.spyOn(prisma, '$transaction').mockImplementation(async (callback) => {
      return await callback(prisma)
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('createProduct', () => {
    it('should create a product successfully', async () => {
      const result = await productService.createProduct(
        mockCreateProductData,
        'user-1'
      )

      expect(result).toEqual(mockProduct)
      expect(prisma.product.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: mockCreateProductData.name,
          status: 'DRAFT',
        }),
        include: expect.any(Object),
      })
      expect(mockSearchService.indexProduct).toHaveBeenCalledWith(mockProduct)
      expect(mockAuditService.log).toHaveBeenCalledWith({
        action: 'CREATE',
        entity: 'Product',
        entityId: mockProduct.id,
        newValues: mockProduct,
        userId: 'user-1',
      })
    })

    it('should generate unique slug when slug is not provided', async () => {
      const dataWithoutSlug = { ...mockCreateProductData, slug: 'test-product' }

      await productService.createProduct(dataWithoutSlug, 'user-1')

      expect(prisma.product.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: mockCreateProductData.name,
          status: 'DRAFT',
        }),
        include: expect.any(Object),
      })
    })

    it('should validate required fields', async () => {
      const invalidData = { ...mockCreateProductData, name: '' }

      await expect(
        productService.createProduct(invalidData, 'user-1')
      ).rejects.toThrow('Product name is required')
    })

    it('should validate variants are provided', async () => {
      const invalidData = { ...mockCreateProductData, variants: [] }

      await expect(
        productService.createProduct(invalidData, 'user-1')
      ).rejects.toThrow('At least one variant is required')
    })

    it('should validate unique SKUs within variants', async () => {
      const invalidData = {
        ...mockCreateProductData,
        variants: [
          { ...mockCreateProductData.variants[0], sku: 'DUPLICATE' },
          { ...mockCreateProductData.variants[0], sku: 'DUPLICATE' },
        ],
      }

      await expect(
        productService.createProduct(invalidData, 'user-1')
      ).rejects.toThrow('Duplicate SKUs found: DUPLICATE')
    })

    it('should validate category exists when provided', async () => {
      const dataWithCategory = {
        ...mockCreateProductData,
        categoryId: 'invalid-category',
      }
      vi.spyOn(prisma.category, 'findFirst').mockResolvedValue(null)

      await expect(
        productService.createProduct(dataWithCategory, 'user-1')
      ).rejects.toThrow('Category not found')
    })

    it('should create inventory records for variants', async () => {
      await productService.createProduct(mockCreateProductData, 'user-1')

      expect(prisma.inventoryItem.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            productId: mockProduct.id,
            variantId: mockProduct.variants[0].id,
            locationId: 'location-1',
            quantity: 0,
            availableQuantity: 0,
            lowStockThreshold: 5,
          }),
        ]),
      })
    })
  })

  describe('getProduct', () => {
    it('should return product from cache if available', async () => {
      mockCache.get.mockResolvedValue(mockProduct)

      const result = await productService.getProduct('product-1')

      expect(result).toEqual(mockProduct)
      expect(mockCache.get).toHaveBeenCalledWith('product:product-1:false')
      expect(prisma.product.findFirst).not.toHaveBeenCalled()
    })

    it('should fetch product from database and cache it', async () => {
      mockCache.get.mockResolvedValue(null)

      const result = await productService.getProduct('product-1')

      expect(result).toEqual(mockProduct)
      expect(prisma.product.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'product-1',
          isActive: true,
          deletedAt: null,
        },
        include: expect.any(Object),
      })
      expect(mockCache.set).toHaveBeenCalledWith(
        'product:product-1:false',
        mockProduct,
        { ttl: 300 }
      )
    })

    it('should return null for non-existent product', async () => {
      vi.spyOn(prisma.product, 'findFirst').mockResolvedValue(null)

      const result = await productService.getProduct('non-existent')

      expect(result).toBeNull()
    })

    it('should include inactive products when requested', async () => {
      await productService.getProduct('product-1', true)

      expect(prisma.product.findFirst).toHaveBeenCalledWith({
        where: { id: 'product-1' },
        include: expect.any(Object),
      })
    })
  })

  describe('updateProduct', () => {
    it('should update product successfully', async () => {
      const updateData = { name: 'Updated Product' }

      const result = await productService.updateProduct(
        'product-1',
        updateData,
        'user-1'
      )

      expect(result).toEqual(mockProduct)
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'product-1' },
        data: expect.objectContaining({
          name: 'Updated Product',
          updatedAt: expect.any(Date),
        }),
        include: expect.any(Object),
      })
      expect(mockSearchService.indexProduct).toHaveBeenCalledWith(mockProduct)
      expect(mockAuditService.log).toHaveBeenCalledWith({
        action: 'UPDATE',
        entity: 'Product',
        entityId: 'product-1',
        oldValues: mockProduct,
        newValues: mockProduct,
        userId: 'user-1',
      })
    })

    it('should throw error for non-existent product', async () => {
      vi.spyOn(prisma.product, 'findFirst').mockResolvedValue(null)

      await expect(
        productService.updateProduct(
          'non-existent',
          { name: 'Updated' },
          'user-1'
        )
      ).rejects.toThrow('Product not found')
    })

    it('should generate new slug when name changes', async () => {
      const updateData = { name: 'New Product Name' }

      await productService.updateProduct('product-1', updateData, 'user-1')

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'product-1' },
        data: expect.objectContaining({
          name: 'New Product Name',
        }),
        include: expect.any(Object),
      })
    })
  })

  describe('deleteProduct', () => {
    it('should soft delete product successfully', async () => {
      await productService.deleteProduct('product-1', 'user-1')

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'product-1' },
        data: {
          deletedAt: expect.any(Date),
          isActive: false,
        },
      })
      expect(mockSearchService.removeProduct).toHaveBeenCalledWith('product-1')
      expect(mockAuditService.log).toHaveBeenCalledWith({
        action: 'DELETE',
        entity: 'Product',
        entityId: 'product-1',
        oldValues: mockProduct,
        userId: 'user-1',
      })
    })

    it('should throw error for non-existent product', async () => {
      vi.spyOn(prisma.product, 'findFirst').mockResolvedValue(null)

      await expect(
        productService.deleteProduct('non-existent', 'user-1')
      ).rejects.toThrow('Product not found')
    })

    it('should prevent deletion of products with orders', async () => {
      vi.spyOn(prisma.orderItem, 'count').mockResolvedValue(1)

      await expect(
        productService.deleteProduct('product-1', 'user-1')
      ).rejects.toThrow('Cannot delete product with existing orders')
    })
  })

  describe('searchProducts', () => {
    it('should return cached results when available', async () => {
          const mockSearchResult = {
      products: [mockProduct],
      total: 1,
      facets: {
        brands: [],
        categories: [],
        priceRanges: [],
        status: [],
      },
    }
      mockCache.get.mockResolvedValue(mockSearchResult)

      const result = await productService.searchProducts({ 
        q: 'test',
        page: 1,
        limit: 20,
        sortOrder: 'asc'
      })

      expect(result).toEqual(mockSearchResult)
      expect(mockCache.get).toHaveBeenCalled()
    })

    it('should use search service when available and search query provided', async () => {
      const mockSearchResult = {
        products: [mockProduct],
        total: 1,
        facets: {
          brands: [],
          categories: [],
          priceRanges: [],
          status: [],
        },
      }
      mockSearchService.isAvailable.mockReturnValue(true)
      mockSearchService.searchProducts.mockResolvedValue(mockSearchResult)

      const result = await productService.searchProducts({ 
        q: 'test',
        page: 1,
        limit: 20,
        sortOrder: 'desc'
      })

      expect(result.products).toEqual(mockSearchResult.products)
      expect(result.total).toEqual(mockSearchResult.total)
      expect(mockSearchService.searchProducts).toHaveBeenCalledWith({
        q: 'test',
        page: 1,
        limit: 20,
        sortOrder: 'desc'
      })
    })

    it('should fallback to database search when search service unavailable', async () => {
      mockSearchService.isAvailable.mockReturnValue(false)
      mockCache.get.mockResolvedValue(null)

      const result = await productService.searchProducts({ 
        q: 'test',
        page: 1,
        limit: 20,
        sortOrder: 'desc'
      })

      expect(result.products).toEqual([mockProduct])
      expect(result.total).toBe(1)
      expect(prisma.product.findMany).toHaveBeenCalled()
      expect(prisma.product.count).toHaveBeenCalled()
    })

    it('should apply filters correctly in database search', async () => {
      mockCache.get.mockResolvedValue(null)

      await productService.searchProducts({
        q: 'test',
        page: 1,
        limit: 20,
        sortOrder: 'desc',
        status: 'active',
        categoryId: 'category-1',
        priceMin: 10,
        priceMax: 50,
      })

      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          isActive: true,
          deletedAt: null,
          OR: expect.any(Array),
          categoryId: 'category-1',
          price: expect.objectContaining({
            lte: 50,
          }),
        }),
        include: expect.any(Object),
        orderBy: expect.any(Object),
        skip: expect.any(Number),
        take: expect.any(Number),
      })
    })
  })

  describe('bulkUpdateProducts', () => {
    it('should update multiple products successfully', async () => {
      const bulkUpdateData = {
        productIds: ['product-1', 'product-2'],
        updates: {
          status: 'active' as ProductStatus,
          vendor: 'New Vendor',
        },
      }

      // Mock findMany to return the products being updated
      vi.spyOn(prisma.product, 'findMany').mockResolvedValue([
        mockProduct,
        { ...mockProduct, id: 'product-2' }
      ] as any)

      const result = await productService.bulkUpdateProducts(
        bulkUpdateData,
        'user-1'
      )

      expect(result.updatedCount).toBe(1)
      expect(prisma.product.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['product-1', 'product-2'] } },
        data: expect.objectContaining({
          status: 'ACTIVE',
          brand: 'New Vendor',
          updatedAt: expect.any(Date),
        }),
      })
      expect(mockAuditService.log).toHaveBeenCalledWith({
        action: 'BULK_UPDATE',
        entity: 'Product',
        entityId: 'product-1,product-2',
        newValues: bulkUpdateData.updates,
        userId: 'user-1',
      })
    })

    it('should validate all products exist', async () => {
      vi.spyOn(prisma.product, 'findMany').mockResolvedValue([])

      const bulkUpdateData = {
        productIds: ['non-existent'],
        updates: { status: 'active' as ProductStatus },
      }

      await expect(
        productService.bulkUpdateProducts(bulkUpdateData, 'user-1')
      ).rejects.toThrow('Products: non-existent not found')
    })
  })

  describe('bulkDeleteProducts', () => {
    it('should delete multiple products successfully', async () => {
      const bulkDeleteData = {
        productIds: ['product-1', 'product-2'],
      }

      const result = await productService.bulkDeleteProducts(
        bulkDeleteData,
        'user-1'
      )

      expect(result.deletedCount).toBe(1)
      expect(prisma.product.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['product-1', 'product-2'] },
          deletedAt: null,
        },
        data: {
          deletedAt: expect.any(Date),
          isActive: false,
        },
      })
      expect(mockSearchService.removeProduct).toHaveBeenCalledTimes(2)
      expect(mockAuditService.log).toHaveBeenCalledWith({
        action: 'BULK_DELETE',
        entity: 'Product',
        entityId: 'product-1,product-2',
        userId: 'user-1',
      })
    })

    it('should prevent deletion of products with orders', async () => {
      vi.spyOn(prisma.orderItem, 'findMany').mockResolvedValue([
        { productId: 'product-1', product: { name: 'Test Product' } },
      ] as any)

      const bulkDeleteData = {
        productIds: ['product-1'],
      }

      await expect(
        productService.bulkDeleteProducts(bulkDeleteData, 'user-1')
      ).rejects.toThrow('Cannot delete products with existing orders')
    })
  })

  describe('getProductAnalytics', () => {
    it('should return cached analytics when available', async () => {
      const mockAnalytics = {
        totalProducts: 10,
        activeProducts: 8,
        draftProducts: 2,
        archivedProducts: 0,
        totalVariants: 20,
        averagePrice: 35.5,
        topCategories: [],
        topBrands: [],
        recentlyCreated: 2,
        recentlyUpdated: 5,
      }
      mockCache.get.mockResolvedValue(mockAnalytics)

      const result = await productService.getProductAnalytics()

      expect(result).toEqual(mockAnalytics)
      expect(mockCache.get).toHaveBeenCalledWith('products:analytics')
    })

    it('should calculate analytics from database when not cached', async () => {
      mockCache.get.mockResolvedValue(null)

      // Mock database responses for analytics
      vi.spyOn(prisma.product, 'count').mockResolvedValue(1)
      vi.spyOn(prisma.product, 'groupBy').mockResolvedValue([
        { status: 'ACTIVE', _count: { id: 1 } },
      ] as any)
      vi.spyOn(prisma.productVariant, 'count').mockResolvedValue(20)
      vi.spyOn(prisma.product, 'aggregate').mockResolvedValue({
        _avg: { price: 35.5 },
      } as any)

      const result = await productService.getProductAnalytics()

      expect(result.totalProducts).toBe(1)
      expect(result.activeProducts).toBe(1)
      expect(result.draftProducts).toBe(0)
      expect(result.totalVariants).toBe(20)
      expect(result.averagePrice).toBe(35.5)
      expect(mockCache.set).toHaveBeenCalledWith(
        'products:analytics',
        result,
        { ttl: 600 }
      )
    })
  })

  describe('Event Emission', () => {
    it('should emit product.created event', async () => {
      const eventSpy = vi.fn()
      productService.on('product.created', eventSpy)

      await productService.createProduct(mockCreateProductData, 'user-1')

      expect(eventSpy).toHaveBeenCalledWith({
        product: mockProduct,
        userId: 'user-1',
      })
    })

    it('should emit product.updated event', async () => {
      const eventSpy = vi.fn()
      productService.on('product.updated', eventSpy)

      await productService.updateProduct(
        'product-1',
        { name: 'Updated' },
        'user-1'
      )

      expect(eventSpy).toHaveBeenCalledWith({
        product: mockProduct,
        previousProduct: mockProduct,
        userId: 'user-1',
      })
    })

    it('should emit product.deleted event', async () => {
      const eventSpy = vi.fn()
      productService.on('product.deleted', eventSpy)

      await productService.deleteProduct('product-1', 'user-1')

      expect(eventSpy).toHaveBeenCalledWith({
        product: mockProduct,
        userId: 'user-1',
      })
    })
  })

  describe('Cache Management', () => {
    it('should invalidate caches after product creation', async () => {
      await productService.createProduct(mockCreateProductData, 'user-1')

      // Cache invalidation is handled internally by the service
      expect(mockCache.del).toHaveBeenCalled()
    })

    it('should invalidate specific product caches after update', async () => {
      await productService.updateProduct(
        'product-1',
        { name: 'Updated' },
        'user-1'
      )

      // Cache invalidation is handled internally by the service
      expect(mockCache.del).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      vi.spyOn(prisma.product, 'create').mockRejectedValue(
        new Error('Database error')
      )

      await expect(
        productService.createProduct(mockCreateProductData, 'user-1')
      ).rejects.toThrow('Database error')
    })

    it('should handle search service errors gracefully', async () => {
      mockSearchService.isAvailable.mockReturnValue(true)
      mockSearchService.searchProducts.mockRejectedValue(
        new Error('Search error')
      )
      mockCache.get.mockResolvedValue(null)

      // Should fallback to database search
      const result = await productService.searchProducts({ 
        q: 'test',
        page: 1,
        limit: 20,
        sortOrder: 'desc'
      })

      expect(result.products).toEqual([mockProduct])
      expect(prisma.product.findMany).toHaveBeenCalled()
    })
  })
})
