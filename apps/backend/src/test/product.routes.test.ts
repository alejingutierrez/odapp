import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import { createTestApp, setupCommonMocks } from './test-app.js'

describe('Product Routes', () => {
  let app: any

  const adminAuth = { Authorization: 'Bearer write-token' }
  const readAuth = { Authorization: 'Bearer read-token' }

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
  beforeAll(() => {
    app = createTestApp()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    setupCommonMocks()
  })

  describe('GET /api/products', () => {
    it('should return products with pagination', async () => {
      const { prisma } = require('../lib/prisma')
      prisma.product.findMany.mockResolvedValue([mockProduct])
      prisma.product.count.mockResolvedValue(1)

      const response = await request(app)
        .get('/api/products')
        .set(adminAuth)
        .query({ page: 1, limit: 20 })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.products).toBeDefined()
      expect(response.body.data.pagination).toBeDefined()
    })

    it('should apply search filters', async () => {
      const { prisma } = require('../lib/prisma')
      prisma.product.findMany.mockResolvedValue([mockProduct])
      prisma.product.count.mockResolvedValue(1)

      const response = await request(app)
        .get('/api/products')
        .set(adminAuth)
        .query({
          search: 'test',
          status: 'active',
          categoryId: 'category-1',
          priceMin: 10,
          priceMax: 50,
        })
        .expect(200)

      expect(response.body.success).toBe(true)
    })

    it('should require authentication', async () => {
      await request(app).get('/api/products').expect(401)
    })
  })

  describe('GET /api/products/:id', () => {
    it('should return a single product', async () => {
      const { prisma } = require('../lib/prisma')
      prisma.product.findFirst.mockResolvedValue(mockProduct)

      const response = await request(app)
        .get('/api/products/product-1')
        .set(adminAuth)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeDefined()
    })

    it('should return 404 for non-existent product', async () => {
      const { prisma } = require('../lib/prisma')
      prisma.product.findFirst.mockResolvedValue(null)

      await request(app)
        .get('/api/products/non-existent')
        .set(adminAuth)
        .expect(404)
    })
  })

  describe('POST /api/products', () => {
    it('should create a product successfully', async () => {
      const { prisma } = require('../lib/prisma')
      prisma.product.create.mockResolvedValue(mockProduct)
      prisma.location.findFirst.mockResolvedValue({
        id: 'location-1',
        name: 'Default Location',
        isDefault: true,
      })

      const response = await request(app)
        .post('/api/products')
        .set(adminAuth)
        .send({
          name: 'New Product',
          description: 'A new product',
          price: 29.99,
          variants: [
            {
              sku: 'NEW-001',
              size: 'M',
              color: 'Red',
              price: 29.99,
              inventoryQuantity: 10,
            },
          ],
        })
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeDefined()
    })

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/products')
        .set(adminAuth)
        .send({ name: '' })
        .expect(400)

      expect(response.body.success).toBe(false)
    })
  })

  describe('PUT /api/products/:id', () => {
    it('should update a product successfully', async () => {
      const { prisma } = require('../lib/prisma')
      prisma.product.findFirst.mockResolvedValue(mockProduct)
      prisma.product.update.mockResolvedValue({
        ...mockProduct,
        name: 'Updated Product',
      })

      const response = await request(app)
        .put('/api/products/product-1')
        .set(adminAuth)
        .send({
          name: 'Updated Product',
          description: 'Updated description',
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.name).toBe('Updated Product')
    })

    it('should return 404 for non-existent product', async () => {
      const { prisma } = require('../lib/prisma')
      prisma.product.findFirst.mockResolvedValue(null)

      await request(app)
        .put('/api/products/non-existent')
        .set(adminAuth)
        .send({ name: 'Updated Product' })
        .expect(404)
    })
  })

  describe('DELETE /api/products/:id', () => {
    it('should delete a product successfully', async () => {
      const { prisma } = require('../lib/prisma')
      prisma.product.findFirst.mockResolvedValue(mockProduct)
      prisma.product.update.mockResolvedValue({
        ...mockProduct,
        deletedAt: new Date(),
      })
      prisma.orderItem.count.mockResolvedValue(0)

      const response = await request(app)
        .delete('/api/products/product-1')
        .set(adminAuth)
        .expect(200)

      expect(response.body.success).toBe(true)
    })

    it('should return 404 for non-existent product', async () => {
      const { prisma } = require('../lib/prisma')
      prisma.product.findFirst.mockResolvedValue(null)

      await request(app)
        .delete('/api/products/non-existent')
        .set(adminAuth)
        .expect(404)
    })
  })

  describe('POST /api/products/bulk-update', () => {
    it('should bulk update products successfully', async () => {
      const { prisma } = require('../lib/prisma')
      prisma.product.findMany.mockResolvedValue([mockProduct])
      prisma.product.updateMany.mockResolvedValue({ count: 1 })

      const response = await request(app)
        .post('/api/products/bulk-update')
        .set(adminAuth)
        .send({
          productIds: ['product-1'],
          updates: { status: 'ACTIVE' },
        })
        .expect(200)

      expect(response.body.success).toBe(true)
    })

    it('should validate product IDs', async () => {
      const response = await request(app)
        .post('/api/products/bulk-update')
        .set(adminAuth)
        .send({
          productIds: [],
          updates: { status: 'ACTIVE' },
        })
        .expect(400)

      expect(response.body.success).toBe(false)
    })
  })

  describe('DELETE /api/products/bulk-delete', () => {
    it('should bulk delete products successfully', async () => {
      const { prisma } = require('../lib/prisma')
      prisma.product.findMany.mockResolvedValue([mockProduct])
      prisma.orderItem.count.mockResolvedValue(0)
      prisma.product.updateMany.mockResolvedValue({ count: 1 })

      const response = await request(app)
        .delete('/api/products/bulk-delete')
        .set(adminAuth)
        .send({
          productIds: ['product-1'],
        })
        .expect(200)

      expect(response.body.success).toBe(true)
    })
  })

  describe('POST /api/products/:id/images', () => {
    it('should upload product images successfully', async () => {
      const { prisma } = require('../lib/prisma')
      prisma.product.findFirst.mockResolvedValue(mockProduct)

      const response = await request(app)
        .post('/api/products/product-1/images')
        .set(adminAuth)
        .attach('images', Buffer.from('fake image data'), 'test.jpg')
        .expect(200)

      expect(response.body.success).toBe(true)
    })

    it('should return 400 when no images provided', async () => {
      await request(app)
        .post('/api/products/product-1/images')
        .set(adminAuth)
        .expect(400)
    })

    it('should return 404 for non-existent product', async () => {
      const { prisma } = require('../lib/prisma')
      prisma.product.findFirst.mockResolvedValue(null)

      await request(app)
        .post('/api/products/non-existent/images')
        .set(adminAuth)
        .attach('images', Buffer.from('fake image data'), 'test.jpg')
        .expect(404)
    })
  })

  describe('GET /api/products/analytics/overview', () => {
    it('should return product analytics overview', async () => {
      const response = await request(app)
        .get('/api/products/analytics/overview')
        .set(adminAuth)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeDefined()
    })
  })

  describe('POST /api/products/import/csv', () => {
    it('should import products from CSV successfully', async () => {
      const response = await request(app)
        .post('/api/products/import/csv')
        .set(adminAuth)
        .attach(
          'file',
          Buffer.from('name,description,price\nTest,Description,29.99'),
          'products.csv'
        )
        .field('updateExisting', 'false')
        .field('skipInvalid', 'true')
        .expect(200)

      expect(response.body.success).toBe(true)
    })

    it('should return 400 when no file provided', async () => {
      await request(app)
        .post('/api/products/import/csv')
        .set(adminAuth)
        .expect(400)
    })
  })

  describe('POST /api/products/export', () => {
    it('should export products successfully', async () => {
      const { prisma } = require('../lib/prisma')
      prisma.product.findMany.mockResolvedValue([mockProduct])

      const response = await request(app)
        .post('/api/products/export')
        .set(adminAuth)
        .send({
          format: 'csv',
          filters: { status: 'ACTIVE' },
        })
        .expect(200)

      expect(response.body.success).toBe(true)
    })

    it('should validate export format', async () => {
      const response = await request(app)
        .post('/api/products/export')
        .set(adminAuth)
        .send({
          format: 'invalid',
          filters: { status: 'ACTIVE' },
        })
        .expect(400)

      expect(response.body.success).toBe(false)
    })
  })

  describe('GET /api/products/search/suggestions', () => {
    it('should return search suggestions', async () => {
      const { prisma } = require('../lib/prisma')
      prisma.product.findMany.mockResolvedValue([mockProduct])

      const response = await request(app)
        .get('/api/products/search/suggestions')
        .set(adminAuth)
        .query({ q: 'test', limit: 5 })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeDefined()
    })

    it('should require query parameter', async () => {
      await request(app)
        .get('/api/products/search/suggestions')
        .set(adminAuth)
        .expect(400)
    })
  })

  describe('Error Handling', () => {
    it('should handle validation errors', async () => {
      const response = await request(app)
        .post('/api/products')
        .set(adminAuth)
        .send({ name: '' }) // Invalid data
        .expect(400)

      expect(response.body.success).toBe(false)
    })
  })

  describe('Authorization', () => {
    it('should require authentication for protected routes', async () => {
      await request(app).get('/api/products').expect(401)
    })

    it('should allow access with read permission', async () => {
      const { prisma } = require('../lib/prisma')
      prisma.product.findMany.mockResolvedValue([mockProduct])
      prisma.product.count.mockResolvedValue(1)

      const response = await request(app)
        .get('/api/products')
        .set(readAuth)
        .expect(200)
      expect(response.body.success).toBe(true)
    })

    it('should forbid writes without proper permission', async () => {
      const response = await request(app)
        .post('/api/products')
        .set(readAuth)
        .send({
          name: 'Test Product',
          description: 'Test description',
          price: 29.99,
          variants: [
            {
              sku: 'NEW-001',
              size: 'M',
              color: 'Red',
              price: 29.99,
              inventoryQuantity: 10,
            },
          ],
        })
      expect(response.status).toBe(403)
    })

    it('should allow writes with proper permission', async () => {
      const { prisma } = require('../lib/prisma')
      prisma.product.create.mockResolvedValue(mockProduct)
      prisma.location.findFirst.mockResolvedValue({
        id: 'location-1',
        name: 'Default Location',
        isDefault: true,
      })

      const response = await request(app)
        .post('/api/products')
        .set(adminAuth)
        .send({
          name: 'Test Product',
          description: 'Test description',
          price: 29.99,
          variants: [
            {
              sku: 'NEW-001',
              size: 'M',
              color: 'Red',
              price: 29.99,
              inventoryQuantity: 10,
            },
          ],
        })
        .expect(201)
      expect(response.body.success).toBe(true)
    })

    it('should enforce delete permissions', async () => {
      const { prisma } = require('../lib/prisma')
      prisma.product.findFirst.mockResolvedValue(mockProduct)
      prisma.orderItem.count.mockResolvedValue(0)

      await request(app)
        .delete('/api/products/product-1')
        .set(readAuth)
        .expect(403)

      const response = await request(app)
        .delete('/api/products/product-1')
        .set(adminAuth)
        .expect(200)
      expect(response.body.success).toBe(true)
    })
  })
})
