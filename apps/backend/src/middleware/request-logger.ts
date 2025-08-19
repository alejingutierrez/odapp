import { Request, Response, NextFunction } from 'express'
import morgan from 'morgan'
import { v4 as uuidv4 } from 'uuid'
import logger, { loggerStream } from '../lib/logger'
import { env } from '../config/env'

// Extend Request interface to include requestId and startTime
declare global {
  namespace Express {
    interface Request {
      requestId: string
      startTime: number
    }
  }
}

/**
 * Add request ID and start time to request
 */
export const requestId = (req: Request, res: Response, next: NextFunction): void => {
  req.requestId = req.headers['x-request-id'] as string || uuidv4()
  req.startTime = Date.now()
  
  // Add request ID to response headers
  res.setHeader('X-Request-ID', req.requestId)
  
  next()
}

/**
 * Custom Morgan token for request ID
 */
morgan.token('requestId', (req: Request) => req.requestId)

/**
 * Custom Morgan token for response time in milliseconds
 */
morgan.token('responseTime', (req: Request) => {
  if (!req.startTime) return '-'
  return `${Date.now() - req.startTime}ms`
})

/**
 * Custom Morgan token for user ID
 */
morgan.token('userId', (req: Request) => {
  return req.user?.id || 'anonymous'
})

/**
 * Custom Morgan token for request body size
 */
morgan.token('bodySize', (req: Request) => {
  if (!req.body) return '0'
  return JSON.stringify(req.body).length.toString()
})

/**
 * Skip logging for health check endpoints in production
 */
const skipHealthChecks = (req: Request, _res: Response) => {
  if (env.NODE_ENV === 'production') {
    return req.url === '/health' || req.url === '/api/health'
  }
  return false
}

/**
 * Morgan format for development
 */
const developmentFormat = ':method :url :status :responseTime - :res[content-length] bytes - :userId - :requestId'

/**
 * Morgan format for production (JSON)
 */
const productionFormat = JSON.stringify({
  method: ':method',
  url: ':url',
  status: ':status',
  responseTime: ':responseTime',
  contentLength: ':res[content-length]',
  userAgent: ':user-agent',
  ip: ':remote-addr',
  userId: ':userId',
  requestId: ':requestId',
  bodySize: ':bodySize',
  timestamp: ':date[iso]'
})

/**
 * HTTP request logging middleware
 */
export const httpLogger = morgan(
  env.NODE_ENV === 'production' ? productionFormat : developmentFormat,
  {
    stream: loggerStream,
    skip: skipHealthChecks,
  }
)

/**
 * Detailed request/response logging middleware
 */
export const detailedLogger = (req: Request, res: Response, next: NextFunction): void => {
  // Log request details
  logger.debug('Incoming Request', {
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.method !== 'GET' ? req.body : undefined,
    query: req.query,
    params: req.params,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
  })

  // Capture original res.json to log response
  const originalJson = res.json
  res.json = function(body: unknown) {
    // Log response details
    logger.debug('Outgoing Response', {
      requestId: req.requestId,
      statusCode: res.statusCode,
      responseTime: `${Date.now() - req.startTime}ms`,
      body: env.NODE_ENV === 'development' ? body : undefined,
      headers: res.getHeaders(),
    })

    return originalJson.call(this, body)
  }

  next()
}

/**
 * Security headers logging
 */
export const securityLogger = (req: Request, res: Response, next: NextFunction): void => {
  // Log potentially suspicious requests
  const suspiciousPatterns = [
    /\.\./,  // Path traversal
    /<script/i,  // XSS attempts
    /union.*select/i,  // SQL injection
    /javascript:/i,  // JavaScript protocol
    /data:/i,  // Data protocol
  ]

  const url = req.url.toLowerCase()
  const body = JSON.stringify(req.body || {}).toLowerCase()
  
  const isSuspicious = suspiciousPatterns.some(pattern => 
    pattern.test(url) || pattern.test(body)
  )

  if (isSuspicious) {
    logger.warn('Suspicious Request Detected', {
      requestId: req.requestId,
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      body: req.body,
      headers: req.headers,
    })
  }

  // Log requests with missing security headers
  const securityHeaders = [
    'x-forwarded-for',
    'x-real-ip',
    'user-agent',
  ]

  const missingHeaders = securityHeaders.filter(header => !req.headers[header])
  
  if (missingHeaders.length > 0) {
    logger.debug('Request Missing Security Headers', {
      requestId: req.requestId,
      missingHeaders,
      ip: req.ip,
    })
  }

  next()
}

/**
 * Performance monitoring middleware
 */
export const performanceLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = process.hrtime.bigint()

  res.on('finish', () => {
    const endTime = process.hrtime.bigint()
    const duration = Number(endTime - startTime) / 1000000 // Convert to milliseconds

    // Log slow requests
    const slowRequestThreshold = env.NODE_ENV === 'production' ? 1000 : 2000
    if (duration > slowRequestThreshold) {
      logger.warn('Slow Request Detected', {
        requestId: req.requestId,
        method: req.method,
        url: req.url,
        duration: `${duration.toFixed(2)}ms`,
        statusCode: res.statusCode,
        userId: req.user?.id,
      })
    }

    // Log performance metrics
    logger.debug('Request Performance', {
      requestId: req.requestId,
      method: req.method,
      url: req.url,
      duration: `${duration.toFixed(2)}ms`,
      statusCode: res.statusCode,
      contentLength: res.get('content-length'),
    })
  })

  next()
}