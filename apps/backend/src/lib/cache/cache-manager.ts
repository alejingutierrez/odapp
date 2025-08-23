import { LRUCache } from 'lru-cache'

import { env } from '../../config/env.js'
import logger from '../logger.js'

import { redisClient } from './redis-client.js'

export interface CacheOptions {
  ttl?: number
  useMemoryCache?: boolean
  useRedisCache?: boolean
  memoryTtl?: number
  redisTtl?: number
  maxMemoryItems?: number
  tags?: string[]
  namespace?: string
}

export interface CacheEntry<T = unknown> {
  data: T
  timestamp: number
  ttl: number
  tags?: string[]
}

export interface CacheStats {
  memoryHits: number
  memoryMisses: number
  redisHits: number
  redisMisses: number
  totalHits: number
  totalMisses: number
  hitRate: number
  memorySize: number
  redisSize: number
}

export class CacheManager {
  private memoryCache: LRUCache<string, CacheEntry>
  private stats: CacheStats
  private tagMap: Map<string, Set<string>> = new Map()

  constructor() {
    // Initialize memory cache with LRU eviction
    this.memoryCache = new LRUCache({
      max: 1000, // Maximum number of items
      maxSize: 50 * 1024 * 1024, // 50MB max memory usage
      sizeCalculation: (value: CacheEntry) => {
        return JSON.stringify(value).length
      },
      ttl: 5 * 60 * 1000, // 5 minutes default TTL for memory cache
      allowStale: false,
      updateAgeOnGet: true,
      updateAgeOnHas: true,
    })

    // Initialize stats
    this.stats = {
      memoryHits: 0,
      memoryMisses: 0,
      redisHits: 0,
      redisMisses: 0,
      totalHits: 0,
      totalMisses: 0,
      hitRate: 0,
      memorySize: 0,
      redisSize: 0,
    }
  }

  /**
   * Get value from cache with multi-level strategy
   */
  async get<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
    const {
      useMemoryCache = true,
      useRedisCache = true,
      namespace = 'default',
    } = options

    const namespacedKey = this.getNamespacedKey(key, namespace)

    try {
      // Level 1: Check memory cache first
      if (useMemoryCache) {
        const memoryEntry = this.memoryCache.get(namespacedKey)
        if (memoryEntry && !this.isExpired(memoryEntry)) {
          this.stats.memoryHits++
          this.stats.totalHits++
          this.updateStats()
          logger.debug('Cache hit (memory)', { key: namespacedKey })
          return memoryEntry.data as T | null
        }
        this.stats.memoryMisses++
      }

      // Level 2: Check Redis cache
      if (useRedisCache && redisClient.isReady()) {
        const client = redisClient.getClient()
        const redisValue = await client.get(namespacedKey)

        if (redisValue) {
          const redisEntry: CacheEntry<T> = JSON.parse(redisValue)

          if (!this.isExpired(redisEntry)) {
            this.stats.redisHits++
            this.stats.totalHits++

            // Promote to memory cache
            if (useMemoryCache) {
              this.memoryCache.set(namespacedKey, redisEntry)
            }

            this.updateStats()
            logger.debug('Cache hit (Redis)', { key: namespacedKey })
            return redisEntry.data as T | null
          } else {
            // Remove expired entry from Redis
            await client.del(namespacedKey)
          }
        }
        this.stats.redisMisses++
      }

      this.stats.totalMisses++
      this.updateStats()
      logger.debug('Cache miss', { key: namespacedKey })
      return null
    } catch (error) {
      logger.error('Cache get error', { key: namespacedKey, error })
      return null
    }
  }

  /**
   * Set value in cache with multi-level strategy
   */
  async set<T>(
    key: string,
    value: T,
    options: CacheOptions = {}
  ): Promise<void> {
    const {
      ttl = env.REDIS_TTL,
      useMemoryCache = true,
      useRedisCache = true,
      memoryTtl = 5 * 60 * 1000, // 5 minutes
      redisTtl = ttl,
      tags = [],
      namespace = 'default',
    } = options

    const namespacedKey = this.getNamespacedKey(key, namespace)
    const timestamp = Date.now()

    try {
      // Create cache entry
      const entry: CacheEntry<T> = {
        data: value,
        timestamp,
        ttl: redisTtl * 1000, // Convert to milliseconds
        tags,
      }

      // Level 1: Set in memory cache
      if (useMemoryCache) {
        const memoryEntry = { ...entry, ttl: memoryTtl }
        this.memoryCache.set(namespacedKey, memoryEntry)
      }

      // Level 2: Set in Redis cache
      if (useRedisCache && redisClient.isReady()) {
        const client = redisClient.getClient()
        await client.setEx(
          namespacedKey,
          Math.floor(redisTtl),
          JSON.stringify(entry)
        )
      }

      // Update tag mapping
      this.updateTagMapping(namespacedKey, tags)

      logger.debug('Cache set', { key: namespacedKey, ttl: redisTtl })
    } catch (error) {
      logger.error('Cache set error', { key: namespacedKey, error })
      throw error
    }
  }

  /**
   * Delete specific key from cache
   */
  async del(key: string, namespace = 'default'): Promise<void> {
    const namespacedKey = this.getNamespacedKey(key, namespace)

    try {
      // Remove from memory cache
      this.memoryCache.delete(namespacedKey)

      // Remove from Redis cache
      if (redisClient.isReady()) {
        const client = redisClient.getClient()
        await client.del(namespacedKey)
      }

      // Remove from tag mapping
      this.removeFromTagMapping(namespacedKey)

      logger.debug('Cache delete', { key: namespacedKey })
    } catch (error) {
      logger.error('Cache delete error', { key: namespacedKey, error })
      throw error
    }
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateByTags(tags: string[]): Promise<void> {
    try {
      const keysToInvalidate = new Set<string>()

      // Collect all keys associated with the tags
      for (const tag of tags) {
        const taggedKeys = this.tagMap.get(tag)
        if (taggedKeys) {
          taggedKeys.forEach((key) => keysToInvalidate.add(key))
        }
      }

      // Remove keys from both caches
      const deletePromises = Array.from(keysToInvalidate).map((key) =>
        this.del(key)
      )
      await Promise.all(deletePromises)

      logger.info('Cache invalidated by tags', {
        tags,
        keysCount: keysToInvalidate.size,
      })
    } catch (error) {
      logger.error('Cache invalidation error', { tags, error })
      throw error
    }
  }

  /**
   * Clear all cache
   */
  async clear(namespace?: string): Promise<void> {
    try {
      if (namespace) {
        // Clear specific namespace
        const pattern = `${namespace}:*`

        // Clear memory cache
        for (const key of this.memoryCache.keys()) {
          if (key.startsWith(`${namespace}:`)) {
            this.memoryCache.delete(key)
          }
        }

        // Clear Redis cache
        if (redisClient.isReady()) {
          const client = redisClient.getClient()
          const keys = await (client as { keys: (_pattern: string) => Promise<string[]> }).keys(pattern)
          if (keys.length > 0) {
            await client.del(keys)
          }
        }
      } else {
        // Clear all caches
        this.memoryCache.clear()

        if (redisClient.isReady()) {
          const client = redisClient.getClient()
          await (client as unknown as { flushDb: () => Promise<void> }).flushDb()
        }
      }

      // Clear tag mapping
      this.tagMap.clear()

      logger.info('Cache cleared', { namespace })
    } catch (error) {
      logger.error('Cache clear error', { namespace, error })
      throw error
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    this.stats.memorySize = this.memoryCache.calculatedSize || 0
    return { ...this.stats }
  }

  /**
   * Reset cache statistics
   */
  resetStats(): void {
    this.stats = {
      memoryHits: 0,
      memoryMisses: 0,
      redisHits: 0,
      redisMisses: 0,
      totalHits: 0,
      totalMisses: 0,
      hitRate: 0,
      memorySize: 0,
      redisSize: 0,
    }
  }

  /**
   * Warm cache with frequently accessed data
   */
  async warmCache(
    warmupData: Array<{ key: string; value: unknown; options?: CacheOptions }>
  ): Promise<void> {
    try {
      const warmupPromises = warmupData.map(({ key, value, options }) =>
        this.set(key, value, options)
      )

      await Promise.all(warmupPromises)

      logger.info('Cache warmed up', { itemsCount: warmupData.length })
    } catch (error) {
      logger.error('Cache warmup error', { error })
      throw error
    }
  }

  private getNamespacedKey(key: string, namespace: string): string {
    return `${namespace}:${key}`
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl
  }

  private updateStats(): void {
    const total = this.stats.totalHits + this.stats.totalMisses
    this.stats.hitRate = total > 0 ? this.stats.totalHits / total : 0
  }

  private updateTagMapping(key: string, tags: string[]): void {
    // Remove key from old tag mappings
    this.removeFromTagMapping(key)

    // Add key to new tag mappings
    for (const tag of tags) {
      if (!this.tagMap.has(tag)) {
        this.tagMap.set(tag, new Set())
      }
      this.tagMap.get(tag)!.add(key)
    }
  }

  private removeFromTagMapping(key: string): void {
    for (const [tag, keys] of Array.from(this.tagMap.entries())) {
      keys.delete(key)
      if (keys.size === 0) {
        this.tagMap.delete(tag)
      }
    }
  }
}

// Create and export cache manager instance
export const cacheManager = new CacheManager()
