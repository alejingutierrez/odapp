import { Response } from 'express'

/**
 * Standard API response format
 */
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: unknown
    timestamp: string
    requestId?: string
  }
  meta?: {
    pagination?: {
      page: number
      limit: number
      total: number
      totalPages: number
      hasNext: boolean
      hasPrev: boolean
    }
    version?: string
    timestamp?: string
    [key: string]: unknown
  }
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number
  limit?: number
  offset?: number
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

/**
 * Create pagination metadata
 */
export const createPaginationMeta = (
  page: number,
  limit: number,
  total: number
): PaginationMeta => {
  const totalPages = Math.ceil(total / limit)

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  }
}

/**
 * Success response helper
 */
export const sendSuccess = <T>(
  res: Response,
  data: T,
  meta?: Omit<ApiResponse['meta'], 'timestamp' | 'version'>,
  statusCode: number = 200
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    meta: {
      ...meta,
      version: 'v1',
      timestamp: new Date().toISOString(),
    },
  }
  if (res.headersSent) {
    return res
  }
  return res.status(statusCode).json(response)
}

/**
 * Created response helper (201)
 */
export const sendCreated = <T>(
  res: Response,
  data: T,
  meta?: Omit<ApiResponse['meta'], 'timestamp' | 'version'>
): Response => {
  return sendSuccess(res, data, meta, 201)
}

/**
 * No content response helper (204)
 */
export const sendNoContent = (res: Response): Response => {
  return res.status(204).send()
}

/**
 * Paginated response helper
 */
export const sendPaginated = <T>(
  res: Response,
  data: T[],
  pagination: PaginationMeta,
  meta?: Omit<ApiResponse['meta'], 'pagination' | 'timestamp' | 'version'>
): Response => {
  return sendSuccess(res, data, {
    ...meta,
    pagination,
  })
}

/**
 * Error response helper
 */
export const sendError = (
  res: Response,
  code: string,
  message: string,
  statusCode: number = 500,
  details?: unknown,
  requestId?: string
): Response => {
  const response: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      details,
      timestamp: new Date().toISOString(),
      requestId,
    },
  }
  if (res.headersSent) {
    return res
  }
  return res.status(statusCode).json(response)
}

/**
 * Validation error response helper
 */
export const sendValidationError = (
  res: Response,
  errors: unknown[],
  requestId?: string
): Response => {
  return sendError(
    res,
    'VALIDATION_ERROR',
    'Validation failed',
    400,
    { errors },
    requestId
  )
}

/**
 * Not found response helper
 */
export const sendNotFound = (
  res: Response,
  resource: string = 'Resource',
  requestId?: string
): Response => {
  return sendError(
    res,
    'NOT_FOUND',
    `${resource} not found`,
    404,
    undefined,
    requestId
  )
}

/**
 * Unauthorized response helper
 */
export const sendUnauthorized = (
  res: Response,
  message: string = 'Authentication required',
  requestId?: string
): Response => {
  return sendError(res, 'UNAUTHORIZED', message, 401, undefined, requestId)
}

/**
 * Forbidden response helper
 */
export const sendForbidden = (
  res: Response,
  message: string = 'Insufficient permissions',
  requestId?: string
): Response => {
  return sendError(res, 'FORBIDDEN', message, 403, undefined, requestId)
}

/**
 * Conflict response helper
 */
export const sendConflict = (
  res: Response,
  message: string,
  requestId?: string
): Response => {
  return sendError(res, 'CONFLICT', message, 409, undefined, requestId)
}

/**
 * Rate limit response helper
 */
export const sendRateLimit = (
  res: Response,
  message: string = 'Rate limit exceeded',
  requestId?: string
): Response => {
  return sendError(
    res,
    'RATE_LIMIT_EXCEEDED',
    message,
    429,
    undefined,
    requestId
  )
}

/**
 * Internal server error response helper
 */
export const sendInternalError = (
  res: Response,
  message: string = 'Internal server error',
  requestId?: string
): Response => {
  return sendError(res, 'INTERNAL_ERROR', message, 500, undefined, requestId)
}
