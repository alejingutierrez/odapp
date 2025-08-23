import { z } from 'zod'

import {
  uuidSchema,
  slugSchema,
  colorHexSchema,
  skuSchema,
  sanitizeString,
  sanitizeHtmlTransform,
  searchSchema,
} from './common.js'

// Product status enum
export const productStatusSchema = z.enum(['draft', 'active', 'archived'])

// Product variant schema
export const productVariantSchema = z.object({
  id: uuidSchema.optional(),
  sku: skuSchema,
  size: z
    .string()
    .min(1, 'Size is required')
    .max(20, 'Size must be less than 20 characters'),
  color: z
    .string()
    .min(1, 'Color is required')
    .max(50, 'Color must be less than 50 characters'),
  colorHex: colorHexSchema.optional(),
  material: z
    .string()
    .max(100, 'Material must be less than 100 characters')
    .optional(),
  price: z.number().min(0, 'Price must be positive'),
  compareAtPrice: z
    .number()
    .min(0, 'Compare at price must be positive')
    .optional(),
  cost: z.number().min(0, 'Cost must be positive').optional(),
  weight: z.number().min(0, 'Weight must be positive').optional(),
  dimensions: z
    .object({
      length: z.number().min(0),
      width: z.number().min(0),
      height: z.number().min(0),
    })
    .optional(),
  barcode: z
    .string()
    .max(50, 'Barcode must be less than 50 characters')
    .optional(),
  inventoryQuantity: z
    .number()
    .int()
    .min(0, 'Inventory quantity must be non-negative')
    .default(0),
  inventoryPolicy: z.enum(['deny', 'continue']).default('deny'),
  requiresShipping: z.boolean().default(true),
  taxable: z.boolean().default(true),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
})

// Product image schema
export const productImageSchema = z.object({
  id: uuidSchema.optional(),
  url: z.string().url('Invalid image URL'),
  altText: z
    .string()
    .max(255, 'Alt text must be less than 255 characters')
    .optional(),
  position: z.number().int().min(0, 'Position must be non-negative').default(0),
  width: z.number().int().min(1, 'Width must be positive').optional(),
  height: z.number().int().min(1, 'Height must be positive').optional(),
})

// Product SEO schema
export const productSeoSchema = z.object({
  title: z
    .string()
    .max(60, 'SEO title must be less than 60 characters')
    .optional(),
  description: z
    .string()
    .max(160, 'SEO description must be less than 160 characters')
    .optional(),
  keywords: z
    .array(z.string())
    .max(10, 'Maximum 10 keywords allowed')
    .optional(),
})

// Product category schema
export const productCategorySchema = z.object({
  id: uuidSchema.optional(),
  name: z
    .string()
    .min(1, 'Category name is required')
    .max(100, 'Category name must be less than 100 characters'),
  slug: slugSchema,
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  parentId: uuidSchema.optional(),
  image: productImageSchema.optional(),
  seo: productSeoSchema.optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
})

// Product collection schema
export const productCollectionSchema = z.object({
  id: uuidSchema.optional(),
  name: z
    .string()
    .min(1, 'Collection name is required')
    .max(100, 'Collection name must be less than 100 characters'),
  slug: slugSchema,
  description: sanitizeHtmlTransform.optional(),
  image: productImageSchema.optional(),
  seo: productSeoSchema.optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
  conditions: z
    .array(
      z.object({
        field: z.string(),
        operator: z.enum([
          'equals',
          'contains',
          'starts_with',
          'ends_with',
          'greater_than',
          'less_than',
        ]),
        value: z.string(),
      })
    )
    .optional(),
})

// Main product schema
export const productSchema = z.object({
  id: uuidSchema.optional(),
  name: z
    .string()
    .min(1, 'Product name is required')
    .max(255, 'Product name must be less than 255 characters')
    .transform(sanitizeString),
  slug: slugSchema,
  description: sanitizeHtmlTransform.optional(),
  shortDescription: z
    .string()
    .max(500, 'Short description must be less than 500 characters')
    .optional(),
  status: productStatusSchema.default('draft'),
  vendor: z
    .string()
    .max(100, 'Vendor must be less than 100 characters')
    .optional(),
  productType: z
    .string()
    .max(100, 'Product type must be less than 100 characters')
    .optional(),
  tags: z
    .array(z.string().max(50, 'Tag must be less than 50 characters'))
    .max(20, 'Maximum 20 tags allowed')
    .default([]),
  images: z
    .array(productImageSchema)
    .max(10, 'Maximum 10 images allowed')
    .default([]),
  variants: z
    .array(productVariantSchema)
    .min(1, 'At least one variant is required'),
  categoryId: uuidSchema.optional(),
  collectionIds: z
    .array(uuidSchema)
    .max(10, 'Maximum 10 collections allowed')
    .default([]),
  seo: productSeoSchema.optional(),
  metafields: z.record(z.any()).optional(),
  publishedAt: z.string().datetime().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
})

// Product creation schema (without optional fields that are auto-generated)
export const createProductSchema = productSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  publishedAt: true,
})

// Product update schema (all fields optional except id)
export const updateProductSchema = productSchema.partial().extend({
  id: uuidSchema,
})

// Product query schemas
export const productQuerySchema = searchSchema.extend({
  status: productStatusSchema.optional(),
  categoryId: uuidSchema.optional(),
  collectionId: uuidSchema.optional(),
  vendor: z.string().optional(),
  productType: z.string().optional(),
  tags: z.array(z.string()).optional(),
  priceMin: z.coerce.number().min(0).optional(),
  priceMax: z.coerce.number().min(0).optional(),
  inStock: z.coerce.boolean().optional(),
})

// Bulk product operations
export const bulkProductUpdateSchema = z.object({
  productIds: z.array(uuidSchema).min(1, 'At least one product ID is required'),
  updates: z.object({
    status: productStatusSchema.optional(),
    categoryId: uuidSchema.optional(),
    tags: z.array(z.string()).optional(),
    vendor: z.string().optional(),
    productType: z.string().optional(),
  }),
})

export const bulkProductDeleteSchema = z.object({
  productIds: z.array(uuidSchema).min(1, 'At least one product ID is required'),
})

// Product import/export schemas
export const productImportSchema = z.object({
  products: z.array(createProductSchema),
  options: z
    .object({
      updateExisting: z.boolean().default(false),
      skipInvalid: z.boolean().default(true),
    })
    .optional(),
})

export const productExportSchema = z.object({
  format: z.enum(['csv', 'json', 'xlsx']).default('csv'),
  filters: productQuerySchema.omit({ page: true, limit: true }).optional(),
  fields: z.array(z.string()).optional(),
})

// Type exports
export type ProductStatus = z.infer<typeof productStatusSchema>
export type ProductVariant = z.infer<typeof productVariantSchema>
export type ProductImage = z.infer<typeof productImageSchema>
export type ProductSeo = z.infer<typeof productSeoSchema>
export type ProductCategory = z.infer<typeof productCategorySchema>
export type ProductCollection = z.infer<typeof productCollectionSchema>
export type Product = z.infer<typeof productSchema>
export type CreateProduct = z.infer<typeof createProductSchema>
export type UpdateProduct = z.infer<typeof updateProductSchema>
export type ProductQuery = z.infer<typeof productQuerySchema>
export type BulkProductUpdate = z.infer<typeof bulkProductUpdateSchema>
export type BulkProductDelete = z.infer<typeof bulkProductDeleteSchema>
export type ProductImport = z.infer<typeof productImportSchema>
export type ProductExport = z.infer<typeof productExportSchema>
