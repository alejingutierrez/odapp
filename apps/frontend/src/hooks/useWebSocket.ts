import { useEffect, useRef, useState, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { io, Socket } from 'socket.io-client'
import { selectIsAuthenticated, selectToken } from '../store/slices/authSlice'
import { setWebSocketStatus, addNotification } from '../store/slices/uiSlice'
import { AppDispatch } from '../store'

interface WebSocketConfig {
  url?: string
  autoConnect?: boolean
  reconnectAttempts?: number
  reconnectDelay?: number
}

export const useWebSocket = (config: WebSocketConfig = {}) => {
  const dispatch = useDispatch<AppDispatch>()
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const token = useSelector(selectToken)

  const {
    url = process.env.VITE_WS_URL || 'ws://localhost:3001',
    autoConnect = true,
    reconnectAttempts = 5,
    reconnectDelay = 1000,
  } = config

  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const reconnectAttemptsRef = useRef(0)

  const connect = useCallback(() => {
    if (!isAuthenticated || !token) {
      console.log('WebSocket: Not authenticated, skipping connection')
      return
    }

    if (socketRef.current?.connected) {
      console.log('WebSocket: Already connected')
      return
    }

    console.log('WebSocket: Connecting to', url)

    const socket = io(url, {
      auth: {
        token: token,
      },
      transports: ['websocket', 'polling'],
      timeout: 10000,
      forceNew: true,
    })

    socketRef.current = socket

    // Connection events
    socket.on('connect', () => {
      console.log('WebSocket: Connected')
      setIsConnected(true)
      setConnectionError(null)
      reconnectAttemptsRef.current = 0
      dispatch(setWebSocketStatus(true))

      dispatch(
        addNotification({
          type: 'success',
          title: 'Connected',
          message: 'Real-time updates are now active',
          duration: 2,
        })
      )
    })

    socket.on('disconnect', (reason) => {
      console.log('WebSocket: Disconnected', reason)
      setIsConnected(false)
      dispatch(setWebSocketStatus(false))

      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        handleReconnect()
      }
    })

    socket.on('connect_error', (error) => {
      console.error('WebSocket: Connection error', error)
      setConnectionError(error.message)
      handleReconnect()
    })

    // Business event handlers
    socket.on('inventory:updated', (data) => {
      console.log('Inventory updated:', data)
      dispatch(
        addNotification({
          type: 'info',
          title: 'Inventory Updated',
          message: `Stock levels updated for ${data.productName}`,
          duration: 3,
        })
      )
    })

    socket.on('order:created', (data) => {
      console.log('New order:', data)
      dispatch(
        addNotification({
          type: 'success',
          title: 'New Order',
          message: `Order #${data.orderNumber} received`,
          duration: 4,
        })
      )
    })

    socket.on('order:status_changed', (data) => {
      console.log('Order status changed:', data)
      dispatch(
        addNotification({
          type: 'info',
          title: 'Order Status Updated',
          message: `Order #${data.orderNumber} is now ${data.status}`,
          duration: 3,
        })
      )
    })

    socket.on('shopify:sync_completed', (data) => {
      console.log('Shopify sync completed:', data)
      dispatch(
        addNotification({
          type: data.success ? 'success' : 'error',
          title: 'Shopify Sync',
          message: data.success
            ? `Sync completed: ${data.itemsProcessed} items processed`
            : `Sync failed: ${data.error}`,
          duration: 5,
        })
      )
    })

    socket.on('low_stock_alert', (data) => {
      console.log('Low stock alert:', data)
      dispatch(
        addNotification({
          type: 'warning',
          title: 'Low Stock Alert',
          message: `${data.productName} is running low (${data.currentStock} remaining)`,
          duration: 6,
          actions: [
            {
              label: 'View Product',
              action: 'navigate',
              payload: `/products/${data.productId}`,
            },
          ],
        })
      )
    })

    socket.on('system:maintenance', (data) => {
      console.log('System maintenance:', data)
      dispatch(
        addNotification({
          type: 'warning',
          title: 'System Maintenance',
          message: data.message,
          duration: 0, // Don't auto-dismiss
        })
      )
    })
  }, [isAuthenticated, token, url, dispatch])

  const handleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current < reconnectAttempts) {
      reconnectAttemptsRef.current += 1
      console.log(
        `WebSocket: Reconnecting... Attempt ${reconnectAttemptsRef.current}/${reconnectAttempts}`
      )

      setTimeout(() => {
        connect()
      }, reconnectDelay * reconnectAttemptsRef.current)
    } else {
      console.log('WebSocket: Max reconnection attempts reached')
      dispatch(
        addNotification({
          type: 'error',
          title: 'Connection Lost',
          message:
            'Unable to connect to real-time updates. Please refresh the page.',
          duration: 0,
        })
      )
    }
  }, [connect, reconnectAttempts, reconnectDelay, dispatch])

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      console.log('WebSocket: Disconnecting')
      socketRef.current.disconnect()
      socketRef.current = null
      setIsConnected(false)
      dispatch(setWebSocketStatus(false))
    }
  }, [dispatch])

  const emit = useCallback((event: string, data?: unknown) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data)
    } else {
      console.warn('WebSocket: Cannot emit, not connected')
    }
  }, [])

  // Auto-connect when authenticated
  useEffect(() => {
    if (autoConnect && isAuthenticated && token) {
      connect()
    } else if (!isAuthenticated) {
      disconnect()
    }

    return () => {
      disconnect()
    }
  }, [autoConnect, isAuthenticated, token, connect, disconnect])

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, reduce activity
        console.log('WebSocket: Page hidden, reducing activity')
      } else {
        // Page is visible, ensure connection
        console.log('WebSocket: Page visible, ensuring connection')
        if (isAuthenticated && token && !isConnected) {
          connect()
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [isAuthenticated, token, isConnected, connect])

  return {
    isConnected,
    connectionError,
    connect,
    disconnect,
    emit,
    socket: socketRef.current,
  }
}
