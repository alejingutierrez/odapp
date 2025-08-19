import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import express from 'express'
import { PrismaClient } from '@prisma/client'
import productRoutes from '../routes/products.js'
import { authenticate, authorize } from '../middleware/auth.js'
import { errorHandler } from '../middleware/error-handler.js'

// Mock middleware
vi.mock('../middleware/auth.js', () => ({
  authenticate: vi.fn((req, res, next) => {
    req.user = { id: 'user-1', email: 'test@example.com' }
    next()
  }),
  authorize: vi.fn(() => (req: any, res: any, next: any) => next())
}))

// Mock services
vi.mock('../services/product.service.js')
vi.mock('../services/search.service.js')
vi.mock('../services/image.service.js')
vi.mock('../services/analytics.service.js')
vi.mock('../services/audit.service.js')
vi.mock('../services/import-export.service.js')
vi.mock('../lib/cache/cache-manager.js')
vi.mock('../lib/prisma.js', () => ({
  prisma: {
    product: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      count: vi.fn()
    },
    productVariant: {
      findMany: vi.fn()
    },
    category: {
      findFirst: vi.fn()
    },
    collection: {
      findMany: vi.fn()
    },
    orderItem: {
      count: vi.fn()
    },
    location: {
      findFirst: vi.fn()
    },
    inventoryItem: {
      createMany: vi.fn()
    },
    collectionProduct: {
      createMany: vi.fn()
    },
    $transaction: vi.fn()
  }
}))

describe('Product Routes', () => {
  let app: express.Application

  const mockProduct = {
    id: 'product-1',
    name: 'Test Product',
    slug: 'test-product',
    description: 'A test product',
    status: 'ACTIVE',
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
        updatedAt: new Date()
      }
    ],
    images: [
      {
        id: 'image-1',
        productId: 'product-1',
        url: 'https://example.com/image.jpg',
        altText: 'Test image',
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ],
    category: null,
    collections: [],
    _count: {
      variants: 1,
      images: 1,
      collections: 0
    }
  }

  const mockSearchResult = {
    products: [mockProduct],
    total: 1,
    facets: {
      categories: [],
      brands: [],
      priceRanges: [],
      status: []
    }
  }

  beforeAll(() => {
    app = express()
    app.use(express.json())
    app.use('/api/products', productRoutes)
    app.use(errorHandler)
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/products', () => {
    it('should return products with pagination', async () => {
      // Mock the ProductService.searchProducts method
      const { ProductService } = await import('../services/product.service.js')
      const mockSearchProducts = vi.fn().mockResolvedValue(mockSearchResult)
      vi.mocked(ProductService).prototype.searchProducts = mockSearchProducts

      const response = await request(app)
        .get('/api/products')
        .query({ page: 1, limit: 20 })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.products).toEqual([mockProduct])
      expect(response.body.data.total).toBe(1)
      expect(response.body.data.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1
      })
      expect(mockSearchProducts).toHaveBeenCalledWith({
        page: '1',
        limit: '20'
      })
    })

    it('should apply search filters', async () => {
      const { ProductService } = await import('../services/product.service.js')
      const mockSearchProducts = vi.fn().mockResolvedValue(mockSearchResult)
      vi.mocked(ProductService).prototype.searchProducts = mockSearchProducts

      await request(app)
        .get('/api/products')
        .query({
          search: 'test',
          status: 'active',
          categoryId: 'category-1',
          priceMin: 10,
          priceMax: 50
        })
        .expect(200)

      expect(mockSearchProducts).toHaveBeenCalledWith({
        search: 'test',
        status: 'active',
        categoryId: 'category-1',
        priceMin: '10',
        priceMax: '50'
      })
    })

    it('should require authentication', async () => {
      vi.mocked(authenticate).mockImplementationOnce((req, res, next) => {
        res.status(401).json({ error: 'Unauthorized' })
      })

      await request(app)
        .get('/api/products')
        .expect(401)
    })
  })

  describe('GET /api/products/:id', () => {
    it('should return a single product', async () => {
      const { ProductService } = await import('../services/product.service.js')
      const mockGetProduct = vi.fn().mockResolvedValue(mockProduct)
      vi.mocked(ProductService).prototype.getProduct = mockGetProduct

      const response = await request(app)
        .get('/api/products/product-1')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.product).toEqual(mockProduct)
      expect(mockGetProduct).toHaveBeenCalledWith('product-1')
    })

    it('should return 404 for non-existent product', async () => {
      const { ProductService } = await import('../services/product.service.js')
      const mockGetProduct = vi.fn().mockResolvedValue(null)
      vi.mocked(ProductService).prototype.getProduct = mockGetProduct

      const response = await request(app)
        .get('/api/products/non-existent')
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Product not found')
    })

    it('should validate UUID format', async () => {
      await request(app)
        .get('/api/products/invalid-id')
        .expect(400)
    })
  })

  describe('POST /api/products', () => {
    const validProductData = {
      name: 'Test Product',
      slug: 'test-product',
      description: 'A test product',
      status: 'draft',
      variants: [
        {
          sku: 'TEST-001',
          size: 'M',
          color: 'Blue',
          price: 29.99,
          inventoryQuantity: 10,
          requiresShipping: true,
          taxable: true
        }
      ]
    }

    it('should create a product successfully', async () => {
      const { ProductService } = await import('../services/product.service.js')
      const mockCreateProduct = vi.fn().mockResolvedValue(mockProduct)
      vi.mocked(ProductService).prototype.createProduct = mockCreateProduct

      const response = await request(app)
        .post('/api/products')
        .send(validProductData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.product).toEqual(mockProduct)
      expect(response.body.message).toBe('Product created successfully')
      expect(mockCreateProduct).toHaveBeenCalledWith(validProductData, 'user-1')
    })

    it('should validate required fields', async () => {
      const invalidData = { ...validProductData, name: '' }

      await request(app)
        .post('/api/products')
        .send(invalidData)
        .expect(400)
    })

    it('should validate variants are provided', async () => {
      const invalidData = { ...validProductData, variants: [] }

      await request(app)
        .post('/api/products')
        .send(invalidData)
        .expect(400)
    })

    it('should require authorization', async () => {
      vi.mocked(authorize).mockImplementationOnce(() => (req: any, res: any, next: any) => {
        res.status(403).json({ error: 'Forbidden' })
      })

      await request(app)
        .post('/api/products')
        .send(validProductData)
        .expect(403)
    })
  })

  describe('PUT /api/products/:id', () => {
    const updateData = {
      name: 'Updated Product',
      description: 'Updated description'
    }

    it('should update a product successfully', async () => {
      const { ProductService } = await import('../services/product.service.js')
      const mockUpdateProduct = vi.fn().mockResolvedValue({ ...mockProduct, ...updateData })
      vi.mocked(ProductService).prototype.updateProduct = mockUpdateProduct

      const response = await request(app)
        .put('/api/products/product-1')
        .send(updateData)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Product updated successfully')
      expect(mockUpdateProduct).toHaveBeenCalledWith('product-1', updateData, 'user-1')
    })

    it('should handle non-existent product', async () => {
      const { ProductService } = await import('../services/product.service.js')
      const mockUpdateProduct = vi.fn().mockRejectedValue(new Error('Product not found'))
      vi.mocked(ProductService).prototype.updateProduct = mockUpdateProduct

      await request(app)
        .put('/api/products/non-existent')
        .send(updateData)
        .expect(500)
    })
  })

  describe('DELETE /api/products/:id', () => {
    it('should delete a product successfully', async () => {
      const { ProductService } = await import('../services/product.service.js')
      const mockDeleteProduct = vi.fn().mockResolvedValue(undefined)
      vi.mocked(ProductService).prototype.deleteProduct = mockDeleteProduct

      const response = await request(app)
        .delete('/api/products/product-1')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Product deleted successfully')
      expect(mockDeleteProduct).toHaveBeenCalledWith('product-1', 'user-1')
    })

    it('should handle products with orders', async () => {
      const { ProductService } = await import('../services/product.service.js')
      const mockDeleteProduct = vi.fn().mockRejectedValue(
        new Error('Cannot delete product with existing orders')
      )
      vi.mocked(ProductService).prototype.deleteProduct = mockDeleteProduct

      await request(app)
        .delete('/api/products/product-1')
        .expect(500)
    })
  })

  describe('POST /api/products/bulk-update', () => {
    const bulkUpdateData = {
      productIds: ['product-1', 'product-2'],
      updates: {
        status: 'active',
        vendor: 'New Vendor'
      }
    }

    it('should bulk update products successfully', async () => {
      const { ProductService } = await import('../services/product.service.js')
      const mockBulkUpdateProducts = vi.fn().mockResolvedValue({ updatedCount: 2 })
      vi.mocked(ProductService).prototype.bulkUpdateProducts = mockBulkUpdateProducts

      const response = await request(app)
        .post('/api/products/bulk-update')
        .send(bulkUpdateData)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.updatedCount).toBe(2)
      expect(response.body.message).toBe('2 products updated successfully')
      expect(mockBulkUpdateProducts).toHaveBeenCalledWith(bulkUpdateData, 'user-1')
    })

    it('should validate product IDs', async () => {
      const invalidData = { ...bulkUpdateData, productIds: [] }

      await request(app)
        .post('/api/products/bulk-update')
        .send(invalidData)
        .expect(400)
    })
  })

  describe('DELETE /api/products/bulk-delete', () => {
    const bulkDeleteData = {
      productIds: ['product-1', 'product-2']
    }

    it('should bulk delete products successfully', async () => {
      const { ProductService } = await import('../services/product.service.js')
      const mockBulkDeleteProducts = vi.fn().mockResolvedValue({ deletedCount: 2 })
      vi.mocked(ProductService).prototype.bulkDeleteProducts = mockBulkDeleteProducts

      const response = await request(app)
        .delete('/api/products/bulk-delete')
        .send(bulkDeleteData)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.deletedCount).toBe(2)
      expect(response.body.message).toBe('2 products deleted successfully')
      expect(mockBulkDeleteProducts).toHaveBeenCalledWith(bulkDeleteData, 'user-1')
    })
  })

  describe('POST /api/products/:id/images', () => {
    it('should upload product images successfully', async () => {
      const { ProductService } = await import('../services/product.service.js')
      const { ImageService } = await import('../services/image.service.js')
      
      const mockGetProduct = vi.fn().mockResolvedValue(mockProduct)
      const mockUpdateProduct = vi.fn().mockResolvedValue(mockProduct)
      const mockBulkProcessImages = vi.fn().mockResolvedValue([
        {
          id: 'image-1',
          url: 'https://example.com/image.jpg',
          thumbnailUrl: 'https://example.com/thumb.jpg',
          width: 800,
          height: 600,
          fileSize: 1024,
          mimeType: 'image/jpeg',
          variants: {}
        }
      ])

      vi.mocked(ProductService).prototype.getProduct = mockGetProduct
      vi.mocked(ProductService).prototype.updateProduct = mockUpdateProduct
      vi.mocked(ImageService).prototype.bulkProcessImages = mockBulkProcessImages

      const response = await request(app)
        .post('/api/products/product-1/images')
        .attach('images', Buffer.from('fake image data'), 'test.jpg')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('1 images uploaded successfully')
      expect(mockGetProduct).toHaveBeenCalledWith('product-1')
      expect(mockBulkProcessImages).toHaveBeenCalled()
      expect(mockUpdateProduct).toHaveBeenCalled()
    })

    it('should return 400 when no images provided', async () => {
      await request(app)
        .post('/api/products/product-1/images')
        .expect(400)
    })

    it('should return 404 for non-existent product', async () => {
      const { ProductService } = await import('../services/product.service.js')
      const mockGetProduct = vi.fn().mockResolvedValue(null)
      vi.mocked(ProductService).prototype.getProduct = mockGetProduct

      await request(app)
        .post('/api/products/non-existent/images')
        .attach('images', Buffer.from('fake image data'), 'test.jpg')
        .expect(404)
    })
  })

  describe('GET /api/products/analytics/overview', () => {
    it('should return product analytics overview', async () => {
      const { ProductService } = await import('../services/product.service.js')
      const mockAnalytics = {
        totalProducts: 10,
        activeProducts: 8,
        draftProducts: 2,
        archivedProducts: 0,
        totalVariants: 20,
        averagePrice: 35.50,
        topCategories: [],
        topBrands: [],
        recentlyCreated: 2,
        recentlyUpdated: 5
      }
      const mockGetProductAnalytics = vi.fn().mockResolvedValue(mockAnalytics)
      vi.mocked(ProductService).prototype.getProductAnalytics = mockGetProductAnalytics

      const response = await request(app)
        .get('/api/products/analytics/overview')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.analytics).toEqual(mockAnalytics)
      expect(mockGetProductAnalytics).toHaveBeenCalled()
    })
  })

  describe('POST /api/products/import/csv', () => {
    it('should import products from CSV successfully', async () => {
      const { ImportExportService } = await import('../services/import-export.service.js')
      const mockImportResult = {
        success: true,
        totalRows: 2,
        successfulRows: 2,
        failedRows: 0,
        errors: [],
        createdProducts: ['product-1', 'product-2'],
        updatedProducts: []
      }
      const mockImportProductsFromCSV = vi.fn().mockResolvedValue(mockImportResult)
      vi.mocked(ImportExportService).prototype.importProductsFromCSV = mockImportProductsFromCSV

      const csvContent = 'name,sku,price\nTest Product,TEST-001,29.99\nAnother Product,TEST-002,39.99'

      const response = await request(app)
        .post('/api/products/import/csv')
        .attach('file', Buffer.from(csvContent), 'products.csv')
        .field('updateExisting', 'false')
        .field('skipInvalid', 'true')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockImportResult)
      expect(mockImportProductsFromCSV).toHaveBeenCalledWith(csvContent, {
        updateExisting: false,
        skipInvalid: true,
        validateOnly: false
      })
    })

    it('should return 400 when no file provided', async () => {
      await request(app)
        .post('/api/products/import/csv')
        .expect(400)
    })
  })

  describe('POST /api/products/export', () => {
    it('should export products successfully', async () => {
      const { ImportExportService } = await import('../services/import-export.service.js')
      const mockExportResult = {
        success: true,
        filename: 'products_export_123456.csv',
        recordCount: 10,
        fileSize: 2048,
        downloadUrl: '/api/exports/products_export_123456.csv'
      }
      const mockExportProducts = vi.fn().mockResolvedValue(mockExportResult)
      vi.mocked(ImportExportService).prototype.exportProducts = mockExportProducts

      const exportData = {
        format: 'csv',
        filters: { status: 'active' }
      }

      const response = await request(app)
        .post('/api/products/export')
        .send(exportData)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockExportResult)
      expect(mockExportProducts).toHaveBeenCalledWith(
        { status: 'active' },
        {
          format: 'csv',
          fields: undefined,
          includeVariants: true,
          includeImages: true,
          includeInventory: true
        }
      )
    })

    it('should validate export format', async () => {
      const invalidData = { format: 'invalid' }

      await request(app)
        .post('/api/products/export')
        .send(invalidData)
        .expect(400)
    })
  })

  describe('GET /api/products/search/suggestions', () => {
    it('should return search suggestions', async () => {
      const { SearchService } = await import('../services/search.service.js')
      const mockSuggestions = ['Test Product', 'Test Variant', 'Testing Item']
      const mockSuggestProducts = vi.fn().mockResolvedValue(mockSuggestions)
      vi.mocked(SearchService).prototype.suggestProducts = mockSuggestProducts

      const response = await request(app)
        .get('/api/products/search/suggestions')
        .query({ q: 'test', limit: 5 })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.suggestions).toEqual(mockSuggestions)
      expect(mockSuggestProducts).toHaveBeenCalledWith('test', 5)
    })

    it('should require query parameter', async () => {
      await request(app)
        .get('/api/products/search/suggestions')
        .expect(400)
    })
  })

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      const { ProductService } = await import('../services/product.service.js')
      const mockSearchProducts = vi.fn().mockRejectedValue(new Error('Service error'))
      vi.mocked(ProductService).prototype.searchProducts = mockSearchProducts

      await request(app)
        .get('/api/products')
        .expect(500)
    })

    it('should handle validation errors', async () => {
      await request(app)
        .post('/api/products')
        .send({ name: '' }) // Invalid data
        .expect(400)
    })
  })

  describe('Authorization', () => {
    it('should check read permissions for GET endpoints', async () => {
      const mockAuthorize = vi.mocked(authorize)
      
      await request(app).get('/api/products')
      
      expect(mockAuthorize).toHaveBeenCalledWith(['products:read'])
    })

    it('should check write permissions for POST endpoints', async () => {
      const mockAuthorize = vi.mocked(authorize)
      
      await request(app)
        .post('/api/products')
        .send({
          name: 'Test',
          variants: [{ sku: 'TEST', price: 10 }]
        })
      
      expect(mockAuthorize).toHaveBeenCalledWith(['products:write'])
    })

    it('should check delete permissions for DELETE endpoints', async () => {
      const mockAuthorize = vi.mocked(authorize)
      
      await request(app).delete('/api/products/product-1')
      
      expect(mockAuthorize).toHaveBeenCalledWith(['products:delete'])
    })

    it('should check admin permissions for reindex endpoint', async () => {
      const mockAuthorize = vi.mocked(authorize)
      
      await request(app).post('/api/products/reindex')
      
      expect(mockAuthorize).toHaveBeenCalledWith(['products:write', 'admin'])
    })
  })
})