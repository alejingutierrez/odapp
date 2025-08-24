import { PrismaClient } from '@prisma/client'

import { env } from '../config/env.js'
import logger from './logger'

// Global variable to store the Prisma client instance
declare global {
  var __prisma: PrismaClient | undefined
}

// Prisma client configuration
const prismaConfig = {
  datasources: {
    db: {
      url: env.DATABASE_URL,
    },
  },
  errorFormat: 'pretty' as const,
}

// Create Prisma client instance
function createPrismaClient() {
  return new PrismaClient(prismaConfig)
}

// Use global variable in development to prevent multiple instances
// due to hot reloading
const prisma = globalThis.__prisma ?? createPrismaClient()

if (env.NODE_ENV === 'development') {
  globalThis.__prisma = prisma
}

// Connection management
export async function connectDatabase() {
  try {
    await prisma.$connect()
    logger.info('✅ Database connected successfully')
  } catch (error) {
    logger.error('❌ Database connection failed:', error)
    throw error
  }
}

export async function disconnectDatabase() {
  try {
    await prisma.$disconnect()
    logger.info('✅ Database disconnected successfully')
  } catch (error) {
    logger.error('❌ Database disconnection failed:', error)
    throw error
  }
}

// Health check function
export async function checkDatabaseHealth() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return { status: 'healthy', timestamp: new Date().toISOString() }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }
  }
}

// Database metrics
export async function getDatabaseMetrics() {
  try {
    const [userCount, productCount, orderCount, customerCount, inventoryCount] =
      await Promise.all([
        prisma.user.count(),
        prisma.product.count(),
        prisma.order.count(),
        prisma.customer.count(),
        prisma.inventoryItem.count(),
      ])

    return {
      users: userCount,
      products: productCount,
      orders: orderCount,
      customers: customerCount,
      inventoryItems: inventoryCount,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    throw new Error(`Failed to get database metrics: ${error}`)
  }
}

// Transaction helper
export async function withTransaction<T>(
  callback: (
    tx: Omit<
      PrismaClient,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
    >
  ) => Promise<T>
): Promise<T> {
  return prisma.$transaction(callback)
}

// Soft delete helper
export async function softDelete(model: keyof PrismaClient, id: string) {
  const modelClient = prisma[model] as Record<string, unknown>
  return (
    modelClient.update as (params: {
      where: { id: string }
      data: { deletedAt: Date }
    }) => Promise<unknown>
  )({
    where: { id },
    data: { deletedAt: new Date() },
  })
}

// Query performance monitoring
export function logSlowQueries() {
  if (env.NODE_ENV === 'development') {
    prisma.$use(async (params, next) => {
      const start = Date.now()
      const result = await next(params)
      const end = Date.now()
      const duration = end - start

      if (duration > (env.DB_SLOW_QUERY_THRESHOLD || 1000)) {
        // eslint-disable-next-line no-console
        console.warn(
          `🐌 Slow query detected: ${params.model}.${params.action} took ${duration}ms`
        )
      }

      return result
    })
  }
}

// Initialize slow query logging
logSlowQueries()

export { prisma }
export default prisma
