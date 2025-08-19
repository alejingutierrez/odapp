import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'
import { AppError, ValidationError, DatabaseError, InternalServerError, NotFoundError, AuthenticationError } from '../lib/errors'
import logger, { logError } from '../lib/logger'
import { env } from '../config/env'

/**
 * Standard API response format
 */
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
    timestamp: string
    requestId?: string
  }
  meta?: {
    pagination?: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
    [key: string]: any
  }
}

/**
 * Create success response
 */
export const createSuccessResponse = <T>(
  data: T,
  meta?: ApiResponse['meta']
): ApiResponse<T> => ({
  success: true,
  data,
  meta,
})

/**
 * Create error response
 */
export const createErrorResponse = (
  error: AppError,
  requestId?: string
): ApiResponse => ({
  success: false,
  error: {
    code: error.errorCode,
    message: error.message,
    details: env.NODE_ENV === 'development' ? error.context : undefined,
    timestamp: new Date().toISOString(),
    requestId,
  },
})

/**
 * Handle Prisma database errors
 */
const handlePrismaError = (error: Prisma.PrismaClientKnownRequestError): AppError => {
  switch (error.code) {
    case 'P2002':
      return new DatabaseError('Unique constraint violation', {
        field: error.meta?.target,
        code: error.code,
      })
    case 'P2025':
      return new DatabaseError('Record not found', {
        code: error.code,
      })
    case 'P2003':
      return new DatabaseError('Foreign key constraint violation', {
        field: error.meta?.field_name,
        code: error.code,
      })
    case 'P2014':
      return new DatabaseError('Invalid ID provided', {
        code: error.code,
      })
    case 'P2021':
      return new DatabaseError('Table does not exist', {
        table: error.meta?.table,
        code: error.code,
      })
    case 'P2022':
      return new DatabaseError('Column does not exist', {
        column: error.meta?.column,
        code: error.code,
      })
    default:
      return new DatabaseError('Database operation failed', {
        code: error.code,
        meta: error.meta,
      })
  }
}

/**
 * Handle JWT errors
 */
const handleJWTError = (error: Error): AppError => {
  if (error.name === 'JsonWebTokenError') {
    return new AuthenticationError('Invalid token')
  }
  if (error.name === 'TokenExpiredError') {
    return new AuthenticationError('Token expired')
  }
  return new InternalServerError('Authentication error')
}

/**
 * Convert unknown errors to AppError
 */
const normalizeError = (error: unknown): AppError => {
  // Already an AppError
  if (error instanceof AppError) {
    return error
  }

  // Zod validation error
  if (error instanceof ZodError) {
    return ValidationError.fromZodError(error)
  }

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return handlePrismaError(error)
  }

  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    return new DatabaseError('Unknown database error', {
      message: error.message,
    })
  }

  if (error instanceof Prisma.PrismaClientRustPanicError) {
    return new DatabaseError('Database engine error', {
      message: error.message,
    })
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return new DatabaseError('Database connection error', {
      message: error.message,
    })
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return new ValidationError('Database validation error', undefined, {
      message: error.message,
    })
  }

  // JWT errors
  if (error instanceof Error && (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError')) {
    return handleJWTError(error)
  }

  // Standard Error
  if (error instanceof Error) {
    return new InternalServerError(error.message, {
      name: error.name,
      stack: error.stack,
    })
  }

  // Unknown error type
  return new InternalServerError('An unexpected error occurred', {
    error: String(error),
  })
}

/**
 * Global error handling middleware
 */
export const errorHandler = (
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const normalizedError = normalizeError(error)
  const requestId = req.headers['x-request-id'] as string

  // Log the error
  logError(normalizedError, {
    requestId,
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: req.user?.id,
    body: req.body,
    params: req.params,
    query: req.query,
  })

  // Send error response
  const response = createErrorResponse(normalizedError, requestId)

  // Don't expose sensitive information in production
  if (env.NODE_ENV === 'production' && !normalizedError.isOperational) {
    response.error!.message = 'Internal server error'
    delete response.error!.details
  }

  res.status(normalizedError.statusCode).json(response)
}

/**
 * Async error wrapper for route handlers
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = new NotFoundError(`Route ${req.method} ${req.path}`)
  next(error)
}

/**
 * Validation middleware using Zod schemas
 */
export const validate = (schema: {
  body?: any
  query?: any
  params?: any
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schema.body) {
        req.body = schema.body.parse(req.body)
      }
      if (schema.query) {
        req.query = schema.query.parse(req.query)
      }
      if (schema.params) {
        req.params = schema.params.parse(req.params)
      }
      next()
    } catch (error) {
      next(error)
    }
  }
}