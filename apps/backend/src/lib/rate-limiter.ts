import { logger } from './logger';
import { RateLimitConfig, RateLimitStatus } from '../types/shopify';

export class RateLimiter {
  private tokens: number;
  private lastRefill: Date;
  private resetTime: Date;

  constructor(private config: RateLimitConfig) {
    this.tokens = config.maxRequests;
    this.lastRefill = new Date();
    this.resetTime = new Date(Date.now() + config.windowMs);
  }

  async waitForToken(): Promise<void> {
    this.refillTokens();

    if (this.tokens <= 0) {
      const waitTime = this.resetTime.getTime() - Date.now();
      if (waitTime > 0) {
        logger.info(`Rate limit reached, waiting ${waitTime}ms`);
        await this.sleep(waitTime);
        this.refillTokens();
      }
    }

    if (this.tokens > 0) {
      this.tokens--;
    }
  }

  updateFromHeaders(headers: Record<string, unknown>): void {
    // Shopify rate limit headers
    const callLimit = headers['x-shopify-shop-api-call-limit'];
    const _bucketSize = headers['x-shopify-api-request-bucket-size'];
    const leakRate = headers['x-shopify-api-request-bucket-leak-rate'];

    if (callLimit) {
      const [used, total] = (callLimit as string).split('/').map(Number);
      this.tokens = Math.max(0, total - used);
      
      if (this.tokens === 0) {
        // Calculate reset time based on leak rate
        const leakRatePerSecond = leakRate ? parseInt(leakRate as string) : 2;
        const waitSeconds = Math.ceil(used / leakRatePerSecond);
        this.resetTime = new Date(Date.now() + waitSeconds * 1000);
      }

      logger.debug(`Shopify rate limit: ${used}/${total}, tokens remaining: ${this.tokens}`);
    }
  }

  private refillTokens(): void {
    const now = new Date();
    
    if (now >= this.resetTime) {
      this.tokens = this.config.maxRequests;
      this.resetTime = new Date(now.getTime() + this.config.windowMs);
      this.lastRefill = now;
      logger.debug('Rate limiter tokens refilled');
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getStatus(): RateLimitStatus {
    this.refillTokens();
    
    return {
      remaining: this.tokens,
      resetTime: this.resetTime,
      isLimited: this.tokens <= 0,
    };
  }

  reset(): void {
    this.tokens = this.config.maxRequests;
    this.resetTime = new Date(Date.now() + this.config.windowMs);
    this.lastRefill = new Date();
    logger.info('Rate limiter manually reset');
  }
}