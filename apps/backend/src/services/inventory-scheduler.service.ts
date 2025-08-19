import cron from 'node-cron'
import { PrismaClient } from '@prisma/client'
import { InventoryService } from './inventory.service'
import { WebSocketService } from './websocket.service'
import { logger } from '../lib/logger'

export class InventorySchedulerService {
  private jobs: Map<string, cron.ScheduledTask> = new Map()

  constructor(
    private prisma: PrismaClient,
    private inventoryService: InventoryService,
    private webSocketService?: WebSocketService
  ) {}

  /**
   * Start all scheduled inventory jobs
   */
  public startAll() {
    this.startExpiredReservationCleanup()
    this.startLowStockMonitoring()
    this.startInventoryReporting()
    this.startInventoryHealthCheck()

    logger.info('All inventory scheduled jobs started')
  }

  /**
   * Stop all scheduled jobs
   */
  public stopAll() {
    this.jobs.forEach((job, name) => {
      job.stop()
      logger.info(`Stopped scheduled job: ${name}`)
    })
    this.jobs.clear()
    logger.info('All inventory scheduled jobs stopped')
  }

  /**
   * Cleanup expired reservations every 15 minutes
   */
  private startExpiredReservationCleanup() {
    const job = cron.schedule('*/15 * * * *', async () => {
      try {
        logger.info('Starting expired reservation cleanup')
        const cleanedCount = await this.inventoryService.cleanupExpiredReservations()
        
        if (cleanedCount > 0) {
          logger.info(`Cleaned up ${cleanedCount} expired reservations`)
          
          // Notify connected users about cleanup
          this.webSocketService?.broadcastNotification('inventory:reservationsCleanup', {
            cleanedCount,
            timestamp: new Date().toISOString()
          })
        }
      } catch (error) {
        logger.error('Failed to cleanup expired reservations', {
          error: error.message,
          stack: error.stack
        })
      }
    }, {
      scheduled: false
    })

    job.start()
    this.jobs.set('expiredReservationCleanup', job)
    logger.info('Started expired reservation cleanup job (every 15 minutes)')
  }

  /**
   * Monitor low stock items every hour
   */
  private startLowStockMonitoring() {
    const job = cron.schedule('0 * * * *', async () => {
      try {
        logger.info('Starting low stock monitoring')
        
        // Get all low stock items
        const lowStockItems = await this.inventoryService.getLowStockItems()
        
        if (lowStockItems.length > 0) {
          logger.warn(`Found ${lowStockItems.length} low stock items`)
          
          // Group by location for better reporting
          const itemsByLocation = lowStockItems.reduce((acc, item) => {
            const locationName = item.location.name
            if (!acc[locationName]) {
              acc[locationName] = []
            }
            acc[locationName].push({
              productName: item.product?.name || item.variant?.name || 'Unknown Product',
              currentQuantity: item.quantity,
              threshold: item.lowStockThreshold,
              inventoryItemId: item.id
            })
            return acc
          }, {} as Record<string, any[]>)

          // Send consolidated low stock report
          this.webSocketService?.broadcastNotification('inventory:lowStockReport', {
            totalItems: lowStockItems.length,
            itemsByLocation,
            timestamp: new Date().toISOString()
          })

          // Log summary
          Object.entries(itemsByLocation).forEach(([location, items]) => {
            logger.warn(`Low stock items in ${location}:`, {
              count: items.length,
              items: items.map(item => `${item.productName} (${item.currentQuantity}/${item.threshold})`)
            })
          })
        } else {
          logger.info('No low stock items found')
        }
      } catch (error) {
        logger.error('Failed to monitor low stock items', {
          error: error.message,
          stack: error.stack
        })
      }
    }, {
      scheduled: false
    })

    job.start()
    this.jobs.set('lowStockMonitoring', job)
    logger.info('Started low stock monitoring job (every hour)')
  }

  /**
   * Generate daily inventory reports at 6 AM
   */
  private startInventoryReporting() {
    const job = cron.schedule('0 6 * * *', async () => {
      try {
        logger.info('Generating daily inventory report')
        
        const report = await this.inventoryService.getInventoryReport()
        
        // Calculate key metrics
        const metrics = {
          totalItems: report.totals.totalItems,
          totalQuantity: report.totals.totalQuantity,
          totalValue: report.totals.totalValue,
          lowStockItems: report.totals.lowStockItems,
          fillRate: report.summary.fillRate,
          averageValue: report.summary.averageValue
        }

        logger.info('Daily inventory metrics', metrics)

        // Send daily report to administrators
        this.webSocketService?.broadcastNotification('inventory:dailyReport', {
          date: new Date().toISOString().split('T')[0],
          metrics,
          timestamp: new Date().toISOString()
        })

        // Store report in database for historical tracking
        await this.storeDailyReport(metrics)

      } catch (error) {
        logger.error('Failed to generate daily inventory report', {
          error: error.message,
          stack: error.stack
        })
      }
    }, {
      scheduled: false
    })

    job.start()
    this.jobs.set('inventoryReporting', job)
    logger.info('Started daily inventory reporting job (6 AM daily)')
  }

  /**
   * Health check for inventory system every 5 minutes
   */
  private startInventoryHealthCheck() {
    const job = cron.schedule('*/5 * * * *', async () => {
      try {
        const healthStatus = await this.performHealthCheck()
        
        if (healthStatus.status !== 'healthy') {
          logger.warn('Inventory system health check failed', healthStatus)
          
          // Notify administrators of health issues
          this.webSocketService?.broadcastNotification('inventory:healthAlert', {
            status: healthStatus.status,
            issues: healthStatus.issues,
            timestamp: new Date().toISOString()
          })
        }

        // Update system health record
        await this.updateSystemHealth(healthStatus)

      } catch (error) {
        logger.error('Inventory health check failed', {
          error: error.message,
          stack: error.stack
        })

        // Record health check failure
        await this.updateSystemHealth({
          status: 'unhealthy',
          issues: [`Health check error: ${error.message}`],
          checkedAt: new Date()
        })
      }
    }, {
      scheduled: false
    })

    job.start()
    this.jobs.set('inventoryHealthCheck', job)
    logger.info('Started inventory health check job (every 5 minutes)')
  }

  /**
   * Perform comprehensive health check
   */
  private async performHealthCheck() {
    const issues: string[] = []
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'

    try {
      // Check database connectivity
      await this.prisma.inventoryItem.count()

      // Check for stale data (items not updated in 24 hours with activity)
      const staleItemsCount = await this.prisma.inventoryItem.count({
        where: {
          updatedAt: {
            lt: new Date(Date.now() - 24 * 60 * 60 * 1000)
          },
          adjustments: {
            some: {
              createdAt: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
              }
            }
          }
        }
      })

      if (staleItemsCount > 0) {
        issues.push(`${staleItemsCount} inventory items have stale data`)
        status = 'degraded'
      }

      // Check for negative quantities (data integrity issue)
      const negativeQuantityCount = await this.prisma.inventoryItem.count({
        where: {
          quantity: { lt: 0 }
        }
      })

      if (negativeQuantityCount > 0) {
        issues.push(`${negativeQuantityCount} inventory items have negative quantities`)
        status = 'unhealthy'
      }

      // Check for inconsistent available quantities
      const inconsistentCount = await this.prisma.inventoryItem.count({
        where: {
          availableQuantity: {
            not: this.prisma.inventoryItem.fields.quantity - this.prisma.inventoryItem.fields.reservedQuantity
          }
        }
      })

      if (inconsistentCount > 0) {
        issues.push(`${inconsistentCount} inventory items have inconsistent available quantities`)
        status = 'degraded'
      }

      // Check for long-running reservations (over 24 hours without expiry)
      const longRunningReservations = await this.prisma.inventoryReservation.count({
        where: {
          createdAt: {
            lt: new Date(Date.now() - 24 * 60 * 60 * 1000)
          },
          expiresAt: null
        }
      })

      if (longRunningReservations > 10) {
        issues.push(`${longRunningReservations} reservations have been running for over 24 hours`)
        status = status === 'unhealthy' ? 'unhealthy' : 'degraded'
      }

      // Check for failed transfers (pending for over 7 days)
      const stalledTransfers = await this.prisma.inventoryTransfer.count({
        where: {
          status: 'PENDING',
          createdAt: {
            lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      })

      if (stalledTransfers > 0) {
        issues.push(`${stalledTransfers} transfers have been pending for over 7 days`)
        status = status === 'unhealthy' ? 'unhealthy' : 'degraded'
      }

    } catch (error) {
      issues.push(`Database connectivity error: ${error.message}`)
      status = 'unhealthy'
    }

    return {
      status,
      issues,
      checkedAt: new Date()
    }
  }

  /**
   * Store daily report metrics
   */
  private async storeDailyReport(metrics: any) {
    try {
      // This would typically go to a separate reporting table
      // For now, we'll use the audit log
      await this.prisma.auditLog.create({
        data: {
          action: 'DAILY_INVENTORY_REPORT',
          entity: 'inventory',
          entityId: 'system',
          newValues: metrics
        }
      })
    } catch (error) {
      logger.error('Failed to store daily report', {
        error: error.message,
        metrics
      })
    }
  }

  /**
   * Update system health record
   */
  private async updateSystemHealth(healthStatus: any) {
    try {
      await this.prisma.systemHealth.create({
        data: {
          service: 'inventory',
          status: healthStatus.status.toUpperCase() as any,
          message: healthStatus.issues.length > 0 ? healthStatus.issues.join('; ') : 'All checks passed',
          metadata: {
            issues: healthStatus.issues,
            checkedAt: healthStatus.checkedAt
          }
        }
      })
    } catch (error) {
      logger.error('Failed to update system health', {
        error: error.message,
        healthStatus
      })
    }
  }

  /**
   * Manual trigger for expired reservation cleanup
   */
  public async triggerExpiredReservationCleanup() {
    logger.info('Manually triggering expired reservation cleanup')
    const cleanedCount = await this.inventoryService.cleanupExpiredReservations()
    logger.info(`Manual cleanup completed: ${cleanedCount} reservations cleaned`)
    return cleanedCount
  }

  /**
   * Manual trigger for low stock monitoring
   */
  public async triggerLowStockMonitoring() {
    logger.info('Manually triggering low stock monitoring')
    const lowStockItems = await this.inventoryService.getLowStockItems()
    logger.info(`Manual low stock check completed: ${lowStockItems.length} items found`)
    return lowStockItems
  }

  /**
   * Manual trigger for health check
   */
  public async triggerHealthCheck() {
    logger.info('Manually triggering inventory health check')
    const healthStatus = await this.performHealthCheck()
    await this.updateSystemHealth(healthStatus)
    logger.info('Manual health check completed', healthStatus)
    return healthStatus
  }

  /**
   * Get job status
   */
  public getJobStatus() {
    const status = Array.from(this.jobs.entries()).map(([name, job]) => ({
      name,
      running: job.running,
      scheduled: job.scheduled
    }))

    return {
      totalJobs: this.jobs.size,
      runningJobs: status.filter(j => j.running).length,
      jobs: status
    }
  }

  /**
   * Restart a specific job
   */
  public restartJob(jobName: string) {
    const job = this.jobs.get(jobName)
    if (job) {
      job.stop()
      job.start()
      logger.info(`Restarted job: ${jobName}`)
      return true
    }
    return false
  }

  /**
   * Stop a specific job
   */
  public stopJob(jobName: string) {
    const job = this.jobs.get(jobName)
    if (job) {
      job.stop()
      logger.info(`Stopped job: ${jobName}`)
      return true
    }
    return false
  }

  /**
   * Start a specific job
   */
  public startJob(jobName: string) {
    const job = this.jobs.get(jobName)
    if (job) {
      job.start()
      logger.info(`Started job: ${jobName}`)
      return true
    }
    return false
  }
}