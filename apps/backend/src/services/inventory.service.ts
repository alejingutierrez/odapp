import { PrismaClient, AdjustmentType, TransferStatus } from '@prisma/client'
import { EventEmitter } from 'events'
import { logger } from '../lib/logger'
import { 
  NotFoundError, 
  BusinessLogicError, 
  ConflictError 
} from '../lib/errors'

export interface InventoryUpdateData {
  inventoryItemId: string
  productId?: string
  variantId?: string
  locationId: string
  oldQuantity: number
  newQuantity: number
  availableQuantity: number
  reason?: string
  userId?: string
}

export interface LowStockAlert {
  inventoryItemId: string
  productId?: string
  variantId?: string
  locationId: string
  currentQuantity: number
  threshold: number
  productName?: string
  variantName?: string
  locationName?: string
}

export interface ReservationRequest {
  inventoryItemId: string
  quantity: number
  reason: string
  referenceId?: string
  expiresAt?: Date
}

export interface AdjustmentRequest {
  inventoryItemId: string
  type: AdjustmentType
  quantityChange: number
  reason?: string
  notes?: string
  unitCost?: number
  referenceType?: string
  referenceId?: string
  userId?: string
}

export interface TransferRequest {
  fromLocationId: string
  toLocationId: string
  items: {
    productId?: string
    variantId?: string
    quantity: number
  }[]
  notes?: string
  userId?: string
}

export interface InventoryReportFilters {
  locationIds?: string[]
  productIds?: string[]
  lowStockOnly?: boolean
  dateFrom?: Date
  dateTo?: Date
}

export class InventoryService extends EventEmitter {
  constructor(private _prisma: PrismaClient) {
    super()
  }

  // ============================================================================
  // INVENTORY TRACKING
  // ============================================================================

  async getInventoryByLocation(
    locationId: string,
    filters?: {
      productIds?: string[]
      lowStockOnly?: boolean
      includeZeroStock?: boolean
    }
  ) {
    const where: Record<string, unknown> = {
      locationId,
      ...(filters?.productIds && {
        OR: [
          { productId: { in: filters.productIds } },
          { variantId: { in: filters.productIds } },
        ],
      }),
      ...(filters?.lowStockOnly && {
        quantity: { lte: this._prisma.inventoryItem.fields.lowStockThreshold },
      }),
      ...(filters?.includeZeroStock === false && {
        quantity: { gt: 0 },
      }),
    }

    return this._prisma.inventoryItem.findMany({
      where,
      include: {
        product: {
          include: {
            images: { take: 1, orderBy: { sortOrder: 'asc' } },
          },
        },
        variant: true,
        location: true,
      },
      orderBy: [{ product: { name: 'asc' } }, { variant: { name: 'asc' } }],
    })
  }

  async getInventoryByProduct(productId: string, variantId?: string) {
    const where: Record<string, unknown> = {
      productId,
      ...(variantId && { variantId }),
    }

    return this._prisma.inventoryItem.findMany({
      where,
      include: {
        location: true,
        product: true,
        variant: true,
      },
      orderBy: { location: { name: 'asc' } },
    })
  }

  async getTotalInventory(productId: string, variantId?: string) {
    const items = await this.getInventoryByProduct(productId, variantId)

    return items.reduce(
      (totals, item) => ({
        totalQuantity: totals.totalQuantity + item.quantity,
        totalReserved: totals.totalReserved + item.reservedQuantity,
        totalAvailable: totals.totalAvailable + item.availableQuantity,
      }),
      {
        totalQuantity: 0,
        totalReserved: 0,
        totalAvailable: 0,
      }
    )
  }

  // ============================================================================
  // STOCK LEVEL UPDATES
  // ============================================================================

  async updateStockLevel(
    inventoryItemId: string,
    newQuantity: number,
    reason?: string,
    userId?: string
  ) {
    return this._prisma.$transaction(async (tx) => {
      // Get current inventory item
      const currentItem = await tx.inventoryItem.findUnique({
        where: { id: inventoryItemId },
        include: { product: true, variant: true, location: true },
      })

      if (!currentItem) {
        throw new NotFoundError('Inventory item')
      }

      const oldQuantity = currentItem.quantity
      const quantityChange = newQuantity - oldQuantity
      const newAvailableQuantity = Math.max(
        0,
        newQuantity - currentItem.reservedQuantity
      )

      // Update inventory item
      const updatedItem = await tx.inventoryItem.update({
        where: { id: inventoryItemId },
        data: {
          quantity: newQuantity,
          availableQuantity: newAvailableQuantity,
          updatedAt: new Date(),
        },
        include: {
          product: true,
          variant: true,
          location: true,
        },
      })

      // Create adjustment record
      await tx.inventoryAdjustment.create({
        data: {
          inventoryItemId,
          type:
            quantityChange > 0
              ? AdjustmentType.INCREASE
              : AdjustmentType.DECREASE,
          quantityChange: Math.abs(quantityChange),
          reason: reason || 'Stock level update',
          referenceType: 'manual',
          createdBy: userId,
        },
      })

      // Emit real-time update event
      const updateData: InventoryUpdateData = {
        inventoryItemId,
        productId: currentItem.productId || undefined,
        variantId: currentItem.variantId || undefined,
        locationId: currentItem.locationId,
        oldQuantity,
        newQuantity,
        availableQuantity: newAvailableQuantity,
        reason,
        userId,
      }

      this.emit('inventory:updated', updateData)

      // Check for low stock alert
      if (
        newQuantity <= currentItem.lowStockThreshold &&
        oldQuantity > currentItem.lowStockThreshold
      ) {
        const alertData: LowStockAlert = {
          inventoryItemId,
          productId: currentItem.productId || undefined,
          variantId: currentItem.variantId || undefined,
          locationId: currentItem.locationId,
          currentQuantity: newQuantity,
          threshold: currentItem.lowStockThreshold,
          productName: currentItem.product?.name,
          variantName: currentItem.variant?.name || undefined,
          locationName: currentItem.location.name,
        }

        this.emit('inventory:lowStock', alertData)
      }

      logger.info('Inventory updated', {
        inventoryItemId,
        oldQuantity,
        newQuantity,
        quantityChange,
        reason,
        userId,
      })

      return updatedItem
    })
  }

  async bulkUpdateStockLevels(
    updates: {
      inventoryItemId: string
      quantity: number
      reason?: string
    }[],
    userId?: string
  ) {
    const results = []

    for (const update of updates) {
      try {
        const result = await this.updateStockLevel(
          update.inventoryItemId,
          update.quantity,
          update.reason,
          userId
        )
        results.push({
          success: true,
          inventoryItemId: update.inventoryItemId,
          result,
        })
      } catch (error: unknown) {
        logger.error('Failed to update inventory item', {
          inventoryItemId: update.inventoryItemId,
          error: error instanceof Error ? error.message : String(error),
        })
        results.push({
          success: false,
          inventoryItemId: update.inventoryItemId,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    return results
  }

  // ============================================================================
  // RESERVATIONS & ALLOCATIONS
  // ============================================================================

  async createReservation(request: ReservationRequest) {
    return this._prisma.$transaction(async (tx) => {
      // Get current inventory item
      const inventoryItem = await tx.inventoryItem.findUnique({
        where: { id: request.inventoryItemId },
      })

      if (!inventoryItem) {
        throw new NotFoundError('Inventory item')
      }

      // Check if enough quantity is available
      if (inventoryItem.availableQuantity < request.quantity) {
        throw new BusinessLogicError(
          `Insufficient inventory. Available: ${inventoryItem.availableQuantity}, Requested: ${request.quantity}`
        )
      }

      // Create reservation
      const reservation = await tx.inventoryReservation.create({
        data: {
          inventoryItemId: request.inventoryItemId,
          quantity: request.quantity,
          reason: request.reason,
          referenceId: request.referenceId,
          expiresAt: request.expiresAt,
        },
      })

      // Update inventory item reserved quantity
      const newReservedQuantity =
        inventoryItem.reservedQuantity + request.quantity
      const newAvailableQuantity = inventoryItem.quantity - newReservedQuantity

      await tx.inventoryItem.update({
        where: { id: request.inventoryItemId },
        data: {
          reservedQuantity: newReservedQuantity,
          availableQuantity: newAvailableQuantity,
        },
      })

      // Emit reservation event
      this.emit('inventory:reserved', {
        inventoryItemId: request.inventoryItemId,
        reservationId: reservation.id,
        quantity: request.quantity,
        reason: request.reason,
        referenceId: request.referenceId,
      })

      logger.info('Inventory reserved', {
        inventoryItemId: request.inventoryItemId,
        reservationId: reservation.id,
        quantity: request.quantity,
        reason: request.reason,
      })

      return reservation
    })
  }

  async releaseReservation(reservationId: string) {
    return this._prisma.$transaction(async (tx) => {
      // Get reservation
      const reservation = await tx.inventoryReservation.findUnique({
        where: { id: reservationId },
      })

      if (!reservation) {
        throw new NotFoundError('Reservation')
      }

      // Get inventory item
      const inventoryItem = await tx.inventoryItem.findUnique({
        where: { id: reservation.inventoryItemId },
      })

      if (!inventoryItem) {
        throw new NotFoundError('Inventory item')
      }

      // Delete reservation
      await tx.inventoryReservation.delete({
        where: { id: reservationId },
      })

      // Update inventory item reserved quantity
      const newReservedQuantity = Math.max(
        0,
        inventoryItem.reservedQuantity - reservation.quantity
      )
      const newAvailableQuantity = inventoryItem.quantity - newReservedQuantity

      await tx.inventoryItem.update({
        where: { id: reservation.inventoryItemId },
        data: {
          reservedQuantity: newReservedQuantity,
          availableQuantity: newAvailableQuantity,
        },
      })

      // Emit release event
      this.emit('inventory:reservationReleased', {
        inventoryItemId: reservation.inventoryItemId,
        reservationId,
        quantity: reservation.quantity,
        reason: reservation.reason,
      })

      logger.info('Inventory reservation released', {
        inventoryItemId: reservation.inventoryItemId,
        reservationId,
        quantity: reservation.quantity,
      })

      return true
    })
  }

  async fulfillReservation(reservationId: string, quantityFulfilled: number) {
    return this._prisma.$transaction(async (tx) => {
      // Get reservation
      const reservation = await tx.inventoryReservation.findUnique({
        where: { id: reservationId },
      })

      if (!reservation) {
        throw new NotFoundError('Reservation')
      }

      if (quantityFulfilled > reservation.quantity) {
        throw new BusinessLogicError('Cannot fulfill more than reserved quantity')
      }

      // Get inventory item
      const inventoryItem = await tx.inventoryItem.findUnique({
        where: { id: reservation.inventoryItemId },
      })

      if (!inventoryItem) {
        throw new NotFoundError('Inventory item')
      }

      // Update inventory quantities
      const newQuantity = inventoryItem.quantity - quantityFulfilled
      const newReservedQuantity =
        inventoryItem.reservedQuantity - quantityFulfilled
      const newAvailableQuantity = newQuantity - newReservedQuantity

      await tx.inventoryItem.update({
        where: { id: reservation.inventoryItemId },
        data: {
          quantity: newQuantity,
          reservedQuantity: newReservedQuantity,
          availableQuantity: newAvailableQuantity,
        },
      })

      // Create adjustment record
      await tx.inventoryAdjustment.create({
        data: {
          inventoryItemId: reservation.inventoryItemId,
          type: AdjustmentType.DECREASE,
          quantityChange: quantityFulfilled,
          reason: `Fulfilled reservation: ${reservation.reason}`,
          referenceType: 'reservation',
          referenceId: reservationId,
        },
      })

      // Update or delete reservation
      if (quantityFulfilled === reservation.quantity) {
        // Fully fulfilled - delete reservation
        await tx.inventoryReservation.delete({
          where: { id: reservationId },
        })
      } else {
        // Partially fulfilled - update reservation
        await tx.inventoryReservation.update({
          where: { id: reservationId },
          data: {
            quantity: reservation.quantity - quantityFulfilled,
          },
        })
      }

      // Emit fulfillment event
      this.emit('inventory:reservationFulfilled', {
        inventoryItemId: reservation.inventoryItemId,
        reservationId,
        quantityFulfilled,
        remainingQuantity: reservation.quantity - quantityFulfilled,
      })

      logger.info('Inventory reservation fulfilled', {
        inventoryItemId: reservation.inventoryItemId,
        reservationId,
        quantityFulfilled,
        remainingQuantity: reservation.quantity - quantityFulfilled,
      })

      return true
    })
  }

  // ============================================================================
  // INVENTORY ADJUSTMENTS
  // ============================================================================

  async createAdjustment(request: AdjustmentRequest) {
    return this._prisma.$transaction(async (tx) => {
      // Get current inventory item
      const inventoryItem = await tx.inventoryItem.findUnique({
        where: { id: request.inventoryItemId },
      })

      if (!inventoryItem) {
        throw new NotFoundError('Inventory item')
      }

      let newQuantity: number
      let actualQuantityChange: number

      switch (request.type) {
        case AdjustmentType.INCREASE:
          newQuantity = inventoryItem.quantity + request.quantityChange
          actualQuantityChange = request.quantityChange
          break
        case AdjustmentType.DECREASE:
          newQuantity = Math.max(
            0,
            inventoryItem.quantity - request.quantityChange
          )
          actualQuantityChange = inventoryItem.quantity - newQuantity
          break
        case AdjustmentType.SET:
          newQuantity = request.quantityChange
          actualQuantityChange = newQuantity - inventoryItem.quantity
          break
        default:
          throw new BusinessLogicError('Invalid adjustment type')
      }

      // Update inventory item
      const newAvailableQuantity = Math.max(
        0,
        newQuantity - inventoryItem.reservedQuantity
      )

      await tx.inventoryItem.update({
        where: { id: request.inventoryItemId },
        data: {
          quantity: newQuantity,
          availableQuantity: newAvailableQuantity,
          ...(request.unitCost && {
            lastCost: request.unitCost,
            // Update average cost using weighted average
            averageCost: inventoryItem.averageCost
              ? (inventoryItem.averageCost.toNumber() * inventoryItem.quantity +
                  request.unitCost * actualQuantityChange) /
                newQuantity
              : request.unitCost,
          }),
        },
      })

      // Create adjustment record
      const adjustment = await tx.inventoryAdjustment.create({
        data: {
          inventoryItemId: request.inventoryItemId,
          type: request.type,
          quantityChange: Math.abs(actualQuantityChange),
          reason: request.reason,
          notes: request.notes,
          unitCost: request.unitCost,
          totalCostImpact: request.unitCost
            ? request.unitCost * actualQuantityChange
            : null,
          referenceType: request.referenceType,
          referenceId: request.referenceId,
          createdBy: request.userId,
        },
      })

      // Emit adjustment event
      this.emit('inventory:adjusted', {
        inventoryItemId: request.inventoryItemId,
        adjustmentId: adjustment.id,
        type: request.type,
        oldQuantity: inventoryItem.quantity,
        newQuantity,
        quantityChange: actualQuantityChange,
        reason: request.reason,
        userId: request.userId,
      })

      logger.info('Inventory adjusted', {
        inventoryItemId: request.inventoryItemId,
        adjustmentId: adjustment.id,
        type: request.type,
        oldQuantity: inventoryItem.quantity,
        newQuantity,
        quantityChange: actualQuantityChange,
      })

      return adjustment
    })
  }

  // ============================================================================
  // INVENTORY TRANSFERS
  // ============================================================================

  async createTransfer(request: TransferRequest) {
    return this._prisma.$transaction(async (tx) => {
      // Validate locations exist
      const [fromLocation, toLocation] = await Promise.all([
        tx.location.findUnique({ where: { id: request.fromLocationId } }),
        tx.location.findUnique({ where: { id: request.toLocationId } }),
      ])

      if (!fromLocation || !toLocation) {
        throw new NotFoundError('Location')
      }

      if (request.fromLocationId === request.toLocationId) {
        throw new ConflictError('Cannot transfer to the same location')
      }

      // Create transfer
      const transfer = await tx.inventoryTransfer.create({
        data: {
          fromLocationId: request.fromLocationId,
          toLocationId: request.toLocationId,
          status: TransferStatus.PENDING,
          notes: request.notes,
          createdBy: request.userId,
        },
      })

      // Create transfer items and validate inventory
      for (const item of request.items) {
        // Find inventory item at source location
        const inventoryItem = await tx.inventoryItem.findFirst({
          where: {
            locationId: request.fromLocationId,
            ...(item.productId && { productId: item.productId }),
            ...(item.variantId && { variantId: item.variantId }),
          },
        })

        if (!inventoryItem) {
          throw new NotFoundError(
            `Inventory item at source location for ${item.productId || item.variantId}`
          )
        }

        if (inventoryItem.availableQuantity < item.quantity) {
          throw new BusinessLogicError(
            `Insufficient inventory for transfer. Available: ${inventoryItem.availableQuantity}, Requested: ${item.quantity}`
          )
        }

        // Create transfer item
        await tx.inventoryTransferItem.create({
          data: {
            transferId: transfer.id,
            productId: item.productId,
            variantId: item.variantId,
            quantityRequested: item.quantity,
          },
        })

        // Reserve inventory at source location
        await this.createReservation({
          inventoryItemId: inventoryItem.id,
          quantity: item.quantity,
          reason: `Transfer to ${toLocation.name}`,
          referenceId: transfer.id,
        })
      }

      // Emit transfer created event
      this.emit('inventory:transferCreated', {
        transferId: transfer.id,
        fromLocationId: request.fromLocationId,
        toLocationId: request.toLocationId,
        items: request.items,
        userId: request.userId,
      })

      logger.info('Inventory transfer created', {
        transferId: transfer.id,
        fromLocationId: request.fromLocationId,
        toLocationId: request.toLocationId,
        itemCount: request.items.length,
      })

      return transfer
    })
  }

  async shipTransfer(
    transferId: string,
    trackingNumber?: string,
    userId?: string
  ) {
    return this._prisma.$transaction(async (tx) => {
      const transfer = await tx.inventoryTransfer.findUnique({
        where: { id: transferId },
        include: { items: true },
      })

      if (!transfer) {
        throw new NotFoundError('Transfer')
      }

      if (transfer.status !== TransferStatus.PENDING) {
        throw new BusinessLogicError('Transfer is not in pending status')
      }

      // Update transfer status
      await tx.inventoryTransfer.update({
        where: { id: transferId },
        data: {
          status: TransferStatus.SHIPPED,
          trackingNumber,
          shippedAt: new Date(),
        },
      })

      // Update transfer items with shipped quantities
      for (const item of transfer.items) {
        await tx.inventoryTransferItem.update({
          where: { id: item.id },
          data: {
            quantityShipped: item.quantityRequested,
          },
        })
      }

      // Emit shipped event
      this.emit('inventory:transferShipped', {
        transferId,
        trackingNumber,
        shippedAt: new Date(),
        userId,
      })

      logger.info('Inventory transfer shipped', {
        transferId,
        trackingNumber,
        itemCount: transfer.items.length,
      })

      return true
    })
  }

  async receiveTransfer(
    transferId: string,
    receivedItems: {
      transferItemId: string
      quantityReceived: number
    }[],
    userId?: string
  ) {
    return this._prisma.$transaction(async (tx) => {
      const transfer = await tx.inventoryTransfer.findUnique({
        where: { id: transferId },
        include: { items: true },
      })

      if (!transfer) {
        throw new NotFoundError('Transfer')
      }

      if (transfer.status !== TransferStatus.SHIPPED) {
        throw new BusinessLogicError('Transfer is not in shipped status')
      }

      // Process received items
      for (const receivedItem of receivedItems) {
        const transferItem = transfer.items.find(
          (item) => item.id === receivedItem.transferItemId
        )

        if (!transferItem) {
          throw new NotFoundError(
            `Transfer item ${receivedItem.transferItemId}`
          )
        }

        if (receivedItem.quantityReceived > transferItem.quantityShipped) {
          throw new BusinessLogicError('Cannot receive more than shipped quantity')
        }

        // Update transfer item
        await tx.inventoryTransferItem.update({
          where: { id: receivedItem.transferItemId },
          data: {
            quantityReceived: receivedItem.quantityReceived,
          },
        })

        // Find or create inventory item at destination location
        let destinationInventory = await tx.inventoryItem.findFirst({
          where: {
            locationId: transfer.toLocationId,
            ...(transferItem.productId && {
              productId: transferItem.productId,
            }),
            ...(transferItem.variantId && {
              variantId: transferItem.variantId,
            }),
          },
        })

        if (!destinationInventory) {
          // Create new inventory item at destination
          destinationInventory = await tx.inventoryItem.create({
            data: {
              locationId: transfer.toLocationId,
              productId: transferItem.productId,
              variantId: transferItem.variantId,
              quantity: receivedItem.quantityReceived,
              availableQuantity: receivedItem.quantityReceived,
            },
          })
        } else {
          // Update existing inventory item
          await tx.inventoryItem.update({
            where: { id: destinationInventory.id },
            data: {
              quantity:
                destinationInventory.quantity + receivedItem.quantityReceived,
              availableQuantity:
                destinationInventory.availableQuantity +
                receivedItem.quantityReceived,
            },
          })
        }

        // Find and fulfill reservation at source location
        const sourceInventory = await tx.inventoryItem.findFirst({
          where: {
            locationId: transfer.fromLocationId,
            ...(transferItem.productId && {
              productId: transferItem.productId,
            }),
            ...(transferItem.variantId && {
              variantId: transferItem.variantId,
            }),
          },
        })

        if (sourceInventory) {
          // Find reservation for this transfer
          const reservation = await tx.inventoryReservation.findFirst({
            where: {
              inventoryItemId: sourceInventory.id,
              referenceId: transferId,
            },
          })

          if (reservation) {
            await this.fulfillReservation(
              reservation.id,
              receivedItem.quantityReceived
            )
          }
        }

        // Create adjustment records
        await tx.inventoryAdjustment.create({
          data: {
            inventoryItemId: destinationInventory.id,
            type: AdjustmentType.INCREASE,
            quantityChange: receivedItem.quantityReceived,
            reason: `Transfer received from location ${transfer.fromLocationId}`,
            referenceType: 'transfer',
            referenceId: transferId,
            createdBy: userId,
          },
        })
      }

      // Check if all items are fully received
      const allItemsReceived = transfer.items.every((item) => {
        const receivedItem = receivedItems.find(
          (ri) => ri.transferItemId === item.id
        )
        return (
          receivedItem && receivedItem.quantityReceived === item.quantityShipped
        )
      })

      if (allItemsReceived) {
        await tx.inventoryTransfer.update({
          where: { id: transferId },
          data: {
            status: TransferStatus.RECEIVED,
            receivedAt: new Date(),
          },
        })
      }

      // Emit received event
      this.emit('inventory:transferReceived', {
        transferId,
        receivedItems,
        fullyReceived: allItemsReceived,
        userId,
      })

      logger.info('Inventory transfer received', {
        transferId,
        receivedItemCount: receivedItems.length,
        fullyReceived: allItemsReceived,
      })

      return true
    })
  }

  // ============================================================================
  // LOW STOCK ALERTS & REORDER POINTS
  // ============================================================================

  async getLowStockItems(locationId?: string) {
    const where: Record<string, unknown> = {
      quantity: { lte: this._prisma.inventoryItem.fields.lowStockThreshold },
      ...(locationId && { locationId }),
    }

    return this._prisma.inventoryItem.findMany({
      where,
      include: {
        product: {
          include: {
            images: { take: 1, orderBy: { sortOrder: 'asc' } },
          },
        },
        variant: true,
        location: true,
      },
      orderBy: [{ quantity: 'asc' }, { product: { name: 'asc' } }],
    })
  }

  async updateLowStockThreshold(inventoryItemId: string, threshold: number) {
    const inventoryItem = await this._prisma.inventoryItem.update({
      where: { id: inventoryItemId },
      data: { lowStockThreshold: threshold },
    })

    // Check if item is now below threshold
    if (inventoryItem.quantity <= threshold) {
      const item = await this._prisma.inventoryItem.findUnique({
        where: { id: inventoryItemId },
        include: {
          product: true,
          variant: true,
          location: true,
        },
      })

      if (item) {
        const alertData: LowStockAlert = {
          inventoryItemId,
          productId: item.productId || undefined,
          variantId: item.variantId || undefined,
          locationId: item.locationId,
          currentQuantity: item.quantity,
          threshold,
          productName: item.product?.name,
          variantName: item.variant?.name || undefined,
          locationName: item.location.name,
        }

        this.emit('inventory:lowStock', alertData)
      }
    }

    return inventoryItem
  }

  // ============================================================================
  // REPORTING & ANALYTICS
  // ============================================================================

  async getInventoryReport(filters: InventoryReportFilters = {}) {
    const where: Record<string, unknown> = {
      ...(filters.locationIds && { locationId: { in: filters.locationIds } }),
      ...(filters.productIds && {
        OR: [
          { productId: { in: filters.productIds } },
          { variantId: { in: filters.productIds } },
        ],
      }),
      ...(filters.lowStockOnly && {
        quantity: { lte: this._prisma.inventoryItem.fields.lowStockThreshold },
      }),
    }

    const items = await this._prisma.inventoryItem.findMany({
      where,
      include: {
        product: true,
        variant: true,
        location: true,
      },
    })

    // Calculate totals
    const totals = items.reduce(
      (acc, item) => ({
        totalItems: acc.totalItems + 1,
        totalQuantity: acc.totalQuantity + item.quantity,
        totalReserved: acc.totalReserved + item.reservedQuantity,
        totalAvailable: acc.totalAvailable + item.availableQuantity,
        totalValue:
          acc.totalValue +
          (item.averageCost ? item.averageCost.toNumber() * item.quantity : 0),
        lowStockItems:
          acc.lowStockItems + (item.quantity <= item.lowStockThreshold ? 1 : 0),
      }),
      {
        totalItems: 0,
        totalQuantity: 0,
        totalReserved: 0,
        totalAvailable: 0,
        totalValue: 0,
        lowStockItems: 0,
      }
    )

    return {
      items,
      totals,
      summary: {
        ...totals,
        averageValue:
          totals.totalItems > 0 ? totals.totalValue / totals.totalItems : 0,
        stockTurnover: 0, // TODO: Calculate based on sales data
        fillRate:
          totals.totalQuantity > 0
            ? (totals.totalAvailable / totals.totalQuantity) * 100
            : 0,
      },
    }
  }

  async getInventoryMovementHistory(
    inventoryItemId: string,
    dateFrom?: Date,
    dateTo?: Date
  ) {
    const where: Record<string, unknown> = {
      inventoryItemId,
      ...(dateFrom && { createdAt: { gte: dateFrom } }),
      ...(dateTo && { createdAt: { lte: dateTo } }),
    }

    return this._prisma.inventoryAdjustment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100, // Limit to last 100 movements
    })
  }

  async getInventoryTrends(
    locationId?: string,
    productIds?: string[],
    days: number = 30
  ) {
    const dateFrom = new Date()
    dateFrom.setDate(dateFrom.getDate() - days)

    // This would typically involve more complex aggregation queries
    // For now, return basic trend data
    const adjustments = await this._prisma.inventoryAdjustment.findMany({
      where: {
        createdAt: { gte: dateFrom },
        inventoryItem: {
          ...(locationId && { locationId }),
          ...(productIds && {
            OR: [
              { productId: { in: productIds } },
              { variantId: { in: productIds } },
            ],
          }),
        },
      },
      include: {
        inventoryItem: {
          include: {
            product: true,
            variant: true,
            location: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    // Group by date and calculate daily changes
    const dailyChanges = adjustments.reduce(
      (acc, adjustment) => {
        const date = adjustment.createdAt.toISOString().split('T')[0]
        if (!acc[date]) {
          acc[date] = { increases: 0, decreases: 0, net: 0 }
        }

        const change =
          adjustment.type === AdjustmentType.INCREASE
            ? adjustment.quantityChange
            : -adjustment.quantityChange

        if (change > 0) {
          acc[date].increases += change
        } else {
          acc[date].decreases += Math.abs(change)
        }
        acc[date].net += change

        return acc
      },
      {} as Record<
        string,
        { increases: number; decreases: number; net: number }
      >
    )

    return {
      dailyChanges,
      totalAdjustments: adjustments.length,
      periodSummary: {
        totalIncreases: Object.values(dailyChanges).reduce(
          (sum, day) => sum + day.increases,
          0
        ),
        totalDecreases: Object.values(dailyChanges).reduce(
          (sum, day) => sum + day.decreases,
          0
        ),
        netChange: Object.values(dailyChanges).reduce(
          (sum, day) => sum + day.net,
          0
        ),
      },
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  async cleanupExpiredReservations() {
    const expiredReservations =
      await this._prisma.inventoryReservation.findMany({
        where: {
          expiresAt: { lte: new Date() },
        },
      })

    for (const reservation of expiredReservations) {
      await this.releaseReservation(reservation.id)
    }

    logger.info('Cleaned up expired reservations', {
      count: expiredReservations.length,
    })

    return expiredReservations.length
  }

  async ensureInventoryItem(
    productId: string | null,
    variantId: string | null,
    locationId: string
  ) {
    const existingItem = await this._prisma.inventoryItem.findFirst({
      where: {
        productId,
        variantId,
        locationId,
      },
    })

    if (existingItem) {
      return existingItem
    }

    // Create new inventory item with zero quantity
    return this._prisma.inventoryItem.create({
      data: {
        productId,
        variantId,
        locationId,
        quantity: 0,
        availableQuantity: 0,
      },
    })
  }
}
