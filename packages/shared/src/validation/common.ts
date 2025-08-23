import { z } from 'zod'

// Common validation schemas
export const emailSchema = z.string().email('Invalid email format')
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  )

export const phoneSchema = z
  .string()
  .regex(/^\+?[\d\s-()]+$/, 'Invalid phone number')

export const urlSchema = z.string().url('Invalid URL format')

export const slugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format')

export const colorHexSchema = z
  .string()
  .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color format')

export const currencySchema = z
  .string()
  .regex(/^[A-Z]{3}$/, 'Invalid currency code (must be 3 uppercase letters)')

export const skuSchema = z
  .string()
  .min(1, 'SKU is required')
  .max(50, 'SKU must be less than 50 characters')
  .regex(
    /^[A-Z0-9-_]+$/,
    'SKU can only contain uppercase letters, numbers, hyphens, and underscores'
  )

// Pagination schema
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export type PaginationParams = z.infer<typeof paginationSchema>

// Search and filter schemas
export const searchSchema = z.object({
  q: z.string().optional(),
  filters: z.record(z.any()).optional(),
  ...paginationSchema.shape,
})

export type SearchParams = z.infer<typeof searchSchema>

// Date range schema
export const dateRangeSchema = z
  .object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  })
  .refine(
    (data) =>
      !data.startDate ||
      !data.endDate ||
      new Date(data.startDate) <= new Date(data.endDate),
    { message: 'Start date must be before end date', path: ['endDate'] }
  )

// ID validation schemas
export const uuidSchema = z.string().uuid('Invalid UUID format')
export const mongoIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId format')

// File upload schemas
export const imageFileSchema = z.object({
  filename: z.string(),
  mimetype: z
    .string()
    .regex(/^image\/(jpeg|jpg|png|gif|webp)$/, 'Invalid image format'),
  size: z.number().max(5 * 1024 * 1024, 'Image size must be less than 5MB'),
})

// Sanitization helpers
export const sanitizeString = (str: string): string => {
  return str
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<[^>]*>/g, '') // Remove all HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .replace(/data:/gi, '') // Remove data: protocol
}

export const sanitizeHtml = (str: string): string => {
  // Basic HTML sanitization - remove script tags and dangerous attributes
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/javascript:/gi, '')
    .trim()
}

export const sanitizeHtmlTransform = z.string().transform(sanitizeHtml)

// Common validation schemas for reuse across routes
export const commonValidationSchemas = {
  id: z.string().uuid('Invalid UUID format'),
  pagination: paginationSchema,
  search: searchSchema,
  dateRange: dateRangeSchema,
} as const
