#!/usr/bin/env tsx

import { databaseHealthChecker } from '../lib/database-health.js'
import { migrationManager } from '../lib/database-migrations.js'
import {
  prisma,
  connectDatabase,
  disconnectDatabase,
  getDatabaseMetrics,
} from '../lib/prisma.js'

async function verifyDatabase() {
  console.log('🔍 Starting database verification...\n')

  try {
    // Connect to database
    console.log('1. Testing database connection...')
    await connectDatabase()
    console.log('✅ Database connection successful\n')

    // Check migration status
    console.log('2. Checking migration status...')
    const migrationStatus = await migrationManager.getMigrationStatus()
    console.log(`✅ Applied migrations: ${migrationStatus.applied.length}`)
    console.log(`⏳ Pending migrations: ${migrationStatus.pending.length}`)
    if (migrationStatus.pending.length > 0) {
      console.log('   Pending:', migrationStatus.pending.join(', '))
    }
    console.log()

    // Validate migrations
    console.log('3. Validating migrations...')
    const validation = await migrationManager.validateMigrations()
    if (validation.valid) {
      console.log('✅ All migrations are valid')
    } else {
      console.log('❌ Migration validation failed:')
      validation.errors.forEach((error) => console.log(`   - ${error}`))
    }
    console.log()

    // Check database health
    console.log('4. Performing health check...')
    const healthResult = await databaseHealthChecker.performHealthCheck()
    console.log(`✅ Database health: ${healthResult.status}`)
    console.log(
      `   Connection: ${healthResult.checks.connection.status} (${healthResult.checks.connection.duration}ms)`
    )
    console.log(
      `   Performance: ${healthResult.checks.performance.status} (${healthResult.checks.performance.duration}ms)`
    )
    console.log(
      `   Storage: ${healthResult.checks.storage.status} (${healthResult.checks.storage.duration}ms)`
    )
    console.log()

    // Get database metrics
    console.log('5. Collecting database metrics...')
    const metrics = await getDatabaseMetrics()
    console.log('✅ Database metrics:')
    console.log(`   Users: ${metrics.users}`)
    console.log(`   Products: ${metrics.products}`)
    console.log(`   Orders: ${metrics.orders}`)
    console.log(`   Customers: ${metrics.customers}`)
    console.log(`   Inventory Items: ${metrics.inventoryItems}`)
    console.log()

    // Check indexes
    console.log('6. Verifying database indexes...')
    const indexes = await prisma.$queryRaw<
      Array<{ indexname: string; tablename: string }>
    >`
      SELECT indexname, tablename 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND indexname LIKE 'idx_%'
      ORDER BY tablename, indexname
    `
    console.log(`✅ Custom indexes created: ${indexes.length}`)

    // Group indexes by table
    const indexesByTable = indexes.reduce(
      (acc, index) => {
        if (!acc[index.tablename]) {
          acc[index.tablename] = []
        }
        acc[index.tablename].push(index.indexname)
        return acc
      },
      {} as Record<string, string[]>
    )

    Object.entries(indexesByTable).forEach(([table, tableIndexes]) => {
      console.log(`   ${table}: ${tableIndexes.length} indexes`)
    })
    console.log()

    // Test complex queries
    console.log('7. Testing complex queries...')

    // Test product search with full-text search
    const searchResults = await prisma.$queryRaw<
      Array<{ id: string; name: string }>
    >`
      SELECT id, name
      FROM products
      WHERE to_tsvector('english', name || ' ' || COALESCE(description, '')) 
      @@ plainto_tsquery('english', 'classic')
      LIMIT 3
    `
    console.log(`✅ Full-text search: ${searchResults.length} results`)

    // Test inventory with low stock
    const lowStockItems = await prisma.inventoryItem.findMany({
      where: {
        quantity: {
          lte: prisma.inventoryItem.fields.lowStockThreshold,
        },
      },
      include: {
        product: {
          select: { name: true },
        },
        location: {
          select: { name: true },
        },
      },
      take: 5,
    })
    console.log(`✅ Low stock query: ${lowStockItems.length} items`)

    // Test customer segmentation
    const vipCustomers = await prisma.customer.findMany({
      where: {
        lifetimeValue: {
          gte: 100,
        },
        status: 'ACTIVE',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        lifetimeValue: true,
      },
      take: 5,
    })
    console.log(`✅ VIP customers query: ${vipCustomers.length} customers`)

    // Test order analytics
    const orderStats = await prisma.order.aggregate({
      _count: {
        id: true,
      },
      _sum: {
        totalAmount: true,
      },
      _avg: {
        totalAmount: true,
      },
    })
    console.log(
      `✅ Order analytics: ${orderStats._count.id} orders, $${orderStats._sum.totalAmount || 0} total, $${orderStats._avg.totalAmount || 0} average`
    )
    console.log()

    // Test database constraints and relationships
    console.log('8. Testing database relationships...')

    const productWithRelations = await prisma.product.findFirst({
      include: {
        variants: true,
        images: true,
        category: true,
        inventory: {
          include: {
            location: true,
          },
        },
        collections: {
          include: {
            collection: true,
          },
        },
      },
    })

    if (productWithRelations) {
      console.log('✅ Product relationships:')
      console.log(`   Variants: ${productWithRelations.variants.length}`)
      console.log(`   Images: ${productWithRelations.images.length}`)
      console.log(
        `   Category: ${productWithRelations.category?.name || 'None'}`
      )
      console.log(
        `   Inventory locations: ${productWithRelations.inventory.length}`
      )
      console.log(`   Collections: ${productWithRelations.collections.length}`)
    }
    console.log()

    // Test audit logging
    console.log('9. Testing audit logging...')
    const auditCount = await prisma.auditLog.count()
    console.log(`✅ Audit logs: ${auditCount} entries`)
    console.log()

    // Performance test
    console.log('10. Running performance tests...')
    const start = Date.now()

    await Promise.all([
      prisma.product.count(),
      prisma.customer.count(),
      prisma.order.count(),
      prisma.inventoryItem.count(),
    ])

    const duration = Date.now() - start
    console.log(`✅ Concurrent queries completed in ${duration}ms`)
    console.log()

    console.log('🎉 Database verification completed successfully!')
    console.log('\n📊 Summary:')
    console.log(`   - Database health: ${healthResult.status}`)
    console.log(
      `   - Total entities: ${Object.values(metrics).reduce((sum, count) => (sum as number) + (typeof count === 'number' ? count : 0), 0)}`
    )
    console.log(`   - Custom indexes: ${indexes.length}`)
    console.log(`   - Performance: ${duration}ms for concurrent queries`)
  } catch (error) {
    console.error('❌ Database verification failed:', error)
    process.exit(1)
  } finally {
    await disconnectDatabase()
  }
}

// Run verification if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  verifyDatabase()
}
