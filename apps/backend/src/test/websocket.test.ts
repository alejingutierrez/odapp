import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { io as Client, Socket as ClientSocket } from 'socket.io-client'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'
import { WebSocketService } from '../services/websocket.service'
import { InventoryService } from '../services/inventory.service'
import { logger } from '../lib/logger'

// Mock dependencies
vi.mock('../lib/logger')
vi.mock('../lib/prisma')

describe('WebSocketService', () => {
  let server: any
  let webSocketService: WebSocketService
  let inventoryService: InventoryService
  let prisma: PrismaClient
  let clientSocket: ClientSocket
  let serverPort: number

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    roles: [
      {
        role: {
          name: 'inventory_manager'
        }
      }
    ]
  }

  const mockToken = jwt.sign(
    { userId: mockUser.id },
    process.env.JWT_SECRET || 'test-secret'
  )

  beforeAll(async () => {
    // Setup test server
    server = createServer()
    serverPort = 0 // Use random available port
    
    // Mock Prisma
    prisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue(mockUser)
      }
    } as any

    // Mock InventoryService
    inventoryService = {
      on: vi.fn(),
      updateStockLevel: vi.fn(),
      createReservation: vi.fn().mockResolvedValue({ id: 'reservation-123' })
    } as any

    // Initialize WebSocket service
    webSocketService = new WebSocketService(server, prisma, inventoryService)

    // Start server
    await new Promise<void>((resolve) => {
      server.listen(serverPort, () => {
        serverPort = server.address()?.port || 3001
        resolve()
      })
    })
  })

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      server.close(resolve)
    })
  })

  beforeEach(async () => {
    // Create client connection
    clientSocket = Client(`http://localhost:${serverPort}`, {
      auth: {
        token: mockToken
      },
      transports: ['websocket']
    })

    // Wait for connection
    await new Promise<void>((resolve) => {
      clientSocket.on('connect', resolve)
    })
  })

  afterEach(() => {
    if (clientSocket.connected) {
      clientSocket.disconnect()
    }
  })

  describe('Authentication', () => {
    it('should authenticate valid token', async () => {
      expect(clientSocket.connected).toBe(true)
    })

    it('should reject connection without token', async () => {
      const unauthorizedClient = Client(`http://localhost:${serverPort}`, {
        transports: ['websocket']
      })

      await new Promise<void>((resolve) => {
        unauthorizedClient.on('connect_error', (error) => {
          expect(error.message).toContain('Authentication token required')
          resolve()
        })
      })

      unauthorizedClient.disconnect()
    })

    it('should reject connection with invalid token', async () => {
      const unauthorizedClient = Client(`http://localhost:${serverPort}`, {
        auth: {
          token: 'invalid-token'
        },
        transports: ['websocket']
      })

      await new Promise<void>((resolve) => {
        unauthorizedClient.on('connect_error', (error) => {
          expect(error.message).toContain('Authentication failed')
          resolve()
        })
      })

      unauthorizedClient.disconnect()
    })
  })

  describe('Connection Management', () => {
    it('should track connected users', () => {
      expect(webSocketService.isUserConnected(mockUser.id)).toBe(true)
      expect(webSocketService.getConnectedUsersCount()).toBeGreaterThan(0)
    })

    it('should send connection confirmation', async () => {
      await new Promise<void>((resolve) => {
        clientSocket.on('connected', (data) => {
          expect(data).toMatchObject({
            socketId: expect.any(String),
            userId: mockUser.id,
            timestamp: expect.any(String)
          })
          resolve()
        })
      })
    })

    it('should handle disconnection', async () => {
      const userId = mockUser.id
      expect(webSocketService.isUserConnected(userId)).toBe(true)

      clientSocket.disconnect()

      // Wait a bit for disconnection to be processed
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(webSocketService.isUserConnected(userId)).toBe(false)
    })
  })

  describe('Inventory Subscriptions', () => {
    it('should handle inventory subscription', async () => {
      const subscriptionData = {
        locationIds: ['location-1', 'location-2'],
        productIds: ['product-1', 'product-2']
      }

      clientSocket.emit('subscribe:inventory', subscriptionData)

      await new Promise<void>((resolve) => {
        clientSocket.on('inventory:subscribed', (data) => {
          expect(data).toMatchObject({
            locationIds: subscriptionData.locationIds,
            productIds: subscriptionData.productIds,
            timestamp: expect.any(String)
          })
          resolve()
        })
      })
    })

    it('should handle order subscription', async () => {
      const subscriptionData = {
        customerId: 'customer-123'
      }

      clientSocket.emit('subscribe:orders', subscriptionData)

      // Should not throw any errors
      await new Promise(resolve => setTimeout(resolve, 100))
    })

    it('should handle notification subscription', async () => {
      clientSocket.emit('subscribe:notifications')

      // Should not throw any errors
      await new Promise(resolve => setTimeout(resolve, 100))
    })
  })

  describe('Inventory Operations', () => {
    it('should handle inventory update with proper permissions', async () => {
      const updateData = {
        inventoryItemId: 'item-123',
        quantity: 100,
        reason: 'Stock adjustment'
      }

      clientSocket.emit('inventory:update', updateData)

      await new Promise<void>((resolve) => {
        clientSocket.on('inventory:updateSuccess', (data) => {
          expect(data).toMatchObject({
            inventoryItemId: updateData.inventoryItemId,
            quantity: updateData.quantity,
            timestamp: expect.any(String)
          })
          resolve()
        })
      })

      expect(inventoryService.updateStockLevel).toHaveBeenCalledWith(
        updateData.inventoryItemId,
        updateData.quantity,
        updateData.reason,
        mockUser.id
      )
    })

    it('should handle inventory reservation with proper permissions', async () => {
      const reservationData = {
        inventoryItemId: 'item-123',
        quantity: 10,
        reason: 'Order reservation',
        referenceId: 'order-456'
      }

      clientSocket.emit('inventory:reserve', reservationData)

      await new Promise<void>((resolve) => {
        clientSocket.on('inventory:reservationSuccess', (data) => {
          expect(data).toMatchObject({
            reservationId: 'reservation-123',
            inventoryItemId: reservationData.inventoryItemId,
            quantity: reservationData.quantity,
            timestamp: expect.any(String)
          })
          resolve()
        })
      })

      expect(inventoryService.createReservation).toHaveBeenCalledWith({
        inventoryItemId: reservationData.inventoryItemId,
        quantity: reservationData.quantity,
        reason: reservationData.reason,
        referenceId: reservationData.referenceId
      })
    })

    it('should handle inventory update error', async () => {
      const updateData = {
        inventoryItemId: 'item-123',
        quantity: 100,
        reason: 'Stock adjustment'
      }

      // Mock service to throw error
      vi.mocked(inventoryService.updateStockLevel).mockRejectedValueOnce(
        new Error('Insufficient stock')
      )

      clientSocket.emit('inventory:update', updateData)

      await new Promise<void>((resolve) => {
        clientSocket.on('inventory:updateError', (data) => {
          expect(data).toMatchObject({
            inventoryItemId: updateData.inventoryItemId,
            error: 'Insufficient stock',
            timestamp: expect.any(String)
          })
          resolve()
        })
      })
    })
  })

  describe('Broadcasting', () => {
    it('should broadcast inventory updates', async () => {
      const updateData = {
        inventoryItemId: 'item-123',
        locationId: 'location-1',
        productId: 'product-1',
        variantId: 'variant-1',
        oldQuantity: 50,
        newQuantity: 100,
        reason: 'Stock adjustment'
      }

      // Subscribe to inventory updates
      clientSocket.emit('subscribe:inventory', {
        locationIds: ['location-1'],
        productIds: ['product-1']
      })

      await new Promise(resolve => setTimeout(resolve, 100))

      // Simulate inventory update broadcast
      webSocketService['broadcastInventoryUpdate'](updateData)

      await new Promise<void>((resolve) => {
        clientSocket.on('inventory:updated', (payload) => {
          expect(payload).toMatchObject({
            type: 'inventory:updated',
            data: updateData,
            timestamp: expect.any(String)
          })
          resolve()
        })
      })
    })

    it('should broadcast low stock alerts', async () => {
      const alertData = {
        inventoryItemId: 'item-123',
        locationId: 'location-1',
        productId: 'product-1',
        variantId: 'variant-1',
        currentQuantity: 5,
        threshold: 10,
        productName: 'Test Product'
      }

      // Subscribe to inventory updates
      clientSocket.emit('subscribe:inventory', {
        locationIds: ['location-1']
      })

      await new Promise(resolve => setTimeout(resolve, 100))

      // Simulate low stock alert broadcast
      webSocketService['broadcastLowStockAlert'](alertData)

      await new Promise<void>((resolve) => {
        clientSocket.on('inventory:lowStock', (payload) => {
          expect(payload).toMatchObject({
            type: 'inventory:lowStock',
            data: alertData,
            timestamp: expect.any(String)
          })
          resolve()
        })
      })
    })

    it('should broadcast order updates', async () => {
      const orderId = 'order-123'
      const status = 'shipped'
      const customerId = 'customer-456'

      // Subscribe to order updates
      clientSocket.emit('subscribe:orders', { customerId })

      await new Promise(resolve => setTimeout(resolve, 100))

      // Simulate order update broadcast
      webSocketService.broadcastOrderUpdate(orderId, status, customerId)

      await new Promise<void>((resolve) => {
        clientSocket.on('order:updated', (payload) => {
          expect(payload).toMatchObject({
            type: 'order:updated',
            data: { orderId, status, customerId },
            timestamp: expect.any(String)
          })
          resolve()
        })
      })
    })

    it('should broadcast Shopify sync status', async () => {
      const syncType = 'inventory'
      const status = 'in_progress'
      const progress = 50

      // Subscribe to inventory updates to receive sync status
      clientSocket.emit('subscribe:inventory', {})

      await new Promise(resolve => setTimeout(resolve, 100))

      // Simulate Shopify sync status broadcast
      webSocketService.broadcastShopifySyncStatus(syncType, status, progress)

      await new Promise<void>((resolve) => {
        clientSocket.on('shopify:syncStatus', (payload) => {
          expect(payload).toMatchObject({
            type: 'shopify:syncStatus',
            data: { syncType, status, progress },
            timestamp: expect.any(String)
          })
          resolve()
        })
      })
    })
  })

  describe('Notifications', () => {
    it('should send notification to specific user', async () => {
      const notificationType = 'test:notification'
      const notificationData = { message: 'Test notification' }

      webSocketService.sendNotificationToUser(mockUser.id, notificationType, notificationData)

      await new Promise<void>((resolve) => {
        clientSocket.on('notification', (payload) => {
          expect(payload).toMatchObject({
            type: notificationType,
            data: notificationData,
            timestamp: expect.any(String)
          })
          resolve()
        })
      })
    })

    it('should broadcast notification to all users', async () => {
      const notificationType = 'system:maintenance'
      const notificationData = { message: 'System maintenance scheduled' }

      webSocketService.broadcastNotification(notificationType, notificationData)

      await new Promise<void>((resolve) => {
        clientSocket.on('notification', (payload) => {
          expect(payload).toMatchObject({
            type: notificationType,
            data: notificationData,
            timestamp: expect.any(String)
          })
          resolve()
        })
      })
    })
  })

  describe('Utility Methods', () => {
    it('should return connected users count', () => {
      const count = webSocketService.getConnectedUsersCount()
      expect(count).toBeGreaterThanOrEqual(0)
    })

    it('should return connected sockets count', () => {
      const count = webSocketService.getConnectedSocketsCount()
      expect(count).toBeGreaterThanOrEqual(0)
    })

    it('should return user sockets', () => {
      const sockets = webSocketService.getUserSockets(mockUser.id)
      expect(Array.isArray(sockets)).toBe(true)
    })

    it('should check if user is connected', () => {
      const isConnected = webSocketService.isUserConnected(mockUser.id)
      expect(typeof isConnected).toBe('boolean')
    })
  })
})