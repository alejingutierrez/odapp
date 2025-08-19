import { PrismaClient } from '@prisma/client'
import { logger } from '../lib/logger.js'

export interface AuditLogEntry {
  action: string
  entity: string
  entityId: string
  oldValues?: any
  newValues?: any
  userId?: string
  ipAddress?: string
  userAgent?: string
  metadata?: Record<string, any>
}

export interface AuditQuery {
  entity?: string
  entityId?: string
  userId?: string
  action?: string
  startDate?: Date
  endDate?: Date
  page?: number
  limit?: number
}

export class AuditService {
  constructor(private prisma: PrismaClient) {}

  async log(entry: AuditLogEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          action: entry.action,
          entity: entry.entity,
          entityId: entry.entityId,
          oldValues: entry.oldValues ? JSON.stringify(entry.oldValues) : null,
          newValues: entry.newValues ? JSON.stringify(entry.newValues) : null,
          userId: entry.userId,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
        }
      })

      logger.debug('Audit log entry created', {
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId,
        userId: entry.userId
      })
    } catch (error) {
      logger.error('Failed to create audit log entry', { error, entry })
      // Don't throw error to avoid breaking the main operation
    }
  }

  async getAuditLogs(query: AuditQuery) {
    const {
      entity,
      entityId,
      userId,
      action,
      startDate,
      endDate,
      page = 1,
      limit = 50
    } = query

    const where: any = {}

    if (entity) where.entity = entity
    if (entityId) where.entityId = entityId
    if (userId) where.userId = userId
    if (action) where.action = action

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = startDate
      if (endDate) where.createdAt.lte = endDate
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      this.prisma.auditLog.count({ where })
    ])

    return {
      logs: logs.map(log => ({
        ...log,
        oldValues: log.oldValues ? JSON.parse(log.oldValues) : null,
        newValues: log.newValues ? JSON.parse(log.newValues) : null
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  }
}