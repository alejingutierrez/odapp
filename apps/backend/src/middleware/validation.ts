import { Request, Response, NextFunction } from 'express'
import { z, ZodError, ZodSchema } from 'zod'

import { ApiError } from '../lib/errors.js'

// Create a simple logger fallback for tests
const createLogger = () => {
  try {
    // Use dynamic import but handle it synchronously for now

    const loggerModule = require('../lib/logger.js')
    return loggerModule.logger || loggerModule.default
  } catch {
    return {
      warn: () => {},
      info: () => {},
      error: () => {},
    }
  }
}

const logger = createLogger()

// Validation middleware factory
export const validate = (schema: {
  body?: ZodSchema
  query?: ZodSchema
  params?: ZodSchema
  headers?: ZodSchema
}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      if (schema.body) {
        req.body = await schema.body.parseAsync(req.body)
      }

      // Validate query parameters
      if (schema.query) {
        req.query = await schema.query.parseAsync(req.query)
      }

      // Validate route parameters
      if (schema.params) {
        req.params = await schema.params.parseAsync(req.params)
      }

      // Validate headers
      if (schema.headers) {
        req.headers = await schema.headers.parseAsync(req.headers)
      }

      next()
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
          received: (err as { received?: unknown }).received || undefined,
        }))

        logger.warn('Validation error', {
          path: req.path,
          method: req.method,
          errors: validationErrors,
          body: req.body,
          query: req.query,
          params: req.params,
        })

        return next(new ApiError(400, 'Validation failed', validationErrors))
      }

      next(error)
    }
  }
}

// Sanitization middleware
export const sanitize = (fields: string[] = []) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Sanitize specified fields in request body
      if (req.body && typeof req.body === 'object') {
        for (const field of fields) {
          if (req.body[field] && typeof req.body[field] === 'string') {
            req.body[field] = sanitizeInput(req.body[field])
          }
        }
      }

      // Sanitize query parameters
      if (req.query && typeof req.query === 'object') {
        for (const [key, value] of Object.entries(req.query)) {
          if (typeof value === 'string' && fields.includes(key)) {
            req.query[key] = sanitizeInput(value)
          }
        }
      }

      next()
    } catch (error) {
      next(error)
    }
  }
}

// XSS protection middleware
export const xssProtection = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Recursively sanitize all string values in request body
      if (req.body) {
        req.body = sanitizeObject(req.body)
      }

      // Sanitize query parameters
      if (req.query) {
        req.query = sanitizeObject(req.query) as typeof req.query
      }

      next()
    } catch (error) {
      next(error)
    }
  }
}

// File upload validation middleware
export const validateFileUpload = (options: {
  allowedMimeTypes?: string[]
  maxFileSize?: number
  maxFiles?: number
  required?: boolean
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const files = req.files as Express.Multer.File[] | undefined
      const file = req.file as Express.Multer.File | undefined

      // Check if files are required
      if (options.required && !files && !file) {
        return next(new ApiError(400, 'File upload is required'))
      }

      // Validate single file
      if (file) {
        validateSingleFile(file, options)
      }

      // Validate multiple files
      if (files) {
        if (options.maxFiles && files.length > options.maxFiles) {
          return next(
            new ApiError(400, `Maximum ${options.maxFiles} files allowed`)
          )
        }

        for (const uploadedFile of files) {
          validateSingleFile(uploadedFile, options)
        }
      }

      next()
    } catch (error) {
      next(error)
    }
  }
}

// Validate individual file
const validateSingleFile = (
  file: Express.Multer.File,
  options: {
    allowedMimeTypes?: string[]
    maxFileSize?: number
  }
) => {
  // Check file size
  if (options.maxFileSize && file.size > options.maxFileSize) {
    throw new ApiError(
      400,
      `File size must be less than ${options.maxFileSize} bytes`
    )
  }

  // Check MIME type
  if (
    options.allowedMimeTypes &&
    !options.allowedMimeTypes.includes(file.mimetype)
  ) {
    throw new ApiError(400, `File type ${file.mimetype} is not allowed`)
  }

  // Check for malicious file extensions
  const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com']
  const fileExtension = file.originalname
    .toLowerCase()
    .substring(file.originalname.lastIndexOf('.'))

  if (dangerousExtensions.includes(fileExtension)) {
    throw new ApiError(400, 'File type is not allowed for security reasons')
  }
}

// Sanitize input string
const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<[^>]*>/g, '') // Remove all HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .replace(/data:/gi, '') // Remove data: protocol
}

// Recursively sanitize object
const sanitizeObject = (obj: unknown): unknown => {
  if (typeof obj === 'string') {
    return sanitizeInput(obj)
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item))
  }

  if (obj && typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value)
    }
    return sanitized
  }

  return obj
}

// Rate limiting validation
export const validateRateLimit = (options: {
  windowMs: number
  maxRequests: number
  keyGenerator?: (_req: Request) => string
}) => {
  const requests = new Map<string, { count: number; resetTime: number }>()

  return (_req: Request, res: Response, next: NextFunction) => {
    const key = options.keyGenerator
      ? options.keyGenerator(_req)
      : _req.ip || 'unknown'
    const now = Date.now()
    const windowStart = now - options.windowMs

    // Clean up old entries
    for (const [k, v] of Array.from(requests.entries())) {
      if (v.resetTime < windowStart) {
        requests.delete(k)
      }
    }

    // Get or create request count for this key
    const requestData = requests.get(key) || {
      count: 0,
      resetTime: now + options.windowMs,
    }

    // Check if limit exceeded
    if (requestData.count >= options.maxRequests) {
      const resetIn = Math.ceil((requestData.resetTime - now) / 1000)

      res.set({
        'X-RateLimit-Limit': options.maxRequests.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': requestData.resetTime.toString(),
      })

      return next(
        new ApiError(429, `Too many requests. Try again in ${resetIn} seconds`)
      )
    }

    // Increment request count
    requestData.count++
    requests.set(key || 'unknown', requestData)

    // Set rate limit headers
    res.set({
      'X-RateLimit-Limit': options.maxRequests.toString(),
      'X-RateLimit-Remaining': (
        options.maxRequests - requestData.count
      ).toString(),
      'X-RateLimit-Reset': requestData.resetTime.toString(),
    })

    next()
  }
}

// Conditional validation middleware
export const validateIf = (
  condition: (_req: Request) => boolean,
  schema: ZodSchema
) => {
  return async (_req: Request, res: Response, next: NextFunction) => {
    if (condition(_req)) {
      return validate({ body: schema })(_req, res, next)
    }
    next()
  }
}

// Validation error formatter
export const formatValidationError = (_error: ZodError) => {
  return {
    message: 'Validation failed',
    errors: _error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code,
      received: (err as { received?: unknown }).received || undefined,
    })),
  }
}

// Custom validation helpers
export const createCustomValidator = <T>(
  validator: (_value: T) => boolean | Promise<boolean>,
  message: string
) => {
  return z.custom<T>((value) => validator(value as T), { message })
}

// Async validation helper
export const asyncValidate = <T>(
  schema: ZodSchema<T>,
  asyncValidator: (_value: T) => Promise<boolean>,
  errorMessage: string
) => {
  return schema.refine(asyncValidator, { message: errorMessage })
}

// Export validation schemas for common use cases
export const commonValidationSchemas = {
  id: z.object({
    id: z.string().uuid('Invalid ID format'),
  }),

  pagination: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),

  search: z.object({
    q: z.string().min(1).optional(),
    filters: z.record(z.unknown()).optional(),
  }),

  dateRange: z
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
    ),
}
