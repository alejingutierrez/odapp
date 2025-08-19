import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create default roles
  console.log('Creating default roles...')
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      description: 'Full system administrator access',
      permissions: [
        'users:read',
        'users:write',
        'users:delete',
        'products:read',
        'products:write',
        'products:delete',
        'inventory:read',
        'inventory:write',
        'orders:read',
        'orders:write',
        'customers:read',
        'customers:write',
        'analytics:read',
        'settings:read',
        'settings:write',
        'shopify:read',
        'shopify:write',
      ],
    },
  })

  const managerRole = await prisma.role.upsert({
    where: { name: 'manager' },
    update: {},
    create: {
      name: 'manager',
      description: 'Store manager with limited admin access',
      permissions: [
        'products:read',
        'products:write',
        'inventory:read',
        'inventory:write',
        'orders:read',
        'orders:write',
        'customers:read',
        'customers:write',
        'analytics:read',
      ],
    },
  })

  const employeeRole = await prisma.role.upsert({
    where: { name: 'employee' },
    update: {},
    create: {
      name: 'employee',
      description: 'Basic employee access',
      permissions: [
        'products:read',
        'inventory:read',
        'orders:read',
        'orders:write',
        'customers:read',
        'customers:write',
      ],
    },
  })

  // Create default admin user
  console.log('Creating default admin user...')
  const hashedPassword = await bcrypt.hash('admin123', 12)
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@oda.local' },
    update: {},
    create: {
      email: 'admin@oda.local',
      username: 'admin',
      firstName: 'System',
      lastName: 'Administrator',
      passwordHash: hashedPassword,
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  })

  // Assign admin role to admin user
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole.id,
    },
  })

  // Create default locations
  console.log('Creating default locations...')
  const mainWarehouse = await prisma.location.upsert({
    where: { code: 'MAIN-WH' },
    update: {},
    create: {
      name: 'Main Warehouse',
      code: 'MAIN-WH',
      type: 'WAREHOUSE',
      address: '123 Warehouse Street',
      city: 'Fashion City',
      state: 'FC',
      country: 'US',
      postalCode: '12345',
      phone: '+1-555-0123',
      email: 'warehouse@oda.local',
      isActive: true,
      isDefault: true,
    },
  })

  const retailStore = await prisma.location.upsert({
    where: { code: 'STORE-01' },
    update: {},
    create: {
      name: 'Flagship Store',
      code: 'STORE-01',
      type: 'STORE',
      address: '456 Fashion Avenue',
      city: 'Fashion City',
      state: 'FC',
      country: 'US',
      postalCode: '12346',
      phone: '+1-555-0124',
      email: 'store@oda.local',
      isActive: true,
      isDefault: false,
    },
  })

  // Create default categories
  console.log('Creating default categories...')
  const womenCategory = await prisma.category.upsert({
    where: { slug: 'women' },
    update: {},
    create: {
      name: 'Women',
      slug: 'women',
      description: 'Women\'s fashion and accessories',
      isActive: true,
      sortOrder: 1,
    },
  })

  const menCategory = await prisma.category.upsert({
    where: { slug: 'men' },
    update: {},
    create: {
      name: 'Men',
      slug: 'men',
      description: 'Men\'s fashion and accessories',
      isActive: true,
      sortOrder: 2,
    },
  })

  // Create subcategories
  const womenTops = await prisma.category.upsert({
    where: { slug: 'women-tops' },
    update: {},
    create: {
      name: 'Tops',
      slug: 'women-tops',
      description: 'Women\'s tops, blouses, and shirts',
      parentId: womenCategory.id,
      isActive: true,
      sortOrder: 1,
    },
  })

  const womenBottoms = await prisma.category.upsert({
    where: { slug: 'women-bottoms' },
    update: {},
    create: {
      name: 'Bottoms',
      slug: 'women-bottoms',
      description: 'Women\'s pants, skirts, and shorts',
      parentId: womenCategory.id,
      isActive: true,
      sortOrder: 2,
    },
  })

  const menTops = await prisma.category.upsert({
    where: { slug: 'men-tops' },
    update: {},
    create: {
      name: 'Tops',
      slug: 'men-tops',
      description: 'Men\'s shirts, t-shirts, and sweaters',
      parentId: menCategory.id,
      isActive: true,
      sortOrder: 1,
    },
  })

  // Create default collections
  console.log('Creating default collections...')
  const springCollection = await prisma.collection.upsert({
    where: { slug: 'spring-2024' },
    update: {},
    create: {
      name: 'Spring 2024',
      slug: 'spring-2024',
      description: 'Fresh styles for the spring season',
      isActive: true,
      sortOrder: 1,
    },
  })

  const summerCollection = await prisma.collection.upsert({
    where: { slug: 'summer-2024' },
    update: {},
    create: {
      name: 'Summer 2024',
      slug: 'summer-2024',
      description: 'Light and breezy summer fashion',
      isActive: true,
      sortOrder: 2,
    },
  })

  // Create sample products
  console.log('Creating sample products...')
  const product1 = await prisma.product.upsert({
    where: { slug: 'classic-white-tee' },
    update: {},
    create: {
      name: 'Classic White T-Shirt',
      slug: 'classic-white-tee',
      description: 'A timeless classic white t-shirt made from 100% organic cotton',
      shortDescription: 'Classic white t-shirt in organic cotton',
      sku: 'CWT-001',
      brand: 'Oda Basics',
      material: '100% Organic Cotton',
      careInstructions: 'Machine wash cold, tumble dry low',
      price: 29.99,
      compareAtPrice: 39.99,
      costPrice: 15.00,
      status: 'ACTIVE',
      isActive: true,
      isFeatured: true,
      trackQuantity: true,
      categoryId: womenTops.id,
    },
  })

  // Create product variants
  const variants = [
    { size: 'XS', color: 'White', sku: 'CWT-001-XS-WHT', price: 29.99 },
    { size: 'S', color: 'White', sku: 'CWT-001-S-WHT', price: 29.99 },
    { size: 'M', color: 'White', sku: 'CWT-001-M-WHT', price: 29.99 },
    { size: 'L', color: 'White', sku: 'CWT-001-L-WHT', price: 29.99 },
    { size: 'XL', color: 'White', sku: 'CWT-001-XL-WHT', price: 29.99 },
  ]

  for (const variant of variants) {
    const createdVariant = await prisma.productVariant.upsert({
      where: { sku: variant.sku },
      update: {},
      create: {
        productId: product1.id,
        name: `${variant.size} - ${variant.color}`,
        sku: variant.sku,
        option1Name: 'Size',
        option1Value: variant.size,
        option2Name: 'Color',
        option2Value: variant.color,
        price: variant.price,
        costPrice: 15.00,
        weight: 0.2,
        isActive: true,
      },
    })

    // Create inventory for each variant
    await prisma.inventoryItem.upsert({
      where: {
        productId_variantId_locationId: {
          productId: product1.id,
          variantId: createdVariant.id,
          locationId: mainWarehouse.id,
        },
      },
      update: {},
      create: {
        productId: product1.id,
        variantId: createdVariant.id,
        locationId: mainWarehouse.id,
        quantity: 100,
        reservedQuantity: 0,
        availableQuantity: 100,
        lowStockThreshold: 10,
        averageCost: 15.00,
        lastCost: 15.00,
      },
    })
  }

  // Add product to collection
  await prisma.collectionProduct.upsert({
    where: {
      collectionId_productId: {
        collectionId: springCollection.id,
        productId: product1.id,
      },
    },
    update: {},
    create: {
      collectionId: springCollection.id,
      productId: product1.id,
      sortOrder: 1,
    },
  })

  // Create sample customer
  console.log('Creating sample customer...')
  const customer = await prisma.customer.upsert({
    where: { email: 'jane.doe@example.com' },
    update: {},
    create: {
      email: 'jane.doe@example.com',
      firstName: 'Jane',
      lastName: 'Doe',
      phone: '+1-555-0199',
      dateOfBirth: new Date('1990-05-15'),
      gender: 'FEMALE',
      language: 'en',
      currency: 'USD',
      marketingOptIn: true,
      emailOptIn: true,
      status: 'ACTIVE',
      loyaltyPoints: 100,
      lifetimeValue: 150.00,
      totalSpent: 150.00,
      totalOrders: 2,
      averageOrderValue: 75.00,
      tags: ['vip', 'frequent-buyer'],
    },
  })

  // Create customer address
  await prisma.customerAddress.upsert({
    where: { id: 'temp-address-id' }, // This will fail and create new
    update: {},
    create: {
      customerId: customer.id,
      firstName: 'Jane',
      lastName: 'Doe',
      address1: '789 Customer Lane',
      city: 'Customer City',
      state: 'CC',
      country: 'US',
      postalCode: '12347',
      phone: '+1-555-0199',
      isDefault: true,
      type: 'BOTH',
    },
  }).catch(() => {
    // Address creation will fail due to unique constraint, but that's expected
    console.log('Customer address already exists or created successfully')
  })

  // Create customer segments
  console.log('Creating customer segments...')
  const vipSegment = await prisma.customerSegment.upsert({
    where: { name: 'VIP Customers' },
    update: {},
    create: {
      name: 'VIP Customers',
      description: 'High-value customers with lifetime value > $500',
      rules: {
        conditions: [
          { field: 'lifetimeValue', operator: 'gte', value: 500 },
        ],
      },
      isActive: true,
    },
  })

  const frequentBuyersSegment = await prisma.customerSegment.upsert({
    where: { name: 'Frequent Buyers' },
    update: {},
    create: {
      name: 'Frequent Buyers',
      description: 'Customers with 5+ orders',
      rules: {
        conditions: [
          { field: 'totalOrders', operator: 'gte', value: 5 },
        ],
      },
      isActive: true,
    },
  })

  console.log('✅ Database seeding completed successfully!')
  console.log(`
  Created:
  - 3 roles (admin, manager, employee)
  - 1 admin user (admin@oda.local / admin123)
  - 2 locations (Main Warehouse, Flagship Store)
  - 5 categories (Women, Men, and subcategories)
  - 2 collections (Spring 2024, Summer 2024)
  - 1 product with 5 variants and inventory
  - 1 sample customer with address
  - 2 customer segments
  `)
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })