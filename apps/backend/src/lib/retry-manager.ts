import { logger } from './logger'
import { RetryConfig, RetryAttempt } from '../types/shopify'

export class RetryManager {
  constructor(private _config: RetryConfig) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error

    for (let attempt = 0; attempt <= this._config.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = this.calculateDelay(attempt)
          logger.info(
            `Retry attempt ${attempt}/${this._config.maxRetries} after ${delay}ms delay`
          )
          await this.sleep(delay)
        }

        const result = await operation()

        if (attempt > 0) {
          logger.info(`Operation succeeded on retry attempt ${attempt}`)
        }

        return result
      } catch (error) {
        lastError = error as Error

        if (!this.shouldRetry(error as Error, attempt)) {
          logger.error(`Operation failed permanently: ${lastError.message}`)
          throw lastError
        }

        logger.warn(
          `Operation failed on attempt ${attempt + 1}: ${lastError.message}`
        )
      }
    }

    logger.error(
      `Operation failed after ${this._config.maxRetries} retries: ${lastError!.message}`
    )
    throw lastError!
  }

  private calculateDelay(attempt: number): number {
    const exponentialDelay =
      this._config.baseDelay * Math.pow(this._config.backoffFactor, attempt - 1)
    const jitteredDelay = exponentialDelay * (0.5 + Math.random() * 0.5) // Add jitter
    return Math.min(jitteredDelay, this._config.maxDelay)
  }

  private shouldRetry(error: Error, attempt: number): boolean {
    if (attempt >= this._config.maxRetries) {
      return false
    }

    // Don't retry on certain error types
    if (this.isNonRetryableError(error)) {
      return false
    }

    return true
  }

  private isNonRetryableError(error: Error): boolean {
    const message = error.message.toLowerCase()

    // Don't retry on authentication errors
    if (message.includes('unauthorized') || message.includes('forbidden')) {
      return true
    }

    // Don't retry on validation errors
    if (message.includes('validation') || message.includes('invalid')) {
      return true
    }

    // Don't retry on 4xx errors (except rate limiting)
    if (
      message.includes('400') ||
      message.includes('404') ||
      message.includes('422')
    ) {
      return true
    }

    return false
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  createAttemptInfo(attempt: number, error?: Error): RetryAttempt {
    return {
      attempt,
      delay: this.calculateDelay(attempt),
      error,
    }
  }
}
