import { cacheManager, CacheStats } from './cache-manager.js'
import { redisClient } from './redis-client.js'
import logger from '../logger.js'

export interface CacheMetrics {
  timestamp: number
  memory: {
    hits: number
    misses: number
    hitRate: number
    size: number
    itemCount: number
  }
  redis: {
    hits: number
    misses: number
    hitRate: number
    size: number
    keyCount: number
    memoryUsage: number
    connectedClients: number
    commandsProcessed: number
    keyspaceHits: number
    keyspaceMisses: number
  }
  overall: {
    totalHits: number
    totalMisses: number
    hitRate: number
    avgResponseTime: number
  }
  performance: {
    slowQueries: number
    errorRate: number
    throughput: number
  }
}

export interface CacheAlert {
  type: 'warning' | 'error' | 'info'
  message: string
  timestamp: number
  metrics?: Partial<CacheMetrics>
}

export class CacheMonitoring {
  private metrics: CacheMetrics[] = []
  private alerts: CacheAlert[] = []
  private monitoringInterval: NodeJS.Timeout | null = null
  private responseTimeTracker: number[] = []
  private errorCount = 0
  private queryCount = 0
  private slowQueryThreshold = 100 // milliseconds
  private slowQueryCount = 0

  private readonly maxMetricsHistory = 1000
  private readonly maxAlertsHistory = 100
  private readonly monitoringIntervalMs = 30000 // 30 seconds

  /**
   * Start cache monitoring
   */
  start(): void {
    if (this.monitoringInterval) {
      logger.warn('Cache monitoring is already running')
      return
    }

    this.monitoringInterval = setInterval(() => {
      this.collectMetrics().catch(error => {
        logger.error('Cache metrics collection failed', { error })
      })
    }, this.monitoringIntervalMs)

    logger.info('Cache monitoring started', {
      interval: this.monitoringIntervalMs,
    })
  }

  /**
   * Stop cache monitoring
   */
  stop(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
      logger.info('Cache monitoring stopped')
    }
  }

  /**
   * Collect current cache metrics
   */
  async collectMetrics(): Promise<CacheMetrics> {
    try {
      const timestamp = Date.now()
      const cacheStats = cacheManager.getStats()
      const redisInfo = await this.getRedisInfo()

      const metrics: CacheMetrics = {
        timestamp,
        memory: {
          hits: cacheStats.memoryHits,
          misses: cacheStats.memoryMisses,
          hitRate: this.calculateHitRate(cacheStats.memoryHits, cacheStats.memoryMisses),
          size: cacheStats.memorySize,
          itemCount: 0, // Would need to be tracked separately
        },
        redis: {
          hits: cacheStats.redisHits,
          misses: cacheStats.redisMisses,
          hitRate: this.calculateHitRate(cacheStats.redisHits, cacheStats.redisMisses),
          size: redisInfo.used_memory || 0,
          keyCount: redisInfo.db0_keys || 0,
          memoryUsage: redisInfo.used_memory_rss || 0,
          connectedClients: redisInfo.connected_clients || 0,
          commandsProcessed: redisInfo.total_commands_processed || 0,
          keyspaceHits: redisInfo.keyspace_hits || 0,
          keyspaceMisses: redisInfo.keyspace_misses || 0,
        },
        overall: {
          totalHits: cacheStats.totalHits,
          totalMisses: cacheStats.totalMisses,
          hitRate: cacheStats.hitRate,
          avgResponseTime: this.calculateAverageResponseTime(),
        },
        performance: {
          slowQueries: this.slowQueryCount,
          errorRate: this.calculateErrorRate(),
          throughput: this.calculateThroughput(),
        },
      }

      // Store metrics
      this.addMetrics(metrics)

      // Check for alerts
      this.checkAlerts(metrics)

      return metrics
    } catch (error) {
      logger.error('Failed to collect cache metrics', { error })
      throw error
    }
  }

  /**
   * Get Redis server information
   */
  private async getRedisInfo(): Promise<Record<string, any>> {
    try {
      if (!redisClient.isReady()) {
        return {}
      }

      const client = redisClient.getClient()
      const info = await client.info()
      
      // Parse Redis INFO response
      const parsed: Record<string, any> = {}
      const lines = info.split('\r\n')
      
      for (const line of lines) {
        if (line.includes(':')) {
          const [key, value] = line.split(':')
          const numValue = Number(value)
          parsed[key] = isNaN(numValue) ? value : numValue
        }
      }

      return parsed
    } catch (error) {
      logger.error('Failed to get Redis info', { error })
      return {}
    }
  }

  /**
   * Track cache operation performance
   */
  trackOperation(duration: number, success: boolean): void {
    this.queryCount++
    
    if (!success) {
      this.errorCount++
    }

    if (duration > this.slowQueryThreshold) {
      this.slowQueryCount++
    }

    this.responseTimeTracker.push(duration)
    
    // Keep only recent response times (last 1000)
    if (this.responseTimeTracker.length > 1000) {
      this.responseTimeTracker = this.responseTimeTracker.slice(-1000)
    }
  }

  /**
   * Get current metrics
   */
  getCurrentMetrics(): CacheMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null
  }

  /**
   * Get metrics history
   */
  getMetricsHistory(limit = 100): CacheMetrics[] {
    return this.metrics.slice(-limit)
  }

  /**
   * Get alerts
   */
  getAlerts(limit = 50): CacheAlert[] {
    return this.alerts.slice(-limit)
  }

  /**
   * Clear metrics history
   */
  clearMetrics(): void {
    this.metrics = []
    this.alerts = []
    this.responseTimeTracker = []
    this.errorCount = 0
    this.queryCount = 0
    this.slowQueryCount = 0
  }

  /**
   * Get cache health status
   */
  getHealthStatus(): {
    status: 'healthy' | 'warning' | 'critical'
    issues: string[]
    metrics: CacheMetrics | null
  } {
    const currentMetrics = this.getCurrentMetrics()
    const issues: string[] = []
    let status: 'healthy' | 'warning' | 'critical' = 'healthy'

    if (!currentMetrics) {
      return {
        status: 'critical',
        issues: ['No metrics available'],
        metrics: null,
      }
    }

    // Check hit rate
    if (currentMetrics.overall.hitRate < 0.5) {
      issues.push('Low cache hit rate')
      status = 'warning'
    }

    if (currentMetrics.overall.hitRate < 0.2) {
      issues.push('Very low cache hit rate')
      status = 'critical'
    }

    // Check error rate
    if (currentMetrics.performance.errorRate > 0.05) {
      issues.push('High error rate')
      status = 'warning'
    }

    if (currentMetrics.performance.errorRate > 0.1) {
      issues.push('Very high error rate')
      status = 'critical'
    }

    // Check response time
    if (currentMetrics.overall.avgResponseTime > 100) {
      issues.push('High average response time')
      status = 'warning'
    }

    if (currentMetrics.overall.avgResponseTime > 500) {
      issues.push('Very high average response time')
      status = 'critical'
    }

    // Check Redis connection
    if (currentMetrics.redis.connectedClients === 0) {
      issues.push('No Redis connections')
      status = 'critical'
    }

    return {
      status,
      issues,
      metrics: currentMetrics,
    }
  }

  private addMetrics(metrics: CacheMetrics): void {
    this.metrics.push(metrics)
    
    // Keep only recent metrics
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory)
    }
  }

  private addAlert(alert: CacheAlert): void {
    this.alerts.push(alert)
    
    // Keep only recent alerts
    if (this.alerts.length > this.maxAlertsHistory) {
      this.alerts = this.alerts.slice(-this.maxAlertsHistory)
    }

    logger.warn('Cache alert', alert)
  }

  private checkAlerts(metrics: CacheMetrics): void {
    const timestamp = Date.now()

    // Low hit rate alert
    if (metrics.overall.hitRate < 0.3) {
      this.addAlert({
        type: 'warning',
        message: `Low cache hit rate: ${(metrics.overall.hitRate * 100).toFixed(1)}%`,
        timestamp,
        metrics: { overall: metrics.overall },
      })
    }

    // High error rate alert
    if (metrics.performance.errorRate > 0.05) {
      this.addAlert({
        type: 'error',
        message: `High cache error rate: ${(metrics.performance.errorRate * 100).toFixed(1)}%`,
        timestamp,
        metrics: { performance: metrics.performance },
      })
    }

    // High response time alert
    if (metrics.overall.avgResponseTime > 200) {
      this.addAlert({
        type: 'warning',
        message: `High average response time: ${metrics.overall.avgResponseTime.toFixed(1)}ms`,
        timestamp,
        metrics: { overall: metrics.overall },
      })
    }

    // Redis memory usage alert
    const memoryUsageMB = metrics.redis.memoryUsage / (1024 * 1024)
    if (memoryUsageMB > 500) {
      this.addAlert({
        type: 'warning',
        message: `High Redis memory usage: ${memoryUsageMB.toFixed(1)}MB`,
        timestamp,
        metrics: { redis: metrics.redis },
      })
    }

    // Many slow queries alert
    if (metrics.performance.slowQueries > 10) {
      this.addAlert({
        type: 'warning',
        message: `Many slow cache queries: ${metrics.performance.slowQueries}`,
        timestamp,
        metrics: { performance: metrics.performance },
      })
    }
  }

  private calculateHitRate(hits: number, misses: number): number {
    const total = hits + misses
    return total > 0 ? hits / total : 0
  }

  private calculateAverageResponseTime(): number {
    if (this.responseTimeTracker.length === 0) {
      return 0
    }

    const sum = this.responseTimeTracker.reduce((acc, time) => acc + time, 0)
    return sum / this.responseTimeTracker.length
  }

  private calculateErrorRate(): number {
    return this.queryCount > 0 ? this.errorCount / this.queryCount : 0
  }

  private calculateThroughput(): number {
    // Queries per second (approximate)
    return this.queryCount / (this.monitoringIntervalMs / 1000)
  }
}

// Create and export cache monitoring instance
export const cacheMonitoring = new CacheMonitoring()

// Auto-start monitoring
if (process.env.NODE_ENV !== 'test') {
  cacheMonitoring.start()
}

// Graceful shutdown
process.on('SIGTERM', () => {
  cacheMonitoring.stop()
})

process.on('SIGINT', () => {
  cacheMonitoring.stop()
})