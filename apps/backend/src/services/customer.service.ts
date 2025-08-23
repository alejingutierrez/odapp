import {
  Customer,
  CustomerAddress,
  CustomerSegment,
  CustomerInteraction,
  LoyaltyTransaction,
  Prisma,
  CustomerStatus,
} from '@prisma/client'

import { cacheManager } from '../lib/cache/index.js'
import {
  InternalServerError,
  ConflictError,
  NotFoundError,
  BusinessLogicError,
} from '../lib/errors.js'
import logger from '../lib/logger.js'
import { prisma } from '../lib/prisma.js'

export interface CustomerWithRelations extends Customer {
  addresses: CustomerAddress[]
  segmentMembers: Array<{
    segment: CustomerSegment
  }>
  interactions: CustomerInteraction[]
  loyaltyTransactions: LoyaltyTransaction[]
  _count: {
    orders: number
  }
}

export interface CustomerTimelineEvent {
  id: string
  type:
    | 'order'
    | 'interaction'
    | 'loyalty'
    | 'segment_change'
    | 'profile_update'
  title: string
  description: string
  date: Date
  metadata?: Record<string, unknown>
}

export class CustomerService {
  private readonly CACHE_TTL = 300 // 5 minutes
  private readonly CACHE_PREFIX = 'customer:'

  /**
   * Get customer by ID with 360° view
   */
  async getCustomerById(
    id: string,
    _includeTimeline = false
  ): Promise<CustomerWithRelations | null> {
    const cacheKey = `${this.CACHE_PREFIX}${id}:full`

    try {
      // Try cache first
      const cached = await cacheManager.get<CustomerWithRelations>(cacheKey)
      if (cached) {
        logger.debug('Customer retrieved from cache', { customerId: id })
        return cached
      }

      const customer = await prisma.customer.findUnique({
        where: { id, deletedAt: null },
        include: {
          addresses: {
            orderBy: { isDefault: 'desc' },
          },
          segmentMembers: {
            include: {
              segment: true,
            },
          },
          interactions: {
            orderBy: { createdAt: 'desc' },
            take: 50, // Latest 50 interactions
          },
          loyaltyTransactions: {
            orderBy: { createdAt: 'desc' },
            take: 100, // Latest 100 transactions
          },
          _count: {
            select: {
              orders: true,
            },
          },
        },
      })

      if (!customer) {
        return null
      }

      // Cache the result
      await cacheManager.set(cacheKey, customer, { ttl: this.CACHE_TTL })

      return customer
    } catch (error) {
      logger.error('Error retrieving customer', { customerId: id, error })
      throw new InternalServerError('Failed to retrieve customer', {
        error,
        id,
      })
    }
  }

  /**
   * Get customer timeline for 360° view
   */
  async getCustomerTimeline(
    customerId: string,
    limit = 100
  ): Promise<CustomerTimelineEvent[]> {
    const cacheKey = `${this.CACHE_PREFIX}${customerId}:timeline`

    try {
      const cached = await cacheManager.get<CustomerTimelineEvent[]>(cacheKey)
      if (cached) {
        return cached
      }

      // Get all timeline events
      const [orders, interactions, loyaltyTransactions] = await Promise.all([
        // Orders
        prisma.order.findMany({
          where: { customerId },
          select: {
            id: true,
            orderNumber: true,
            totalAmount: true,
            status: true,
            orderDate: true,
            items: {
              select: {
                name: true,
                quantity: true,
              },
            },
          },
          orderBy: { orderDate: 'desc' },
          take: 50,
        }),

        // Interactions
        prisma.customerInteraction.findMany({
          where: { customerId },
          orderBy: { createdAt: 'desc' },
          take: 50,
        }),

        // Loyalty transactions
        prisma.loyaltyTransaction.findMany({
          where: { customerId },
          orderBy: { createdAt: 'desc' },
          take: 50,
        }),
      ])

      // Transform to timeline events
      const timeline: CustomerTimelineEvent[] = []

      // Add orders
      orders.forEach((order) => {
        timeline.push({
          id: `order_${order.id}`,
          type: 'order',
          title: `Order ${order.orderNumber}`,
          description: `Order for $${order.totalAmount} with ${order.items.length} items`,
          date: order.orderDate,
          metadata: {
            orderId: order.id,
            orderNumber: order.orderNumber,
            amount: order.totalAmount,
            status: order.status,
            itemCount: order.items.length,
          },
        })
      })

      // Add interactions
      interactions.forEach((interaction) => {
        timeline.push({
          id: `interaction_${interaction.id}`,
          type: 'interaction',
          title: `${interaction.type.charAt(0).toUpperCase() + interaction.type.slice(1)} ${interaction.channel}`,
          description:
            interaction.subject ||
            interaction.content?.substring(0, 100) + '...' ||
            '',
          date: interaction.createdAt,
          metadata: {
            interactionId: interaction.id,
            type: interaction.type,
            channel: interaction.channel,
            outcome: interaction.outcome,
          },
        })
      })

      // Add loyalty transactions
      loyaltyTransactions.forEach((transaction) => {
        timeline.push({
          id: `loyalty_${transaction.id}`,
          type: 'loyalty',
          title: `${transaction.type === 'EARNED' ? 'Earned' : transaction.type === 'REDEEMED' ? 'Redeemed' : 'Adjusted'} ${Math.abs(transaction.points)} points`,
          description: transaction.description || '',
          date: transaction.createdAt,
          metadata: {
            transactionId: transaction.id,
            type: transaction.type,
            points: transaction.points,
            referenceType: transaction.referenceType,
            referenceId: transaction.referenceId,
          },
        })
      })

      // Sort by date descending and limit
      timeline.sort((a, b) => b.date.getTime() - a.date.getTime())
      const limitedTimeline = timeline.slice(0, limit)

      // Cache the result
      await cacheManager.set(cacheKey, limitedTimeline, { ttl: this.CACHE_TTL })

      return limitedTimeline
    } catch (error) {
      logger.error('Error retrieving customer timeline', { customerId, error })
      throw new InternalServerError('Failed to retrieve customer timeline', {
        error,
        customerId,
      })
    }
  }

  /**
   * Search customers with advanced filtering
   */
  async searchCustomers(query: Record<string, unknown>): Promise<{
    customers: CustomerWithRelations[]
    total: number
    page: number
    limit: number
    totalPages: number
  }> {
    const {
      search,
      status,
      segmentId,
      tags,
      country,
      acceptsMarketing,
      // _verifiedEmail, // TODO: Implement email verification filter
      hasOrders,
      totalSpentMin,
      totalSpentMax,
      lastOrderDateRange,
      createdDateRange,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query

    try {
      const where: Prisma.CustomerWhereInput = {
        deletedAt: null,
      }

      // Text search
      if (search) {
        where.OR = [
          { firstName: { contains: search as string, mode: 'insensitive' } },
          { lastName: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } },
          { phone: { contains: search as string } },
        ]
      }

      // Status filter
      if (status) {
        where.status = (status as string).toUpperCase() as CustomerStatus
      }

      // Segment filter
      if (segmentId) {
        where.segmentMembers = {
          some: {
            segmentId,
          },
        }
      }

      // Tags filter
      if (tags && Array.isArray(tags) && tags.length > 0) {
        where.tags = {
          hasEvery: tags as string[],
        }
      }

      // Country filter
      if (country) {
        where.addresses = {
          some: {
            country: (country as string).toUpperCase(),
          },
        }
      }

      // Marketing preferences
      if (acceptsMarketing !== undefined) {
        where.marketingOptIn = acceptsMarketing as boolean
      }

      // Has orders filter
      if (hasOrders !== undefined) {
        if (hasOrders) {
          where.totalOrders = { gt: 0 }
        } else {
          where.totalOrders = 0
        }
      }

      // Total spent range
      if (totalSpentMin !== undefined || totalSpentMax !== undefined) {
        where.totalSpent = {}
        if (totalSpentMin !== undefined) {
          where.totalSpent.gte = totalSpentMin as number
        }
        if (totalSpentMax !== undefined) {
          where.totalSpent.lte = totalSpentMax as number
        }
      }

      // Last order date range
      if (lastOrderDateRange) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const dateRange = lastOrderDateRange as any
        where.lastOrderAt = {
          gte: dateRange.startDate
            ? new Date(dateRange.startDate)
            : undefined,
          lte: dateRange.endDate
            ? new Date(dateRange.endDate)
            : undefined,
        }
      }

      // Created date range
      if (createdDateRange) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const createdRange = createdDateRange as any
        where.createdAt = {
          gte: createdRange.startDate
            ? new Date(createdRange.startDate)
            : undefined,
          lte: createdRange.endDate
            ? new Date(createdRange.endDate)
            : undefined,
        }
      }

      // Build order by
      const orderBy: Prisma.CustomerOrderByWithRelationInput = {}
      if (sortBy === 'name') {
        orderBy.firstName = sortOrder as 'asc' | 'desc'
      } else if (sortBy === 'totalSpent') {
        orderBy.totalSpent = sortOrder as 'asc' | 'desc'
      } else if (sortBy === 'totalOrders') {
        orderBy.totalOrders = sortOrder as 'asc' | 'desc'
      } else if (sortBy === 'lastOrderAt') {
        orderBy.lastOrderAt = sortOrder as 'asc' | 'desc'
      } else {
        orderBy.createdAt = sortOrder as 'asc' | 'desc'
      }

      const [customers, total] = await Promise.all([
        prisma.customer.findMany({
          where,
          include: {
            addresses: {
              orderBy: { isDefault: 'desc' },
            },
            segmentMembers: {
              include: {
                segment: true,
              },
            },
            interactions: {
              orderBy: { createdAt: 'desc' },
              take: 5, // Latest 5 interactions for list view
            },
            loyaltyTransactions: {
              orderBy: { createdAt: 'desc' },
              take: 5, // Latest 5 transactions for list view
            },
            _count: {
              select: {
                orders: true,
              },
            },
          },
          orderBy,
          skip: ((page as number) - 1) * (limit as number),
          take: limit as number,
        }),
        prisma.customer.count({ where }),
      ])

      return {
        customers: customers as CustomerWithRelations[],
        total,
        page: page as number,
        limit: limit as number,
        totalPages: Math.ceil(total / (limit as number)),
      }
    } catch (error) {
      logger.error('Error searching customers', { query, error })
      throw new InternalServerError('Failed to search customers', { error })
    }
  }

  /**
   * Create new customer
   */
  async createCustomer(
    data: Record<string, unknown>,
    _userId?: string
  ): Promise<CustomerWithRelations> {
    try {
      // Check for existing customer with same email
      if (data.email) {
        const existing = await prisma.customer.findUnique({
          where: { email: data.email as string },
        })
        if (existing) {
          throw new ConflictError('A customer with this email already exists.')
        }
      }

      const customer = await prisma.customer.create({
        data: {
          email: data.email as string,
          firstName: data.firstName as string,
          lastName: data.lastName as string,
          phone: data.phone as string | null | undefined,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth as string) : null,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          gender: (data.gender as string)?.toUpperCase() as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          language: (data.preferences as any)?.language,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          currency: (data.preferences as any)?.currency,
          marketingOptIn: data.acceptsMarketing as boolean | undefined,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          emailOptIn: (data.preferences as any)?.emailMarketing,
          smsOptIn: data.acceptsSmsMarketing as boolean | undefined,
          tags: data.tags as string[] || [],
          notes: data.notes as string | null | undefined,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          addresses: (data.addresses as any[])?.length
            ? {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                create: (data.addresses as any[]).map((addr: Record<string, unknown>) => ({
                  firstName: addr.firstName as string,
                  lastName: addr.lastName as string,
                  company: addr.company as string | null | undefined,
                  address1: addr.address1 as string,
                  address2: addr.address2 as string | null | undefined,
                  city: addr.city as string,
                  state: addr.province as string | null | undefined,
                  country: addr.country as string,
                  postalCode: addr.zip as string | null | undefined,
                  phone: addr.phone as string | null | undefined,
                  isDefault: addr.isDefault as boolean | undefined,
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  type: (addr.type as string).toUpperCase() as any,
                })),
              }
            : undefined,
        },
        include: {
          addresses: {
            orderBy: { isDefault: 'desc' },
          },
          segmentMembers: {
            include: {
              segment: true,
            },
          },
          interactions: true,
          loyaltyTransactions: true,
          _count: {
            select: {
              orders: true,
            },
          },
        },
      })

      // Clear cache
      await this.clearCustomerCache(customer.id)

      logger.info('Customer created', {
        customerId: customer.id,
        email: customer.email,
      })

      return customer
    } catch (error) {
      logger.error('Error creating customer', { data, error })
      throw new InternalServerError('Failed to create customer', { error })
    }
  }

  /**
   * Update customer
   */
  async updateCustomer(
    id: string,
    data: Record<string, unknown>,
    _userId?: string
  ): Promise<CustomerWithRelations> {
    try {
      const existing = await this.getCustomerById(id)
      if (!existing) {
        throw new NotFoundError('Customer')
      }

      // Check email uniqueness if changing
      if (data.email && data.email !== existing.email) {
        const emailExists = await prisma.customer.findUnique({
          where: { email: data.email as string },
        })
        if (emailExists) {
          throw new ConflictError('A customer with this email already exists.')
        }
      }

      const customer = await prisma.customer.update({
        where: { id },
        data: {
          email: data.email as string | null | undefined,
          firstName: data.firstName as string | null | undefined,
          lastName: data.lastName as string | null | undefined,
          phone: data.phone as string | null | undefined,
          dateOfBirth: data.dateOfBirth
            ? new Date(data.dateOfBirth as string)
            : undefined,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          gender: (data.gender as string)?.toUpperCase() as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          language: (data.preferences as any)?.language,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          currency: (data.preferences as any)?.currency,
          marketingOptIn: data.acceptsMarketing as boolean | undefined,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          emailOptIn: (data.preferences as any)?.emailMarketing,
          smsOptIn: data.acceptsSmsMarketing as boolean | undefined,
          tags: data.tags as string[] | undefined,
          notes: data.notes as string | null | undefined,
          updatedAt: new Date(),
        },
        include: {
          addresses: {
            orderBy: { isDefault: 'desc' },
          },
          segmentMembers: {
            include: {
              segment: true,
            },
          },
          interactions: {
            orderBy: { createdAt: 'desc' },
            take: 50,
          },
          loyaltyTransactions: {
            orderBy: { createdAt: 'desc' },
            take: 100,
          },
          _count: {
            select: {
              orders: true,
            },
          },
        },
      })

      // Clear cache
      await this.clearCustomerCache(id)

      logger.info('Customer updated', { customerId: id })

      return customer
    } catch (error) {
      logger.error('Error updating customer', { id, data, error })
      throw new InternalServerError('Failed to update customer', { error, id })
    }
  }

  /**
   * Delete customer (soft delete)
   */
  async deleteCustomer(id: string, _userId?: string): Promise<void> {
    try {
      const existing = await this.getCustomerById(id)
      if (!existing) {
        throw new NotFoundError('Customer')
      }

      await prisma.customer.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          email: `${existing.email}_deleted_${Date.now()}`, // Prevent email conflicts
        },
      })

      // Clear cache
      await this.clearCustomerCache(id)

      logger.info('Customer deleted', { customerId: id })
    } catch (error) {
      logger.error('Error deleting customer', { id, error })
      throw new InternalServerError('Failed to delete customer', { error, id })
    }
  }

  /**
   * Add customer interaction
   */
  async addInteraction(
    customerId: string,
    data: Record<string, unknown>,
    _userId?: string
  ): Promise<CustomerInteraction> {
    try {
      const interaction = await prisma.customerInteraction.create({
        data: {
          customerId,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          type: (data.type as string).toUpperCase() as any,
          channel: data.direction as string, // Using direction as channel for now
          subject: data.subject as string,
          content: data.content as string,
          outcome: data.status as string,
          createdBy: _userId,
        },
      })

      // Clear customer cache
      await this.clearCustomerCache(customerId)

      logger.info('Customer interaction added', {
        customerId,
        interactionId: interaction.id,
        type: interaction.type,
      })

      return interaction
    } catch (error) {
      logger.error('Error adding customer interaction', {
        customerId,
        data,
        error,
      })
      throw new InternalServerError('Failed to add customer interaction', {
        error,
        customerId,
      })
    }
  }

  /**
   * Add loyalty points
   */
  async addLoyaltyPoints(
    customerId: string,
    points: number,
    description: string,
    referenceType?: string,
    referenceId?: string,
    _userId?: string
  ): Promise<void> {
    try {
      await prisma.$transaction(async (tx) => {
        // Add loyalty transaction
        await tx.loyaltyTransaction.create({
          data: {
            customerId,
            type: 'EARNED',
            points,
            description,
            referenceType,
            referenceId,
          },
        })

        // Update customer loyalty points
        await tx.customer.update({
          where: { id: customerId },
          data: {
            loyaltyPoints: {
              increment: points,
            },
          },
        })
      })

      // Clear cache
      await this.clearCustomerCache(customerId)

      logger.info('Loyalty points added', { customerId, points, description })
    } catch (error) {
      logger.error('Error adding loyalty points', { customerId, points, error })
      throw new InternalServerError('Failed to add loyalty points', {
        error,
        customerId,
      })
    }
  }

  /**
   * Redeem loyalty points
   */
  async redeemLoyaltyPoints(
    customerId: string,
    points: number,
    description: string,
    referenceType?: string,
    referenceId?: string,
    _userId?: string
  ): Promise<void> {
    try {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
      })

      if (!customer) {
        throw new NotFoundError('Customer')
      }

      if (customer.loyaltyPoints < points) {
        throw new BusinessLogicError('Insufficient loyalty points')
      }

      await prisma.$transaction(async (tx) => {
        // Add loyalty transaction
        await tx.loyaltyTransaction.create({
          data: {
            customerId,
            type: 'REDEEMED',
            points: -points, // Negative for redemption
            description,
            referenceType,
            referenceId,
          },
        })

        // Update customer loyalty points
        await tx.customer.update({
          where: { id: customerId },
          data: {
            loyaltyPoints: {
              decrement: points,
            },
          },
        })
      })

      // Clear cache
      await this.clearCustomerCache(customerId)

      logger.info('Loyalty points redeemed', {
        customerId,
        points,
        description,
      })
    } catch (error) {
      if (error instanceof BusinessLogicError) throw error
      logger.error('Error redeeming loyalty points', {
        customerId,
        points,
        error,
      })
      throw new InternalServerError('Failed to redeem loyalty points', {
        error,
        customerId,
      })
    }
  }

  /**
   * Calculate customer lifetime value
   */
  async calculateLifetimeValue(customerId: string): Promise<number> {
    try {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        include: {
          orders: {
            where: {
              status: { not: 'CANCELLED' },
              financialStatus: 'PAID',
            },
            select: {
              totalAmount: true,
              orderDate: true,
            },
          },
        },
      })

      if (!customer || customer.orders.length === 0) {
        return 0
      }

      // Simple CLV calculation: Average Order Value * Purchase Frequency * Customer Lifespan
      const totalSpent = customer.orders.reduce(
        (sum, order) => sum + Number(order.totalAmount),
        0
      )
      const orderCount = customer.orders.length
      const averageOrderValue = totalSpent / orderCount

      // Calculate customer lifespan in months
      const firstOrder = customer.orders.reduce(
        (earliest, order) =>
          order.orderDate < earliest ? order.orderDate : earliest,
        customer.orders[0].orderDate
      )
      const lastOrder = customer.orders.reduce(
        (latest, order) =>
          order.orderDate > latest ? order.orderDate : latest,
        customer.orders[0].orderDate
      )

      const lifespanMonths = Math.max(
        1,
        (lastOrder.getTime() - firstOrder.getTime()) /
          (1000 * 60 * 60 * 24 * 30)
      )

      const purchaseFrequency = orderCount / lifespanMonths

      // Predict future value (simplified)
      const predictedLifespanMonths = Math.max(lifespanMonths, 12) // At least 12 months
      const clv =
        averageOrderValue * purchaseFrequency * predictedLifespanMonths

      // Update customer record
      await prisma.customer.update({
        where: { id: customerId },
        data: { lifetimeValue: clv },
      })

      return clv
    } catch (error) {
      logger.error('Error calculating customer lifetime value', {
        customerId,
        error,
      })
      return 0
    }
  }

  /**
   * Export customer data for GDPR compliance
   */
  async exportCustomerData(
    customerId: string
  ): Promise<Record<string, unknown>> {
    try {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        include: {
          addresses: true,
          orders: {
            include: {
              items: true,
              payments: true,
            },
          },
          interactions: true,
          loyaltyTransactions: true,
          segmentMembers: {
            include: {
              segment: true,
            },
          },
        },
      })

      if (!customer) {
        throw new NotFoundError('Customer')
      }

      // Remove sensitive internal data
      const exportData = {
        personalInfo: {
          id: customer.id,
          email: customer.email,
          firstName: customer.firstName,
          lastName: customer.lastName,
          phone: customer.phone,
          dateOfBirth: customer.dateOfBirth,
          gender: customer.gender,
          createdAt: customer.createdAt,
          updatedAt: customer.updatedAt,
        },
        preferences: {
          language: customer.language,
          currency: customer.currency,
          marketingOptIn: customer.marketingOptIn,
          emailOptIn: customer.emailOptIn,
          smsOptIn: customer.smsOptIn,
        },
        addresses: customer.addresses.map((addr) => ({
          type: addr.type,
          firstName: addr.firstName,
          lastName: addr.lastName,
          company: addr.company,
          address1: addr.address1,
          address2: addr.address2,
          city: addr.city,
          state: addr.state,
          country: addr.country,
          postalCode: addr.postalCode,
          phone: addr.phone,
          isDefault: addr.isDefault,
        })),
        orderHistory: customer.orders.map((order) => ({
          orderNumber: order.orderNumber,
          orderDate: order.orderDate,
          status: order.status,
          totalAmount: order.totalAmount,
          currency: order.currency,
          items: order.items.map((item) => ({
            name: item.name,
            sku: item.sku,
            quantity: item.quantity,
            price: item.price,
          })),
        })),
        loyaltyProgram: {
          points: customer.loyaltyPoints,
          tier: customer.loyaltyTier,
          lifetimeValue: customer.lifetimeValue,
          totalSpent: customer.totalSpent,
          totalOrders: customer.totalOrders,
          transactions: customer.loyaltyTransactions.map((tx) => ({
            type: tx.type,
            points: tx.points,
            description: tx.description,
            createdAt: tx.createdAt,
          })),
        },
        segments: customer.segmentMembers.map((member) => ({
          segmentName: member.segment.name,
          addedAt: member.addedAt,
        })),
        interactions: customer.interactions.map((interaction) => ({
          type: interaction.type,
          channel: interaction.channel,
          subject: interaction.subject,
          createdAt: interaction.createdAt,
        })),
      }

      logger.info('Customer data exported', { customerId })

      return exportData
    } catch (error) {
      if (error instanceof Error) throw error
      logger.error('Error exporting customer data', { customerId, error })
      throw new InternalServerError('Failed to export customer data')
    }
  }

  /**
   * Clear customer cache
   */
  private async clearCustomerCache(customerId: string): Promise<void> {
    try {
      await Promise.all([
        cacheManager.del(`${this.CACHE_PREFIX}${customerId}:full`),
        cacheManager.del(`${this.CACHE_PREFIX}${customerId}:timeline`),
      ])
    } catch (error) {
      logger.warn('Failed to clear customer cache', { customerId, error })
    }
  }

  /**
   * Update customer statistics (called from order service)
   */
  async updateCustomerStats(customerId: string): Promise<void> {
    try {
      const stats = await prisma.order.aggregate({
        where: {
          customerId,
          status: { not: 'CANCELLED' },
          financialStatus: 'PAID',
        },
        _count: { id: true },
        _sum: { totalAmount: true },
        _avg: { totalAmount: true },
        _max: { orderDate: true },
      })

      await prisma.customer.update({
        where: { id: customerId },
        data: {
          totalOrders: stats._count.id,
          totalSpent: stats._sum.totalAmount || 0,
          averageOrderValue: stats._avg.totalAmount || 0,
          lastOrderAt: stats._max.orderDate,
        },
      })

      // Clear cache
      await this.clearCustomerCache(customerId)

      // Calculate CLV
      await this.calculateLifetimeValue(customerId)
    } catch (error) {
      logger.error('Error updating customer stats', { customerId, error })
    }
  }
}

export const customerService = new CustomerService()
