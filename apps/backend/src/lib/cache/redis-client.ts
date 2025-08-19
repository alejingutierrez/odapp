import { createClient, RedisClientType, RedisClusterType } from 'redis'
import { env } from '../../config/env.js'
import logger from '../logger.js'

export interface RedisConfig {
  url: string
  ttl: number
  retryAttempts: number
  retryDelay: number
  maxRetriesPerRequest: number
  lazyConnect: boolean
  keepAlive: number
  family: number
  connectTimeout: number
  commandTimeout: number
}

export class RedisClient {
  private client: RedisClientType | RedisClusterType | null = null
  private isConnected = false
  private reconnectAttempts = 0
  private maxReconnectAttempts = 10
  private reconnectDelay = 1000

  constructor(private config: RedisConfig) {}

  async connect(): Promise<void> {
    try {
      // Parse Redis URL to determine if it's a cluster
      const url = new URL(this.config.url)
      const isCluster = url.searchParams.get('cluster') === 'true'

      if (isCluster) {
        // Create cluster client
        const { createCluster } = await import('redis')
        this.client = createCluster({
          rootNodes: [
            {
              url: this.config.url.replace('?cluster=true', ''),
            },
          ],
          defaults: {
            socket: {
              connectTimeout: this.config.connectTimeout,
              commandTimeout: this.config.commandTimeout,
              keepAlive: this.config.keepAlive,
              family: this.config.family,
            },
            lazyConnect: this.config.lazyConnect,
          },
          useReplicas: true,
        })
      } else {
        // Create single instance client
        this.client = createClient({
          url: this.config.url,
          socket: {
            connectTimeout: this.config.connectTimeout,
            commandTimeout: this.config.commandTimeout,
            keepAlive: this.config.keepAlive,
            family: this.config.family,
          },
          lazyConnect: this.config.lazyConnect,
        })
      }

      // Set up event listeners
      this.client.on('error', this.handleError.bind(this))
      this.client.on('connect', this.handleConnect.bind(this))
      this.client.on('ready', this.handleReady.bind(this))
      this.client.on('end', this.handleEnd.bind(this))
      this.client.on('reconnecting', this.handleReconnecting.bind(this))

      // Connect to Redis
      await this.client.connect()
      
      logger.info('Redis client connected successfully', {
        url: this.config.url,
        isCluster,
      })
    } catch (error) {
      logger.error('Failed to connect to Redis', { error })
      throw error
    }
  }

  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      try {
        await this.client.quit()
        this.isConnected = false
        logger.info('Redis client disconnected')
      } catch (error) {
        logger.error('Error disconnecting from Redis', { error })
        throw error
      }
    }
  }

  getClient(): RedisClientType | RedisClusterType {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis client is not connected')
    }
    return this.client
  }

  isReady(): boolean {
    return this.isConnected && this.client !== null
  }

  async ping(): Promise<string> {
    if (!this.client) {
      throw new Error('Redis client is not initialized')
    }
    return await this.client.ping()
  }

  private handleError(error: Error): void {
    logger.error('Redis client error', { error })
    this.isConnected = false
  }

  private handleConnect(): void {
    logger.info('Redis client connecting...')
  }

  private handleReady(): void {
    logger.info('Redis client ready')
    this.isConnected = true
    this.reconnectAttempts = 0
  }

  private handleEnd(): void {
    logger.info('Redis client connection ended')
    this.isConnected = false
    this.attemptReconnect()
  }

  private handleReconnecting(): void {
    this.reconnectAttempts++
    logger.info('Redis client reconnecting...', {
      attempt: this.reconnectAttempts,
      maxAttempts: this.maxReconnectAttempts,
    })
  }

  private async attemptReconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('Max reconnection attempts reached for Redis client')
      return
    }

    setTimeout(async () => {
      try {
        await this.connect()
      } catch (error) {
        logger.error('Failed to reconnect to Redis', { error })
        this.attemptReconnect()
      }
    }, this.reconnectDelay * Math.pow(2, this.reconnectAttempts))
  }
}

// Create and export Redis client instance
const redisConfig: RedisConfig = {
  url: env.REDIS_URL,
  ttl: env.REDIS_TTL,
  retryAttempts: 3,
  retryDelay: 1000,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  keepAlive: 30000,
  family: 4,
  connectTimeout: 10000,
  commandTimeout: 5000,
}

export const redisClient = new RedisClient(redisConfig)

// Initialize Redis connection
export async function initializeRedis(): Promise<void> {
  try {
    await redisClient.connect()
    logger.info('Redis initialized successfully')
  } catch (error) {
    logger.error('Failed to initialize Redis', { error })
    throw error
  }
}

// Graceful shutdown
export async function shutdownRedis(): Promise<void> {
  try {
    await redisClient.disconnect()
    logger.info('Redis shutdown completed')
  } catch (error) {
    logger.error('Error during Redis shutdown', { error })
  }
}