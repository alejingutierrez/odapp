import {
  // productSchema,
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
  bulkProductUpdateSchema,
  bulkProductDeleteSchema,
  // productImportSchema,
  productExportSchema,
  commonValidationSchemas,
} from '@oda/shared'
import { Router } from 'express'
import multer from 'multer'
import { z } from 'zod'

import {
  sendSuccess,
  sendCreated,
  sendError,
  sendPaginated,
} from '../lib/api-response.js'
import { CacheManager } from '../lib/cache/cache-manager.js'
import { logger } from '../lib/logger.js'
import { prisma } from '../lib/prisma'
import { authenticate, authorize } from '../middleware/auth.js'
import { validate, xssProtection } from '../middleware/validation.js'
import { AnalyticsService } from '../services/analytics.service.js'
import { AuditService } from '../services/audit.service.js'
import { ImageService } from '../services/image.service.js'
import { ImportExportService } from '../services/import-export.service.js'
import { ProductService } from '../services/product.service.js'
import { SearchService } from '../services/search.service.js'

const router = Router()

// Initialize services
const cacheManager = new CacheManager()
const searchService = new SearchService()
const imageService = new ImageService()
const analyticsService = new AnalyticsService(prisma, cacheManager)
const auditService = new AuditService(prisma)
const productService = new ProductService(
  prisma,
  cacheManager,
  searchService,
  imageService,
  analyticsService,
  auditService
)
const importExportService = new ImportExportService(prisma, productService)

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 10,
  },
})

// Apply authentication and XSS protection to all routes
router.use(authenticate)
router.use(xssProtection())

// GET /products - List products with filtering and pagination
router.get(
  '/',
  validate({ query: productQuerySchema }),
  authorize(['products:read']),
  async (req, res, next) => {
    try {
      const query = productQuerySchema.parse(req.query)

      logger.info('Fetching products', { query, userId: req.user?.id })

      const result = await productService.searchProducts(query)

      sendPaginated(
        res,
        result.products,
        {
          page: query.page || 1,
          limit: query.limit || 20,
          total: result.total,
          totalPages: Math.ceil(result.total / (query.limit || 20)),
          hasNext:
            (query.page || 1) < Math.ceil(result.total / (query.limit || 20)),
          hasPrev: (query.page || 1) > 1,
        },
        {
          facets: result.facets,
        }
      )
    } catch (error) {
      next(error)
    }
  }
)

// GET /products/:id - Get single product
router.get(
  '/:id',
  validate({ params: commonValidationSchemas.id }),
  authorize(['products:read']),
  async (req, res, next) => {
    try {
      const { id } = req.params

      logger.info('Fetching product', { productId: id, userId: req.user?.id })

      const product = await productService.getProduct(id)

      if (!product) {
        return sendError(res, 'NOT_FOUND', 'Product not found', 404)
      }

      sendSuccess(res, { product })
    } catch (error) {
      next(error)
    }
  }
)

// POST /products - Create new product
router.post(
  '/',
  validate({ body: createProductSchema }),
  authorize(['products:write']),
  async (req, res, next) => {
    try {
      const productData = req.body as z.infer<typeof createProductSchema>

      logger.info('Creating product', {
        productName: productData.name,
        userId: req.user?.id,
      })

      const newProduct = await productService.createProduct(
        productData,
        req.user?.id
      )

      logger.info('Product created successfully', {
        productId: newProduct.id,
        productName: newProduct.name,
        userId: req.user?.id,
      })

      sendCreated(res, { product: newProduct })
    } catch (error) {
      next(error)
    }
  }
)

// PUT /products/:id - Update product
router.put(
  '/:id',
  validate({
    params: commonValidationSchemas.id,
    body: updateProductSchema.omit({ id: true }),
  }),
  authorize(['products:write']),
  async (req, res, next) => {
    try {
      const { id } = req.params
      const updateData = req.body

      logger.info('Updating product', {
        productId: id,
        userId: req.user?.id,
      })

      const updatedProduct = await productService.updateProduct(
        id,
        updateData,
        req.user?.id
      )

      logger.info('Product updated successfully', {
        productId: id,
        userId: req.user?.id,
      })

      sendSuccess(res, { product: updatedProduct })
    } catch (error) {
      next(error)
    }
  }
)

// DELETE /products/:id - Delete product
router.delete(
  '/:id',
  validate({ params: commonValidationSchemas.id }),
  authorize(['products:delete']),
  async (req, res, next) => {
    try {
      const { id } = req.params

      logger.info('Deleting product', {
        productId: id,
        userId: req.user?.id,
      })

      await productService.deleteProduct(id, req.user?.id)

      logger.info('Product deleted successfully', {
        productId: id,
        userId: req.user?.id,
      })

      const response = sendSuccess(res, null, 'Product deleted successfully')
      res.json(response)
    } catch (error) {
      next(error)
    }
  }
)

// POST /products/bulk-update - Bulk update products
router.post(
  '/bulk-update',
  validate({ body: bulkProductUpdateSchema }),
  authorize(['products:write']),
  async (req, res, next) => {
    try {
      const bulkUpdateData = req.body as z.infer<typeof bulkProductUpdateSchema>

      logger.info('Bulk updating products', {
        productCount: bulkUpdateData.productIds.length,
        updates: bulkUpdateData.updates,
        userId: req.user?.id,
      })

      const result = await productService.bulkUpdateProducts(
        bulkUpdateData,
        req.user?.id
      )

      const response = sendSuccess(
        res,
        result,
        `${result.updatedCount} products updated successfully`
      )
      res.json(response)
    } catch (error) {
      next(error)
    }
  }
)

// DELETE /products/bulk-delete - Bulk delete products
router.delete(
  '/bulk-delete',
  validate({ body: bulkProductDeleteSchema }),
  authorize(['products:delete']),
  async (req, res, next) => {
    try {
      const bulkDeleteData = req.body as z.infer<typeof bulkProductDeleteSchema>

      logger.info('Bulk deleting products', {
        productCount: bulkDeleteData.productIds.length,
        userId: req.user?.id,
      })

      const result = await productService.bulkDeleteProducts(
        bulkDeleteData,
        req.user?.id
      )

      const response = sendSuccess(
        res,
        result,
        `${result.deletedCount} products deleted successfully`
      )
      res.json(response)
    } catch (error) {
      next(error)
    }
  }
)

// POST /products/:id/images - Upload product images
router.post(
  '/:id/images',
  validate({ params: commonValidationSchemas.id }),
  upload.array('images', 10),
  authorize(['products:write']),
  async (req, res, next) => {
    try {
      const { id } = req.params
      const files = req.files as Express.Multer.File[]

      if (!files || files.length === 0) {
        return sendError(res, 'VALIDATION_ERROR', 'No images provided', 400)
      }

      logger.info('Uploading product images', {
        productId: id,
        imageCount: files.length,
        userId: req.user?.id,
      })

      // Check if product exists
      const product = await productService.getProduct(id)
      if (!product) {
        return res
          .status(404)
          .json(sendError(res, 'NOT_FOUND', 'Product not found', 404))
      }

      // Process images
      const uploadResults = await imageService.bulkProcessImages(files, {
        generateThumbnails: true,
        optimizeOriginals: true,
      })

      // Update product with new images
      const imageData = uploadResults.map((result, index) => ({
        url: result.url,
        altText: files[index].originalname,
        position: (product.images?.length || 0) + index,
        width: result.width,
        height: result.height,
      }))

      const updatedProduct = await productService.updateProduct(
        id,
        {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          images: [...(product.images || []), ...imageData] as any,
        },
        req.user?.id
      )

      const response = sendSuccess(
        res,
        {
          images: uploadResults,
          product: updatedProduct,
        },
        `${files.length} images uploaded successfully`
      )
      res.json(response)
    } catch (error) {
      next(error)
    }
  }
)

// GET /products/:id/variants - Get product variants
router.get(
  '/:id/variants',
  validate({ params: commonValidationSchemas.id }),
  authorize(['products:read']),
  async (req, res, next) => {
    try {
      const { id } = req.params

      logger.info('Fetching product variants', {
        productId: id,
        userId: req.user?.id,
      })

      const product = await productService.getProduct(id)

      if (!product) {
        return res
          .status(404)
          .json(sendError(res, 'NOT_FOUND', 'Product not found', 404))
      }

      const response = sendSuccess(res, { variants: product.variants })
      res.json(response)
    } catch (error) {
      next(error)
    }
  }
)
// GET /products/analytics/overview - Get product analytics overview
router.get(
  '/analytics/overview',
  authorize(['products:read', 'analytics:read']),
  async (req, res, next) => {
    try {
      logger.info('Fetching product analytics overview', {
        userId: req.user?.id,
      })

      const analytics = await productService.getProductAnalytics()

      const response = sendSuccess(res, { analytics })
      res.json(response)
    } catch (error) {
      next(error)
    }
  }
)

// GET /products/analytics/performance - Get product performance report
router.get(
  '/analytics/performance',
  authorize(['products:read', 'analytics:read']),
  async (req, res, next) => {
    try {
      const { categoryId, brand, status, startDate, endDate } = req.query

      logger.info('Fetching product performance report', {
        filters: { categoryId, brand, status, startDate, endDate },
        userId: req.user?.id,
      })

      const filters = {
        ...(categoryId && { categoryId: String(categoryId) }),
        ...(brand && { brand: String(brand) }),
        ...(status && { status: String(status) }),
        ...(startDate && { startDate: new Date(String(startDate)) }),
        ...(endDate && { endDate: new Date(String(endDate)) }),
      }

      const report = await analyticsService.getProductPerformanceReport(filters)

      const response = sendSuccess(res, { report })
      res.json(response)
    } catch (error) {
      next(error)
    }
  }
)

// GET /products/:id/analytics - Get analytics for specific product
router.get(
  '/:id/analytics',
  validate({ params: commonValidationSchemas.id }),
  authorize(['products:read', 'analytics:read']),
  async (req, res, next) => {
    try {
      const { id } = req.params
      const { startDate, endDate } = req.query

      logger.info('Fetching product analytics', {
        productId: id,
        startDate,
        endDate,
        userId: req.user?.id,
      })

      const analytics = await analyticsService.getProductAnalytics(
        id,
        startDate ? new Date(String(startDate)) : undefined,
        endDate ? new Date(String(endDate)) : undefined
      )

      const response = sendSuccess(res, { analytics })
      res.json(response)
    } catch (error) {
      next(error)
    }
  }
)

// POST /products/import/csv - Import products from CSV
router.post(
  '/import/csv',
  upload.single('file'),
  authorize(['products:write', 'products:import']),
  async (req, res, next) => {
    try {
      const file = req.file
      const { updateExisting, skipInvalid, validateOnly } = req.body

      if (!file) {
        return res
          .status(400)
          .json(
            sendError(res, 'CSV_FILE_REQUIRED', 'CSV file is required', 400)
          )
      }

      logger.info('Starting CSV product import', {
        filename: file.originalname,
        size: file.size,
        options: { updateExisting, skipInvalid, validateOnly },
        userId: req.user?.id,
      })

      const csvContent = file.buffer.toString('utf-8')
      const result = await importExportService.importProductsFromCSV(
        csvContent,
        {
          updateExisting: updateExisting === 'true',
          skipInvalid: skipInvalid === 'true',
          validateOnly: validateOnly === 'true',
        }
      )

      const statusCode = result.success ? 200 : 400
      const message = result.success
        ? `Import completed: ${result.successfulRows} successful, ${result.failedRows} failed`
        : `Import failed: ${result.failedRows} errors`

      const response = sendSuccess(res, result, message)
      res.status(statusCode).json(response)
    } catch (error) {
      next(error)
    }
  }
)

// POST /products/import/json - Import products from JSON
router.post(
  '/import/json',
  upload.single('file'),
  authorize(['products:write', 'products:import']),
  async (req, res, next) => {
    try {
      const file = req.file
      const { updateExisting, skipInvalid, validateOnly } = req.body

      if (!file) {
        return res
          .status(400)
          .json(
            sendError(res, 'JSON_FILE_REQUIRED', 'JSON file is required', 400)
          )
      }

      logger.info('Starting JSON product import', {
        filename: file.originalname,
        size: file.size,
        options: { updateExisting, skipInvalid, validateOnly },
        userId: req.user?.id,
      })

      const jsonContent = file.buffer.toString('utf-8')
      const result = await importExportService.importProductsFromJSON(
        jsonContent,
        {
          updateExisting: updateExisting === 'true',
          skipInvalid: skipInvalid === 'true',
          validateOnly: validateOnly === 'true',
        }
      )

      const statusCode = result.success ? 200 : 400
      const message = result.success
        ? `Import completed: ${result.successfulRows} successful, ${result.failedRows} failed`
        : `Import failed: ${result.failedRows} errors`

      const response = sendSuccess(res, result, message)
      res.status(statusCode).json(response)
    } catch (error) {
      next(error)
    }
  }
)

// POST /products/export - Export products
router.post(
  '/export',
  validate({ body: productExportSchema }),
  authorize(['products:read', 'products:export']),
  async (req, res, next) => {
    try {
      const exportOptions = req.body as z.infer<typeof productExportSchema>

      logger.info('Starting product export', {
        format: exportOptions.format,
        filters: exportOptions.filters,
        userId: req.user?.id,
      })

      const result = await importExportService.exportProducts(
        exportOptions.filters || {},
        {
          format: exportOptions.format,
          fields: exportOptions.fields,
          includeVariants: true,
          includeImages: true,
          includeInventory: true,
        }
      )

      const response = sendSuccess(res, result, 'Export completed successfully')
      res.json(response)
    } catch (error) {
      next(error)
    }
  }
)

// GET /products/search/suggestions - Get search suggestions
router.get(
  '/search/suggestions',
  authorize(['products:read']),
  async (req, res, next) => {
    try {
      const { q, limit } = req.query

      if (!q || typeof q !== 'string') {
        return res
          .status(400)
          .json(
            sendError(
              res,
              'QUERY_PARAMETER_REQUIRED',
              'Query parameter "q" is required',
              400
            )
          )
      }

      logger.info('Fetching search suggestions', {
        query: q,
        limit,
        userId: req.user?.id,
      })

      const suggestions = await searchService.suggestProducts(
        q,
        limit ? parseInt(String(limit)) : 10
      )

      const response = sendSuccess(res, { suggestions })
      res.json(response)
    } catch (error) {
      next(error)
    }
  }
)

// POST /products/reindex - Reindex all products in search engine
router.post(
  '/reindex',
  authorize(['products:write', 'admin']),
  async (req, res, next) => {
    try {
      logger.info('Starting product reindexing', { userId: req.user?.id })

      // Get all products
      const products = await prisma.product.findMany({
        where: { deletedAt: null },
        include: {
          variants: {
            where: { isActive: true },
          },
          images: {
            orderBy: { sortOrder: 'asc' },
          },
          category: true,
          collections: {
            include: { collection: true },
          },
        },
      })

      // Reindex in search engine
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await searchService.reindexAllProducts(products as any)

      const response = sendSuccess(
        res,
        { reindexedCount: products.length },
        `${products.length} products reindexed successfully`
      )
      res.json(response)
    } catch (error) {
      next(error)
    }
  }
)

// DELETE /products/:id/images/:imageId - Delete product image
router.delete(
  '/:id/images/:imageId',
  validate({
    params: z.object({
      id: commonValidationSchemas.id,
      imageId: z.string().uuid(),
    }),
  }),
  authorize(['products:write']),
  async (req, res, next) => {
    try {
      const { id, imageId } = req.params

      logger.info('Deleting product image', {
        productId: id,
        imageId,
        userId: req.user?.id,
      })

      // Get product
      const product = await productService.getProduct(id)
      if (!product) {
        return res
          .status(404)
          .json(sendError(res, 'NOT_FOUND', 'Product not found', 404))
      }

      // Find and remove image
      const imageIndex = product.images.findIndex((img) => img.id === imageId)
      if (imageIndex === -1) {
        return res
          .status(404)
          .json(sendError(res, 'NOT_FOUND', 'Image not found', 404))
      }

      // Delete image file
      await imageService.deleteImage(imageId)

      // Update product
      const updatedImages = product.images.filter((img) => img.id !== imageId)
      await productService.updateProduct(
        id,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { images: updatedImages as any },
        req.user?.id
      )

      const response = sendSuccess(res, null, 'Image deleted successfully')
      res.json(response)
    } catch (error) {
      next(error)
    }
  }
)

// Input validation for complex scenarios
const validateProductAvailability = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  req: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  res: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  next: any
) => {
  try {
    const { variants } = req.body

    // Custom validation: Check if at least one variant has inventory
    const hasInventory = variants.some(
      (variant: Record<string, unknown>) =>
        (variant.inventoryQuantity as number) > 0
    )

    if (!hasInventory) {
      return res
        .status(400)
        .json(
          sendError(
            res,
            'INVENTORY_REQUIRED',
            'At least one variant must have inventory available',
            400
          )
        )
    }

    next()
  } catch (error) {
    next(error)
  }
}

// POST /products with custom validation
router.post(
  '/with-inventory-check',
  validate({ body: createProductSchema }),
  validateProductAvailability,
  authorize(['products:write']),
  async (req, res, next) => {
    try {
      const productData = req.body as z.infer<typeof createProductSchema>

      const newProduct = await productService.createProduct(
        productData,
        req.user?.id
      )

      const response = sendSuccess(
        res,
        { product: newProduct },
        'Product created with inventory validation'
      )
      res.status(201).json(response)
    } catch (error) {
      next(error)
    }
  }
)

export default router
