import {
  Order,
  OrderStatus,
  Payment,
  PaymentStatus,
  Prisma,
  FulfillmentStatus,
  FinancialStatus,
  AdjustmentType,
  PaymentMethod,
  OrderItem,
  ReturnStatus,
} from '@prisma/client'

import {
  NotFoundError,
  BusinessLogicError,
  ValidationError,
} from '../lib/errors'
import { logger } from '../lib/logger'
import { prisma } from '../lib/prisma'

import { AuditService } from './audit.service'
import { customerService, CustomerService } from './customer.service'
import { InventoryService } from './inventory.service'
import { WebSocketService } from './websocket.service'

export interface CreateOrderRequest {
  customerId?: string
  guestEmail?: string
  guestPhone?: string
  items: CreateOrderItemRequest[]
  billingAddress?: CreateAddressRequest
  shippingAddress?: CreateAddressRequest
  shippingMethod?: string
  notes?: string
  tags?: string[]
  currency?: string
}

export interface CreateOrderItemRequest {
  productId?: string
  variantId?: string
  quantity: number
  price?: number // If not provided, will use current product/variant price
}

export interface CreateAddressRequest {
  firstName?: string
  lastName?: string
  company?: string
  address1: string
  address2?: string
  city: string
  state?: string
  country: string
  postalCode?: string
  phone?: string
}

export interface UpdateOrderRequest {
  status?: OrderStatus
  financialStatus?: FinancialStatus
  fulfillmentStatus?: FulfillmentStatus
  notes?: string
  tags?: string[]
  shippingMethod?: string
  trackingNumber?: string
  trackingUrl?: string
}

export interface ProcessPaymentRequest {
  amount: number
  currency: string
  method: PaymentMethod
  gateway: string
  gatewayTransactionId?: string
  metadata?: Record<string, unknown>
}

export interface CreateFulfillmentRequest {
  items: FulfillmentItemRequest[]
  trackingNumber?: string
  trackingUrl?: string
  carrier?: string
  service?: string
}

export interface FulfillmentItemRequest {
  orderItemId: string
  quantity: number
}

export interface CreateReturnRequest {
  items: ReturnItemRequest[]
  reason?: string
  notes?: string
}

export interface ReturnItemRequest {
  orderItemId: string
  quantity: number
  reason?: string
  condition?: string
}

export interface OrderFilters {
  status?: OrderStatus[]
  financialStatus?: FinancialStatus[]
  fulfillmentStatus?: FulfillmentStatus[]
  customerId?: string
  dateFrom?: Date
  dateTo?: Date
  search?: string
  tags?: string[]
}

export interface OrderAnalytics {
  totalOrders: number
  totalRevenue: number
  averageOrderValue: number
  ordersByStatus: Record<OrderStatus, number>
  ordersByMonth: Array<{ month: string; orders: number; revenue: number }>
  topProducts: Array<{
    productId: string
    productName: string
    quantity: number
    revenue: number
  }>
  topCustomers: Array<{
    customerId: string
    customerName: string
    orders: number
    revenue: number
  }>
}

export class OrderService {
  private inventoryService: InventoryService
  private customerService: CustomerService
  private auditService: AuditService
  private _webSocketService: WebSocketService | null = null

  private get webSocketService(): WebSocketService {
    if (!this._webSocketService) {
      this._webSocketService = WebSocketService.getInstance()
    }
    return this._webSocketService
  }

  constructor(
    inventoryService?: InventoryService,
    customerServiceParam?: CustomerService,
    auditService?: AuditService,
    webSocketService?: WebSocketService
  ) {
    this.inventoryService = inventoryService || new InventoryService(prisma)
    this.customerService = customerServiceParam || customerService // Use the imported customerService instance
    this.auditService = auditService || new AuditService(prisma)
    this._webSocketService = webSocketService || null
  }

  /**
   * Create a new order
   */
  async createOrder(data: CreateOrderRequest, userId?: string): Promise<Order> {
    logger.info('Creating new order', {
      customerId: data.customerId,
      itemCount: data.items.length,
    })

    return await prisma.$transaction(async (tx) => {
      // Generate order number
      const orderNumber = await this.generateOrderNumber(tx)

      // Validate customer if provided
      if (data.customerId) {
        const customer = await tx.customer.findUnique({
          where: { id: data.customerId },
          select: { id: true },
        })
        if (!customer) {
          throw new NotFoundError('Customer not found')
        }
      }

      // Validate and calculate order items
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const orderItems: any[] = []
      let subtotal = 0

      for (const item of data.items) {
        let product, variant, price, name, sku

        if (item.variantId) {
          variant = await tx.productVariant.findUnique({
            where: { id: item.variantId },
            include: { product: true },
          })
          if (!variant) {
            throw new NotFoundError(
              `Product variant not found: ${item.variantId}`
            )
          }
          product = variant.product
          price = item.price || Number(variant.price)
          name = variant.name || product.name
          sku = variant.sku
        } else if (item.productId) {
          product = await tx.product.findUnique({
            where: { id: item.productId },
            select: {
              id: true,
              price: true,
              name: true,
              sku: true,
              trackQuantity: true,
            },
          })
          if (!product) {
            throw new NotFoundError(`Product not found: ${item.productId}`)
          }
          price = item.price || Number(product.price)
          name = product.name
          sku = product.sku
        } else {
          throw new BusinessLogicError(
            'Either productId or variantId must be provided'
          )
        }

        // Check inventory availability
        if (product.trackQuantity) {
          const inventory = await this.inventoryService.getTotalInventory(
            item.productId!,
            item.variantId
          )

          if (inventory.totalAvailable < item.quantity) {
            throw new BusinessLogicError(
              `Insufficient stock for product ${item.productId}`
            )
          }
        }

        const totalPrice = price * item.quantity
        subtotal += totalPrice

        orderItems.push({
          productId: item.productId,
          variantId: item.variantId,
          name,
          sku,
          quantity: item.quantity,
          price,
          totalPrice,
          productSnapshot: {
            product: product,
            variant: variant,
          },
        })
      }

      // Calculate totals (simplified - in real implementation, add tax and shipping calculation)
      const taxAmount = 0 // TODO: Implement tax calculation
      const shippingAmount = 0 // TODO: Implement shipping calculation
      const discountAmount = 0 // TODO: Implement discount calculation
      const totalAmount = subtotal + taxAmount + shippingAmount - discountAmount

      // Create addresses if provided
      let billingAddressId, shippingAddressId

      if (data.billingAddress && data.customerId) {
        const billingAddress = await tx.customerAddress.create({
          data: {
            customerId: data.customerId,
            ...data.billingAddress,
            type: 'BILLING',
          },
        })
        billingAddressId = billingAddress.id
      }

      if (data.shippingAddress && data.customerId) {
        const shippingAddress = await tx.customerAddress.create({
          data: {
            customerId: data.customerId,
            ...data.shippingAddress,
            type: 'SHIPPING',
          },
        })
        shippingAddressId = shippingAddress.id
      }

      // Create the order
      const order = await tx.order.create({
        data: {
          orderNumber,
          customerId: data.customerId,
          guestEmail: data.guestEmail,
          guestPhone: data.guestPhone,
          status: OrderStatus.PENDING,
          financialStatus: FinancialStatus.PENDING,
          fulfillmentStatus: FulfillmentStatus.UNFULFILLED,
          subtotal,
          taxAmount,
          shippingAmount,
          discountAmount,
          totalAmount,
          currency: data.currency || 'USD',
          billingAddressId,
          shippingAddressId,
          shippingMethod: data.shippingMethod,
          notes: data.notes,
          tags: data.tags || [],
          items: {
            create: orderItems,
          },
        },
        include: {
          items: {
            include: {
              product: true,
              variant: true,
            },
          },
          customer: true,
          billingAddress: true,
          shippingAddress: true,
        },
      })

      // Reserve inventory for order items
      for (const item of data.items) {
        if (item.productId || item.variantId) {
          const inventoryItem = await tx.inventoryItem.findFirst({
            where: { productId: item.productId, variantId: item.variantId },
            select: { id: true },
          })
          if (inventoryItem) {
            await this.inventoryService.createAdjustment({
              inventoryItemId: inventoryItem.id,
              type: AdjustmentType.DECREASE,
              quantityChange: item.quantity,
              reason: `Order ${orderNumber}`,
              referenceType: 'ORDER',
              referenceId: order.id,
              userId,
            })
          }
        }
      }

      // Update customer statistics if customer order
      if (data.customerId) {
        await this.customerService.updateCustomerStats(data.customerId)
      }

      // Log audit event for order creation
      await this.auditService.log({
        action: 'CREATE_ORDER',
        entity: 'ORDER',
        entityId: order.id,
        userId,
        metadata: { message: `Order created by ${userId || 'system'}` },
      })

      // Send real-time notification
      this.webSocketService.broadcast('order.created', {
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerId: order.customerId,
        totalAmount: order.totalAmount,
      })

      logger.info('Order created successfully', {
        orderId: order.id,
        orderNumber: order.orderNumber,
      })

      return order
    })
  }

  /**
   * Get order by ID
   */
  async getOrderById(
    id: string
  ): Promise<(Order & { items: OrderItem[] }) | null> {
    return await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
            fulfillmentItems: {
              include: {
                fulfillment: true,
              },
            },
            returnItems: {
              include: {
                return: true,
              },
            },
          },
        },
        customer: true,
        billingAddress: true,
        shippingAddress: true,
        payments: true,
        fulfillments: {
          include: {
            items: {
              include: {
                orderItem: true,
              },
            },
          },
        },
        returns: {
          include: {
            items: {
              include: {
                orderItem: true,
              },
            },
          },
        },
      },
    })
  }

  /**
   * Get orders with filters and pagination
   */
  async getOrders(
    filters: OrderFilters = {},
    page: number = 1,
    limit: number = 20,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ) {
    const skip = (page - 1) * limit

    const where: Prisma.OrderWhereInput = {}

    if (filters.status?.length) {
      where.status = { in: filters.status }
    }

    if (filters.financialStatus?.length) {
      where.financialStatus = { in: filters.financialStatus }
    }

    if (filters.fulfillmentStatus?.length) {
      where.fulfillmentStatus = { in: filters.fulfillmentStatus }
    }

    if (filters.customerId) {
      where.customerId = filters.customerId
    }

    if (filters.dateFrom || filters.dateTo) {
      where.orderDate = {}
      if (filters.dateFrom) where.orderDate.gte = filters.dateFrom
      if (filters.dateTo) where.orderDate.lte = filters.dateTo
    }

    if (filters.search) {
      where.OR = [
        { orderNumber: { contains: filters.search, mode: 'insensitive' } },
        { guestEmail: { contains: filters.search, mode: 'insensitive' } },
        {
          customer: {
            email: { contains: filters.search, mode: 'insensitive' },
          },
        },
        {
          customer: {
            firstName: { contains: filters.search, mode: 'insensitive' },
          },
        },
        {
          customer: {
            lastName: { contains: filters.search, mode: 'insensitive' },
          },
        },
      ]
    }

    if (filters.tags?.length) {
      where.tags = { hasSome: filters.tags }
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: true,
              variant: true,
            },
          },
          customer: true,
          payments: true,
        },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.order.count({ where }),
    ])

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }
  }

  /**
   * Update an existing order
   */
  async updateOrder(
    id: string,
    data: UpdateOrderRequest,
    userId?: string
  ): Promise<Order> {
    const existingOrder = await prisma.order.findUnique({ where: { id } })

    if (!existingOrder) {
      throw new NotFoundError('Order not found')
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data,
    })

    // Log audit trail for order update
    await this.auditService.log({
      action: 'UPDATE_ORDER',
      entity: 'ORDER',
      entityId: id,
      userId,
      metadata: { changes: data },
    })

    // Send real-time notification for status changes
    if (data.status && data.status !== existingOrder.status) {
      this.webSocketService.broadcast('order.status.updated', {
        orderId: id,
        orderNumber: updatedOrder.orderNumber,
        oldStatus: existingOrder.status,
        newStatus: data.status,
        customerId: updatedOrder.customerId,
      })
    }

    logger.info('Order updated', { orderId: id, changes: Object.keys(data) })

    return updatedOrder
  }

  /**
   * Cancel order
   */
  async cancelOrder(
    orderId: string,
    reason?: string,
    userId?: string
  ): Promise<Order> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        payments: true,
      },
    })

    if (!order) {
      throw new NotFoundError(`Order not found with id: ${orderId}`)
    }

    if (
      order.status === OrderStatus.SHIPPED ||
      order.status === OrderStatus.DELIVERED
    ) {
      throw new BusinessLogicError(
        `Cannot cancel shipped or delivered order with id: ${orderId}`
      )
    }

    return await prisma.$transaction(async (tx) => {
      // Cancel the order
      const cancelledOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.CANCELLED,
          cancelledAt: new Date(),
          notes: reason
            ? `${order.notes || ''}\nCancellation reason: ${reason}`.trim()
            : order.notes,
        },
      })

      // Release inventory reservations
      for (const item of order.items) {
        const inventoryItem = await tx.inventoryItem.findFirst({
          where: { productId: item.productId, variantId: item.variantId },
          select: { id: true },
        })

        if (inventoryItem) {
          const reservation = await tx.inventoryReservation.findFirst({
            where: { referenceId: order.id, inventoryItemId: inventoryItem.id },
          })
          if (reservation) {
            await this.inventoryService.releaseReservation(reservation.id)
          }
        }
      }

      // Refund completed payments
      const completedPayments = order.payments.filter(
        (p: Payment) => p.status === PaymentStatus.COMPLETED
      )
      for (const payment of completedPayments) {
        await tx.payment.create({
          data: {
            orderId,
            amount: -Number(payment.amount),
            currency: payment.currency,
            status: PaymentStatus.COMPLETED,
            method: payment.method,
            gateway: 'refund',
            gatewayTransactionId: `REFUND_${payment.gatewayTransactionId || ''}`,
            processedAt: new Date(),
            metadata: { reason: 'Order Canceled' },
          },
        })
      }

      // Update order financial status
      if (completedPayments.length > 0) {
        await tx.order.update({
          where: { id: orderId },
          data: { financialStatus: FinancialStatus.REFUNDED },
        })
      }

      // Log audit trail
      await this.auditService.log({
        action: 'CANCEL_ORDER',
        entity: 'ORDER',
        entityId: orderId,
        userId,
        metadata: { reason },
      })

      // Send notification
      this.webSocketService.broadcast('order.cancelled', {
        orderId,
        orderNumber: order.orderNumber,
        reason,
      })

      logger.info('Order cancelled', { orderId, reason })

      return cancelledOrder
    })
  }

  /**
   * Get order analytics
   */
  async getOrderAnalytics(
    dateFrom?: Date,
    dateTo?: Date,
    customerId?: string
  ): Promise<OrderAnalytics> {
    const where: Prisma.OrderWhereInput = {}

    if (dateFrom || dateTo) {
      where.orderDate = {}
      if (dateFrom) where.orderDate.gte = dateFrom
      if (dateTo) where.orderDate.lte = dateTo
    }

    if (customerId) {
      where.customerId = customerId
    }

    // Exclude cancelled orders from revenue calculations
    const revenueWhere = { ...where, status: { not: OrderStatus.CANCELLED } }

    const [
      totalOrders,
      totalRevenue,
      ordersByStatus,
      ordersByMonth,
      topProducts,
      topCustomers,
    ] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.aggregate({
        where: revenueWhere,
        _sum: { totalAmount: true },
      }),
      prisma.order.groupBy({
        by: ['status'],
        where,
        _count: { status: true },
      }),
      prisma.$queryRaw<
        Record<string, unknown>[]
      >`SELECT TO_CHAR(order_date, 'YYYY-MM') as month, COUNT(*)::int as orders, SUM(total_amount)::float as revenue FROM "orders" WHERE status != 'CANCELLED' GROUP BY TO_CHAR(order_date, 'YYYY-MM') ORDER BY month DESC LIMIT 12`,
      prisma.$queryRaw<
        Record<string, unknown>[]
      >`SELECT oi.product_id as "productId", p.name as "productName", SUM(oi.quantity)::int as quantity, SUM(oi.total_price)::float as revenue FROM "order_items" oi JOIN "orders" o ON oi.order_id = o.id LEFT JOIN "products" p ON oi.product_id = p.id WHERE o.status != 'CANCELLED' GROUP BY oi.product_id, p.name ORDER BY revenue DESC LIMIT 10`,
      customerId
        ? Promise.resolve([])
        : prisma.$queryRaw<
            Record<string, unknown>[]
          >`SELECT o.customer_id as "customerId", CONCAT(c.first_name, ' ', c.last_name) as "customerName", COUNT(o.id)::int as orders, SUM(o.total_amount)::float as revenue FROM "orders" o LEFT JOIN "customers" c ON o.customer_id = c.id WHERE o.status != 'CANCELLED' AND o.customer_id IS NOT NULL GROUP BY o.customer_id, c.first_name, c.last_name ORDER BY revenue DESC LIMIT 10`,
    ])

    const revenue = Number(totalRevenue._sum.totalAmount || 0)
    const averageOrderValue = totalOrders > 0 ? revenue / totalOrders : 0

    const statusCounts = ordersByStatus.reduce(
      (acc, item) => {
        acc[item.status] = item._count.status
        return acc
      },
      {} as Record<OrderStatus, number>
    )

    return {
      totalOrders,
      totalRevenue: revenue,
      averageOrderValue,
      ordersByStatus: statusCounts,
      ordersByMonth: ordersByMonth as { month: string; orders: number; revenue: number }[],
      topProducts: topProducts as { productId: string; productName: string; quantity: number; revenue: number }[],
      topCustomers: topCustomers as { customerId: string; customerName: string; orders: number; revenue: number }[],
    }
  }

  /**
   * Generate unique order number
   */
  private async generateOrderNumber(
    tx: Prisma.TransactionClient
  ): Promise<string> {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')

    const prefix = `ORD-${year}${month}${day}`

    // Find the highest order number for today
    const lastOrder = await tx.order.findFirst({
      where: {
        orderNumber: {
          startsWith: prefix,
        },
      },
      orderBy: {
        orderNumber: 'desc',
      },
    })

    let sequence = 1
    if (lastOrder) {
      const lastSequence = parseInt(
        lastOrder.orderNumber.split('-')[1].slice(8)
      )
      sequence = lastSequence + 1
    }

    return `${prefix}-${String(sequence).padStart(4, '0')}`
  }

  /**
   * Generate unique return number
   */
  private async generateReturnNumber(
    tx: Prisma.TransactionClient
  ): Promise<string> {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')

    const prefix = `RET-${year}${month}${day}`

    // Find the highest return number for today
    const lastReturn = await tx.return.findFirst({
      where: {
        returnNumber: {
          startsWith: prefix,
        },
      },
      orderBy: {
        returnNumber: 'desc',
      },
    })

    let sequence = 1
    if (lastReturn && lastReturn.returnNumber) {
      const lastSequence = parseInt(
        lastReturn.returnNumber.split('-')[1].slice(8)
      )
      sequence = lastSequence + 1
    }

    return `${prefix}-${String(sequence).padStart(4, '0')}`
  }

  /**
   * Simulate payment processing (replace with actual gateway integration)
   */
  private async simulatePaymentProcessing(
    _payment: Record<string, unknown>
  ): Promise<boolean> {
    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Simulate 95% success rate
    return Math.random() > 0.05
  }

  // TODO: Implement the following methods
  async processPayment(
    orderId: string,
    data: ProcessPaymentRequest,
    userId?: string
  ): Promise<Payment> {
    // Find the order
    const order = await prisma.order.findFirst({
      where: { id: orderId },
      include: { items: true },
    })

    if (!order) {
      throw new NotFoundError(`Order not found with id: ${orderId}`)
    }

    // Simulate payment processing
    const success = await this.simulatePaymentProcessing(data as any)

    if (!success) {
      throw new ValidationError('Payment processing failed')
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        amount: data.amount,
        currency: data.currency,
        method: data.method,
        status: PaymentStatus.COMPLETED,
        gateway: data.gateway || 'unknown',
        processedAt: new Date(),
      },
    })

    // Update order financial status
    await prisma.order.update({
      where: { id: orderId },
      data: { financialStatus: FinancialStatus.PAID },
    })

    // Log audit trail
    await this.auditService.log({
      action: 'PROCESS_PAYMENT',
      entity: 'PAYMENT',
      entityId: payment.id,
      userId,
      metadata: { amount: data.amount, method: data.method },
    })

    // Send notification
    this.webSocketService.broadcast('payment.processed', {
      orderId,
      paymentId: payment.id,
      amount: data.amount,
      method: data.method,
    })

    return payment
  }

  async createFulfillment(
    orderId: string,
    data: CreateFulfillmentRequest,
    userId?: string
  ): Promise<unknown> {
    // Find the order
    const order = await prisma.order.findFirst({
      where: { id: orderId },
      include: { items: true },
    })

    if (!order) {
      throw new NotFoundError(`Order not found with id: ${orderId}`)
    }

    // Validate items exist
    for (const item of data.items) {
      const orderItem = order.items.find((oi) => oi.id === item.orderItemId)
      if (!orderItem) {
        throw new ValidationError(`Order item not found: ${item.orderItemId}`)
      }

      if (item.quantity > orderItem.quantity - orderItem.quantityFulfilled) {
        throw new ValidationError(`Cannot fulfill ${item.quantity} items, only ${orderItem.quantity - orderItem.quantityFulfilled} remaining`)
      }
    }

    return await prisma.$transaction(async (tx) => {
      // Create fulfillment
      const fulfillment = await tx.fulfillment.create({
        data: {
          orderId: order.id,
          status: FulfillmentStatus.PENDING,
          items: {
            create: data.items.map(item => ({
              orderItemId: item.orderItemId,
              quantity: item.quantity,
            }))
          },
        },
      })

      // Update order item quantities
      for (const item of data.items) {
        const orderItem = order.items.find((oi) => oi.id === item.orderItemId)
        if (orderItem) {
          await tx.orderItem.update({
            where: { id: item.orderItemId },
            data: {
              quantityFulfilled: orderItem.quantityFulfilled + item.quantity,
            },
          })

          // Adjust inventory
          await this.inventoryService.adjustInventory(
            orderItem.productId,
            orderItem.variantId,
            -item.quantity,
            'FULFILLMENT',
            `Fulfillment for order ${order.orderNumber}`,
            userId,
            order.id
          )
        }
      }

      // Log audit trail
      await this.auditService.log({
        action: 'CREATE_FULFILLMENT',
        entity: 'FULFILLMENT',
        entityId: fulfillment.id,
        userId,
        metadata: { items: data.items },
      })

      // Send notification
      this.webSocketService.broadcast('fulfillment.created', {
        orderId,
        fulfillmentId: fulfillment.id,
      })

      return fulfillment
    })
  }

  async shipFulfillment(
    fulfillmentId: string,
    data: { trackingNumber?: string; trackingUrl?: string },
    _userId?: string
  ): Promise<unknown> {
    const fulfillment = await prisma.fulfillment.findFirst({
      where: { id: fulfillmentId },
    })

    if (!fulfillment) {
      throw new NotFoundError(`Fulfillment not found: ${fulfillmentId}`)
    }

    const updatedFulfillment = await prisma.fulfillment.update({
      where: { id: fulfillmentId },
      data: {
        status: FulfillmentStatus.SHIPPED,
        trackingNumber: data.trackingNumber,
        trackingUrl: data.trackingUrl,
        shippedAt: new Date(),
      },
    })

    return updatedFulfillment
  }

  async createReturn(
    orderId: string,
    data: CreateReturnRequest,
    userId?: string
  ): Promise<unknown> {
    // Find the order
    const order = await prisma.order.findFirst({
      where: { id: orderId },
      include: { items: true },
    })

    if (!order) {
      throw new NotFoundError(`Order not found with id: ${orderId}`)
    }

    // Validate return quantities
    for (const item of data.items) {
      const orderItem = order.items.find((oi) => oi.id === item.orderItemId)
      if (!orderItem) {
        throw new ValidationError(`Order item not found: ${item.orderItemId}`)
      }

      const returnableQuantity = orderItem.quantityFulfilled - (orderItem.quantityReturned || 0)
      if (item.quantity > returnableQuantity) {
        throw new ValidationError(`Cannot return ${item.quantity} items, only ${returnableQuantity} returnable`)
      }
    }

    // Create return
    const returnRecord = await prisma.return.create({
      data: {
        orderId: order.id,
        returnNumber: await this.generateReturnNumber(prisma),
        status: ReturnStatus.REQUESTED,
        reason: data.reason,
        items: {
          create: data.items.map(item => ({
            orderItemId: item.orderItemId,
            quantity: item.quantity,
          }))
        },
      },
    })

    // Log audit trail
    await this.auditService.log({
      action: 'CREATE_RETURN',
      entity: 'RETURN',
      entityId: returnRecord.id,
      userId,
      metadata: { items: data.items, reason: data.reason },
    })

    // Send notification
    this.webSocketService.broadcast('return.created', {
      orderId,
      returnId: returnRecord.id,
      returnNumber: returnRecord.returnNumber,
    })

    return returnRecord
  }

  async processReturn(
    orderId: string,
    returnId: string,
    approve: boolean,
    data: { refundAmount?: number },
    _userId?: string
  ): Promise<unknown> {
    const returnRecord = await prisma.return.findFirst({
      where: { id: returnId },
    })

    if (!returnRecord) {
      throw new NotFoundError(`Return not found: ${returnId}`)
    }

    const status = approve ? ReturnStatus.APPROVED : ReturnStatus.REJECTED
    const updatedReturn = await prisma.return.update({
      where: { id: returnId },
      data: {
        status,
        processedAt: new Date(),
        refundAmount: data.refundAmount,
      },
    })

    return updatedReturn
  }
}
