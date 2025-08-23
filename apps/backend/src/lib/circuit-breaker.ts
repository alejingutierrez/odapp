import { logger } from './logger'
import { CircuitBreakerConfig, CircuitBreakerStatus } from '../types/shopify'

export class CircuitBreaker {
  private state: 'closed' | 'open' | 'half-open' = 'closed'
  private failureCount = 0
  private lastFailureTime?: Date
  private nextAttemptTime?: Date

  // eslint-disable-next-line no-unused-vars
  constructor(private config: CircuitBreakerConfig) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (this.shouldAttemptReset()) {
        this.state = 'half-open'
        logger.info('Circuit breaker transitioning to half-open state')
      } else {
        throw new Error('Circuit breaker is open - operation not allowed')
      }
    }

    try {
      const result = await operation()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure(error as Error)
      throw error
    }
  }

  private onSuccess(): void {
    this.failureCount = 0
    this.lastFailureTime = undefined
    this.nextAttemptTime = undefined

    if (this.state === 'half-open') {
      this.state = 'closed'
      logger.info('Circuit breaker reset to closed state')
    }
  }

  private onFailure(error: Error): void {
    this.failureCount++
    this.lastFailureTime = new Date()

    logger.warn(
      `Circuit breaker failure ${this.failureCount}/${this.config.failureThreshold}:`,
      error.message
    )

    if (this.failureCount >= this.config.failureThreshold) {
      this.state = 'open'
      this.nextAttemptTime = new Date(Date.now() + this.config.recoveryTimeout)
      logger.error('Circuit breaker opened due to failure threshold reached')
    }
  }

  private shouldAttemptReset(): boolean {
    return this.nextAttemptTime ? new Date() >= this.nextAttemptTime : false
  }

  getStatus(): CircuitBreakerStatus {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
      nextAttemptTime: this.nextAttemptTime,
    }
  }

  reset(): void {
    this.state = 'closed'
    this.failureCount = 0
    this.lastFailureTime = undefined
    this.nextAttemptTime = undefined
    logger.info('Circuit breaker manually reset')
  }
}
