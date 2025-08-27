import { Server as SocketIOServer } from 'socket.io'
import { Server as HTTPServer } from 'http'
import { logger } from './logger.js'

export interface WebSocketMessage {
  type: string
  data: any
  userId?: string
  timestamp: Date
}

export class WebSocketService {
  private io: SocketIOServer | null = null
  private connectedClients: Map<string, any> = new Map()

  initialize(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
      },
    })

    this.io.on('connection', (socket) => {
      logger.info(`Client connected: ${socket.id}`)
      this.connectedClients.set(socket.id, socket)

      socket.on('authenticate', (_data: { token: string }) => {
        // TODO: Implement token validation
        logger.info(`Client authenticated: ${socket.id}`)
      })

      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`)
        this.connectedClients.delete(socket.id)
      })
    })

    logger.info('WebSocket service initialized')
  }

  broadcast(event: string, data: any, room?: string) {
    if (!this.io) {
      logger.warn('WebSocket service not initialized')
      return
    }

    if (room) {
      this.io.to(room).emit(event, data)
    } else {
      this.io.emit(event, data)
    }

    logger.info(`Broadcasted event: ${event}`, { room, data })
  }

  sendToUser(userId: string, event: string, data: any) {
    if (!this.io) {
      logger.warn('WebSocket service not initialized')
      return
    }

    this.io.to(`user:${userId}`).emit(event, data)
    logger.info(`Sent event to user: ${event}`, { userId, data })
  }

  sendToClient(clientId: string, event: string, data: any) {
    if (!this.io) {
      logger.warn('WebSocket service not initialized')
      return
    }

    this.io.to(clientId).emit(event, data)
    logger.info(`Sent event to client: ${event}`, { clientId, data })
  }

  getConnectedClientsCount(): number {
    return this.connectedClients.size
  }

  isClientConnected(clientId: string): boolean {
    return this.connectedClients.has(clientId)
  }
}

export const webSocketService = new WebSocketService()
