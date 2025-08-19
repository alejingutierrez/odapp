import { Router } from 'express'
import { z } from 'zod'
import { validate, xssProtection } from '../middleware/validation.js'
import { authenticate, authorize } from '../middleware/auth.js'
import { productCollectionSchema, commonValidationSchemas } from '@oda/shared'
import { ApiResponse } from '../lib/api-response.js'
import { logger } from '../lib/logger.js'
import { prisma } from '../lib/prisma.js'
import { CacheManager } from '../lib/cache/cache-manager.js'

const router = Router()
const cache = new CacheManager()

// Apply authentication and XSS protection to all routes
router.use(authenticate)
router.use(xssProtection())

// Collection validation schemas
const createCollectionSchema = productCollectionSchema.omit({ id: true })
const updateCollectionSchema = productCollectionSchema.partial().extend({
  id: commonValidationSchemas.id.shape.id
})

const addProductsSchema = z.object({
  productIds: z.array(z.string().uuid()).min(1, 'At least one product ID is required')
})

const removeProductsSchema = z.object({
  productIds: z.array(z.string().uuid()).min(1, 'At least one product ID is required')
})

// GET /collections - List collections
router.get('/',
  authorize(['products:read']),
  async (req, res, next) => {
    try {
      const { includeInactive, page = 1, limit = 20 } = req.query
      
      logger.info('Fetching collections', { 
        includeInactive,
        page,
        limit,
        userId: req.user?.id 
      })

      const pageNum = parseInt(String(page))
      const limitNum = parseInt(String(limit))
      const skip = (pageNum - 1) * limitNum

      const cacheKey = `collections:list:${includeInactive}:${page}:${limit}`
      
      // Try cache first
      let result = await cache.get(cacheKey)
      
      if (!result) {
        const [collections, total] = await Promise.all([
          prisma.collection.findMany({
            where: includeInactive !== 'true' ? { isActive: true } : {},
            include: {
              _count: {
                select: {
                  products: {
                    where: {
                      product: { deletedAt: null, isActive: true }
                    }
                  }
                }
              }
            },
            orderBy: [
              { sortOrder: 'asc' },
              { name: 'asc' }
            ],
            skip,
            take: limitNum
          }),
          prisma.collection.count({
            where: includeInactive !== 'true' ? { isActive: true } : {}
          })
        ])

        result = {
          collections,
          total,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum)
          }
        }

        // Cache for 5 minutes
        await cache.set(cacheKey, result, 300)
      }

      const response = ApiResponse.success(result)
      res.json(response)
    } catch (error) {
      next(error)
    }
  }
)

// GET /collections/:id - Get single collection
router.get('/:id',
  validate({ params: commonValidationSchemas.id }),
  authorize(['products:read']),
  async (req, res, next) => {
    try {
      const { id } = req.params
      const { includeProducts = 'true', productLimit = 20 } = req.query
      
      logger.info('Fetching collection', { 
        collectionId: id,
        includeProducts,
        userId: req.user?.id 
      })

      const collection = await prisma.collection.findFirst({
        where: { id },
        include: {
          ...(includeProducts === 'true' && {
            products: {
              where: {
                product: { deletedAt: null, isActive: true }
              },
              include: {
                product: {
                  include: {
                    images: {
                      take: 1,
                      orderBy: { sortOrder: 'asc' }
                    },
                    variants: {
                      where: { isActive: true },
                      take: 1,
                      orderBy: { createdAt: 'asc' }
                    }
                  }
                }
              },
              orderBy: { sortOrder: 'asc' },
              take: parseInt(String(productLimit))
            }
          }),
          _count: {
            select: {
              products: {
                where: {
                  product: { deletedAt: null, isActive: true }
                }
              }
            }
          }
        }
      })

      if (!collection) {
        return res.status(404).json(
          ApiResponse.error('Collection not found', 404)
        )
      }

      const response = ApiResponse.success({ collection })
      res.json(response)
    } catch (error) {
      next(error)
    }
  }
)

// POST /collections - Create new collection
router.post('/',
  validate({ body: createCollectionSchema }),
  authorize(['products:write', 'collections:write']),
  async (req, res, next) => {
    try {
      const collectionData = req.body
      
      logger.info('Creating collection', { 
        collectionName: collectionData.name,
        userId: req.user?.id 
      })

      // Check for duplicate slug
      const existingCollection = await prisma.collection.findFirst({
        where: { slug: collectionData.slug }
      })
      if (existingCollection) {
        return res.status(400).json(
          ApiResponse.error('Collection with this slug already exists', 400)
        )
      }

      const newCollection = await prisma.collection.create({
        data: {
          name: collectionData.name,
          slug: collectionData.slug,
          description: collectionData.description,
          image: collectionData.image?.url,
          isActive: collectionData.isActive !== false,
          sortOrder: collectionData.sortOrder || 0,
          rules: collectionData.conditions ? JSON.stringify(collectionData.conditions) : null,
          metaTitle: collectionData.seo?.title,
          metaDescription: collectionData.seo?.description
        },
        include: {
          _count: {
            select: {
              products: true
            }
          }
        }
      })

      // Clear collection caches
      await cache.deletePattern('collections:*')

      logger.info('Collection created successfully', { 
        collectionId: newCollection.id,
        collectionName: newCollection.name,
        userId: req.user?.id 
      })

      const response = ApiResponse.success({ collection: newCollection }, 'Collection created successfully', 201)
      res.status(201).json(response)
    } catch (error) {
      next(error)
    }
  }
)

// PUT /collections/:id - Update collection
router.put('/:id',
  validate({ 
    params: commonValidationSchemas.id,
    body: updateCollectionSchema.omit({ id: true })
  }),
  authorize(['products:write', 'collections:write']),
  async (req, res, next) => {
    try {
      const { id } = req.params
      const updateData = req.body
      
      logger.info('Updating collection', { 
        collectionId: id,
        userId: req.user?.id 
      })

      // Check if collection exists
      const existingCollection = await prisma.collection.findFirst({
        where: { id }
      })
      if (!existingCollection) {
        return res.status(404).json(
          ApiResponse.error('Collection not found', 404)
        )
      }

      // Check for duplicate slug if slug is being updated
      if (updateData.slug && updateData.slug !== existingCollection.slug) {
        const duplicateSlug = await prisma.collection.findFirst({
          where: { 
            slug: updateData.slug,
            id: { not: id }
          }
        })
        if (duplicateSlug) {
          return res.status(400).json(
            ApiResponse.error('Collection with this slug already exists', 400)
          )
        }
      }

      const updatedCollection = await prisma.collection.update({
        where: { id },
        data: {
          ...(updateData.name && { name: updateData.name }),
          ...(updateData.slug && { slug: updateData.slug }),
          ...(updateData.description !== undefined && { description: updateData.description }),
          ...(updateData.image && { image: updateData.image.url }),
          ...(updateData.isActive !== undefined && { isActive: updateData.isActive }),
          ...(updateData.sortOrder !== undefined && { sortOrder: updateData.sortOrder }),
          ...(updateData.conditions !== undefined && { 
            rules: updateData.conditions ? JSON.stringify(updateData.conditions) : null 
          }),
          ...(updateData.seo?.title !== undefined && { metaTitle: updateData.seo.title }),
          ...(updateData.seo?.description !== undefined && { metaDescription: updateData.seo.description })
        },
        include: {
          _count: {
            select: {
              products: true
            }
          }
        }
      })

      // Clear collection caches
      await cache.deletePattern('collections:*')

      logger.info('Collection updated successfully', { 
        collectionId: id,
        userId: req.user?.id 
      })

      const response = ApiResponse.success({ collection: updatedCollection }, 'Collection updated successfully')
      res.json(response)
    } catch (error) {
      next(error)
    }
  }
)

// DELETE /collections/:id - Delete collection
router.delete('/:id',
  validate({ params: commonValidationSchemas.id }),
  authorize(['products:delete', 'collections:delete']),
  async (req, res, next) => {
    try {
      const { id } = req.params
      
      logger.info('Deleting collection', { 
        collectionId: id,
        userId: req.user?.id 
      })

      // Check if collection exists
      const collection = await prisma.collection.findFirst({
        where: { id }
      })

      if (!collection) {
        return res.status(404).json(
          ApiResponse.error('Collection not found', 404)
        )
      }

      await prisma.$transaction(async (tx) => {
        // Remove all product associations
        await tx.collectionProduct.deleteMany({
          where: { collectionId: id }
        })

        // Delete the collection
        await tx.collection.delete({
          where: { id }
        })
      })

      // Clear collection caches
      await cache.deletePattern('collections:*')

      logger.info('Collection deleted successfully', { 
        collectionId: id,
        userId: req.user?.id 
      })

      const response = ApiResponse.success(null, 'Collection deleted successfully')
      res.json(response)
    } catch (error) {
      next(error)
    }
  }
)

// POST /collections/:id/products - Add products to collection
router.post('/:id/products',
  validate({ 
    params: commonValidationSchemas.id,
    body: addProductsSchema
  }),
  authorize(['products:write', 'collections:write']),
  async (req, res, next) => {
    try {
      const { id } = req.params
      const { productIds } = req.body
      
      logger.info('Adding products to collection', { 
        collectionId: id,
        productCount: productIds.length,
        userId: req.user?.id 
      })

      // Check if collection exists
      const collection = await prisma.collection.findFirst({
        where: { id }
      })
      if (!collection) {
        return res.status(404).json(
          ApiResponse.error('Collection not found', 404)
        )
      }

      // Validate all products exist
      const existingProducts = await prisma.product.findMany({
        where: {
          id: { in: productIds },
          deletedAt: null
        },
        select: { id: true }
      })

      if (existingProducts.length !== productIds.length) {
        const foundIds = existingProducts.map(p => p.id)
        const missingIds = productIds.filter(id => !foundIds.includes(id))
        return res.status(404).json(
          ApiResponse.error(`Products not found: ${missingIds.join(', ')}`, 404)
        )
      }

      // Get current max sort order
      const maxSortOrder = await prisma.collectionProduct.aggregate({
        where: { collectionId: id },
        _max: { sortOrder: true }
      })

      const startSortOrder = (maxSortOrder._max.sortOrder || 0) + 1

      // Add products to collection (ignore duplicates)
      const collectionProducts = productIds.map((productId, index) => ({
        collectionId: id,
        productId,
        sortOrder: startSortOrder + index
      }))

      await prisma.collectionProduct.createMany({
        data: collectionProducts,
        skipDuplicates: true
      })

      // Get updated collection with product count
      const updatedCollection = await prisma.collection.findFirst({
        where: { id },
        include: {
          _count: {
            select: {
              products: true
            }
          }
        }
      })

      // Clear collection caches
      await cache.deletePattern('collections:*')

      logger.info('Products added to collection successfully', { 
        collectionId: id,
        addedCount: productIds.length,
        userId: req.user?.id 
      })

      const response = ApiResponse.success(
        { 
          collection: updatedCollection,
          addedCount: productIds.length
        },
        `${productIds.length} products added to collection`
      )
      res.json(response)
    } catch (error) {
      next(error)
    }
  }
)

// DELETE /collections/:id/products - Remove products from collection
router.delete('/:id/products',
  validate({ 
    params: commonValidationSchemas.id,
    body: removeProductsSchema
  }),
  authorize(['products:write', 'collections:write']),
  async (req, res, next) => {
    try {
      const { id } = req.params
      const { productIds } = req.body
      
      logger.info('Removing products from collection', { 
        collectionId: id,
        productCount: productIds.length,
        userId: req.user?.id 
      })

      // Check if collection exists
      const collection = await prisma.collection.findFirst({
        where: { id }
      })
      if (!collection) {
        return res.status(404).json(
          ApiResponse.error('Collection not found', 404)
        )
      }

      // Remove products from collection
      const result = await prisma.collectionProduct.deleteMany({
        where: {
          collectionId: id,
          productId: { in: productIds }
        }
      })

      // Get updated collection with product count
      const updatedCollection = await prisma.collection.findFirst({
        where: { id },
        include: {
          _count: {
            select: {
              products: true
            }
          }
        }
      })

      // Clear collection caches
      await cache.deletePattern('collections:*')

      logger.info('Products removed from collection successfully', { 
        collectionId: id,
        removedCount: result.count,
        userId: req.user?.id 
      })

      const response = ApiResponse.success(
        { 
          collection: updatedCollection,
          removedCount: result.count
        },
        `${result.count} products removed from collection`
      )
      res.json(response)
    } catch (error) {
      next(error)
    }
  }
)

// POST /collections/:id/reorder - Reorder collection
router.post('/:id/reorder',
  validate({ 
    params: commonValidationSchemas.id,
    body: z.object({
      sortOrder: z.number().int().min(0)
    })
  }),
  authorize(['products:write', 'collections:write']),
  async (req, res, next) => {
    try {
      const { id } = req.params
      const { sortOrder } = req.body
      
      logger.info('Reordering collection', { 
        collectionId: id,
        sortOrder,
        userId: req.user?.id 
      })

      const updatedCollection = await prisma.collection.update({
        where: { id },
        data: { sortOrder }
      })

      // Clear collection caches
      await cache.deletePattern('collections:*')

      const response = ApiResponse.success({ collection: updatedCollection }, 'Collection reordered successfully')
      res.json(response)
    } catch (error) {
      next(error)
    }
  }
)

// POST /collections/:id/products/reorder - Reorder products within collection
router.post('/:id/products/reorder',
  validate({ 
    params: commonValidationSchemas.id,
    body: z.object({
      productOrders: z.array(z.object({
        productId: z.string().uuid(),
        sortOrder: z.number().int().min(0)
      })).min(1)
    })
  }),
  authorize(['products:write', 'collections:write']),
  async (req, res, next) => {
    try {
      const { id } = req.params
      const { productOrders } = req.body
      
      logger.info('Reordering products in collection', { 
        collectionId: id,
        productCount: productOrders.length,
        userId: req.user?.id 
      })

      // Update product orders in transaction
      await prisma.$transaction(async (tx) => {
        for (const { productId, sortOrder } of productOrders) {
          await tx.collectionProduct.updateMany({
            where: {
              collectionId: id,
              productId
            },
            data: { sortOrder }
          })
        }
      })

      // Clear collection caches
      await cache.deletePattern('collections:*')

      const response = ApiResponse.success(
        { reorderedCount: productOrders.length },
        'Products reordered successfully'
      )
      res.json(response)
    } catch (error) {
      next(error)
    }
  }
)

// GET /collections/:id/products - Get collection products
router.get('/:id/products',
  validate({ params: commonValidationSchemas.id }),
  authorize(['products:read']),
  async (req, res, next) => {
    try {
      const { id } = req.params
      const { page = 1, limit = 20, sortBy = 'sortOrder', sortOrder = 'asc' } = req.query
      
      logger.info('Fetching collection products', { 
        collectionId: id,
        page,
        limit,
        sortBy,
        sortOrder,
        userId: req.user?.id 
      })

      const pageNum = parseInt(String(page))
      const limitNum = parseInt(String(limit))
      const skip = (pageNum - 1) * limitNum

      // Build order by
      const orderBy: any = {}
      if (sortBy === 'sortOrder') {
        orderBy.sortOrder = sortOrder
      } else if (sortBy === 'name') {
        orderBy.product = { name: sortOrder }
      } else if (sortBy === 'price') {
        orderBy.product = { price: sortOrder }
      } else if (sortBy === 'createdAt') {
        orderBy.product = { createdAt: sortOrder }
      }

      const [collectionProducts, total] = await Promise.all([
        prisma.collectionProduct.findMany({
          where: {
            collectionId: id,
            product: { deletedAt: null, isActive: true }
          },
          include: {
            product: {
              include: {
                images: {
                  take: 1,
                  orderBy: { sortOrder: 'asc' }
                },
                variants: {
                  where: { isActive: true },
                  take: 1,
                  orderBy: { createdAt: 'asc' }
                },
                category: true
              }
            }
          },
          orderBy,
          skip,
          take: limitNum
        }),
        prisma.collectionProduct.count({
          where: {
            collectionId: id,
            product: { deletedAt: null, isActive: true }
          }
        })
      ])

      const products = collectionProducts.map(cp => ({
        ...cp.product,
        collectionSortOrder: cp.sortOrder
      }))

      const response = ApiResponse.success({
        products,
        total,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      })
      res.json(response)
    } catch (error) {
      next(error)
    }
  }
)

export default router