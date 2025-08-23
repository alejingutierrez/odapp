import { ZodError } from 'zod'

/**
 * Base application error class
 */
export abstract class AppError extends Error {
  abstract readonly statusCode: number
  abstract readonly isOperational: boolean
  abstract readonly errorCode: string

  constructor(
    message: string,
    public readonly _context?: Record<string, unknown>
  ) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      errorCode: this.errorCode,
      context: this._context,
      stack: this.stack,
    }
  }
}

/**
 * Generic API error used by middlewares expecting an ApiError class
 */
export class ApiError extends AppError {
  readonly isOperational = true
  readonly errorCode: string

  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly details?: unknown,
    context?: Record<string, unknown>
  ) {
    super(message, { ...context, details })
    // Map common status codes to generic error codes, fallback to API_ERROR
    const codeMap: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'RATE_LIMIT',
      500: 'INTERNAL_ERROR',
      502: 'BAD_GATEWAY',
      503: 'SERVICE_UNAVAILABLE',
    }
    this.errorCode = codeMap[statusCode] || 'API_ERROR'
  }

  toJSON() {
    return {
      ...super.toJSON(),
      details: this.details,
    }
  }
}

/**
 * Validation error for request data
 */
export class ValidationError extends AppError {
  readonly statusCode = 400
  readonly isOperational = true
  readonly errorCode = 'VALIDATION_ERROR'

  constructor(
    message: string,
    public readonly _errors?: unknown[],
    context?: Record<string, unknown>
  ) {
    super(message, context)
  }

  static fromZodError(
    error: ZodError,
    context?: Record<string, unknown>
  ): ValidationError {
    const errors = error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code,
    }))

    return new ValidationError('Validation failed', errors, context)
  }

  toJSON() {
    return {
      ...super.toJSON(),
      errors: this._errors,
    }
  }
}

/**
 * Authentication error
 */
export class AuthenticationError extends AppError {
  readonly statusCode = 401
  readonly isOperational = true
  readonly errorCode = 'AUTHENTICATION_ERROR'

  constructor(
    message: string = 'Authentication required',
    context?: Record<string, unknown>
  ) {
    super(message, context)
  }
}

/**
 * Authorization error
 */
export class AuthorizationError extends AppError {
  readonly statusCode = 403
  readonly isOperational = true
  readonly errorCode = 'AUTHORIZATION_ERROR'

  constructor(
    message: string = 'Insufficient permissions',
    context?: Record<string, unknown>
  ) {
    super(message, context)
  }
}

/**
 * Resource not found error
 */
export class NotFoundError extends AppError {
  readonly statusCode = 404
  readonly isOperational = true
  readonly errorCode = 'NOT_FOUND_ERROR'

  constructor(
    resource: string = 'Resource',
    context?: Record<string, unknown>
  ) {
    super(`${resource} not found`, context)
  }
}

/**
 * Conflict error (e.g., duplicate resource)
 */
export class ConflictError extends AppError {
  readonly statusCode = 409
  readonly isOperational = true
  readonly errorCode = 'CONFLICT_ERROR'

  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context)
  }
}

/**
 * Rate limit exceeded error
 */
export class RateLimitError extends AppError {
  readonly statusCode = 429
  readonly isOperational = true
  readonly errorCode = 'RATE_LIMIT_ERROR'

  constructor(
    message: string = 'Rate limit exceeded',
    context?: Record<string, unknown>
  ) {
    super(message, context)
  }
}

/**
 * External service error
 */
export class ExternalServiceError extends AppError {
  readonly statusCode = 502
  readonly isOperational = true
  readonly errorCode = 'EXTERNAL_SERVICE_ERROR'

  constructor(
    service: string,
    message?: string,
    context?: Record<string, unknown>
  ) {
    super(message || `External service ${service} is unavailable`, context)
  }
}

/**
 * Database error
 */
export class DatabaseError extends AppError {
  readonly statusCode = 500
  readonly isOperational = true
  readonly errorCode = 'DATABASE_ERROR'

  constructor(
    message: string = 'Database operation failed',
    context?: Record<string, unknown>
  ) {
    super(message, context)
  }
}

/**
 * Internal server error
 */
export class InternalServerError extends AppError {
  readonly statusCode = 500
  readonly isOperational = false
  readonly errorCode = 'INTERNAL_SERVER_ERROR'

  constructor(
    message: string = 'Internal server error',
    context?: Record<string, unknown>
  ) {
    super(message, context)
  }
}

/**
 * Service unavailable error
 */
export class ServiceUnavailableError extends AppError {
  readonly statusCode = 503
  readonly isOperational = true
  readonly errorCode = 'SERVICE_UNAVAILABLE_ERROR'

  constructor(
    message: string = 'Service temporarily unavailable',
    context?: Record<string, unknown>
  ) {
    super(message, context)
  }
}

/**
 * Business logic error
 */
export class BusinessLogicError extends AppError {
  readonly statusCode = 422
  readonly isOperational = true
  readonly errorCode = 'BUSINESS_LOGIC_ERROR'

  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context)
  }
}

/**
 * File upload error
 */
export class FileUploadError extends AppError {
  readonly statusCode = 400
  readonly isOperational = true
  readonly errorCode = 'FILE_UPLOAD_ERROR'

  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context)
  }
}

/**
 * Payment error
 */
export class PaymentError extends AppError {
  readonly statusCode = 402
  readonly isOperational = true
  readonly errorCode = 'PAYMENT_ERROR'

  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context)
  }
}

/**
 * Shopify integration error
 */
export class ShopifyError extends AppError {
  readonly statusCode = 502
  readonly isOperational = true
  readonly errorCode = 'SHOPIFY_ERROR'

  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context)
  }
}
