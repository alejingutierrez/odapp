import { describe, it, expect } from 'vitest'
import { CacheUtils } from '../lib/cache/index.js'

describe('Cache Utilities', () => {
  describe('Key Generation', () => {
    it('should generate proper cache keys', () => {
      expect(CacheUtils.generateKey('products', '123')).toBe('products:123')
      expect(CacheUtils.generateKey('products', '123', 'variants')).toBe(
        'products:123:variants'
      )
      expect(CacheUtils.generateKey('namespace', 'key', 'subkey', '456')).toBe(
        'namespace:key:subkey:456'
      )
    })

    it('should generate product keys', () => {
      expect(CacheUtils.productKey('123')).toBe('product:123')
      expect(CacheUtils.productKey('abc-def')).toBe('product:abc-def')
    })

    it('should generate customer keys', () => {
      expect(CacheUtils.customerKey('456')).toBe('customer:456')
      expect(CacheUtils.customerKey('user-789')).toBe('customer:user-789')
    })

    it('should generate order keys', () => {
      expect(CacheUtils.orderKey('789')).toBe('order:789')
      expect(CacheUtils.orderKey('order-123')).toBe('order:order-123')
    })

    it('should generate inventory keys', () => {
      expect(CacheUtils.inventoryKey('123')).toBe('inventory:123')
      expect(CacheUtils.inventoryKey('123', 'variant-456')).toBe(
        'inventory:123:variant-456'
      )
    })

    it('should generate analytics keys', () => {
      expect(CacheUtils.analyticsKey('sales', 'daily')).toBe(
        'analytics:sales:daily'
      )
      expect(CacheUtils.analyticsKey('products', 'monthly', '2024', '01')).toBe(
        'analytics:products:monthly:2024:01'
      )
    })

    it('should generate Shopify sync keys', () => {
      expect(CacheUtils.shopifySyncKey('products', 'import')).toBe(
        'shopify:sync:products:import'
      )
      expect(CacheUtils.shopifySyncKey('orders', 'export')).toBe(
        'shopify:sync:orders:export'
      )
    })
  })

  describe('Product List Keys', () => {
    it('should generate product list key without filters', () => {
      const key = CacheUtils.productListKey()
      expect(key).toBe('products:list:all')
    })

    it('should generate product list key with single filter', () => {
      const filters = { category: 'electronics' }
      const key = CacheUtils.productListKey(filters)

      expect(key).toContain('products:list:')
      expect(key).toContain('category:electronics')
    })

    it('should generate product list key with multiple filters', () => {
      const filters = {
        category: 'electronics',
        price: 'under-100',
        brand: 'apple',
      }
      const key = CacheUtils.productListKey(filters)

      expect(key).toContain('products:list:')
      expect(key).toContain('category:electronics')
      expect(key).toContain('price:under-100')
      expect(key).toContain('brand:apple')
    })

    it('should generate consistent keys for same filters in different order', () => {
      const filters1 = { category: 'electronics', price: 'under-100' }
      const filters2 = { price: 'under-100', category: 'electronics' }

      const key1 = CacheUtils.productListKey(filters1)
      const key2 = CacheUtils.productListKey(filters2)

      expect(key1).toBe(key2)
    })

    it('should handle complex filter values', () => {
      const filters = {
        search: 'iphone 15 pro',
        'price-range': '500-1000',
        'in-stock': 'true',
      }
      const key = CacheUtils.productListKey(filters)

      expect(key).toContain('products:list:')
      expect(key).toContain('search:iphone 15 pro')
      expect(key).toContain('price-range:500-1000')
      expect(key).toContain('in-stock:true')
    })
  })

  describe('Tag Generation', () => {
    it('should generate product tags', () => {
      const tags = CacheUtils.getProductTags('123')

      expect(tags).toContain('products')
      expect(tags).toContain('product:123')
      expect(tags).toHaveLength(2)
    })

    it('should generate product tags with category', () => {
      const tags = CacheUtils.getProductTags('123', 'electronics')

      expect(tags).toContain('products')
      expect(tags).toContain('product:123')
      expect(tags).toContain('category:electronics')
      expect(tags).toHaveLength(3)
    })

    it('should generate product tags with collections', () => {
      const tags = CacheUtils.getProductTags('123', undefined, [
        'summer',
        'sale',
      ])

      expect(tags).toContain('products')
      expect(tags).toContain('product:123')
      expect(tags).toContain('collection:summer')
      expect(tags).toContain('collection:sale')
      expect(tags).toHaveLength(4)
    })

    it('should generate product tags with category and collections', () => {
      const tags = CacheUtils.getProductTags('123', 'electronics', [
        'summer',
        'sale',
      ])

      expect(tags).toContain('products')
      expect(tags).toContain('product:123')
      expect(tags).toContain('category:electronics')
      expect(tags).toContain('collection:summer')
      expect(tags).toContain('collection:sale')
      expect(tags).toHaveLength(5)
    })

    it('should generate inventory tags', () => {
      const tags = CacheUtils.getInventoryTags('123')

      expect(tags).toContain('inventory')
      expect(tags).toContain('product:123')
      expect(tags).toHaveLength(2)
    })

    it('should generate inventory tags with variant', () => {
      const tags = CacheUtils.getInventoryTags('123', 'variant-456')

      expect(tags).toContain('inventory')
      expect(tags).toContain('product:123')
      expect(tags).toContain('variant:variant-456')
      expect(tags).toHaveLength(3)
    })

    it('should generate customer tags', () => {
      const tags = CacheUtils.getCustomerTags('456')

      expect(tags).toContain('customers')
      expect(tags).toContain('customer:456')
      expect(tags).toHaveLength(2)
    })

    it('should generate customer tags with segments', () => {
      const tags = CacheUtils.getCustomerTags('456', ['vip', 'frequent-buyer'])

      expect(tags).toContain('customers')
      expect(tags).toContain('customer:456')
      expect(tags).toContain('segment:vip')
      expect(tags).toContain('segment:frequent-buyer')
      expect(tags).toHaveLength(4)
    })

    it('should generate order tags', () => {
      const tags = CacheUtils.getOrderTags('789', '456')

      expect(tags).toContain('orders')
      expect(tags).toContain('order:789')
      expect(tags).toContain('customer:456')
      expect(tags).toHaveLength(3)
    })

    it('should generate order tags with products', () => {
      const tags = CacheUtils.getOrderTags('789', '456', ['123', '124'])

      expect(tags).toContain('orders')
      expect(tags).toContain('order:789')
      expect(tags).toContain('customer:456')
      expect(tags).toContain('product:123')
      expect(tags).toContain('product:124')
      expect(tags).toHaveLength(5)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty strings in key generation', () => {
      expect(CacheUtils.generateKey('namespace', '')).toBe('namespace:')
      expect(CacheUtils.generateKey('', 'key')).toBe(':key')
    })

    it('should handle special characters in keys', () => {
      expect(CacheUtils.generateKey('namespace', 'key-with-dashes')).toBe(
        'namespace:key-with-dashes'
      )
      expect(CacheUtils.generateKey('namespace', 'key_with_underscores')).toBe(
        'namespace:key_with_underscores'
      )
      expect(CacheUtils.generateKey('namespace', 'key.with.dots')).toBe(
        'namespace:key.with.dots'
      )
    })

    it('should handle numeric values in key generation', () => {
      expect(CacheUtils.generateKey('namespace', 123)).toBe('namespace:123')
      expect(CacheUtils.generateKey('namespace', 'key', 456)).toBe(
        'namespace:key:456'
      )
    })

    it('should handle empty arrays in tag generation', () => {
      const tags = CacheUtils.getProductTags('123', undefined, [])
      expect(tags).toContain('products')
      expect(tags).toContain('product:123')
      expect(tags).toHaveLength(2)
    })

    it('should handle undefined values in tag generation', () => {
      const tags = CacheUtils.getProductTags('123', undefined, undefined)
      expect(tags).toContain('products')
      expect(tags).toContain('product:123')
      expect(tags).toHaveLength(2)
    })
  })

  describe('Performance', () => {
    it('should generate keys efficiently for large datasets', () => {
      const start = Date.now()

      for (let i = 0; i < 10000; i++) {
        CacheUtils.productKey(`product-${i}`)
        CacheUtils.customerKey(`customer-${i}`)
        CacheUtils.orderKey(`order-${i}`)
      }

      const duration = Date.now() - start
      expect(duration).toBeLessThan(100) // Should complete in less than 100ms
    })

    it('should generate tags efficiently for large datasets', () => {
      const start = Date.now()

      for (let i = 0; i < 1000; i++) {
        CacheUtils.getProductTags(`product-${i}`, `category-${i % 10}`, [
          `collection-${i % 5}`,
          `collection-${i % 3}`,
        ])
        CacheUtils.getCustomerTags(`customer-${i}`, [
          `segment-${i % 4}`,
          `segment-${i % 7}`,
        ])
        CacheUtils.getOrderTags(`order-${i}`, `customer-${i}`, [
          `product-${i}`,
          `product-${i + 1}`,
        ])
      }

      const duration = Date.now() - start
      expect(duration).toBeLessThan(100) // Should complete in less than 100ms
    })
  })
})
