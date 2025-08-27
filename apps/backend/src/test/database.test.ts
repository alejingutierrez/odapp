import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import {
  prisma,
  connectDatabase,
  disconnectDatabase,
  getDatabaseMetrics,
} from '../lib/prisma'
import { databaseHealthChecker } from '../lib/database-health.js'
import { databasePool } from '../lib/database-pool.js'

describe('Database Setup', () => {
  beforeAll(async () => {
    await connectDatabase()
  })

  afterAll(async () => {
    await disconnectDatabase()
  })

  it('should connect to the database successfully', async () => {
    const result = await prisma.$queryRaw`SELECT 1 as test`
    expect(result).toBeDefined()
    expect(Array.isArray(result)).toBe(true)
  })

  it('should have seeded data', async () => {
    const userCount = await prisma.user.count()
    const roleCount = await prisma.role.count()
    const locationCount = await prisma.location.count()
    const categoryCount = await prisma.category.count()
    const productCount = await prisma.product.count()
    const customerCount = await prisma.customer.count()

    expect(userCount).toBeGreaterThan(0)
    expect(roleCount).toBeGreaterThan(0)
    expect(locationCount).toBeGreaterThan(0)
    expect(categoryCount).toBeGreaterThan(0)
    expect(productCount).toBeGreaterThan(0)
    expect(customerCount).toBeGreaterThan(0)
  })

  it('should have proper indexes created', async () => {
    const indexes = await prisma.$queryRaw`
      SELECT indexname, tablename 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND indexname LIKE 'idx_%'
      ORDER BY tablename, indexname
    `

    expect(Array.isArray(indexes)).toBe(true)
    expect((indexes as unknown[]).length).toBeGreaterThan(10)
  })

  it('should perform health check successfully', async () => {
    const healthResult = await databaseHealthChecker.performHealthCheck()

    expect(healthResult.status).toMatch(/healthy|degraded/)
    expect(healthResult.checks.connection.status).toBe('pass')
    expect(healthResult.checks.performance.status).toMatch(/pass|warn/)
    expect(healthResult.checks.storage.status).toMatch(/pass|warn/)
  })

  it('should get database metrics', async () => {
    const metrics = await getDatabaseMetrics()

    expect(metrics).toBeDefined()
    expect(typeof metrics.users).toBe('number')
    expect(typeof metrics.products).toBe('number')
    expect(typeof metrics.orders).toBe('number')
    expect(typeof metrics.customers).toBe('number')
    expect(typeof metrics.inventoryItems).toBe('number')
    expect(metrics.timestamp).toBeDefined()
  })

  it('should handle database pool operations', async () => {
    const poolHealth = await databasePool.healthCheck()

    expect(poolHealth.healthy).toBe(true)
    expect(poolHealth.stats).toBeDefined()
    expect(typeof poolHealth.stats.totalCount).toBe('number')
    expect(typeof poolHealth.stats.idleCount).toBe('number')
  })

  it('should create and query products with variants', async () => {
    const products = await prisma.product.findMany({
      include: {
        variants: true,
        category: true,
        inventory: true,
      },
      take: 1,
    })

    expect(products.length).toBeGreaterThan(0)

    const product = products[0]
    expect(product.variants.length).toBeGreaterThan(0)
    expect(product.category).toBeDefined()
    expect(product.inventory.length).toBeGreaterThan(0)
  })

  it('should create and query customers with addresses', async () => {
    const customers = await prisma.customer.findMany({
      include: {
        addresses: true,
        orders: true,
      },
      take: 1,
    })

    expect(customers.length).toBeGreaterThan(0)

    const customer = customers[0]
    expect(customer.email).toBeDefined()
    expect(customer.addresses.length).toBeGreaterThan(0)
  })

  it('should handle inventory operations', async () => {
    const inventory = await prisma.inventoryItem.findMany({
      include: {
        product: true,
        variant: true,
        location: true,
      },
      take: 1,
    })

    expect(inventory.length).toBeGreaterThan(0)

    const item = inventory[0]
    expect(item.quantity).toBeGreaterThanOrEqual(0)
    expect(item.availableQuantity).toBeGreaterThanOrEqual(0)
    expect(item.location).toBeDefined()
  })

  it('should support full-text search on products', async () => {
    const searchResults = await prisma.$queryRaw`
      SELECT id, name, description
      FROM products
      WHERE to_tsvector('english', name || ' ' || COALESCE(description, '')) 
      @@ plainto_tsquery('english', 'classic white')
      LIMIT 5
    `

    expect(Array.isArray(searchResults)).toBe(true)
  })

  it('should support complex queries with joins', async () => {
    const result = await prisma.product.findMany({
      where: {
        isActive: true,
        status: 'ACTIVE',
        inventory: {
          some: {
            availableQuantity: {
              gt: 0,
            },
          },
        },
      },
      include: {
        variants: {
          where: {
            isActive: true,
          },
        },
        inventory: {
          where: {
            availableQuantity: {
              gt: 0,
            },
          },
          include: {
            location: true,
          },
        },
        category: true,
      },
      take: 5,
    })

    expect(Array.isArray(result)).toBe(true)
  })
})
