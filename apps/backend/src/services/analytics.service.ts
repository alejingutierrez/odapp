import { PrismaClient } from '@prisma/client'

import { CacheManager } from '../lib/cache/cache-manager.js'
import { logger } from '../lib/logger.js'

export interface ProductAnalyticsData {
  productId: string
  productName: string
  views: number
  orders: number
  revenue: number
  conversionRate: number
  averageOrderValue: number
  topVariants: {
    variantId: string
    variantName: string
    orders: number
    revenue: number
  }[]
  performanceMetrics: {
    clickThroughRate: number
    addToCartRate: number
    purchaseRate: number
  }
}

export interface CategoryAnalytics {
  categoryId: string
  categoryName: string
  productCount: number
  totalRevenue: number
  averagePrice: number
  topProducts: {
    productId: string
    productName: string
    revenue: number
    orders: number
  }[]
}

export interface InventoryAnalytics {
  totalProducts: number
  totalVariants: number
  inStockProducts: number
  lowStockProducts: number
  outOfStockProducts: number
  totalInventoryValue: number
  averageInventoryTurnover: number
  slowMovingProducts: {
    productId: string
    productName: string
    daysInStock: number
    currentStock: number
  }[]
  fastMovingProducts: {
    productId: string
    productName: string
    turnoverRate: number
    currentStock: number
  }[]
}

export interface SalesAnalytics {
  period: string
  totalRevenue: number
  totalOrders: number
  averageOrderValue: number
  topSellingProducts: {
    productId: string
    productName: string
    quantitySold: number
    revenue: number
  }[]
  revenueByCategory: {
    categoryId: string
    categoryName: string
    revenue: number
    percentage: number
  }[]
  salesTrend: {
    date: string
    revenue: number
    orders: number
  }[]
}

export interface CustomerAnalytics {
  totalCustomers: number
  newCustomers: number
  returningCustomers: number
  averageLifetimeValue: number
  topCustomers: {
    customerId: string
    customerName: string
    totalSpent: number
    orderCount: number
  }[]
  customerSegments: {
    segment: string
    count: number
    averageOrderValue: number
    totalRevenue: number
  }[]
}

export interface ProductPerformanceReport {
  productId: string
  productName: string
  sku: string
  category: string
  brand: string
  status: string
  createdAt: Date

  // Sales metrics
  totalRevenue: number
  totalOrders: number
  totalQuantitySold: number
  averageOrderValue: number

  // Inventory metrics
  currentStock: number
  stockValue: number
  turnoverRate: number
  daysInStock: number

  // Performance metrics
  views: number
  conversionRate: number
  returnRate: number
  profitMargin: number

  // Trends (last 30 days)
  revenueTrend: number // percentage change
  ordersTrend: number
  stockTrend: number
}

export class AnalyticsService {
  constructor(
    private _prisma: PrismaClient,
    private _cache: CacheManager
  ) {}

  // ============================================================================
  // PRODUCT ANALYTICS
  // ============================================================================

  async getProductAnalytics(
    productId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<ProductAnalyticsData> {
    const cacheKey = `analytics:product:${productId}:${startDate?.toISOString()}:${endDate?.toISOString()}`

    // Try cache first
    const cached = await this._cache.get<ProductAnalyticsData>(cacheKey)
    if (cached) {
      return cached
    }

    try {
      const dateFilter = this.buildDateFilter(startDate, endDate)

      // Get product info
      const product = await this._prisma.product.findUnique({
        where: { id: productId },
        select: { id: true, name: true },
      })

      if (!product) {
        throw new Error('Product not found')
      }

      // Get order data
      const orderItems = await this._prisma.orderItem.findMany({
        where: {
          productId,
          order: {
            status: { in: ['DELIVERED', 'SHIPPED'] },
            orderDate: dateFilter,
          },
        },
        include: {
          order: true,
          variant: true,
        },
      })

      // Calculate metrics
      const orders = orderItems.length
      const revenue = orderItems.reduce(
        (sum, item) => sum + Number(item.totalPrice),
        0
      )
      const averageOrderValue = orders > 0 ? revenue / orders : 0

      // Get variant performance
      const variantStats = new Map<
        string,
        { orders: number; revenue: number; name: string }
      >()

      orderItems.forEach((item) => {
        if (item.variantId) {
          const existing = variantStats.get(item.variantId) || {
            orders: 0,
            revenue: 0,
            name: item.variant?.name || 'Unknown',
          }
          existing.orders += 1
          existing.revenue += Number(item.totalPrice)
          variantStats.set(item.variantId, existing)
        }
      })

      const topVariants = Array.from(variantStats.entries())
        .map(([variantId, stats]) => ({
          variantId,
          variantName: stats.name,
          orders: stats.orders,
          revenue: stats.revenue,
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)

      // TODO: Implement view tracking and conversion metrics
      const views = 0 // Would come from analytics tracking
      const conversionRate = views > 0 ? (orders / views) * 100 : 0

      const analytics: ProductAnalyticsData = {
        productId,
        productName: product.name,
        views,
        orders,
        revenue,
        conversionRate,
        averageOrderValue,
        topVariants,
        performanceMetrics: {
          clickThroughRate: 0, // TODO: Implement
          addToCartRate: 0, // TODO: Implement
          purchaseRate: conversionRate,
        },
      }

      // Cache for 1 hour
      await this._cache.set(cacheKey, analytics, { ttl: 3600 })

      return analytics
    } catch (error) {
      logger.error('Failed to get product analytics', { error, productId })
      throw error
    }
  }

  async getProductPerformanceReport(
    filters: {
      categoryId?: string
      brand?: string
      status?: string
      startDate?: Date
      endDate?: Date
    } = {}
  ): Promise<ProductPerformanceReport[]> {
    const cacheKey = `analytics:product-performance:${JSON.stringify(filters)}`

    // Try cache first
    const cached = await this._cache.get<ProductPerformanceReport[]>(cacheKey)
    if (cached) {
      return cached
    }

    try {
      const dateFilter = this.buildDateFilter(
        filters.startDate,
        filters.endDate
      )

      // Get products with filters
      const products = await this._prisma.product.findMany({
        where: {
          deletedAt: null,
          ...(filters.categoryId && { categoryId: filters.categoryId }),
          ...(filters.brand && {
            brand: { contains: filters.brand, mode: 'insensitive' },
          }),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...(filters.status && { status: filters.status as any }),
        },
        include: {
          category: true,
          variants: {
            include: {
              inventory: true,
            },
          },
          orderItems: {
            where: {
              order: {
                status: { in: ['DELIVERED', 'SHIPPED'] },
                orderDate: dateFilter,
              },
            },
            include: {
              order: true,
            },
          },
        },
      })

      const reports: ProductPerformanceReport[] = []

      for (const product of products) {
        // Calculate sales metrics
        const totalRevenue = product.orderItems.reduce(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (sum: number, item: any) => sum + Number(item.totalPrice),
          0
        )
        const totalOrders = product.orderItems.length
        const totalQuantitySold = product.orderItems.reduce(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (sum: number, item: any) => sum + item.quantity,
          0
        )
        const averageOrderValue =
          totalOrders > 0 ? totalRevenue / totalOrders : 0

        // Calculate inventory metrics
        const currentStock = product.variants.reduce(
          (sum, variant) =>
            sum +
            variant.inventory.reduce((invSum, inv) => invSum + inv.quantity, 0),
          0
        )
        const stockValue = currentStock * Number(product.price)

        // Calculate turnover rate (simplified)
        const daysInPeriod =
          filters.startDate && filters.endDate
            ? Math.ceil(
                (filters.endDate.getTime() - filters.startDate.getTime()) /
                  (1000 * 60 * 60 * 24)
              )
            : 30
        const turnoverRate =
          currentStock > 0
            ? (totalQuantitySold / currentStock) * (365 / daysInPeriod)
            : 0

        // Calculate trends (compare with previous period)
        const previousPeriodStart = filters.startDate
          ? new Date(
              filters.startDate.getTime() - daysInPeriod * 24 * 60 * 60 * 1000
            )
          : new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) // 60 days ago

        const previousPeriodEnd =
          filters.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

        const previousOrderItems = await this._prisma.orderItem.findMany({
          where: {
            productId: product.id,
            order: {
              status: { in: ['DELIVERED', 'SHIPPED'] },
              orderDate: {
                gte: previousPeriodStart,
                lte: previousPeriodEnd,
              },
            },
          },
        })

        const previousRevenue = previousOrderItems.reduce(
          (sum, item) => sum + Number(item.totalPrice),
          0
        )
        const previousOrders = previousOrderItems.length

        const revenueTrend =
          previousRevenue > 0
            ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
            : 0
        const ordersTrend =
          previousOrders > 0
            ? ((totalOrders - previousOrders) / previousOrders) * 100
            : 0

        reports.push({
          productId: product.id,
          productName: product.name,
          sku: product.sku || '',
          category: product.category?.name || 'Uncategorized',
          brand: product.brand || '',
          status: product.status,
          createdAt: product.createdAt,
          totalRevenue,
          totalOrders,
          totalQuantitySold,
          averageOrderValue,
          currentStock,
          stockValue,
          turnoverRate,
          daysInStock: Math.ceil(
            (Date.now() - product.createdAt.getTime()) / (1000 * 60 * 60 * 24)
          ),
          views: 0, // TODO: Implement view tracking
          conversionRate: 0, // TODO: Implement
          returnRate: 0, // TODO: Implement return tracking
          profitMargin: 0, // TODO: Calculate based on cost price
          revenueTrend,
          ordersTrend,
          stockTrend: 0, // TODO: Implement stock trend tracking
        })
      }

      // Cache for 30 minutes
      await this._cache.set(cacheKey, reports, { ttl: 1800 })

      return reports
    } catch (error) {
      logger.error('Failed to get product performance report', {
        error,
        filters,
      })
      throw error
    }
  }

  // ============================================================================
  // CATEGORY ANALYTICS
  // ============================================================================

  async getCategoryAnalytics(
    startDate?: Date,
    endDate?: Date
  ): Promise<CategoryAnalytics[]> {
    const cacheKey = `analytics:categories:${startDate?.toISOString()}:${endDate?.toISOString()}`

    // Try cache first
    const cached = await this._cache.get<CategoryAnalytics[]>(cacheKey)
    if (cached) {
      return cached
    }

    try {
      const dateFilter = this.buildDateFilter(startDate, endDate)

      const categories = await this._prisma.category.findMany({
        where: { isActive: true },
        include: {
          products: {
            where: { deletedAt: null },
            include: {
              orderItems: {
                where: {
                  order: {
                    status: { in: ['DELIVERED', 'SHIPPED'] },
                    orderDate: dateFilter,
                  },
                },
              },
            },
          },
        },
      })

      const analytics: CategoryAnalytics[] = categories.map((category) => {
        const productCount = category.products.length
        const totalRevenue = category.products.reduce(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (sum: number, product: any) =>
            sum +
            product.orderItems.reduce(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (itemSum: number, item: any) => itemSum + Number(item.totalPrice),
              0
            ),
          0
        )
        const averagePrice =
          productCount > 0
            ? category.products.reduce(
                (sum, product) => sum + Number(product.price),
                0
              ) / productCount
            : 0

        const topProducts = category.products
          .map((product) => {
            const revenue = product.orderItems.reduce(
              (sum, item) => sum + Number(item.totalPrice),
              0
            )
            const orders = product.orderItems.length
            return {
              productId: product.id,
              productName: product.name,
              revenue,
              orders,
            }
          })
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5)

        return {
          categoryId: category.id,
          categoryName: category.name,
          productCount,
          totalRevenue,
          averagePrice,
          topProducts,
        }
      })

      // Cache for 1 hour
      await this._cache.set(cacheKey, analytics, { ttl: 3600 })

      return analytics
    } catch (error) {
      logger.error('Failed to get category analytics', { error })
      throw error
    }
  }

  // ============================================================================
  // INVENTORY ANALYTICS
  // ============================================================================

  async getInventoryAnalytics(): Promise<InventoryAnalytics> {
    const cacheKey = 'analytics:inventory'

    // Try cache first
    const cached = await this._cache.get<InventoryAnalytics>(cacheKey)
    if (cached) {
      return cached
    }

    try {
      // Get inventory data
      const [totalProducts, totalVariants, inventoryItems, products] =
        await Promise.all([
          this._prisma.product.count({
            where: { deletedAt: null, isActive: true },
          }),
          this._prisma.productVariant.count({
            where: { isActive: true, product: { deletedAt: null } },
          }),
          this._prisma.inventoryItem.findMany({
            include: {
              product: true,
              variant: true,
            },
          }),
          this._prisma.product.findMany({
            where: { deletedAt: null, isActive: true },
            include: {
              variants: {
                include: {
                  inventory: true,
                  orderItems: {
                    where: {
                      order: {
                        status: { in: ['DELIVERED', 'SHIPPED'] },
                        orderDate: {
                          gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
                        },
                      },
                    },
                  },
                },
              },
            },
          }),
        ])

      // Calculate stock status
      let inStockProducts = 0
      let lowStockProducts = 0
      let outOfStockProducts = 0
      let totalInventoryValue = 0

      const productStockStatus = new Map<
        string,
        { inStock: boolean; lowStock: boolean; outOfStock: boolean }
      >()

      inventoryItems.forEach((item) => {
        const productId = item.productId || item.variant?.productId
        if (!productId) return

        const isInStock = item.availableQuantity > 0
        const isLowStock =
          item.availableQuantity <= item.lowStockThreshold &&
          item.availableQuantity > 0
        const isOutOfStock = item.availableQuantity === 0

        const existing = productStockStatus.get(productId) || {
          inStock: false,
          lowStock: false,
          outOfStock: true,
        }

        if (isInStock) existing.inStock = true
        if (isLowStock) existing.lowStock = true
        if (!isOutOfStock) existing.outOfStock = false

        productStockStatus.set(productId, existing)

        // Calculate inventory value
        const product = item.product
        if (product) {
          totalInventoryValue += item.quantity * Number(product.price)
        }
      })

      // Count products by stock status
      productStockStatus.forEach((status) => {
        if (status.inStock) inStockProducts++
        if (status.lowStock) lowStockProducts++
        if (status.outOfStock) outOfStockProducts++
      })

      // Calculate turnover and identify slow/fast moving products
      const slowMovingProducts: InventoryAnalytics['slowMovingProducts'] = []
      const fastMovingProducts: InventoryAnalytics['fastMovingProducts'] = []

      products.forEach((product) => {
        const totalStock = product.variants.reduce(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (sum: number, variant: any) =>
            sum +
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            variant.inventory.reduce((invSum: number, inv: any) => invSum + inv.quantity, 0),
          0
        )

        const totalSold = product.variants.reduce(
          (sum, variant) =>
            sum +
            variant.orderItems.reduce(
              (itemSum, item) => itemSum + item.quantity,
              0
            ),
          0
        )

        const turnoverRate =
          totalStock > 0 ? (totalSold / totalStock) * (365 / 90) : 0 // Annualized
        const daysInStock = Math.ceil(
          (Date.now() - product.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        )

        if (turnoverRate < 1 && totalStock > 0 && daysInStock > 30) {
          slowMovingProducts.push({
            productId: product.id,
            productName: product.name,
            daysInStock,
            currentStock: totalStock,
          })
        }

        if (turnoverRate > 5) {
          fastMovingProducts.push({
            productId: product.id,
            productName: product.name,
            turnoverRate,
            currentStock: totalStock,
          })
        }
      })

      // Sort and limit results
      slowMovingProducts
        .sort((a, b) => b.daysInStock - a.daysInStock)
        .splice(10)
      fastMovingProducts
        .sort((a, b) => b.turnoverRate - a.turnoverRate)
        .splice(10)

      const analytics: InventoryAnalytics = {
        totalProducts,
        totalVariants,
        inStockProducts,
        lowStockProducts,
        outOfStockProducts,
        totalInventoryValue,
        averageInventoryTurnover: 0, // TODO: Calculate overall turnover
        slowMovingProducts,
        fastMovingProducts,
      }

      // Cache for 30 minutes
      await this._cache.set(cacheKey, analytics, { ttl: 1800 })

      return analytics
    } catch (error) {
      logger.error('Failed to get inventory analytics', { error })
      throw error
    }
  }

  // ============================================================================
  // SALES ANALYTICS
  // ============================================================================

  async getSalesAnalytics(
    period: 'day' | 'week' | 'month' | 'year' = 'month',
    startDate?: Date,
    endDate?: Date
  ): Promise<SalesAnalytics> {
    const cacheKey = `analytics:sales:${period}:${startDate?.toISOString()}:${endDate?.toISOString()}`

    // Try cache first
    const cached = await this._cache.get<SalesAnalytics>(cacheKey)
    if (cached) {
      return cached
    }

    try {
      const dateFilter = this.buildDateFilter(startDate, endDate)

      // Get orders data
      const orders = await this._prisma.order.findMany({
        where: {
          status: { in: ['DELIVERED', 'SHIPPED'] },
          orderDate: dateFilter,
        },
        include: {
          items: {
            include: {
              product: {
                include: {
                  category: true,
                },
              },
            },
          },
        },
      })

      // Calculate basic metrics
      const totalRevenue = orders.reduce(
        (sum, order) => sum + Number(order.totalAmount),
        0
      )
      const totalOrders = orders.length
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

      // Get top selling products
      const productSales = new Map<
        string,
        { name: string; quantity: number; revenue: number }
      >()

      orders.forEach((order) => {
        order.items.forEach((item) => {
          if (item.product) {
            const existing = productSales.get(item.product.id) || {
              name: item.product.name,
              quantity: 0,
              revenue: 0,
            }
            existing.quantity += item.quantity
            existing.revenue += Number(item.totalPrice)
            productSales.set(item.product.id, existing)
          }
        })
      })

      const topSellingProducts = Array.from(productSales.entries())
        .map(([productId, data]) => ({
          productId,
          productName: data.name,
          quantitySold: data.quantity,
          revenue: data.revenue,
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10)

      // Get revenue by category
      const categoryRevenue = new Map<
        string,
        { name: string; revenue: number }
      >()

      orders.forEach((order) => {
        order.items.forEach((item) => {
          if (item.product?.category) {
            const categoryId = item.product.category.id
            const existing = categoryRevenue.get(categoryId) || {
              name: item.product.category.name,
              revenue: 0,
            }
            existing.revenue += Number(item.totalPrice)
            categoryRevenue.set(categoryId, existing)
          }
        })
      })

      const revenueByCategory = Array.from(categoryRevenue.entries())
        .map(([categoryId, data]) => ({
          categoryId,
          categoryName: data.name,
          revenue: data.revenue,
          percentage:
            totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0,
        }))
        .sort((a, b) => b.revenue - a.revenue)

      // Generate sales trend data
      const salesTrend = this.generateSalesTrend(orders, period)

      const analytics: SalesAnalytics = {
        period,
        totalRevenue,
        totalOrders,
        averageOrderValue,
        topSellingProducts,
        revenueByCategory,
        salesTrend,
      }

      // Cache for 1 hour
      await this._cache.set(cacheKey, analytics, { ttl: 3600 })

      return analytics
    } catch (error) {
      logger.error('Failed to get sales analytics', { error, period })
      throw error
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private buildDateFilter(startDate?: Date, endDate?: Date) {
    if (!startDate && !endDate) {
      // Default to last 30 days
      return {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      }
    }

    const filter: Record<string, unknown> = {}
    if (startDate) filter.gte = startDate
    if (endDate) filter.lte = endDate

    return filter
  }

  private generateSalesTrend(
    orders: Record<string, unknown>[],
    period: 'day' | 'week' | 'month' | 'year'
  ) {
    // Group orders by period
    const groupedData = new Map<string, { revenue: number; orders: number }>()

    orders.forEach((order) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const date = new Date(order.orderDate as any)
      let key: string

      switch (period) {
        case 'day':
          key = date.toISOString().split('T')[0]
          break
        case 'week': {
          const weekStart = new Date(date)
          weekStart.setDate(date.getDate() - date.getDay())
          key = weekStart.toISOString().split('T')[0]
          break
        }
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          break
        case 'year':
          key = String(date.getFullYear())
          break
      }

      const existing = groupedData.get(key) || { revenue: 0, orders: 0 }
      existing.revenue += Number(order.totalAmount)
      existing.orders += 1
      groupedData.set(key, existing)
    })

    // Convert to array and sort
    return Array.from(groupedData.entries())
      .map(([date, data]) => ({
        date,
        revenue: data.revenue,
        orders: data.orders,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  async clearAnalyticsCache(): Promise<void> {
    // Note: deletePattern is not available in the current cache implementation
    // This would need to be implemented based on the specific cache backend
    logger.info('Analytics cache clear requested (not implemented)')
  }
}
