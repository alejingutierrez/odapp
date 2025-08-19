import { cacheManager, CacheOptions } from './cache-manager.js'
import logger from '../logger.js'

export interface CacheAsideOptions<T> extends CacheOptions {
  loader: () => Promise<T>
  keyGenerator?: (params: any) => string
}

export interface WriteThroughOptions<T> extends CacheOptions {
  writer: (data: T) => Promise<T>
  keyGenerator?: (params: any) => string
}

/**
 * Cache-Aside Pattern
 * Application manages cache explicitly
 */
export class CacheAsidePattern {
  /**
   * Get data with cache-aside pattern
   */
  static async get<T>(
    key: string,
    options: CacheAsideOptions<T>
  ): Promise<T> {
    const { loader, ...cacheOptions } = options

    try {
      // Try to get from cache first
      const cachedData = await cacheManager.get<T>(key, cacheOptions)
      
      if (cachedData !== null) {
        logger.debug('Cache-aside hit', { key })
        return cachedData
      }

      // Cache miss - load from source
      logger.debug('Cache-aside miss, loading from source', { key })
      const data = await loader()

      // Store in cache for future requests
      await cacheManager.set(key, data, cacheOptions)

      return data
    } catch (error) {
      logger.error('Cache-aside get error', { key, error })
      // Fallback to loader if cache fails
      return await loader()
    }
  }

  /**
   * Invalidate cache entry
   */
  static async invalidate(key: string, namespace?: string): Promise<void> {
    try {
      await cacheManager.del(key, namespace)
      logger.debug('Cache-aside invalidated', { key, namespace })
    } catch (error) {
      logger.error('Cache-aside invalidation error', { key, namespace, error })
    }
  }

  /**
   * Invalidate by tags
   */
  static async invalidateByTags(tags: string[]): Promise<void> {
    try {
      await cacheManager.invalidateByTags(tags)
      logger.debug('Cache-aside invalidated by tags', { tags })
    } catch (error) {
      logger.error('Cache-aside tag invalidation error', { tags, error })
    }
  }
}

/**
 * Write-Through Pattern
 * Cache is updated synchronously with the data store
 */
export class WriteThroughPattern {
  /**
   * Write data with write-through pattern
   */
  static async write<T>(
    key: string,
    data: T,
    options: WriteThroughOptions<T>
  ): Promise<T> {
    const { writer, ...cacheOptions } = options

    try {
      // Write to primary data store first
      const result = await writer(data)

      // Update cache with the result
      await cacheManager.set(key, result, cacheOptions)

      logger.debug('Write-through completed', { key })
      return result
    } catch (error) {
      logger.error('Write-through error', { key, error })
      throw error
    }
  }

  /**
   * Update data with write-through pattern
   */
  static async update<T>(
    key: string,
    data: T,
    options: WriteThroughOptions<T>
  ): Promise<T> {
    return this.write(key, data, options)
  }

  /**
   * Delete data with write-through pattern
   */
  static async delete(
    key: string,
    deleter: () => Promise<void>,
    namespace?: string
  ): Promise<void> {
    try {
      // Delete from primary data store first
      await deleter()

      // Remove from cache
      await cacheManager.del(key, namespace)

      logger.debug('Write-through delete completed', { key })
    } catch (error) {
      logger.error('Write-through delete error', { key, error })
      throw error
    }
  }
}

/**
 * Write-Behind (Write-Back) Pattern
 * Cache is updated immediately, data store is updated asynchronously
 */
export class WriteBehindPattern {
  private static writeQueue: Map<string, { data: any; timestamp: number }> = new Map()
  private static flushInterval: NodeJS.Timeout | null = null
  private static flushIntervalMs = 5000 // 5 seconds

  /**
   * Initialize write-behind pattern
   */
  static initialize(): void {
    if (!this.flushInterval) {
      this.flushInterval = setInterval(() => {
        this.flushWrites().catch(error => {
          logger.error('Write-behind flush error', { error })
        })
      }, this.flushIntervalMs)
    }
  }

  /**
   * Shutdown write-behind pattern
   */
  static async shutdown(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
      this.flushInterval = null
    }
    
    // Flush any remaining writes
    await this.flushWrites()
  }

  /**
   * Write data with write-behind pattern
   */
  static async write<T>(
    key: string,
    data: T,
    writer: (data: T) => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    try {
      // Update cache immediately
      await cacheManager.set(key, data, options)

      // Queue write to data store
      this.writeQueue.set(key, { data, timestamp: Date.now() })

      logger.debug('Write-behind queued', { key })
      return data
    } catch (error) {
      logger.error('Write-behind error', { key, error })
      throw error
    }
  }

  /**
   * Flush pending writes to data store
   */
  private static async flushWrites(): Promise<void> {
    if (this.writeQueue.size === 0) {
      return
    }

    const writes = Array.from(this.writeQueue.entries())
    this.writeQueue.clear()

    const flushPromises = writes.map(async ([key, { data }]) => {
      try {
        // This would need to be implemented based on specific data store logic
        logger.debug('Write-behind flushing', { key })
        // await dataStore.write(key, data)
      } catch (error) {
        logger.error('Write-behind flush failed', { key, error })
        // Re-queue failed writes
        this.writeQueue.set(key, { data, timestamp: Date.now() })
      }
    })

    await Promise.allSettled(flushPromises)
  }
}

/**
 * Refresh-Ahead Pattern
 * Proactively refresh cache before expiration
 */
export class RefreshAheadPattern {
  private static refreshTasks: Map<string, NodeJS.Timeout> = new Map()

  /**
   * Get data with refresh-ahead pattern
   */
  static async get<T>(
    key: string,
    loader: () => Promise<T>,
    options: CacheOptions & { refreshThreshold?: number } = {}
  ): Promise<T> {
    const { refreshThreshold = 0.8, ...cacheOptions } = options

    try {
      const cachedData = await cacheManager.get<T>(key, cacheOptions)
      
      if (cachedData !== null) {
        // Schedule refresh if needed
        this.scheduleRefresh(key, loader, cacheOptions, refreshThreshold)
        return cachedData
      }

      // Cache miss - load and cache
      const data = await loader()
      await cacheManager.set(key, data, cacheOptions)
      
      // Schedule refresh
      this.scheduleRefresh(key, loader, cacheOptions, refreshThreshold)
      
      return data
    } catch (error) {
      logger.error('Refresh-ahead get error', { key, error })
      return await loader()
    }
  }

  /**
   * Schedule refresh task
   */
  private static scheduleRefresh<T>(
    key: string,
    loader: () => Promise<T>,
    options: CacheOptions,
    refreshThreshold: number
  ): void {
    // Clear existing refresh task
    const existingTask = this.refreshTasks.get(key)
    if (existingTask) {
      clearTimeout(existingTask)
    }

    const ttl = options.redisTtl || options.ttl || 3600
    const refreshTime = ttl * refreshThreshold * 1000 // Convert to milliseconds

    const refreshTask = setTimeout(async () => {
      try {
        logger.debug('Refresh-ahead refreshing', { key })
        const data = await loader()
        await cacheManager.set(key, data, options)
        
        // Schedule next refresh
        this.scheduleRefresh(key, loader, options, refreshThreshold)
      } catch (error) {
        logger.error('Refresh-ahead refresh error', { key, error })
      }
    }, refreshTime)

    this.refreshTasks.set(key, refreshTask)
  }

  /**
   * Cancel refresh task
   */
  static cancelRefresh(key: string): void {
    const task = this.refreshTasks.get(key)
    if (task) {
      clearTimeout(task)
      this.refreshTasks.delete(key)
    }
  }

  /**
   * Shutdown refresh-ahead pattern
   */
  static shutdown(): void {
    for (const [key, task] of this.refreshTasks.entries()) {
      clearTimeout(task)
    }
    this.refreshTasks.clear()
  }
}

// Initialize patterns
WriteBehindPattern.initialize()

// Graceful shutdown
process.on('SIGTERM', async () => {
  await WriteBehindPattern.shutdown()
  RefreshAheadPattern.shutdown()
})

process.on('SIGINT', async () => {
  await WriteBehindPattern.shutdown()
  RefreshAheadPattern.shutdown()
})