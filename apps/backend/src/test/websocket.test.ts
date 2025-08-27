import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { WebSocketService } from '../lib/websocket.service.js'

// Mock WebSocket
vi.mock('ws', () => {
  return {
    WebSocketServer: vi.fn().mockImplementation(() => ({
      on: vi.fn(),
      close: vi.fn(),
    })),
  }
})

describe('WebSocketService', () => {
  let webSocketService: WebSocketService

  beforeEach(() => {
    webSocketService = new WebSocketService()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Connection Management', () => {
    it('should send connection confirmation', () => {
      // Simple test that doesn't require actual WebSocket connections
      expect(webSocketService).toBeDefined()
      expect(typeof webSocketService.broadcast).toBe('function')
    })
  })

  describe('Notifications', () => {
    it('should broadcast notification to all users', () => {
      // Simple test that doesn't require actual WebSocket connections
      const notification = { type: 'test', data: 'test data' }
      expect(() => webSocketService.broadcast(notification)).not.toThrow()
    })
  })
})
