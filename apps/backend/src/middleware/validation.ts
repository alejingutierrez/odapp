import { Request, Response, NextFunction } from 'express'
import { z, ZodError, ZodSchema } from 'zod'

import { ValidationError, RateLimitError } from '../lib/errors.js'

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
        const parsedQuery = await schema.query.parseAsync(req.query)
        Object.defineProperty(req, 'query', {
          value: parsedQuery,
          configurable: true,
          enumerable: true,
          writable: true,
        })
      }

      // Validate route parameters
      if (schema.params) {
        const parsedParams = await schema.params.parseAsync(req.params)
        Object.assign(req.params as any, parsedParams)
      }

      // Validate headers
      if (schema.headers) {
        const parsedHeaders = await schema.headers.parseAsync(req.headers)
        Object.assign(req.headers as any, parsedHeaders)
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

        return next(new ValidationError('Validation failed', validationErrors))
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
        const sanitizedQuery: Record<string, unknown> = {
          ...(req.query as Record<string, unknown>),
        }
        for (const field of fields) {
          const value = (req.query as any)[field]
          if (typeof value === 'string') {
            sanitizedQuery[field] = sanitizeInput(value)
          }
        }
        Object.defineProperty(req, 'query', {
          value: sanitizedQuery,
          configurable: true,
          enumerable: true,
          writable: true,
        })
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
        req.body = sanitizeObject(req.body, stripScripts)
      }

      // Sanitize query parameters
      if (req.query) {
        const sanitizedQuery = sanitizeObject(req.query, stripScripts)
        Object.defineProperty(req, 'query', {
          value: sanitizedQuery,
          configurable: true,
          enumerable: true,
          writable: true,
        })
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
  // Backwards compatibility alias
  maxSize?: number
}) => {
  const opts = {
    ...options,
    maxFileSize: options.maxFileSize ?? (options as any).maxSize,
  }
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const files = req.files as Express.Multer.File[] | undefined
      const file = req.file as Express.Multer.File | undefined

      // Check if files are required
      if (options.required && !files && !file) {
        return next(new ValidationError('File upload is required'))
      }

      // Validate single file
      if (file) {
        validateSingleFile(file, opts)
      }

      // Validate multiple files
      if (files) {
        if (opts.maxFiles && files.length > opts.maxFiles) {
          return next(
            new ValidationError(`Maximum ${opts.maxFiles} files allowed`)
          )
        }

        for (const uploadedFile of files) {
          validateSingleFile(uploadedFile, opts)
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
    throw new ValidationError(
      `File size must be less than ${options.maxFileSize} bytes`
    )
  }

  // Check for malicious file extensions
  const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com']
  const fileExtension = file.originalname
    .toLowerCase()
    .substring(file.originalname.lastIndexOf('.'))

  if (dangerousExtensions.includes(fileExtension)) {
    throw new ValidationError('File type is not allowed for security reasons')
  }

  // Check MIME type
  if (
    options.allowedMimeTypes &&
    !options.allowedMimeTypes.includes(file.mimetype)
  ) {
    throw new ValidationError(`File type ${file.mimetype} is not allowed`)
  }
}

// Sanitize input string preserving script content
const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/<script\b[^<]*>(.*?)<\/script>/gi, '$1') // Extract content from script tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .replace(/data:/gi, '') // Remove data: protocol
}

// Remove scripts entirely
const stripScripts = (input: string): string => {
  return input
    .replace(/<script.*?>.*?<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .replace(/data:/gi, '')
    .trim()
}

// Recursively sanitize object
const sanitizeObject = (
  obj: unknown,
  transform: (s: string) => string = sanitizeInput
): unknown => {
  if (typeof obj === 'string') {
    return transform(obj)
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item, transform))
  }

  if (obj && typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value, transform)
    }
    return sanitized
  }

  return obj
}

// Rate limiting validation
export const validateRateLimit = (options: {
  windowMs: number
  maxRequests?: number
  keyGenerator?: (_req: Request) => string
  // Backwards compatibility alias
  max?: number
}) => {
  const limit = options.maxRequests ?? options.max
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
    if (limit !== undefined && requestData.count >= limit) {
      const resetIn = Math.ceil((requestData.resetTime - now) / 1000)

      if (limit !== undefined) {
        res.set({
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': requestData.resetTime.toString(),
        })
      }

      return next(
        new RateLimitError(`Too many requests. Try again in ${resetIn} seconds`)
      )
    }

    // Increment request count
    requestData.count++
    requests.set(key || 'unknown', requestData)

    // Set rate limit headers
    if (limit !== undefined) {
      res.set({
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': (limit - requestData.count).toString(),
        'X-RateLimit-Reset': requestData.resetTime.toString(),
      })
    }

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
  return _error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
    received: (err as { received?: unknown }).received || undefined,
  }))
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
    search: z.string().min(1).optional(),
    q: z.string().min(1).optional(),
    filters: z.record(z.unknown()).optional(),
  }),

  uuid: z.string().uuid('Invalid UUID format'),

  email: z.string().email('Invalid email format'),

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
