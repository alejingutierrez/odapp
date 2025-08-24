import { ApiError } from '../lib/errors'
import { logger } from '../lib/logger'

export interface ShippingAddress {
  name: string
  company?: string
  address1: string
  address2?: string
  city: string
  state?: string
  postalCode: string
  country: string
  phone?: string
  email?: string
}

export interface ShippingItem {
  name: string
  sku?: string
  quantity: number
  weight: number // in grams
  dimensions?: {
    length: number // in cm
    width: number
    height: number
  }
  value: number // in cents
}

export interface ShippingRateRequest {
  fromAddress: ShippingAddress
  toAddress: ShippingAddress
  items: ShippingItem[]
  serviceTypes?: string[]
}

export interface ShippingRate {
  carrier: string
  service: string
  serviceName: string
  rate: number // in cents
  currency: string
  estimatedDays: number
  deliveryDate?: Date
  metadata?: Record<string, unknown>
}

export interface ShipmentRequest {
  fromAddress: ShippingAddress
  toAddress: ShippingAddress
  items: ShippingItem[]
  service: string
  carrier: string
  insurance?: number
  signature?: boolean
  reference?: string
}

export interface ShipmentResponse {
  success: boolean
  shipmentId?: string
  trackingNumber?: string
  labelUrl?: string
  rate: number
  currency: string
  estimatedDelivery?: Date
  metadata?: Record<string, unknown>
  error?: string
}

export interface TrackingInfo {
  trackingNumber: string
  carrier: string
  status: TrackingStatus
  estimatedDelivery?: Date
  deliveredAt?: Date
  events: TrackingEvent[]
}

export interface TrackingEvent {
  timestamp: Date
  status: string
  description: string
  location?: string
}

// Tracking status for shipments
// These enum values are defined for future use in shipping tracking

export enum TrackingStatus {
  LABEL_CREATED = 'label_created',
  IN_TRANSIT = 'in_transit',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  EXCEPTION = 'exception',
  RETURNED = 'returned',
  CANCELLED = 'cancelled',
}

export interface ShippingCarrier {
  name: string
  getRates(_request: ShippingRateRequest): Promise<ShippingRate[]>
  createShipment(_request: ShipmentRequest): Promise<ShipmentResponse>
  trackShipment(_trackingNumber: string): Promise<TrackingInfo>
  cancelShipment?(_shipmentId: string): Promise<boolean>
  validateAddress?(_address: ShippingAddress): Promise<ShippingAddress>
}

// FedEx Carrier Implementation
export class FedExCarrier implements ShippingCarrier {
  name = 'fedex'
  private apiKey: string
  private accountNumber: string

  constructor(apiKey: string, accountNumber: string) {
    this.apiKey = apiKey
    this.accountNumber = accountNumber
  }

  async getRates(request: ShippingRateRequest): Promise<ShippingRate[]> {
    try {
      logger.info('Getting FedEx rates', {
        from: request.fromAddress.city,
        to: request.toAddress.city,
        itemCount: request.items.length,
      })

      // Simulate FedEx API call
      const rates: ShippingRate[] = [
        {
          carrier: 'fedex',
          service: 'FEDEX_GROUND',
          serviceName: 'FedEx Ground',
          rate: 1299, // $12.99
          currency: 'USD',
          estimatedDays: 3,
          deliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        },
        {
          carrier: 'fedex',
          service: 'FEDEX_2_DAY',
          serviceName: 'FedEx 2Day',
          rate: 2499, // $24.99
          currency: 'USD',
          estimatedDays: 2,
          deliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        },
        {
          carrier: 'fedex',
          service: 'STANDARD_OVERNIGHT',
          serviceName: 'FedEx Standard Overnight',
          rate: 4999, // $49.99
          currency: 'USD',
          estimatedDays: 1,
          deliveryDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        },
      ]

      // Filter by requested service types
      if (request.serviceTypes?.length) {
        return rates.filter((rate) =>
          request.serviceTypes?.includes(rate.service)
        )
      }

      return rates
    } catch (error) {
      logger.error('FedEx rate request failed', {
        error: (error as Error).message,
        request,
      })
      throw new ApiError(500, 'Failed to get FedEx rates')
    }
  }

  async createShipment(request: ShipmentRequest): Promise<ShipmentResponse> {
    try {
      logger.info('Creating FedEx shipment', {
        service: request.service,
        from: request.fromAddress.city,
        to: request.toAddress.city,
      })

      // Simulate FedEx shipment creation
      const success = Math.random() > 0.02 // 98% success rate

      if (success) {
        const trackingNumber = `1Z${Math.random().toString(36).substr(2, 16).toUpperCase()}`
        const shipmentId = `fedex_${Math.random().toString(36).substr(2, 12)}`

        return {
          success: true,
          shipmentId,
          trackingNumber,
          labelUrl: `https://api.fedex.com/labels/${shipmentId}.pdf`,
          rate: 1299,
          currency: 'USD',
          estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          metadata: {
            carrier: 'fedex',
            service: request.service,
          },
        }
      } else {
        return {
          success: false,
          rate: 0,
          currency: 'USD',
          error: 'Address validation failed',
        }
      }
    } catch (error) {
      logger.error('FedEx shipment creation failed', {
        error: error instanceof Error ? error.message : String(error),
        request,
      })
      return {
        success: false,
        rate: 0,
        currency: 'USD',
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  async trackShipment(trackingNumber: string): Promise<TrackingInfo> {
    try {
      logger.info('Tracking FedEx shipment', { trackingNumber })

      // Simulate FedEx tracking API
      const statuses = [
        TrackingStatus.LABEL_CREATED,
        TrackingStatus.IN_TRANSIT,
        TrackingStatus.OUT_FOR_DELIVERY,
        TrackingStatus.DELIVERED,
      ]

      const currentStatus =
        statuses[Math.floor(Math.random() * statuses.length)]

      const events: TrackingEvent[] = [
        {
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          status: 'label_created',
          description: 'Shipping label created',
          location: 'Memphis, TN',
        },
        {
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          status: 'in_transit',
          description: 'Package in transit',
          location: 'Atlanta, GA',
        },
      ]

      if (currentStatus === TrackingStatus.DELIVERED) {
        events.push({
          timestamp: new Date(),
          status: 'delivered',
          description: 'Package delivered',
          location: 'Customer address',
        })
      }

      return {
        trackingNumber,
        carrier: 'fedex',
        status: currentStatus,
        estimatedDelivery: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        deliveredAt:
          currentStatus === TrackingStatus.DELIVERED ? new Date() : undefined,
        events,
      }
    } catch (error) {
      logger.error('FedEx tracking failed', {
        error: error instanceof Error ? error.message : String(error),
        trackingNumber,
      })
      throw new ApiError(500, 'Failed to track FedEx shipment')
    }
  }

  async cancelShipment(shipmentId: string): Promise<boolean> {
    try {
      logger.info('Cancelling FedEx shipment', { shipmentId })

      // Simulate FedEx cancellation API
      return Math.random() > 0.1 // 90% success rate
    } catch (error) {
      logger.error('FedEx shipment cancellation failed', {
        error: error instanceof Error ? error.message : String(error),
        shipmentId,
      })
      return false
    }
  }
}

// UPS Carrier Implementation
export class UPSCarrier implements ShippingCarrier {
  name = 'ups'
  private apiKey: string
  private accountNumber: string

  constructor(apiKey: string, accountNumber: string) {
    this.apiKey = apiKey
    this.accountNumber = accountNumber
  }

  async getRates(request: ShippingRateRequest): Promise<ShippingRate[]> {
    try {
      logger.info('Getting UPS rates', {
        from: request.fromAddress.city,
        to: request.toAddress.city,
        itemCount: request.items.length,
      })

      const rates: ShippingRate[] = [
        {
          carrier: 'ups',
          service: 'UPS_GROUND',
          serviceName: 'UPS Ground',
          rate: 1199, // $11.99
          currency: 'USD',
          estimatedDays: 4,
          deliveryDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        },
        {
          carrier: 'ups',
          service: 'UPS_2ND_DAY_AIR',
          serviceName: 'UPS 2nd Day Air',
          rate: 2299, // $22.99
          currency: 'USD',
          estimatedDays: 2,
          deliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        },
        {
          carrier: 'ups',
          service: 'UPS_NEXT_DAY_AIR',
          serviceName: 'UPS Next Day Air',
          rate: 4599, // $45.99
          currency: 'USD',
          estimatedDays: 1,
          deliveryDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        },
      ]

      if (request.serviceTypes?.length) {
        return rates.filter((rate) =>
          request.serviceTypes?.includes(rate.service)
        )
      }

      return rates
    } catch (error) {
      logger.error('UPS rate request failed', {
        error: error instanceof Error ? error.message : String(error),
        request,
      })
      throw new ApiError(500, 'Failed to get UPS rates')
    }
  }

  async createShipment(request: ShipmentRequest): Promise<ShipmentResponse> {
    try {
      logger.info('Creating UPS shipment', {
        service: request.service,
        from: request.fromAddress.city,
        to: request.toAddress.city,
      })

      const success = Math.random() > 0.03 // 97% success rate

      if (success) {
        const trackingNumber = `1Z${Math.random().toString(36).substr(2, 16).toUpperCase()}`
        const shipmentId = `ups_${Math.random().toString(36).substr(2, 12)}`

        return {
          success: true,
          shipmentId,
          trackingNumber,
          labelUrl: `https://api.ups.com/labels/${shipmentId}.pdf`,
          rate: 1199,
          currency: 'USD',
          estimatedDelivery: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
          metadata: {
            carrier: 'ups',
            service: request.service,
          },
        }
      } else {
        return {
          success: false,
          rate: 0,
          currency: 'USD',
          error: 'Invalid shipping address',
        }
      }
    } catch (error) {
      logger.error('UPS shipment creation failed', {
        error: error instanceof Error ? error.message : String(error),
        request,
      })
      return {
        success: false,
        rate: 0,
        currency: 'USD',
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  async trackShipment(trackingNumber: string): Promise<TrackingInfo> {
    try {
      logger.info('Tracking UPS shipment', { trackingNumber })

      const statuses = [
        TrackingStatus.LABEL_CREATED,
        TrackingStatus.IN_TRANSIT,
        TrackingStatus.OUT_FOR_DELIVERY,
        TrackingStatus.DELIVERED,
      ]

      const currentStatus =
        statuses[Math.floor(Math.random() * statuses.length)]

      const events: TrackingEvent[] = [
        {
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          status: 'label_created',
          description: 'Order processed: Ready for UPS',
          location: 'Atlanta, GA',
        },
        {
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          status: 'in_transit',
          description: 'Departed from facility',
          location: 'Louisville, KY',
        },
      ]

      if (currentStatus === TrackingStatus.DELIVERED) {
        events.push({
          timestamp: new Date(),
          status: 'delivered',
          description: 'Delivered',
          location: 'Front door',
        })
      }

      return {
        trackingNumber,
        carrier: 'ups',
        status: currentStatus,
        estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        deliveredAt:
          currentStatus === TrackingStatus.DELIVERED ? new Date() : undefined,
        events,
      }
    } catch (error) {
      logger.error('UPS tracking failed', {
        error: error instanceof Error ? error.message : String(error),
        trackingNumber,
      })
      throw new ApiError(500, 'Failed to track UPS shipment')
    }
  }
}

// USPS Carrier Implementation
export class USPSCarrier implements ShippingCarrier {
  name = 'usps'
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async getRates(request: ShippingRateRequest): Promise<ShippingRate[]> {
    try {
      logger.info('Getting USPS rates', {
        from: request.fromAddress.city,
        to: request.toAddress.city,
        itemCount: request.items.length,
      })

      const rates: ShippingRate[] = [
        {
          carrier: 'usps',
          service: 'USPS_GROUND_ADVANTAGE',
          serviceName: 'USPS Ground Advantage',
          rate: 899, // $8.99
          currency: 'USD',
          estimatedDays: 5,
          deliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        },
        {
          carrier: 'usps',
          service: 'USPS_PRIORITY_MAIL',
          serviceName: 'USPS Priority Mail',
          rate: 1599, // $15.99
          currency: 'USD',
          estimatedDays: 3,
          deliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        },
        {
          carrier: 'usps',
          service: 'USPS_PRIORITY_MAIL_EXPRESS',
          serviceName: 'USPS Priority Mail Express',
          rate: 2999, // $29.99
          currency: 'USD',
          estimatedDays: 1,
          deliveryDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        },
      ]

      if (request.serviceTypes?.length) {
        return rates.filter((rate) =>
          request.serviceTypes?.includes(rate.service)
        )
      }

      return rates
    } catch (error) {
      logger.error('USPS rate request failed', {
        error: error instanceof Error ? error.message : String(error),
        request,
      })
      throw new ApiError(500, 'Failed to get USPS rates')
    }
  }

  async createShipment(request: ShipmentRequest): Promise<ShipmentResponse> {
    try {
      logger.info('Creating USPS shipment', {
        service: request.service,
        from: request.fromAddress.city,
        to: request.toAddress.city,
      })

      const success = Math.random() > 0.01 // 99% success rate

      if (success) {
        const trackingNumber = `9400${Math.random().toString().substr(2, 16)}`
        const shipmentId = `usps_${Math.random().toString(36).substr(2, 12)}`

        return {
          success: true,
          shipmentId,
          trackingNumber,
          labelUrl: `https://api.usps.com/labels/${shipmentId}.pdf`,
          rate: 899,
          currency: 'USD',
          estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          metadata: {
            carrier: 'usps',
            service: request.service,
          },
        }
      } else {
        return {
          success: false,
          rate: 0,
          currency: 'USD',
          error: 'Service temporarily unavailable',
        }
      }
    } catch (error) {
      logger.error('USPS shipment creation failed', {
        error: error instanceof Error ? error.message : String(error),
        request,
      })
      return {
        success: false,
        rate: 0,
        currency: 'USD',
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  async trackShipment(trackingNumber: string): Promise<TrackingInfo> {
    try {
      logger.info('Tracking USPS shipment', { trackingNumber })

      const statuses = [
        TrackingStatus.LABEL_CREATED,
        TrackingStatus.IN_TRANSIT,
        TrackingStatus.OUT_FOR_DELIVERY,
        TrackingStatus.DELIVERED,
      ]

      const currentStatus =
        statuses[Math.floor(Math.random() * statuses.length)]

      const events: TrackingEvent[] = [
        {
          timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
          status: 'label_created',
          description: 'Shipping label created',
          location: 'Origin facility',
        },
        {
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          status: 'in_transit',
          description: 'In transit to next facility',
          location: 'Regional facility',
        },
      ]

      if (currentStatus === TrackingStatus.DELIVERED) {
        events.push({
          timestamp: new Date(),
          status: 'delivered',
          description: 'Delivered to mailbox',
          location: 'Customer address',
        })
      }

      return {
        trackingNumber,
        carrier: 'usps',
        status: currentStatus,
        estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        deliveredAt:
          currentStatus === TrackingStatus.DELIVERED ? new Date() : undefined,
        events,
      }
    } catch (error) {
      logger.error('USPS tracking failed', {
        error: error instanceof Error ? error.message : String(error),
        trackingNumber,
      })
      throw new ApiError(500, 'Failed to track USPS shipment')
    }
  }
}

// Shipping Service Manager
export class ShippingService {
  private carriers: Map<string, ShippingCarrier> = new Map()
  private defaultCarrier: string = 'fedex'

  constructor() {
    this.initializeCarriers()
  }

  private initializeCarriers() {
    // Initialize carriers based on environment configuration
    const fedexApiKey = process.env.FEDEX_API_KEY
    const fedexAccount = process.env.FEDEX_ACCOUNT_NUMBER
    if (fedexApiKey && fedexAccount) {
      this.carriers.set('fedex', new FedExCarrier(fedexApiKey, fedexAccount))
    }

    const upsApiKey = process.env.UPS_API_KEY
    const upsAccount = process.env.UPS_ACCOUNT_NUMBER
    if (upsApiKey && upsAccount) {
      this.carriers.set('ups', new UPSCarrier(upsApiKey, upsAccount))
    }

    const uspsApiKey = process.env.USPS_API_KEY
    if (uspsApiKey) {
      this.carriers.set('usps', new USPSCarrier(uspsApiKey))
    }

    this.defaultCarrier = process.env.DEFAULT_SHIPPING_CARRIER || 'fedex'

    logger.info('Shipping carriers initialized', {
      carriers: Array.from(this.carriers.keys()),
      default: this.defaultCarrier,
    })
  }

  getCarrier(name?: string): ShippingCarrier {
    const carrierName = name || this.defaultCarrier
    const carrier = this.carriers.get(carrierName)

    if (!carrier) {
      throw new ApiError(
        500,
        `Shipping carrier '${carrierName}' not configured`
      )
    }

    return carrier
  }

  async getRates(
    request: ShippingRateRequest,
    carriers?: string[]
  ): Promise<ShippingRate[]> {
    const carriersToQuery = carriers || Array.from(this.carriers.keys())
    const allRates: ShippingRate[] = []

    await Promise.allSettled(
      carriersToQuery.map(async (carrierName) => {
        try {
          const carrier = this.getCarrier(carrierName)
          const rates = await carrier.getRates(request)
          allRates.push(...rates)
        } catch (error) {
          logger.warn('Failed to get rates from carrier', {
            carrier: carrierName,
            error: error instanceof Error ? error.message : String(error),
          })
        }
      })
    )

    // Sort by rate (cheapest first)
    return allRates.sort((a, b) => a.rate - b.rate)
  }

  async createShipment(request: ShipmentRequest): Promise<ShipmentResponse> {
    const carrier = this.getCarrier(request.carrier)

    logger.info('Creating shipment', {
      carrier: request.carrier,
      service: request.service,
      from: request.fromAddress.city,
      to: request.toAddress.city,
    })

    return await carrier.createShipment(request)
  }

  async trackShipment(
    trackingNumber: string,
    carrier?: string
  ): Promise<TrackingInfo> {
    // If carrier not specified, try to detect from tracking number format
    if (!carrier) {
      carrier = this.detectCarrierFromTrackingNumber(trackingNumber)
    }

    const shippingCarrier = this.getCarrier(carrier)
    return await shippingCarrier.trackShipment(trackingNumber)
  }

  async cancelShipment(shipmentId: string, carrier: string): Promise<boolean> {
    const shippingCarrier = this.getCarrier(carrier)

    if (shippingCarrier.cancelShipment) {
      return await shippingCarrier.cancelShipment(shipmentId)
    }

    throw new ApiError(
      400,
      `Carrier '${carrier}' does not support shipment cancellation`
    )
  }

  async validateAddress(
    address: ShippingAddress,
    carrier?: string
  ): Promise<ShippingAddress> {
    const shippingCarrier = this.getCarrier(carrier)

    if (shippingCarrier.validateAddress) {
      return await shippingCarrier.validateAddress(address)
    }

    // Return original address if validation not supported
    return address
  }

  private detectCarrierFromTrackingNumber(trackingNumber: string): string {
    // Simple carrier detection based on tracking number patterns
    if (trackingNumber.startsWith('1Z')) {
      return 'ups'
    } else if (trackingNumber.match(/^94\d{20}$/)) {
      return 'usps'
    } else if (
      trackingNumber.match(/^\d{12}$/) ||
      trackingNumber.match(/^\d{14}$/)
    ) {
      return 'fedex'
    }

    // Default to configured default carrier
    return this.defaultCarrier
  }

  getAvailableCarriers(): string[] {
    return Array.from(this.carriers.keys())
  }

  /**
   * Get cheapest shipping rate
   */
  async getCheapestRate(
    request: ShippingRateRequest
  ): Promise<ShippingRate | null> {
    const rates = await this.getRates(request)
    return rates.length > 0 ? rates[0] : null
  }

  /**
   * Get fastest shipping rate
   */
  async getFastestRate(
    request: ShippingRateRequest
  ): Promise<ShippingRate | null> {
    const rates = await this.getRates(request)
    return rates.length > 0
      ? rates.sort((a, b) => a.estimatedDays - b.estimatedDays)[0]
      : null
  }

  /**
   * Calculate dimensional weight
   */
  calculateDimensionalWeight(dimensions: {
    length: number
    width: number
    height: number
  }): number {
    // Standard dimensional weight calculation (L x W x H / 139 for inches, / 5000 for cm)
    return Math.ceil(
      (dimensions.length * dimensions.width * dimensions.height) / 5000
    )
  }

  /**
   * Get total package weight including dimensional weight
   */
  getTotalWeight(items: ShippingItem[]): number {
    let totalWeight = 0
    let totalDimensionalWeight = 0

    for (const item of items) {
      totalWeight += item.weight * item.quantity

      if (item.dimensions) {
        const dimWeight = this.calculateDimensionalWeight(item.dimensions)
        totalDimensionalWeight += dimWeight * item.quantity
      }
    }

    // Use the greater of actual weight or dimensional weight
    return Math.max(totalWeight, totalDimensionalWeight)
  }
}
