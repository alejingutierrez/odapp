import { productCategorySchema, commonValidationSchemas } from '@oda/shared'
import { Router } from 'express'
import { z } from 'zod'

import { sendSuccess, sendCreated, sendError, sendNotFound } from '../lib/api-response.js'
import { CacheManager } from '../lib/cache/cache-manager.js'
import { logger } from '../lib/logger.js'
import { prisma } from '../lib/prisma.js'
import { authenticate, authorize } from '../middleware/auth.js'
import { validate, xssProtection } from '../middleware/validation.js'

const router = Router()
const cache = new CacheManager()

// Apply authentication and XSS protection to all routes
router.use(authenticate)
router.use(xssProtection())

// Category validation schemas
const createCategorySchema = productCategorySchema.omit({ id: true })
const updateCategorySchema = productCategorySchema.partial().extend({
  id: z.string().uuid(),
})

// GET /categories - List categories with hierarchy
router.get('/', async (req, res, next) => {
  try {
    const { includeInactive, parentId } = req.query

    logger.info('Fetching categories', {
      includeInactive,
      parentId,
      userId: req.user?.id,
    })

    const cacheKey = `categories:list:${includeInactive}:${parentId}`

    // Try cache first
    let categories = await cache.get(cacheKey)

    if (!categories) {
      categories = await prisma.category.findMany({
        where: {
          ...(includeInactive !== 'true' && { isActive: true }),
          ...(parentId && { parentId: parentId as string }),
        },
        include: {
          parent: true,
          children: {
            where: includeInactive !== 'true' ? { isActive: true } : {},
            orderBy: { sortOrder: 'asc' },
          },
          _count: {
            select: {
              products: {
                where: { deletedAt: null, isActive: true },
              },
              children: true,
            },
          },
        },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      })

      // Cache for 10 minutes
      await cache.set(cacheKey, categories, { ttl: 600 })
    }

    sendSuccess(res, { categories })
  } catch (error) {
    next(error)
  }
})

// GET /categories/tree - Get category tree structure
router.get('/tree', async (req, res, next) => {
  try {
    const { includeInactive } = req.query

    logger.info('Fetching category tree', {
      includeInactive,
      userId: req.user?.id,
    })

    const cacheKey = `categories:tree:${includeInactive}`

    let categoryTree = await cache.get(cacheKey)

    if (!categoryTree) {
      // Get all categories
      const categories = await prisma.category.findMany({
        where: includeInactive !== 'true' ? { isActive: true } : {},
        include: {
          _count: {
            select: {
              products: {
                where: { deletedAt: null, isActive: true },
              },
            },
          },
        },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      })

      // Build tree structure
      const categoryMap = new Map()
      const rootCategories: unknown[] = []

      // First pass: create map of all categories
      categories.forEach((category) => {
        categoryMap.set(category.id, {
          ...category,
          children: [],
        })
      })

      // Second pass: build hierarchy
      categories.forEach((category) => {
        if (category.parentId) {
          const parent = categoryMap.get(category.parentId)
          if (parent) {
            parent.children.push(categoryMap.get(category.id))
          }
        } else {
          rootCategories.push(categoryMap.get(category.id))
        }
      })

      categoryTree = rootCategories

      // Cache for 15 minutes
      await cache.set(cacheKey, categoryTree, { ttl: 900 })
    }

    sendSuccess(res, { categoryTree })
  } catch (error) {
    next(error)
  }
})

// GET /categories/:id - Get single category
router.get(
  '/:id',
  validate({ params: z.object({ id: z.string().uuid() }) }),
  async (req, res, next) => {
    try {
      const { id } = req.params

      logger.info('Fetching category', { categoryId: id, userId: req.user?.id })

      const category = await prisma.category.findFirst({
        where: { id },
        include: {
          parent: true,
          children: {
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
          },
          products: {
            where: { deletedAt: null, isActive: true },
            take: 10,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              name: true,
              slug: true,
              price: true,
              images: {
                take: 1,
                orderBy: { sortOrder: 'asc' },
              },
            },
          },
          _count: {
            select: {
              products: {
                where: { deletedAt: null, isActive: true },
              },
              children: true,
            },
          },
        },
      })

      if (!category) {
        return sendNotFound(res, 'Category')
      }

        sendSuccess(res, { category })
    } catch (error) {
      next(error)
    }
  }
)

// POST /categories - Create new category
router.post(
  '/',
  validate({ body: createCategorySchema }),

  async (req, res, next) => {
    try {
      const categoryData = req.body

      logger.info('Creating category', {
        categoryName: categoryData.name,
        parentId: categoryData.parentId,
        userId: req.user?.id,
      })

      // Validate parent category exists if provided
      if (categoryData.parentId) {
        const parentCategory = await prisma.category.findFirst({
          where: { id: categoryData.parentId, isActive: true },
        })
        if (!parentCategory) {
                  return sendNotFound(res, 'Parent category')
        }
      }

      // Check for duplicate slug
      const existingCategory = await prisma.category.findFirst({
        where: { slug: categoryData.slug },
      })
      if (existingCategory) {
        return sendError(res, 'DUPLICATE_SLUG', 'Category with this slug already exists', 400)
      }

      const newCategory = await prisma.category.create({
        data: {
          name: categoryData.name,
          slug: categoryData.slug,
          description: categoryData.description,
          image: categoryData.image?.url,
          parentId: categoryData.parentId,
          sortOrder: categoryData.sortOrder || 0,
          isActive: categoryData.isActive !== false,
          metaTitle: categoryData.seo?.title,
          metaDescription: categoryData.seo?.description,
        },
        include: {
          parent: true,
          children: true,
          _count: {
            select: {
              products: true,
              children: true,
            },
          },
        },
      })

      // Clear category caches
      await cache.clear('categories')

      logger.info('Category created successfully', {
        categoryId: newCategory.id,
        categoryName: newCategory.name,
        userId: req.user?.id,
      })

      sendCreated(res, { category: newCategory })
    } catch (error) {
      next(error)
    }
  }
)

// PUT /categories/:id - Update category
router.put(
  '/:id',
  validate({
    params: z.object({ id: z.string().uuid() }),
    body: updateCategorySchema.omit({ id: true }),
  }),
  async (req, res, next) => {
    try {
      const { id } = req.params
      const updateData = req.body

      logger.info('Updating category', {
        categoryId: id,
        userId: req.user?.id,
      })

      // Check if category exists
      const existingCategory = await prisma.category.findFirst({
        where: { id },
      })
      if (!existingCategory) {
        return sendError(res, 'NOT_FOUND', 'Category not found', 404)
      }

      // Validate parent category if provided
      if (updateData.parentId && updateData.parentId !== id) {
        const parentCategory = await prisma.category.findFirst({
          where: { id: updateData.parentId, isActive: true },
        })
        if (!parentCategory) {
                  return sendNotFound(res, 'Parent category')
        }

        // Prevent circular references
        const isCircular = await checkCircularReference(id, updateData.parentId)
        if (isCircular) {
          return sendError(res, 'CIRCULAR_REFERENCE', 'Cannot create circular category reference', 400)
        }
      }

      // Check for duplicate slug if slug is being updated
      if (updateData.slug && updateData.slug !== existingCategory.slug) {
        const duplicateSlug = await prisma.category.findFirst({
          where: {
            slug: updateData.slug,
            id: { not: id },
          },
        })
        if (duplicateSlug) {
          return sendError(res, 'DUPLICATE_SLUG', 'Category with this slug already exists', 400)
        }
      }

      const updatedCategory = await prisma.category.update({
        where: { id },
        data: {
          ...(updateData.name && { name: updateData.name }),
          ...(updateData.slug && { slug: updateData.slug }),
          ...(updateData.description !== undefined && {
            description: updateData.description,
          }),
          ...(updateData.image && { image: updateData.image.url }),
          ...(updateData.parentId !== undefined && {
            parentId: updateData.parentId,
          }),
          ...(updateData.sortOrder !== undefined && {
            sortOrder: updateData.sortOrder,
          }),
          ...(updateData.isActive !== undefined && {
            isActive: updateData.isActive,
          }),
          ...(updateData.seo?.title !== undefined && {
            metaTitle: updateData.seo.title,
          }),
          ...(updateData.seo?.description !== undefined && {
            metaDescription: updateData.seo.description,
          }),
        },
        include: {
          parent: true,
          children: true,
          _count: {
            select: {
              products: true,
              children: true,
            },
          },
        },
      })

      // Clear category caches
      await cache.clear('categories')

      logger.info('Category updated successfully', {
        categoryId: id,
        userId: req.user?.id,
      })

      const response = sendSuccess(res, 
        { category: updatedCategory },
        'Category updated successfully'
      )
      res.json(response)
    } catch (error) {
      next(error)
    }
  }
)

// DELETE /categories/:id - Delete category
router.delete(
  '/:id',
  validate({ params: commonValidationSchemas.id }),
  authorize(['products:delete', 'categories:delete']),
  async (req, res, next) => {
    try {
      const { id } = req.params

      logger.info('Deleting category', {
        categoryId: id,
        userId: req.user?.id,
      })

      // Check if category exists
      const category = await prisma.category.findFirst({
        where: { id },
        include: {
          children: true,
          _count: {
            select: {
              products: {
                where: { deletedAt: null },
              },
            },
          },
        },
      })

      if (!category) {
        return sendNotFound(res, 'Category')
      }

      // Check if category has products
      if (category._count.products > 0) {
        return sendError(res, 'CATEGORY_HAS_PRODUCTS', 'Cannot delete category with products. Move products to another category first.', 400)
      }

      // Check if category has children
      if (category.children.length > 0) {
        return sendError(res, 'CATEGORY_HAS_CHILDREN', 'Cannot delete category with subcategories. Delete or move subcategories first.', 400)
      }

      await prisma.category.delete({
        where: { id },
      })

      // Clear category caches
      await cache.clear('categories')

      logger.info('Category deleted successfully', {
        categoryId: id,
        userId: req.user?.id,
      })

      const response = sendSuccess(res, 
        null,
        'Category deleted successfully'
      )
      res.json(response)
    } catch (error) {
      next(error)
    }
  }
)

// POST /categories/:id/reorder - Reorder categories
router.post(
  '/:id/reorder',
  validate({
    params: commonValidationSchemas.id,
    body: z.object({
      sortOrder: z.number().int().min(0),
    }),
  }),
  authorize(['products:write', 'categories:write']),
  async (req, res, next) => {
    try {
      const { id } = req.params
      const { sortOrder } = req.body

      logger.info('Reordering category', {
        categoryId: id,
        sortOrder,
        userId: req.user?.id,
      })

      const updatedCategory = await prisma.category.update({
        where: { id },
        data: { sortOrder },
      })

      // Clear category caches
      await cache.clear('categories')

      const response = sendSuccess(res, 
        { category: updatedCategory },
        'Category reordered successfully'
      )
      res.json(response)
    } catch (error) {
      next(error)
    }
  }
)

// Helper function to check circular references
async function checkCircularReference(
  categoryId: string,
  parentId: string
): Promise<boolean> {
  if (categoryId === parentId) {
    return true
  }

  const parent = await prisma.category.findFirst({
    where: { id: parentId },
    select: { parentId: true },
  })

  if (!parent || !parent.parentId) {
    return false
  }

  return checkCircularReference(categoryId, parent.parentId)
}

export default router
