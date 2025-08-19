import { Pool, PoolConfig } from 'pg'
import { env } from '../config/env.js'

export interface DatabasePoolConfig {
  connectionString: string
  min: number
  max: number
  idleTimeoutMillis: number
  connectionTimeoutMillis: number
  statementTimeout: number
  queryTimeout: number
  allowExitOnIdle: boolean
}

export class DatabasePool {
  private pool: Pool
  private config: DatabasePoolConfig

  constructor(config?: Partial<DatabasePoolConfig>) {
    this.config = {
      connectionString: env.DATABASE_URL,
      min: env.DB_CONNECTION_POOL_MIN || 2,
      max: env.DB_CONNECTION_POOL_MAX || 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: env.DATABASE_CONNECTION_TIMEOUT || 20000,
      statementTimeout: env.DATABASE_QUERY_TIMEOUT || 60000,
      queryTimeout: env.DATABASE_QUERY_TIMEOUT || 60000,
      allowExitOnIdle: true,
      ...config,
    }

    const poolConfig: PoolConfig = {
      connectionString: this.config.connectionString,
      min: this.config.min,
      max: this.config.max,
      idleTimeoutMillis: this.config.idleTimeoutMillis,
      connectionTimeoutMillis: this.config.connectionTimeoutMillis,
      statement_timeout: this.config.statementTimeout,
      query_timeout: this.config.queryTimeout,
      allowExitOnIdle: this.config.allowExitOnIdle,
    }

    this.pool = new Pool(poolConfig)

    // Set up event listeners
    this.setupEventListeners()
  }

  private setupEventListeners(): void {
    this.pool.on('connect', (client) => {
      console.log('🔗 New database client connected')
      
      // Set up client-specific configuration
      client.query(`SET statement_timeout = ${this.config.statementTimeout}`)
      client.query(`SET lock_timeout = ${this.config.statementTimeout}`)
    })

    this.pool.on('acquire', () => {
      console.log('📥 Database client acquired from pool')
    })

    this.pool.on('release', () => {
      console.log('📤 Database client released back to pool')
    })

    this.pool.on('remove', () => {
      console.log('🗑️ Database client removed from pool')
    })

    this.pool.on('error', (err) => {
      console.error('❌ Database pool error:', err)
    })
  }

  async query(text: string, params?: unknown[]): Promise<unknown> {
    const start = Date.now()
    
    try {
      const result = await this.pool.query(text, params)
      const duration = Date.now() - start
      
      if (duration > (env.DB_SLOW_QUERY_THRESHOLD || 1000)) {
        console.warn(`🐌 Slow query detected: ${text.substring(0, 100)}... took ${duration}ms`)
      }
      
      return result
    } catch (error) {
      console.error('❌ Database query error:', error)
      throw error
    }
  }

  async getClient() {
    return this.pool.connect()
  }

  async transaction<T>(callback: (_client: unknown) => Promise<T>): Promise<T> {
    const client = await this.pool.connect()
    
    try {
      await client.query('BEGIN')
      const result = await callback(client)
      await client.query('COMMIT')
      return result
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  getPoolStats() {
    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
      config: {
        min: this.config.min,
        max: this.config.max,
        idleTimeoutMillis: this.config.idleTimeoutMillis,
        connectionTimeoutMillis: this.config.connectionTimeoutMillis,
      },
    }
  }

  async healthCheck(): Promise<{ healthy: boolean; stats: Record<string, unknown>; error?: string }> {
    try {
      const start = Date.now()
      await this.query('SELECT 1')
      const duration = Date.now() - start
      
      return {
        healthy: true,
        stats: {
          ...this.getPoolStats(),
          responseTime: duration,
        },
      }
    } catch (error) {
      return {
        healthy: false,
        stats: this.getPoolStats(),
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async close(): Promise<void> {
    try {
      await this.pool.end()
      console.log('✅ Database pool closed successfully')
    } catch (error) {
      console.error('❌ Error closing database pool:', error)
      throw error
    }
  }
}

// Singleton instance for the application
export const databasePool = new DatabasePool()

// Graceful shutdown handler
process.on('SIGINT', async () => {
  console.log('🛑 Received SIGINT, closing database pool...')
  await databasePool.close()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('🛑 Received SIGTERM, closing database pool...')
  await databasePool.close()
  process.exit(0)
})