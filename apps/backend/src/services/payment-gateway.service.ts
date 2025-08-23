import { logger } from '../lib/logger'
import { ServiceUnavailableError, NotFoundError, ApiError } from '../lib/errors'
import { PaymentMethod, PaymentStatus } from '@prisma/client'

export interface PaymentRequest {
  amount: number
  currency: string
  method: PaymentMethod
  customerInfo?: {
    email?: string
    name?: string
    phone?: string
  }
  billingAddress?: {
    line1: string
    line2?: string
    city: string
    state?: string
    postalCode?: string
    country: string
  }
  metadata?: Record<string, unknown>
}

export interface PaymentResponse {
  success: boolean
  transactionId?: string
  status: PaymentStatus
  message?: string
  metadata?: Record<string, unknown>
}

export interface RefundRequest {
  transactionId: string
  amount?: number // If not provided, full refund
  reason?: string
}

export interface RefundResponse {
  success: boolean
  refundId?: string
  amount: number
  message?: string
}

export interface PaymentGateway {
  name: string
  processPayment(_request: PaymentRequest): Promise<PaymentResponse>
  refundPayment(_request: RefundRequest): Promise<RefundResponse>
  verifyWebhook?(_payload: unknown, _signature: string): boolean
  handleWebhook?(_payload: unknown): Promise<void>
}

// Stripe Gateway Implementation
export class StripeGateway implements PaymentGateway {
  name = 'stripe'
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      logger.info('Processing Stripe payment', {
        amount: request.amount,
        currency: request.currency,
      })

      // Simulate Stripe API call
      // In real implementation, use Stripe SDK
      const success = Math.random() > 0.05 // 95% success rate

      if (success) {
        const transactionId = `pi_${Math.random().toString(36).substr(2, 24)}`

        return {
          success: true,
          transactionId,
          status: PaymentStatus.COMPLETED,
          message: 'Payment processed successfully',
          metadata: {
            gateway: 'stripe',
            processingTime: Date.now(),
          },
        }
      } else {
        return {
          success: false,
          status: PaymentStatus.FAILED,
          message: 'Payment declined by bank',
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Stripe payment processing failed', {
        error: errorMessage,
        request,
      })
      return {
        success: false,
        status: PaymentStatus.FAILED,
        message: errorMessage,
      }
    }
  }

  async refundPayment(request: RefundRequest): Promise<RefundResponse> {
    try {
      logger.info('Processing Stripe refund', {
        transactionId: request.transactionId,
        amount: request.amount,
      })

      // Simulate Stripe refund API call
      const success = Math.random() > 0.02 // 98% success rate

      if (success) {
        const refundId = `re_${Math.random().toString(36).substr(2, 24)}`

        return {
          success: true,
          refundId,
          amount: request.amount || 0,
          message: 'Refund processed successfully',
        }
      } else {
        return {
          success: false,
          amount: 0,
          message: 'Refund failed - transaction not found',
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Stripe refund processing failed', {
        error: errorMessage,
        request,
      })
      return {
        success: false,
        amount: 0,
        message: errorMessage,
      }
    }
  }

  verifyWebhook(_payload: unknown, _signature: string): boolean {
    // Implement Stripe webhook signature verification
    // This is a simplified version
    return _signature.startsWith('whsec_')
  }

  async handleWebhook(_payload: Record<string, unknown>): Promise<void> {
    logger.info('Handling Stripe webhook', { type: _payload.type })

    switch (_payload.type) {
      case 'payment_intent.succeeded':
        // Handle successful payment
        break
      case 'payment_intent.payment_failed':
        // Handle failed payment
        break
      case 'charge.dispute.created':
        // Handle chargeback
        break
      default:
        logger.info('Unhandled Stripe webhook type', { type: _payload.type })
    }
  }
}

// PayPal Gateway Implementation
export class PayPalGateway implements PaymentGateway {
  name = 'paypal'
  private clientId: string
  private clientSecret: string

  constructor(clientId: string, clientSecret: string) {
    this.clientId = clientId
    this.clientSecret = clientSecret
  }

  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      logger.info('Processing PayPal payment', {
        amount: request.amount,
        currency: request.currency,
      })

      // Simulate PayPal API call
      const success = Math.random() > 0.03 // 97% success rate

      if (success) {
        const transactionId = `PAY-${Math.random().toString(36).substr(2, 17).toUpperCase()}`

        return {
          success: true,
          transactionId,
          status: PaymentStatus.COMPLETED,
          message: 'Payment processed successfully',
          metadata: {
            gateway: 'paypal',
            processingTime: Date.now(),
          },
        }
      } else {
        return {
          success: false,
          status: PaymentStatus.FAILED,
          message: 'Payment declined',
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('PayPal payment processing failed', {
        error: errorMessage,
        request,
      })
      return {
        success: false,
        status: PaymentStatus.FAILED,
        message: errorMessage,
      }
    }
  }

  async refundPayment(request: RefundRequest): Promise<RefundResponse> {
    try {
      logger.info('Processing PayPal refund', {
        transactionId: request.transactionId,
        amount: request.amount,
      })

      // Simulate PayPal refund API call
      const success = Math.random() > 0.01 // 99% success rate

      if (success) {
        const refundId = `REF-${Math.random().toString(36).substr(2, 17).toUpperCase()}`

        return {
          success: true,
          refundId,
          amount: request.amount || 0,
          message: 'Refund processed successfully',
        }
      } else {
        return {
          success: false,
          amount: 0,
          message: 'Refund failed',
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('PayPal refund processing failed', {
        error: errorMessage,
        request,
      })
      return {
        success: false,
        amount: 0,
        message: errorMessage,
      }
    }
  }
}

// Square Gateway Implementation
export class SquareGateway implements PaymentGateway {
  name = 'square'
  private accessToken: string
  private applicationId: string

  constructor(accessToken: string, applicationId: string) {
    this.accessToken = accessToken
    this.applicationId = applicationId
  }

  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      logger.info('Processing Square payment', {
        amount: request.amount,
        currency: request.currency,
      })

      // Simulate Square API call
      const success = Math.random() > 0.04 // 96% success rate

      if (success) {
        const transactionId = Math.random().toString(36).substr(2, 22)

        return {
          success: true,
          transactionId,
          status: PaymentStatus.COMPLETED,
          message: 'Payment processed successfully',
          metadata: {
            gateway: 'square',
            processingTime: Date.now(),
          },
        }
      } else {
        return {
          success: false,
          status: PaymentStatus.FAILED,
          message: 'Payment declined',
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Square payment processing failed', {
        error: errorMessage,
        request,
      })
      return {
        success: false,
        status: PaymentStatus.FAILED,
        message: errorMessage,
      }
    }
  }

  async refundPayment(request: RefundRequest): Promise<RefundResponse> {
    try {
      logger.info('Processing Square refund', {
        transactionId: request.transactionId,
        amount: request.amount,
      })

      // Simulate Square refund API call
      const success = Math.random() > 0.02 // 98% success rate

      if (success) {
        const refundId = Math.random().toString(36).substr(2, 22)

        return {
          success: true,
          refundId,
          amount: request.amount || 0,
          message: 'Refund processed successfully',
        }
      } else {
        return {
          success: false,
          amount: 0,
          message: 'Refund failed',
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Square refund processing failed', {
        error: errorMessage,
        request,
      })
      return {
        success: false,
        amount: 0,
        message: errorMessage,
      }
    }
  }
}

// Payment Gateway Manager
export class PaymentGatewayService {
  private gateways: Map<string, PaymentGateway> = new Map()
  private defaultGateway: string = 'stripe'

  constructor() {
    this.initializeGateways()
  }

  private initializeGateways() {
    // Initialize gateways based on environment configuration
    const stripeKey = process.env.STRIPE_SECRET_KEY
    if (stripeKey) {
      this.gateways.set('stripe', new StripeGateway(stripeKey))
    }

    const paypalClientId = process.env.PAYPAL_CLIENT_ID
    const paypalClientSecret = process.env.PAYPAL_CLIENT_SECRET
    if (paypalClientId && paypalClientSecret) {
      this.gateways.set(
        'paypal',
        new PayPalGateway(paypalClientId, paypalClientSecret)
      )
    }

    const squareAccessToken = process.env.SQUARE_ACCESS_TOKEN
    const squareApplicationId = process.env.SQUARE_APPLICATION_ID
    if (squareAccessToken && squareApplicationId) {
      this.gateways.set(
        'square',
        new SquareGateway(squareAccessToken, squareApplicationId)
      )
    }

    // Set default gateway
    this.defaultGateway = process.env.DEFAULT_PAYMENT_GATEWAY || 'stripe'

    logger.info('Payment gateways initialized', {
      gateways: Array.from(this.gateways.keys()),
      default: this.defaultGateway,
    })
  }

  getGateway(name?: string): PaymentGateway {
    const gatewayName = name || this.defaultGateway
    const gateway = this.gateways.get(gatewayName)

    if (!gateway) {
      throw new ServiceUnavailableError(`Payment gateway '${gatewayName}' not configured`)
    }

    return gateway
  }

  async processPayment(
    request: PaymentRequest,
    gatewayName?: string
  ): Promise<PaymentResponse> {
    const gateway = this.getGateway(gatewayName)

    logger.info('Processing payment', {
      gateway: gateway.name,
      amount: request.amount,
      currency: request.currency,
      method: request.method,
    })

    const startTime = Date.now()
    const response = await gateway.processPayment(request)
    const processingTime = Date.now() - startTime

    logger.info('Payment processing completed', {
      gateway: gateway.name,
      success: response.success,
      status: response.status,
      processingTime,
      transactionId: response.transactionId,
    })

    return response
  }

  async refundPayment(
    request: RefundRequest,
    gatewayName?: string
  ): Promise<RefundResponse> {
    const gateway = this.getGateway(gatewayName)

    logger.info('Processing refund', {
      gateway: gateway.name,
      transactionId: request.transactionId,
      amount: request.amount,
    })

    const startTime = Date.now()
    const response = await gateway.refundPayment(request)
    const processingTime = Date.now() - startTime

    logger.info('Refund processing completed', {
      gateway: gateway.name,
      success: response.success,
      processingTime,
      refundId: response.refundId,
      amount: response.amount,
    })

    return response
  }

  async handleWebhook(
    gatewayName: string,
    payload: Record<string, unknown>,
    signature?: string
  ): Promise<void> {
    const gateway = this.gateways.get(gatewayName)

    if (!gateway) {
      throw new NotFoundError(`Payment gateway '${gatewayName}'`)
    }

    // Verify webhook signature if gateway supports it
    if (gateway.verifyWebhook && signature) {
      const isValid = gateway.verifyWebhook(payload, signature)
      if (!isValid) {
        throw new ApiError(401, 'Invalid webhook signature')
      }
    }

    // Handle webhook if gateway supports it
    if (gateway.handleWebhook) {
      await gateway.handleWebhook(payload)
    }

    logger.info('Webhook processed', { gateway: gatewayName })
  }

  getAvailableGateways(): string[] {
    return Array.from(this.gateways.keys())
  }

  getDefaultGateway(): string {
    return this.defaultGateway
  }

  setDefaultGateway(gatewayName: string): void {
    if (!this.gateways.has(gatewayName)) {
      throw new ServiceUnavailableError(`Payment gateway '${gatewayName}' not configured`)
    }

    this.defaultGateway = gatewayName
    logger.info('Default payment gateway changed', { gateway: gatewayName })
  }

  /**
   * Get payment method routing based on business rules
   */
  getRecommendedGateway(request: PaymentRequest): string {
    // Business logic for gateway selection
    // This could be based on:
    // - Payment method
    // - Amount
    // - Currency
    // - Customer location
    // - Gateway fees
    // - Success rates

    if (request.method === PaymentMethod.PAYPAL) {
      return 'paypal'
    }

    if (request.amount > 10000) {
      // Use most reliable gateway for high-value transactions
      return 'stripe'
    }

    if (request.currency !== 'USD') {
      // Use gateway with best international support
      return 'stripe'
    }

    // Default routing
    return this.defaultGateway
  }

  /**
   * Process payment with automatic failover
   */
  async processPaymentWithFailover(
    request: PaymentRequest
  ): Promise<PaymentResponse> {
    const primaryGateway = this.getRecommendedGateway(request)
    const availableGateways = this.getAvailableGateways()

    // Try primary gateway first
    try {
      const response = await this.processPayment(request, primaryGateway)
      if (response.success) {
        return response
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.warn('Primary gateway failed, trying failover', {
        primary: primaryGateway,
        error: errorMessage,
      })
    }

    // Try other gateways as failover
    for (const gatewayName of availableGateways) {
      if (gatewayName === primaryGateway) continue

      try {
        logger.info('Attempting failover payment', { gateway: gatewayName })
        const response = await this.processPayment(request, gatewayName)
        if (response.success) {
          logger.info('Failover payment successful', { gateway: gatewayName })
          return response
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        logger.warn('Failover gateway failed', {
          gateway: gatewayName,
          error: errorMessage,
        })
      }
    }

    // All gateways failed
    logger.error('All payment gateways failed', { request })
    return {
      success: false,
      status: PaymentStatus.FAILED,
      message: 'All payment gateways are currently unavailable',
    }
  }
}
