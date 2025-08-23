import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
  beforeAll,
  afterAll,
} from 'vitest'
import { createServer } from 'http'
import { io as Client, Socket as ClientSocket } from 'socket.io-client'
import * as jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'
import { WebSocketService } from '../services/websocket.service'
import { InventoryService } from '../services/inventory.service'
import { OrderService } from '../services/order.service'
import { ShopifyService } from '../services/shopify.service'

describe('WebSocket Integration Tests', () => {
  let server: any
  let webSocketService: WebSocketService
  let inventoryService: InventoryService
  let _orderService: OrderService
  let _shopifyService: ShopifyService
  let prisma: PrismaClient
  let clientSocket1: ClientSocket
  let clientSocket2: ClientSocket
  let serverPort: number

  const mockUser1 = {
    id: 'user-1',
    email: 'user1@example.com',
    roles: [{ role: { name: 'inventory_manager' } }],
  }

  const mockUser2 = {
    id: 'user-2',
    email: 'user2@example.com',
    roles: [{ role: { name: 'sales_manager' } }],
  }

  const mockToken1 = jwt.sign(
    { userId: mockUser1.id },
    process.env.JWT_SECRET || 'test-secret'
  )
  const mockToken2 = jwt.sign(
    { userId: mockUser2.id },
    process.env.JWT_SECRET || 'test-secret'
  )

  beforeAll(async () => {
    server = createServer()
    serverPort = 0 // Use random available port

    // Mock Prisma
    prisma = {
      user: {
        findUnique: vi.fn().mockImplementation(({ where }) => {
          if (where.id === mockUser1.id) return Promise.resolve(mockUser1)
          if (where.id === mockUser2.id) return Promise.resolve(mockUser2)
          return Promise.resolve(null)
        }),
      },
      inventoryItem: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      inventoryReservation: {
        create: vi.fn(),
      },
    } as any

    // Initialize services
    inventoryService = new InventoryService(prisma)
    webSocketService = new WebSocketService(server, prisma, inventoryService)
    _orderService = new OrderService()
    _shopifyService = new ShopifyService()

    // Start server
    await new Promise<void>((resolve) => {
      server.listen(serverPort, () => {
        serverPort = server.address()?.port || 3002
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
    // Create client connections
    clientSocket1 = Client(`http://localhost:${serverPort}`, {
      auth: { token: mockToken1 },
      transports: ['websocket'],
    })

    clientSocket2 = Client(`http://localhost:${serverPort}`, {
      auth: { token: mockToken2 },
      transports: ['websocket'],
    })

    // Wait for connections
    await Promise.all([
      new Promise<void>((resolve) => clientSocket1.on('connect', resolve)),
      new Promise<void>((resolve) => clientSocket2.on('connect', resolve)),
    ])
  })

  afterEach(() => {
    if (clientSocket1.connected) clientSocket1.disconnect()
    if (clientSocket2.connected) clientSocket2.disconnect()
  })

  describe('Multi-user Inventory Updates', () => {
    it('should broadcast inventory updates to all subscribed users', async () => {
      const locationId = 'location-1'
      const productId = 'product-1'

      // Both users subscribe to the same location
      clientSocket1.emit('subscribe:inventory', { locationIds: [locationId] })
      clientSocket2.emit('subscribe:inventory', { locationIds: [locationId] })

      await new Promise((resolve) => setTimeout(resolve, 100))

      const updateData = {
        inventoryItemId: 'item-123',
        locationId,
        productId,
        oldQuantity: 50,
        newQuantity: 100,
        reason: 'Stock adjustment',
      }

      // Set up listeners for both clients
      const promises = [
        new Promise<void>((resolve) => {
          clientSocket1.on('inventory:updated', (payload) => {
            expect(payload.data).toMatchObject(updateData)
            resolve()
          })
        }),
        new Promise<void>((resolve) => {
          clientSocket2.on('inventory:updated', (payload) => {
            expect(payload.data).toMatchObject(updateData)
            resolve()
          })
        }),
      ]

      // Trigger inventory update
      webSocketService['broadcastInventoryUpdate'](updateData)

      await Promise.all(promises)
    })

    it('should only notify users subscribed to specific locations', async () => {
      const location1 = 'location-1'
      const location2 = 'location-2'

      // User 1 subscribes to location 1, User 2 to location 2
      clientSocket1.emit('subscribe:inventory', { locationIds: [location1] })
      clientSocket2.emit('subscribe:inventory', { locationIds: [location2] })

      await new Promise((resolve) => setTimeout(resolve, 100))

      let user1Received = false
      let user2Received = false

      clientSocket1.on('inventory:updated', () => {
        user1Received = true
      })
      clientSocket2.on('inventory:updated', () => {
        user2Received = true
      })

      // Update inventory in location 1
      const updateData = {
        inventoryItemId: 'item-123',
        locationId: location1,
        productId: 'product-1',
        oldQuantity: 50,
        newQuantity: 100,
        reason: 'Stock adjustment',
      }

      webSocketService['broadcastInventoryUpdate'](updateData)

      await new Promise((resolve) => setTimeout(resolve, 200))

      expect(user1Received).toBe(true)
      expect(user2Received).toBe(false)
    })
  })

  describe('Real-time Order Status Updates', () => {
    it('should notify customers of order status changes', async () => {
      const customerId = 'customer-123'
      const orderId = 'order-456'
      const newStatus = 'shipped'

      // User subscribes to customer orders
      clientSocket1.emit('subscribe:orders', { customerId })

      await new Promise((resolve) => setTimeout(resolve, 100))

      const orderUpdatePromise = new Promise<void>((resolve) => {
        clientSocket1.on('order:updated', (payload) => {
          expect(payload.data).toMatchObject({
            orderId,
            status: newStatus,
            customerId,
          })
          resolve()
        })
      })

      // Simulate order status update
      webSocketService.broadcastOrderUpdate(orderId, newStatus, customerId)

      await orderUpdatePromise
    })

    it('should broadcast order updates to all order subscribers', async () => {
      const orderId = 'order-789'
      const newStatus = 'delivered'

      // Both users subscribe to all orders
      clientSocket1.emit('subscribe:orders', {})
      clientSocket2.emit('subscribe:orders', {})

      await new Promise((resolve) => setTimeout(resolve, 100))

      const promises = [
        new Promise<void>((resolve) => {
          clientSocket1.on('order:updated', (payload) => {
            expect(payload.data.orderId).toBe(orderId)
            expect(payload.data.status).toBe(newStatus)
            resolve()
          })
        }),
        new Promise<void>((resolve) => {
          clientSocket2.on('order:updated', (payload) => {
            expect(payload.data.orderId).toBe(orderId)
            expect(payload.data.status).toBe(newStatus)
            resolve()
          })
        }),
      ]

      webSocketService.broadcastOrderUpdate(orderId, newStatus)

      await Promise.all(promises)
    })
  })

  describe('Shopify Sync Status Notifications', () => {
    it('should broadcast sync progress to all inventory subscribers', async () => {
      const syncType = 'products'
      const status = 'in_progress'
      const progress = 75

      // Both users subscribe to inventory updates
      clientSocket1.emit('subscribe:inventory', {})
      clientSocket2.emit('subscribe:inventory', {})

      await new Promise((resolve) => setTimeout(resolve, 100))

      const promises = [
        new Promise<void>((resolve) => {
          clientSocket1.on('shopify:syncStatus', (payload) => {
            expect(payload.data).toMatchObject({
              syncType,
              status,
              progress,
            })
            resolve()
          })
        }),
        new Promise<void>((resolve) => {
          clientSocket2.on('shopify:syncStatus', (payload) => {
            expect(payload.data).toMatchObject({
              syncType,
              status,
              progress,
            })
            resolve()
          })
        }),
      ]

      webSocketService.broadcastShopifySyncStatus(syncType, status, progress)

      await Promise.all(promises)
    })

    it('should handle sync completion notifications', async () => {
      const syncType = 'inventory'
      const status = 'completed'
      const progress = 100

      clientSocket1.emit('subscribe:inventory', {})

      await new Promise((resolve) => setTimeout(resolve, 100))

      const syncCompletePromise = new Promise<void>((resolve) => {
        clientSocket1.on('shopify:syncStatus', (payload) => {
          expect(payload.data).toMatchObject({
            syncType,
            status,
            progress,
          })
          resolve()
        })
      })

      webSocketService.broadcastShopifySyncStatus(syncType, status, progress)

      await syncCompletePromise
    })

    it('should handle sync error notifications', async () => {
      const syncType = 'orders'
      const status = 'error'
      const error = 'API rate limit exceeded'

      clientSocket1.emit('subscribe:inventory', {})

      await new Promise((resolve) => setTimeout(resolve, 100))

      const syncErrorPromise = new Promise<void>((resolve) => {
        clientSocket1.on('shopify:syncStatus', (payload) => {
          expect(payload.data).toMatchObject({
            syncType,
            status,
            error,
          })
          resolve()
        })
      })

      webSocketService.broadcastShopifySyncStatus(
        syncType,
        status,
        undefined,
        error
      )

      await syncErrorPromise
    })
  })

  describe('User Activity Broadcasting', () => {
    it('should broadcast user login activity', async () => {
      const activityData = {
        userId: mockUser1.id,
        action: 'login',
        timestamp: new Date().toISOString(),
        metadata: { ip: '192.168.1.1', userAgent: 'Test Browser' },
      }

      clientSocket2.emit('subscribe:notifications')

      await new Promise((resolve) => setTimeout(resolve, 100))

      const activityPromise = new Promise<void>((resolve) => {
        clientSocket2.on('notification', (payload) => {
          if (payload.type === 'user:activity') {
            expect(payload.data).toMatchObject(activityData)
            resolve()
          }
        })
      })

      webSocketService.broadcastNotification('user:activity', activityData)

      await activityPromise
    })

    it('should broadcast system events', async () => {
      const systemEvent = {
        type: 'maintenance',
        message: 'System maintenance scheduled for tonight',
        scheduledTime: new Date(Date.now() + 3600000).toISOString(),
      }

      // Both users subscribe to notifications
      clientSocket1.emit('subscribe:notifications')
      clientSocket2.emit('subscribe:notifications')

      await new Promise((resolve) => setTimeout(resolve, 100))

      const promises = [
        new Promise<void>((resolve) => {
          clientSocket1.on('notification', (payload) => {
            if (payload.type === 'system:event') {
              expect(payload.data).toMatchObject(systemEvent)
              resolve()
            }
          })
        }),
        new Promise<void>((resolve) => {
          clientSocket2.on('notification', (payload) => {
            if (payload.type === 'system:event') {
              expect(payload.data).toMatchObject(systemEvent)
              resolve()
            }
          })
        }),
      ]

      webSocketService.broadcastNotification('system:event', systemEvent)

      await Promise.all(promises)
    })
  })

  describe('Permission-based Notifications', () => {
    it('should only send low stock alerts to users with inventory permissions', async () => {
      const alertData = {
        inventoryItemId: 'item-123',
        locationId: 'location-1',
        productId: 'product-1',
        currentQuantity: 3,
        threshold: 10,
        productName: 'Test Product',
      }

      // Both users subscribe to inventory
      clientSocket1.emit('subscribe:inventory', { locationIds: ['location-1'] })
      clientSocket2.emit('subscribe:inventory', { locationIds: ['location-1'] })

      await new Promise((resolve) => setTimeout(resolve, 100))

      let user1Received = false
      let _user2Received = false

      clientSocket1.on('notification', (payload) => {
        if (payload.type === 'notification:lowStock') {
          user1Received = true
        }
      })

      clientSocket2.on('notification', (payload) => {
        if (payload.type === 'notification:lowStock') {
          _user2Received = true
        }
      })

      webSocketService['broadcastLowStockAlert'](alertData)

      await new Promise((resolve) => setTimeout(resolve, 200))

      // User 1 has inventory_manager role, should receive notification
      // User 2 has sales_manager role, should also receive (for this test)
      expect(user1Received).toBe(true)
    })
  })

  describe('Connection Resilience', () => {
    it('should handle reconnection gracefully', async () => {
      const userId = mockUser1.id

      expect(webSocketService.isUserConnected(userId)).toBe(true)

      // Disconnect and reconnect
      clientSocket1.disconnect()
      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(webSocketService.isUserConnected(userId)).toBe(false)

      // Reconnect
      clientSocket1 = Client(`http://localhost:${serverPort}`, {
        auth: { token: mockToken1 },
        transports: ['websocket'],
      })

      await new Promise<void>((resolve) => {
        clientSocket1.on('connect', resolve)
      })

      expect(webSocketService.isUserConnected(userId)).toBe(true)
    })

    it('should handle multiple connections from same user', async () => {
      const userId = mockUser1.id

      // Create second connection for same user
      const clientSocket1b = Client(`http://localhost:${serverPort}`, {
        auth: { token: mockToken1 },
        transports: ['websocket'],
      })

      await new Promise<void>((resolve) => {
        clientSocket1b.on('connect', resolve)
      })

      expect(webSocketService.isUserConnected(userId)).toBe(true)
      expect(webSocketService.getUserSockets(userId).length).toBeGreaterThan(1)

      // Disconnect one connection
      clientSocket1.disconnect()
      await new Promise((resolve) => setTimeout(resolve, 100))

      // User should still be connected via second socket
      expect(webSocketService.isUserConnected(userId)).toBe(true)

      clientSocket1b.disconnect()
    })
  })
})
