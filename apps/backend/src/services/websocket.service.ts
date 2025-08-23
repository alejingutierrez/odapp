import { Server as SocketIOServer } from 'socket.io'
import { Server as HttpServer } from 'http'
import * as jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'
import { logger } from '../lib/logger'
import {
  InventoryService,
  InventoryUpdateData,
  LowStockAlert,
} from './inventory.service'

import { Socket as SocketIOSocket } from 'socket.io'

export interface AuthenticatedSocket extends SocketIOSocket {
  userId?: string
  userRoles?: string[]
}

export class WebSocketService {
  private static instance: WebSocketService
  private io: SocketIOServer
  private connectedUsers: Map<string, Set<string>> = new Map() // userId -> Set of socketIds
  private socketUsers: Map<string, string> = new Map() // socketId -> userId

  constructor(
    server: HttpServer,
    private _prisma: PrismaClient,
    private _inventoryService: InventoryService
  ) {
    WebSocketService.instance = this
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    })

    this.setupMiddleware()
    this.setupEventHandlers()
    this.setupInventoryEventListeners()
  }

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      throw new Error(
        'WebSocketService not initialized. Call constructor first.'
      )
    }
    return WebSocketService.instance
  }

  private setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token =
          socket.handshake?.auth?.token ||
          socket.handshake?.headers?.authorization?.replace('Bearer ', '')

        if (!token) {
          return next(new Error('Authentication token required'))
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
          userId: string
        }

        // Get user with roles
        const user = await this._prisma.user.findUnique({
          where: { id: decoded.userId },
          include: {
            roles: {
              include: {
                role: true,
              },
            },
          },
        })

        if (!user) {
          return next(new Error('User not found'))
        }

        socket.userId = user.id
        socket.userRoles = user.roles.map((ur) => ur.role.name)

        next()
      } catch (error) {
        logger.error('WebSocket authentication failed', {
          error: error instanceof Error ? error.message : String(error),
        })
        next(new Error('Authentication failed'))
      }
    })
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      logger.info('WebSocket client connected', {
        socketId: socket.id,
        userId: socket.userId,
      })

      // Track connected user
      if (socket.userId) {
        if (!this.connectedUsers.has(socket.userId)) {
          this.connectedUsers.set(socket.userId, new Set())
        }
        this.connectedUsers.get(socket.userId)!.add(socket.id)
        this.socketUsers.set(socket.id, socket.userId)

        // Join user-specific room
        socket.join(`user:${socket.userId}`)
      }

      // Handle room subscriptions
      socket.on(
        'subscribe:inventory',
        (data: { locationIds?: string[]; productIds?: string[] }) => {
          this.handleInventorySubscription(socket, data)
        }
      )

      socket.on('subscribe:orders', (data: { customerId?: string }) => {
        this.handleOrderSubscription(socket, data)
      })

      socket.on('subscribe:notifications', () => {
        socket.join(`notifications:${socket.userId}`)
        logger.debug('User subscribed to notifications', {
          userId: socket.userId,
        })
      })

      // Handle inventory actions
      socket.on(
        'inventory:update',
        async (data: {
          inventoryItemId: string
          quantity: number
          reason?: string
        }) => {
          await this.handleInventoryUpdate(socket, data)
        }
      )

      socket.on(
        'inventory:reserve',
        async (data: {
          inventoryItemId: string
          quantity: number
          reason: string
          referenceId?: string
        }) => {
          await this.handleInventoryReservation(socket, data)
        }
      )

      // Handle disconnection
      socket.on('disconnect', () => {
        this.handleDisconnection(socket)
      })

      // Send initial connection confirmation
      socket.emit('connected', {
        socketId: socket.id,
        userId: socket.userId,
        timestamp: new Date().toISOString(),
      })
    })
  }

  private setupInventoryEventListeners() {
    // Listen to inventory service events
    this._inventoryService.on(
      'inventory:updated',
      (data: InventoryUpdateData) => {
        this.broadcastInventoryUpdate(data)
      }
    )

    this._inventoryService.on('inventory:lowStock', (data: LowStockAlert) => {
      this.broadcastLowStockAlert(data)
    })

    this._inventoryService.on(
      'inventory:reserved',
      (data: InventoryUpdateData) => {
        this.broadcastInventoryReservation(data)
      }
    )

    this._inventoryService.on(
      'inventory:reservationReleased',
      (data: InventoryUpdateData) => {
        this.broadcastReservationRelease(data)
      }
    )

    this._inventoryService.on(
      'inventory:reservationFulfilled',
      (data: InventoryUpdateData) => {
        this.broadcastReservationFulfillment(data)
      }
    )

    this._inventoryService.on(
      'inventory:adjusted',
      (data: InventoryUpdateData) => {
        this.broadcastInventoryAdjustment(data)
      }
    )

    this._inventoryService.on(
      'inventory:transferCreated',
      (data: InventoryUpdateData) => {
        this.broadcastTransferUpdate(data, 'created')
      }
    )

    this._inventoryService.on(
      'inventory:transferShipped',
      (data: InventoryUpdateData) => {
        this.broadcastTransferUpdate(data, 'shipped')
      }
    )

    this._inventoryService.on(
      'inventory:transferReceived',
      (data: InventoryUpdateData) => {
        this.broadcastTransferUpdate(data, 'received')
      }
    )
  }

  private handleInventorySubscription(
    socket: AuthenticatedSocket,
    data: { locationIds?: string[]; productIds?: string[] }
  ) {
    // Join location-specific rooms
    if (data.locationIds) {
      data.locationIds.forEach((locationId) => {
        socket.join(`inventory:location:${locationId}`)
      })
    }

    // Join product-specific rooms
    if (data.productIds) {
      data.productIds.forEach((productId) => {
        socket.join(`inventory:product:${productId}`)
      })
    }

    // Join general inventory room
    socket.join('inventory:all')

    logger.debug('User subscribed to inventory updates', {
      userId: socket.userId,
      locationIds: data.locationIds,
      productIds: data.productIds,
    })

    socket.emit('inventory:subscribed', {
      locationIds: data.locationIds,
      productIds: data.productIds,
      timestamp: new Date().toISOString(),
    })
  }

  private handleOrderSubscription(
    socket: AuthenticatedSocket,
    data: { customerId?: string }
  ) {
    if (data.customerId) {
      socket.join(`orders:customer:${data.customerId}`)
    }

    socket.join('orders:all')

    logger.debug('User subscribed to order updates', {
      userId: socket.userId,
      customerId: data.customerId,
    })
  }

  private async handleInventoryUpdate(
    socket: AuthenticatedSocket,
    data: {
      inventoryItemId: string
      quantity: number
      reason?: string
    }
  ) {
    try {
      // Check permissions
      if (!this.hasPermission(socket.userRoles, 'inventory:update')) {
        socket.emit('error', { message: 'Insufficient permissions' })
        return
      }

      await this._inventoryService.updateStockLevel(
        data.inventoryItemId,
        data.quantity,
        data.reason,
        socket.userId
      )

      socket.emit('inventory:updateSuccess', {
        inventoryItemId: data.inventoryItemId,
        quantity: data.quantity,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      logger.error('WebSocket inventory update failed', {
        error: error instanceof Error ? error.message : String(error),
        userId: socket.userId,
        data,
      })

      socket.emit('inventory:updateError', {
        inventoryItemId: data.inventoryItemId,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      })
    }
  }

  private async handleInventoryReservation(
    socket: AuthenticatedSocket,
    data: {
      inventoryItemId: string
      quantity: number
      reason: string
      referenceId?: string
    }
  ) {
    try {
      // Check permissions
      if (!this.hasPermission(socket.userRoles, 'inventory:reserve')) {
        socket.emit('error', { message: 'Insufficient permissions' })
        return
      }

      const reservation = await this._inventoryService.createReservation({
        inventoryItemId: data.inventoryItemId,
        quantity: data.quantity,
        reason: data.reason,
        referenceId: data.referenceId,
      })

      socket.emit('inventory:reservationSuccess', {
        reservationId: reservation.id,
        inventoryItemId: data.inventoryItemId,
        quantity: data.quantity,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      logger.error('WebSocket inventory reservation failed', {
        error: error instanceof Error ? error.message : String(error),
        userId: socket.userId,
        data,
      })

      socket.emit('inventory:reservationError', {
        inventoryItemId: data.inventoryItemId,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      })
    }
  }

  private handleDisconnection(socket: AuthenticatedSocket) {
    logger.info('WebSocket client disconnected', {
      socketId: socket.id,
      userId: socket.userId,
    })

    if (socket.userId) {
      const userSockets = this.connectedUsers.get(socket.userId)
      if (userSockets) {
        userSockets.delete(socket.id)
        if (userSockets.size === 0) {
          this.connectedUsers.delete(socket.userId)
        }
      }
      this.socketUsers.delete(socket.id)
    }
  }

  // ============================================================================
  // BROADCAST METHODS
  // ============================================================================

  private broadcastInventoryUpdate(data: InventoryUpdateData) {
    const payload = {
      type: 'inventory:updated',
      data,
      timestamp: new Date().toISOString(),
    }

    // Broadcast to all inventory subscribers
    this.io.to('inventory:all').emit('inventory:updated', payload)

    // Broadcast to location-specific subscribers
    this.io
      .to(`inventory:location:${data.locationId}`)
      .emit('inventory:updated', payload)

    // Broadcast to product-specific subscribers
    if (data.productId) {
      this.io
        .to(`inventory:product:${data.productId}`)
        .emit('inventory:updated', payload)
    }
    if (data.variantId) {
      this.io
        .to(`inventory:product:${data.variantId}`)
        .emit('inventory:updated', payload)
    }

    logger.debug('Broadcasted inventory update', {
      inventoryItemId: data.inventoryItemId,
      locationId: data.locationId,
      oldQuantity: data.oldQuantity,
      newQuantity: data.newQuantity,
    })
  }

  private broadcastLowStockAlert(data: LowStockAlert) {
    const payload = {
      type: 'inventory:lowStock',
      data,
      timestamp: new Date().toISOString(),
    }

    // Broadcast to all inventory subscribers
    this.io.to('inventory:all').emit('inventory:lowStock', payload)

    // Broadcast to location-specific subscribers
    this.io
      .to(`inventory:location:${data.locationId}`)
      .emit('inventory:lowStock', payload)

    // Broadcast to product-specific subscribers
    if (data.productId) {
      this.io
        .to(`inventory:product:${data.productId}`)
        .emit('inventory:lowStock', payload)
    }
    if (data.variantId) {
      this.io
        .to(`inventory:product:${data.variantId}`)
        .emit('inventory:lowStock', payload)
    }

    // Send notification to all users with inventory management permissions
    this.broadcastToUsersWithPermission(
      'inventory:manage',
      'notification:lowStock',
      payload
    )

    logger.info('Broadcasted low stock alert', {
      inventoryItemId: data.inventoryItemId,
      currentQuantity: data.currentQuantity,
      threshold: data.threshold,
      productName: data.productName,
    })
  }

  private broadcastInventoryReservation(data: InventoryUpdateData) {
    const payload = {
      type: 'inventory:reserved',
      data,
      timestamp: new Date().toISOString(),
    }

    this.io.to('inventory:all').emit('inventory:reserved', payload)
    this.io
      .to(`inventory:location:${data.locationId}`)
      .emit('inventory:reserved', payload)

    // Note: These properties don't exist in InventoryUpdateData interface
    // Using type assertion to access them for reservation events
    const reservationData = data as any
    logger.debug('Broadcasted inventory reservation', {
      inventoryItemId: data.inventoryItemId,
      reservationId: reservationData.reservationId,
      quantity: reservationData.quantity,
    })
  }

  private broadcastReservationRelease(data: InventoryUpdateData) {
    const payload = {
      type: 'inventory:reservationReleased',
      data,
      timestamp: new Date().toISOString(),
    }

    this.io.to('inventory:all').emit('inventory:reservationReleased', payload)

    // Note: These properties don't exist in InventoryUpdateData interface
    // Using type assertion to access them for reservation events
    const reservationData = data as any
    logger.debug('Broadcasted reservation release', {
      inventoryItemId: data.inventoryItemId,
      reservationId: reservationData.reservationId,
      quantity: reservationData.quantity,
    })
  }

  private broadcastReservationFulfillment(data: InventoryUpdateData) {
    const payload = {
      type: 'inventory:reservationFulfilled',
      data,
      timestamp: new Date().toISOString(),
    }

    this.io.to('inventory:all').emit('inventory:reservationFulfilled', payload)

    // Note: These properties don't exist in InventoryUpdateData interface
    // Using type assertion to access them for reservation events
    const reservationData = data as any
    logger.debug('Broadcasted reservation fulfillment', {
      inventoryItemId: data.inventoryItemId,
      reservationId: reservationData.reservationId,
      quantityFulfilled: reservationData.quantityFulfilled,
    })
  }

  private broadcastInventoryAdjustment(data: InventoryUpdateData) {
    const payload = {
      type: 'inventory:adjusted',
      data,
      timestamp: new Date().toISOString(),
    }

    this.io.to('inventory:all').emit('inventory:adjusted', payload)

    // Note: These properties don't exist in InventoryUpdateData interface
    // Using type assertion to access them for adjustment events
    const adjustmentData = data as any
    logger.debug('Broadcasted inventory adjustment', {
      inventoryItemId: data.inventoryItemId,
      adjustmentId: adjustmentData.adjustmentId,
      type: adjustmentData.type,
      quantityChange: adjustmentData.quantityChange,
    })
  }

  private broadcastTransferUpdate(data: InventoryUpdateData, action: string) {
    const payload = {
      type: `inventory:transfer${action.charAt(0).toUpperCase() + action.slice(1)}`,
      data,
      timestamp: new Date().toISOString(),
    }

    this.io
      .to('inventory:all')
      .emit(
        `inventory:transfer${action.charAt(0).toUpperCase() + action.slice(1)}`,
        payload
      )

    // Broadcast to location-specific rooms
    // Note: These properties don't exist in InventoryUpdateData interface
    // Using type assertion to access them for transfer events
    const transferData = data as any
    if (transferData.fromLocationId) {
      this.io
        .to(`inventory:location:${transferData.fromLocationId}`)
        .emit(
          `inventory:transfer${action.charAt(0).toUpperCase() + action.slice(1)}`,
          payload
        )
    }
    if (transferData.toLocationId) {
      this.io
        .to(`inventory:location:${transferData.toLocationId}`)
        .emit(
          `inventory:transfer${action.charAt(0).toUpperCase() + action.slice(1)}`,
          payload
        )
    }

    logger.debug(`Broadcasted transfer ${action}`, {
      transferId: transferData.transferId,
      fromLocationId: transferData.fromLocationId,
      toLocationId: transferData.toLocationId,
    })
  }

  // ============================================================================
  // NOTIFICATION METHODS
  // ============================================================================

  public sendNotificationToUser(
    userId: string,
    type: string,
    data: Record<string, unknown>
  ) {
    const userSockets = this.connectedUsers.get(userId)
    if (userSockets && userSockets.size > 0) {
      const payload = {
        type,
        data,
        timestamp: new Date().toISOString(),
      }

      userSockets.forEach((socketId) => {
        this.io.to(socketId).emit('notification', payload)
      })

      logger.debug('Sent notification to user', {
        userId,
        type,
        socketCount: userSockets.size,
      })
    }
  }

  public broadcastNotification(
    type: string,
    data: Record<string, unknown>,
    roomFilter?: string
  ) {
    const payload = {
      type,
      data,
      timestamp: new Date().toISOString(),
    }

    const room = roomFilter || 'inventory:all'
    this.io.to(room).emit('notification', payload)

    logger.debug('Broadcasted notification', {
      type,
      room,
      connectedClients: this.io.sockets.sockets.size,
    })
  }

  // Generic broadcast method for backward compatibility
  public broadcast(eventType: string, data: Record<string, unknown>) {
    const payload = {
      type: eventType,
      data,
      timestamp: new Date().toISOString(),
    }

    // Determine appropriate room based on event type
    let room = 'inventory:all'
    if (eventType.includes('order')) {
      room = 'orders:all'
    } else if (eventType.includes('customer')) {
      room = 'inventory:all' // customers don't have specific rooms yet
    }

    this.io.to(room).emit(eventType, payload)

    logger.debug('Broadcasted event', {
      eventType,
      room,
      connectedClients: this.io.sockets.sockets.size,
    })
  }

  private async broadcastToUsersWithPermission(
    permission: string,
    eventType: string,
    data: Record<string, unknown>
  ) {
    // This would require querying users with specific permissions
    // For now, broadcast to all connected users
    this.broadcastNotification(eventType, data)
  }

  // ============================================================================
  // USER ACTIVITY BROADCASTING
  // ============================================================================

  public broadcastUserActivity(
    userId: string,
    action: string,
    metadata?: Record<string, unknown>
  ) {
    const payload = {
      type: 'user:activity',
      data: {
        userId,
        action,
        timestamp: new Date().toISOString(),
        metadata,
      },
      timestamp: new Date().toISOString(),
    }

    // Broadcast to all connected users (excluding the user who performed the action)
    this.connectedUsers.forEach((socketIds, connectedUserId) => {
      if (connectedUserId !== userId) {
        socketIds.forEach((socketId) => {
          this.io.to(socketId).emit('notification', payload)
        })
      }
    })

    logger.debug('Broadcasted user activity', { userId, action, metadata })
  }

  public broadcastSystemEvent(
    eventType: string,
    message: string,
    severity: 'info' | 'warning' | 'error' = 'info',
    metadata?: Record<string, unknown>
  ) {
    const payload = {
      type: 'system:event',
      data: {
        eventType,
        message,
        severity,
        timestamp: new Date().toISOString(),
        metadata,
      },
      timestamp: new Date().toISOString(),
    }

    // Broadcast to all connected users
    this.io.emit('notification', payload)

    logger.info('Broadcasted system event', {
      eventType,
      message,
      severity,
      metadata,
    })
  }

  public broadcastMaintenanceNotification(
    message: string,
    scheduledTime?: string,
    duration?: string
  ) {
    const payload = {
      type: 'system:maintenance',
      data: {
        message,
        scheduledTime,
        duration,
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    }

    this.io.emit('notification', payload)

    logger.info('Broadcasted maintenance notification', {
      message,
      scheduledTime,
      duration,
    })
  }

  public broadcastSecurityAlert(
    alertType: string,
    message: string,
    affectedUserId?: string,
    metadata?: Record<string, unknown>
  ) {
    const payload = {
      type: 'security:alert',
      data: {
        alertType,
        message,
        affectedUserId,
        timestamp: new Date().toISOString(),
        metadata,
      },
      timestamp: new Date().toISOString(),
    }

    if (affectedUserId) {
      // Send to specific user
      this.sendNotificationToUser(
        affectedUserId,
        'security:alert',
        payload.data
      )
    } else {
      // Broadcast to all users with admin permissions
      this.broadcastToUsersWithPermission(
        'admin',
        'security:alert',
        payload.data
      )
    }

    logger.warn('Broadcasted security alert', {
      alertType,
      message,
      affectedUserId,
      metadata,
    })
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private hasPermission(
    userRoles: string[] = [],
    _permission: string
  ): boolean {
    // Simple permission check - in a real app, this would be more sophisticated
    const adminRoles = ['admin', 'inventory_manager', 'warehouse_manager']
    return userRoles.some((role) => adminRoles.includes(role))
  }

  public getConnectedUsersCount(): number {
    return this.connectedUsers.size
  }

  public getConnectedSocketsCount(): number {
    return this.io.sockets.sockets.size
  }

  public getUserSockets(userId: string): string[] {
    const sockets = this.connectedUsers.get(userId)
    return sockets ? Array.from(sockets) : []
  }

  public isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId)
  }

  // ============================================================================
  // ORDER EVENTS (for future integration)
  // ============================================================================

  public broadcastOrderUpdate(
    orderId: string,
    status: string,
    customerId?: string
  ) {
    const payload = {
      type: 'order:updated',
      data: { orderId, status, customerId },
      timestamp: new Date().toISOString(),
    }

    this.io.to('orders:all').emit('order:updated', payload)

    if (customerId) {
      this.io.to(`orders:customer:${customerId}`).emit('order:updated', payload)
    }

    logger.debug('Broadcasted order update', { orderId, status, customerId })
  }

  public broadcastShopifySyncStatus(
    syncType: string,
    status: string,
    progress?: number,
    error?: string,
    details?: Record<string, unknown>
  ) {
    const payload = {
      type: 'shopify:syncStatus',
      data: {
        syncType,
        status,
        progress,
        error,
        details,
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    }

    // Broadcast to all inventory subscribers
    this.io.to('inventory:all').emit('shopify:syncStatus', payload)

    // Also broadcast to general notifications for important status changes
    if (status === 'completed' || status === 'error' || status === 'failed') {
      this.broadcastNotification('shopify:syncComplete', payload.data)
    }

    logger.debug('Broadcasted Shopify sync status', {
      syncType,
      status,
      progress,
      error,
    })
  }

  // ============================================================================
  // SHOPIFY SYNC SPECIFIC METHODS
  // ============================================================================

  public broadcastShopifyProductSync(
    action: 'started' | 'progress' | 'completed' | 'error',
    data: Record<string, unknown>
  ) {
    const payload = {
      type: `shopify:product:${action}`,
      data,
      timestamp: new Date().toISOString(),
    }

    this.io.to('inventory:all').emit(`shopify:product:${action}`, payload)

    if (action === 'error') {
      this.broadcastNotification('shopify:error', {
        type: 'product_sync',
        message: data.message || 'Product sync failed',
        details: data,
      })
    }

    logger.debug(`Broadcasted Shopify product sync ${action}`, data)
  }

  public broadcastShopifyInventorySync(
    action: 'started' | 'progress' | 'completed' | 'error',
    data: Record<string, unknown>
  ) {
    const payload = {
      type: `shopify:inventory:${action}`,
      data,
      timestamp: new Date().toISOString(),
    }

    this.io.to('inventory:all').emit(`shopify:inventory:${action}`, payload)

    if (action === 'error') {
      this.broadcastNotification('shopify:error', {
        type: 'inventory_sync',
        message: data.message || 'Inventory sync failed',
        details: data,
      })
    }

    logger.debug(`Broadcasted Shopify inventory sync ${action}`, data)
  }

  public broadcastShopifyOrderSync(
    action: 'started' | 'progress' | 'completed' | 'error',
    data: Record<string, unknown>
  ) {
    const payload = {
      type: `shopify:order:${action}`,
      data,
      timestamp: new Date().toISOString(),
    }

    this.io.to('orders:all').emit(`shopify:order:${action}`, payload)

    if (action === 'error') {
      this.broadcastNotification('shopify:error', {
        type: 'order_sync',
        message: data.message || 'Order sync failed',
        details: data,
      })
    }

    logger.debug(`Broadcasted Shopify order sync ${action}`, data)
  }

  public broadcastShopifyCustomerSync(
    action: 'started' | 'progress' | 'completed' | 'error',
    data: Record<string, unknown>
  ) {
    const payload = {
      type: `shopify:customer:${action}`,
      data,
      timestamp: new Date().toISOString(),
    }

    this.io.to('inventory:all').emit(`shopify:customer:${action}`, payload)

    if (action === 'error') {
      this.broadcastNotification('shopify:error', {
        type: 'customer_sync',
        message: data.message || 'Customer sync failed',
        details: data,
      })
    }

    logger.debug(`Broadcasted Shopify customer sync ${action}`, data)
  }

  public broadcastShopifyWebhookReceived(
    webhookType: string,
    data: Record<string, unknown>
  ) {
    const payload = {
      type: 'shopify:webhook:received',
      data: {
        webhookType,
        ...data,
      },
      timestamp: new Date().toISOString(),
    }

    // Broadcast to appropriate rooms based on webhook type
    switch (webhookType) {
      case 'orders/create':
      case 'orders/updated':
      case 'orders/paid':
      case 'orders/cancelled':
        this.io.to('orders:all').emit('shopify:webhook:received', payload)
        break
      case 'products/create':
      case 'products/update':
      case 'products/delete':
        this.io.to('inventory:all').emit('shopify:webhook:received', payload)
        break
      case 'inventory_levels/update':
        this.io.to('inventory:all').emit('shopify:webhook:received', payload)
        break
      case 'customers/create':
      case 'customers/update':
      case 'customers/delete':
        this.io.to('inventory:all').emit('shopify:webhook:received', payload)
        break
      default:
        this.io.to('inventory:all').emit('shopify:webhook:received', payload)
    }

    logger.debug('Broadcasted Shopify webhook received', {
      webhookType,
      dataKeys: Object.keys(data),
    })
  }
}
