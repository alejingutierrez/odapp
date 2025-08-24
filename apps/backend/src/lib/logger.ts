import * as winston from 'winston'

import { env } from '../config/env'

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
}

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
}

// Tell winston that you want to link the colors
winston.addColors(colors)

// Define format for logs
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) =>
      `${info.timestamp} ${info.level}: ${info.message}${info.stack ? '\n' + info.stack : ''}`
  )
)

// Define format for JSON logs (production)
const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.metadata({
    fillExcept: ['message', 'level', 'timestamp', 'label'],
  })
)

// Define which transports the logger must use
const transports: winston.transport[] = [
  // Console transport
  new winston.transports.Console({
    format: env.LOG_FORMAT === 'json' ? jsonFormat : format,
  }),
]

// Add file transports in production
if (env.NODE_ENV === 'production') {
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: jsonFormat,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: jsonFormat,
    })
  )
}

// Create the logger
const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  levels,
  format: env.LOG_FORMAT === 'json' ? jsonFormat : format,
  transports,
  exitOnError: false,
})

// Export as both named and default for compatibility
export { logger }

// Create a stream object for Morgan HTTP logging
export const loggerStream = {
  write: (message: string) => {
    logger.http(message.trim())
  },
}

// Helper functions for structured logging
export const logWithContext = (
  level: string,
  message: string,
  context?: Record<string, unknown>
) => {
  logger.log(level, message, context)
}

export const logError = (error: Error, context?: Record<string, unknown>) => {
  logger.error(error.message, {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    ...context,
  })
}

export const logRequest = (
  req: Record<string, unknown>,
  res: Record<string, unknown>,
  responseTime?: number
) => {
  logger.http('HTTP Request', {
    method: req.method,
    url: req.url,
    statusCode: res.statusCode,
    responseTime: responseTime ? `${responseTime}ms` : undefined,
    userAgent: (req.get as (name: string) => string | undefined)('User-Agent'),
    ip: req.ip,
    userId: (req.user as { id?: string })?.id,
  })
}

export const logDatabaseQuery = (
  query: string,
  duration: number,
  context?: Record<string, unknown>
) => {
  logger.debug('Database Query', {
    query,
    duration: `${duration}ms`,
    ...context,
  })
}

export const logExternalApiCall = (
  service: string,
  method: string,
  url: string,
  statusCode: number,
  duration: number,
  context?: Record<string, unknown>
) => {
  logger.info('External API Call', {
    service,
    method,
    url,
    statusCode,
    duration: `${duration}ms`,
    ...context,
  })
}

export const logBusinessEvent = (
  event: string,
  context?: Record<string, unknown>
) => {
  logger.info('Business Event', {
    event,
    ...context,
  })
}

export default logger
