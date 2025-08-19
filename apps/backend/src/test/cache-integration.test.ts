import { describe, it, expect, beforeEach, vi } from 'vitest'
import { cacheManager, CacheAsidePattern, WriteThroughPattern } from '../lib/cache/index.js'

describe('Cache Integration Tests', () => {
  beforeEach(() => {
    // Reset cache stats before each test
    cacheManager.resetStats()
  })

  describe('Memory Cache Only', () => {
    it('should cache and retrieve values using memory cache only', async () => {
      const key = 'test:memory:123'
      const value = { id: '123', name: 'Test Product', price: 99.99 }

      // Set with memory cache only
      await cacheManager.set(key, value, { 
        useMemoryCache: true, 
        useRedisCache: false 
      })

      // Get from memory cache only
      const cachedValue = await cacheManager.get(key, { 
        useMemoryCache: true, 
        useRedisCache: false 
      })

      expect(cachedValue).toEqual(value)
    })

    it('should handle cache miss in memory cache', async () => {
      const key = 'test:memory:nonexistent'
      
      const cachedValue = await cacheManager.get(key, { 
        useMemoryCache: true, 
        useRedisCache: false 
      })

      expect(cachedValue).toBeNull()
    })

    it('should delete from memory cache', async () => {
      const key = 'test:memory:delete'
      const value = { id: '123', data: 'test' }

      await cacheManager.set(key, value, { 
        useMemoryCache: true, 
        useRedisCache: false 
      })

      let cachedValue = await cacheManager.get(key, { 
        useMemoryCache: true, 
        useRedisCache: false 
      })
      expect(cachedValue).toEqual(value)

      await cacheManager.del(key)
      
      cachedValue = await cacheManager.get(key, { 
        useMemoryCache: true, 
        useRedisCache: false 
      })
      expect(cachedValue).toBeNull()
    })

    it('should track cache statistics', async () => {
      const key = 'test:memory:stats'
      const value = { id: '123', data: 'test' }

      // Initial stats should be zero
      let stats = cacheManager.getStats()
      expect(stats.totalHits).toBe(0)
      expect(stats.totalMisses).toBe(0)

      // Cache miss
      await cacheManager.get(key, { 
        useMemoryCache: true, 
        useRedisCache: false 
      })
      stats = cacheManager.getStats()
      expect(stats.totalMisses).toBe(1)

      // Cache set and hit
      await cacheManager.set(key, value, { 
        useMemoryCache: true, 
        useRedisCache: false 
      })
      await cacheManager.get(key, { 
        useMemoryCache: true, 
        useRedisCache: false 
      })
      stats = cacheManager.getStats()
      expect(stats.totalHits).toBe(1)
      expect(stats.hitRate).toBeCloseTo(0.5) // 1 hit, 1 miss
    })
  })

  describe('Cache-Aside Pattern', () => {
    it('should load data on cache miss', async () => {
      const key = 'test:cache-aside:123'
      const expectedValue = { id: '123', name: 'Loaded Product' }
      
      const loader = vi.fn().mockResolvedValue(expectedValue)

      const result = await CacheAsidePattern.get(key, { 
        loader,
        useMemoryCache: true,
        useRedisCache: false
      })

      expect(loader).toHaveBeenCalledOnce()
      expect(result).toEqual(expectedValue)

      // Second call should hit cache
      const result2 = await CacheAsidePattern.get(key, { 
        loader,
        useMemoryCache: true,
        useRedisCache: false
      })
      expect(loader).toHaveBeenCalledOnce() // Still only called once
      expect(result2).toEqual(expectedValue)
    })

    it('should handle loader errors gracefully', async () => {
      const key = 'test:cache-aside:error'
      const error = new Error('Loader failed')
      const loader = vi.fn().mockRejectedValue(error)

      await expect(CacheAsidePattern.get(key, { 
        loader,
        useMemoryCache: true,
        useRedisCache: false
      })).rejects.toThrow('Loader failed')
    })

    it('should invalidate cache entries', async () => {
      const key = 'test:cache-aside:invalidate'
      const value = { id: '123', data: 'test' }
      
      await cacheManager.set(key, value, { 
        useMemoryCache: true, 
        useRedisCache: false 
      })
      expect(await cacheManager.get(key, { 
        useMemoryCache: true, 
        useRedisCache: false 
      })).toEqual(value)

      await CacheAsidePattern.invalidate(key)
      expect(await cacheManager.get(key, { 
        useMemoryCache: true, 
        useRedisCache: false 
      })).toBeNull()
    })
  })

  describe('Write-Through Pattern', () => {
    it('should write to both cache and data store', async () => {
      const key = 'test:write-through:123'
      const value = { id: '123', name: 'Test Product' }
      const updatedValue = { id: '123', name: 'Test Product', updatedAt: new Date() }
      
      const writer = vi.fn().mockResolvedValue(updatedValue)

      const result = await WriteThroughPattern.write(key, value, { 
        writer,
        useMemoryCache: true,
        useRedisCache: false
      })

      expect(writer).toHaveBeenCalledWith(value)
      expect(result).toEqual(updatedValue)

      // Verify it's cached
      const cachedValue = await cacheManager.get(key, { 
        useMemoryCache: true, 
        useRedisCache: false 
      })
      expect(cachedValue).toEqual(updatedValue)
    })

    it('should handle writer errors', async () => {
      const key = 'test:write-through:error'
      const value = { id: '123', data: 'test' }
      const error = new Error('Writer failed')
      
      const writer = vi.fn().mockRejectedValue(error)

      await expect(WriteThroughPattern.write(key, value, { 
        writer,
        useMemoryCache: true,
        useRedisCache: false
      })).rejects.toThrow('Writer failed')
    })

    it('should delete from both cache and data store', async () => {
      const key = 'test:write-through:delete'
      const value = { id: '123', data: 'test' }
      
      await cacheManager.set(key, value, { 
        useMemoryCache: true, 
        useRedisCache: false 
      })
      expect(await cacheManager.get(key, { 
        useMemoryCache: true, 
        useRedisCache: false 
      })).toEqual(value)

      const deleter = vi.fn().mockResolvedValue(undefined)
      await WriteThroughPattern.delete(key, deleter)

      expect(deleter).toHaveBeenCalledOnce()
      expect(await cacheManager.get(key, { 
        useMemoryCache: true, 
        useRedisCache: false 
      })).toBeNull()
    })
  })

  describe('Namespaces', () => {
    it('should handle different namespaces independently', async () => {
      const key = 'test:123'
      const value1 = { namespace: 'products', data: 'product data' }
      const value2 = { namespace: 'customers', data: 'customer data' }

      await cacheManager.set(key, value1, { 
        namespace: 'products',
        useMemoryCache: true,
        useRedisCache: false
      })
      await cacheManager.set(key, value2, { 
        namespace: 'customers',
        useMemoryCache: true,
        useRedisCache: false
      })

      const productValue = await cacheManager.get(key, { 
        namespace: 'products',
        useMemoryCache: true,
        useRedisCache: false
      })
      const customerValue = await cacheManager.get(key, { 
        namespace: 'customers',
        useMemoryCache: true,
        useRedisCache: false
      })

      expect(productValue).toEqual(value1)
      expect(customerValue).toEqual(value2)
    })

    it('should clear namespace independently', async () => {
      const key1 = 'test:123'
      const key2 = 'test:456'
      const value1 = { data: 'product 1' }
      const value2 = { data: 'product 2' }
      const value3 = { data: 'customer 1' }

      // Set values in different namespaces
      await cacheManager.set(key1, value1, { 
        namespace: 'products',
        useMemoryCache: true,
        useRedisCache: false
      })
      await cacheManager.set(key2, value2, { 
        namespace: 'products',
        useMemoryCache: true,
        useRedisCache: false
      })
      await cacheManager.set(key1, value3, { 
        namespace: 'customers',
        useMemoryCache: true,
        useRedisCache: false
      })

      // Clear products namespace
      await cacheManager.clear('products')

      // Products should be cleared
      expect(await cacheManager.get(key1, { 
        namespace: 'products',
        useMemoryCache: true,
        useRedisCache: false
      })).toBeNull()
      expect(await cacheManager.get(key2, { 
        namespace: 'products',
        useMemoryCache: true,
        useRedisCache: false
      })).toBeNull()

      // Customers should still exist
      expect(await cacheManager.get(key1, { 
        namespace: 'customers',
        useMemoryCache: true,
        useRedisCache: false
      })).toEqual(value3)
    })
  })

  describe('Performance', () => {
    it('should handle concurrent cache operations', async () => {
      const operations = []
      
      // Create 100 concurrent cache operations
      for (let i = 0; i < 100; i++) {
        operations.push(
          cacheManager.set(`test:concurrent:${i}`, { id: i, data: `test-${i}` }, {
            useMemoryCache: true,
            useRedisCache: false
          })
        )
      }

      // All operations should complete successfully
      await expect(Promise.all(operations)).resolves.not.toThrow()

      // Verify all values are cached
      const getOperations = []
      for (let i = 0; i < 100; i++) {
        getOperations.push(cacheManager.get(`test:concurrent:${i}`, {
          useMemoryCache: true,
          useRedisCache: false
        }))
      }

      const results = await Promise.all(getOperations)
      expect(results).toHaveLength(100)
      expect(results.every(result => result !== null)).toBe(true)
    })

    it('should handle large cache values', async () => {
      const key = 'test:large:123'
      
      // Create a large object (100KB of data)
      const largeValue = {
        id: '123',
        data: 'x'.repeat(100 * 1024), // 100KB string
        metadata: {
          size: '100KB',
          created: new Date().toISOString()
        }
      }

      await expect(cacheManager.set(key, largeValue, {
        useMemoryCache: true,
        useRedisCache: false
      })).resolves.not.toThrow()
      
      const cachedValue = await cacheManager.get(key, {
        useMemoryCache: true,
        useRedisCache: false
      })
      expect(cachedValue).toEqual(largeValue)
    })
  })
})