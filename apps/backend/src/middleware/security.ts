import { Request, Response, NextFunction } from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import * as cors from 'cors'
import { env } from '../config/env'
import { RateLimitError } from '../lib/errors'
import logger from '../lib/logger'

/**
 * Enhanced CORS configuration
 */
export const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true)

    const allowedOrigins = env.CORS_ORIGINS

    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      return callback(null, true)
    }

    logger.warn('CORS: Origin not allowed', { origin })
    callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-API-Version',
    'X-Request-ID',
    'Cache-Control',
  ],
  exposedHeaders: [
    'X-Request-ID',
    'X-API-Version',
    'X-Supported-Versions',
    'X-Rate-Limit-Limit',
    'X-Rate-Limit-Remaining',
    'X-Rate-Limit-Reset',
  ],
  maxAge: 86400, // 24 hours
}

/**
 * Enhanced Helmet configuration
 */
export const helmetOptions: Parameters<typeof helmet>[0] = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for API
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  noSniff: true,
  frameguard: { action: 'deny' },
  xssFilter: true,
}

/**
 * Rate limiting configurations
 */
export const createRateLimit = (options: {
  windowMs?: number
  max?: number
  message?: string
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
  keyGenerator?: (_req: Request) => string
}) => {
  return rateLimit({
    windowMs: options.windowMs || env.RATE_LIMIT_WINDOW_MS,
    max: options.max || env.RATE_LIMIT_MAX_REQUESTS,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message:
          options.message ||
          'Too many requests from this IP, please try again later.',
        timestamp: new Date().toISOString(),
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    skipFailedRequests: options.skipFailedRequests || false,
    keyGenerator: options.keyGenerator || ((_req) => _req.ip || 'unknown'),
    handler: (_req) => {
      logger.warn('Rate limit exceeded', {
        ip: _req.ip,
        userAgent: _req.get('User-Agent'),
        url: _req.url,
        method: _req.method,
      })

      throw new RateLimitError(options.message)
    },
  })
}

/**
 * General API rate limiting
 */
export const generalRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per 15 minutes
  message: 'Too many API requests from this IP, please try again later.',
})

/**
 * Strict rate limiting for authentication endpoints
 */
export const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per 15 minutes
  message:
    'Too many authentication attempts from this IP, please try again later.',
  skipSuccessfulRequests: true,
})

/**
 * Rate limiting for password reset
 */
export const passwordResetRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per hour
  message:
    'Too many password reset attempts from this IP, please try again later.',
})

/**
 * Rate limiting for file uploads
 */
export const uploadRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 uploads per hour
  message: 'Too many file uploads from this IP, please try again later.',
})

/**
 * User-specific rate limiting
 */
export const userRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // 500 requests per 15 minutes per user
  keyGenerator: (_req) => _req.user?.id || _req.ip || 'unknown',
  message: 'Too many requests from this user, please try again later.',
})

/**
 * IP whitelist middleware
 */
export const ipWhitelist = (allowedIPs: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const clientIP = req.ip || req.connection.remoteAddress

    if (!clientIP || !allowedIPs.includes(clientIP)) {
      logger.warn('IP not whitelisted', {
        clientIP,
        allowedIPs,
        url: req.url,
        method: req.method,
      })

      res.status(403).json({
        success: false,
        error: {
          code: 'IP_NOT_ALLOWED',
          message: 'Your IP address is not allowed to access this resource',
          timestamp: new Date().toISOString(),
        },
      })
      return
    }

    next()
  }
}

/**
 * Request size limiting middleware
 */
export const requestSizeLimit = (maxSize: number = env.MAX_FILE_SIZE) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentLength = parseInt(req.headers['content-length'] || '0', 10)

    if (contentLength > maxSize) {
      logger.warn('Request size too large', {
        contentLength,
        maxSize,
        ip: req.ip,
        url: req.url,
        method: req.method,
      })

      res.status(413).json({
        success: false,
        error: {
          code: 'REQUEST_TOO_LARGE',
          message: `Request size ${contentLength} bytes exceeds maximum allowed size of ${maxSize} bytes`,
          timestamp: new Date().toISOString(),
        },
      })
      return
    }

    next()
  }
}

/**
 * Security headers middleware
 */
export const securityHeaders = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Remove server information
  res.removeHeader('X-Powered-By')

  // Add custom security headers
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=()'
  )

  // Add API-specific headers
  res.setHeader('X-API-Name', 'Oda Fashion Platform API')
  res.setHeader('X-API-Environment', env.NODE_ENV)

  next()
}

/**
 * Request sanitization middleware
 */
export const sanitizeRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Sanitize query parameters
  if (req.query) {
    for (const [_key, value] of Object.entries(req.query)) {
      if (typeof value === 'string') {
        // Remove potentially dangerous characters
        req.query[_key] = value.replace(/[<>']/g, '')
      }
    }
  }

  // Sanitize request body (basic sanitization)
  if (req.body && typeof req.body === 'object' && req.body !== null) {
    sanitizeObject(req.body as Record<string, unknown>)
  }

  next()
}

/**
 * Recursively sanitize object properties
 */
const sanitizeObject = (obj: Record<string, unknown>): void => {
  for (const [_key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      // Basic XSS prevention
      obj[_key] = value.replace(
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        ''
      )
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitizeObject(value as Record<string, unknown>)
    }
  }
}

/**
 * Trusted proxy configuration
 */
export const configureTrustedProxies = (app: { set: (_key: string, _value: unknown) => void }): void => {
  // Trust first proxy (load balancer, reverse proxy)
  app.set('trust proxy', 1)

  // In production, you might want to be more specific:
  // app.set('trust proxy', ['127.0.0.1', '::1', '10.0.0.0/8'])
}
