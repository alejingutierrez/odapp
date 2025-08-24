import { env } from '../config/env.js'

import { prisma } from './prisma.js'
import logger from './logger'

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  checks: {
    connection: HealthCheck
    performance: HealthCheck
    storage: HealthCheck
    replication?: HealthCheck
  }
  metrics?: DatabaseMetrics
}

export interface HealthCheck {
  status: 'pass' | 'warn' | 'fail'
  duration: number
  message?: string
  details?: Record<string, unknown>
}

export interface DatabaseMetrics {
  connections: {
    active: number
    idle: number
    total: number
  }
  queries: {
    total: number
    slow: number
    failed: number
  }
  storage: {
    size: string
    tables: number
    indexes: number
  }
}

export class DatabaseHealthChecker {
  private readonly slowQueryThreshold: number
  private readonly connectionTimeout: number

  constructor() {
    this.slowQueryThreshold = env.DB_SLOW_QUERY_THRESHOLD || 1000
    this.connectionTimeout = env.DATABASE_CONNECTION_TIMEOUT || 5000
  }

  async performHealthCheck(): Promise<HealthCheckResult> {
    const timestamp = new Date().toISOString()
    const checks = {
      connection: await this.checkConnection(),
      performance: await this.checkPerformance(),
      storage: await this.checkStorage(),
    }

    // Determine overall status
    const statuses = Object.values(checks).map((check) => check.status)
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'

    if (statuses.includes('fail')) {
      overallStatus = 'unhealthy'
    } else if (statuses.includes('warn')) {
      overallStatus = 'degraded'
    }

    const result: HealthCheckResult = {
      status: overallStatus,
      timestamp,
      checks,
    }

    // Add metrics if system is healthy or degraded
    if (overallStatus !== 'unhealthy') {
      try {
        result.metrics = await this.getMetrics()
      } catch (error) {
        // Don't fail health check if metrics collection fails
        logger.warn('Failed to collect database metrics:', error)
      }
    }

    return result
  }

  private async checkConnection(): Promise<HealthCheck> {
    const start = Date.now()

    try {
      await Promise.race([
        prisma.$queryRaw`SELECT 1 as health_check`,
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('Connection timeout')),
            this.connectionTimeout
          )
        ),
      ])

      const duration = Date.now() - start

      return {
        status: duration > 1000 ? 'warn' : 'pass',
        duration,
        message:
          duration > 1000 ? 'Connection is slow' : 'Connection is healthy',
      }
    } catch (error) {
      return {
        status: 'fail',
        duration: Date.now() - start,
        message: 'Database connection failed',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      }
    }
  }

  private async checkPerformance(): Promise<HealthCheck> {
    const start = Date.now()

    try {
      // Test query performance with a simple aggregation
      await prisma.product.count()
      await prisma.order.count()
      await prisma.customer.count()

      const duration = Date.now() - start

      return {
        status: duration > this.slowQueryThreshold ? 'warn' : 'pass',
        duration,
        message:
          duration > this.slowQueryThreshold
            ? 'Database queries are slow'
            : 'Database performance is good',
      }
    } catch (error) {
      return {
        status: 'fail',
        duration: Date.now() - start,
        message: 'Performance check failed',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      }
    }
  }

  private async checkStorage(): Promise<HealthCheck> {
    const start = Date.now()

    try {
      // Check database size and table count
      const sizeResult = await prisma.$queryRaw<Array<{ size: string }>>`
        SELECT pg_size_pretty(pg_database_size(current_database())) as size
      `

      const tableCountResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `

      const duration = Date.now() - start
      const size = sizeResult[0]?.size || 'Unknown'
      const tableCount = Number(tableCountResult[0]?.count || 0)

      return {
        status: 'pass',
        duration,
        message: 'Storage check completed',
        details: {
          databaseSize: size,
          tableCount,
        },
      }
    } catch (error) {
      return {
        status: 'warn',
        duration: Date.now() - start,
        message: 'Storage check failed',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      }
    }
  }

  private async getMetrics(): Promise<DatabaseMetrics> {
    try {
      // Get connection stats
      const connectionStats = await prisma.$queryRaw<
        Array<{
          state: string
          count: bigint
        }>
      >`
        SELECT state, COUNT(*) as count
        FROM pg_stat_activity
        WHERE datname = current_database()
        GROUP BY state
      `

      // Get table and index count
      const tableStats = await prisma.$queryRaw<
        Array<{
          tables: bigint
          indexes: bigint
        }>
      >`
        SELECT 
          (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as tables,
          (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public') as indexes
      `

      // Get database size
      const sizeResult = await prisma.$queryRaw<Array<{ size: string }>>`
        SELECT pg_size_pretty(pg_database_size(current_database())) as size
      `

      const connections = connectionStats.reduce(
        (acc, stat) => {
          const count = Number(stat.count)
          if (stat.state === 'active') acc.active = count
          else if (stat.state === 'idle') acc.idle = count
          acc.total += count
          return acc
        },
        { active: 0, idle: 0, total: 0 }
      )

      return {
        connections,
        queries: {
          total: 0, // Would need query log analysis
          slow: 0, // Would need query log analysis
          failed: 0, // Would need query log analysis
        },
        storage: {
          size: sizeResult[0]?.size || 'Unknown',
          tables: Number(tableStats[0]?.tables || 0),
          indexes: Number(tableStats[0]?.indexes || 0),
        },
      }
    } catch (error) {
      throw new Error(`Failed to collect database metrics: ${error}`)
    }
  }

  async recordHealthCheck(result: HealthCheckResult): Promise<void> {
    try {
      await prisma.systemHealth.create({
        data: {
          service: 'database',
          status: result.status.toUpperCase() as
            | 'HEALTHY'
            | 'DEGRADED'
            | 'UNHEALTHY',
          message: `Overall: ${result.status}`,
          metadata: JSON.parse(
            JSON.stringify({
              checks: result.checks,
              metrics: result.metrics,
            })
          ),
        },
      })
    } catch (error) {
      logger.error('Failed to record health check:', error)
    }
  }
}

// Singleton instance
export const databaseHealthChecker = new DatabaseHealthChecker()

// Utility functions
export async function isHealthy(): Promise<boolean> {
  try {
    const result = await databaseHealthChecker.performHealthCheck()
    return result.status === 'healthy'
  } catch {
    return false
  }
}

export async function waitForHealthy(
  maxAttempts: number = 30,
  intervalMs: number = 1000
): Promise<boolean> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (await isHealthy()) {
      return true
    }

    if (attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs))
    }
  }

  return false
}
