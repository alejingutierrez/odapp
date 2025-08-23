import { PrismaClient } from '@prisma/client'
import { env } from '../config/env.js'

// Global variable to store the Prisma client instance
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined
}

// Prisma client configuration
const prismaConfig = {
  datasources: {
    db: {
      url: env.DATABASE_URL,
    },
  },
  log:
    env.NODE_ENV === 'development'
      ? (['query', 'info', 'warn', 'error'] as any)
      : (['warn', 'error'] as any),
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
    console.log('✅ Database connected successfully')
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    throw error
  }
}

export async function disconnectDatabase() {
  try {
    await prisma.$disconnect()
    console.log('✅ Database disconnected successfully')
  } catch (error) {
    console.error('❌ Database disconnection failed:', error)
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
export async function withTransaction(
  callback: (_prisma: PrismaClient) => Promise<any>
): Promise<any> {
  return prisma.$transaction(callback as any)
}

// Soft delete helper
export async function softDelete(model: keyof PrismaClient, id: string) {
  const modelClient = prisma[model] as Record<string, unknown>
  return (modelClient.update as any)({
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
