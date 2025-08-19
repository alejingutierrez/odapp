import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verify() {
  try {
    console.log('🔍 Verifying database setup...')
    
    // Test connection
    await prisma.$connect()
    console.log('✅ Database connected')
    
    // Check data
    const counts = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.customer.count(),
      prisma.inventoryItem.count(),
    ])
    
    console.log(`✅ Data verification:`)
    console.log(`   Users: ${counts[0]}`)
    console.log(`   Products: ${counts[1]}`)
    console.log(`   Customers: ${counts[2]}`)
    console.log(`   Inventory: ${counts[3]}`)
    
    // Test complex query
    const products = await prisma.product.findMany({
      include: {
        variants: true,
        inventory: true,
      },
      take: 1,
    })
    
    console.log(`✅ Complex query: Found ${products.length} products with relations`)
    
    console.log('🎉 Database verification successful!')
    
  } catch (error) {
    console.error('❌ Verification failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verify()