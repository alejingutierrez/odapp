import { PrismaClient } from '@prisma/client'
import { logger } from '../lib/logger.js'

export interface AuditLogEntry {
  action: string
  entity: string
  entityId: string
  oldValues?: Record<string, unknown>
  newValues?: Record<string, unknown>
  userId?: string
  ipAddress?: string
  userAgent?: string
  metadata?: Record<string, unknown>
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
  constructor(private _prisma: PrismaClient) {}

  async log(entry: AuditLogEntry): Promise<void> {
    try {
      await this._prisma.auditLog.create({
        data: {
          action: entry.action,
          entity: entry.entity,
          entityId: entry.entityId,
          oldValues: entry.oldValues
            ? JSON.stringify(entry.oldValues)
            : undefined,
          newValues: entry.newValues
            ? JSON.stringify(entry.newValues)
            : undefined,
          userId: entry.userId,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
        },
      })

      logger.debug('Audit log entry created', {
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId,
        userId: entry.userId,
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
      limit = 50,
    } = query

    const where: Record<string, unknown> = {}

    if (entity) where.entity = entity
    if (entityId) where.entityId = entityId
    if (userId) where.userId = userId
    if (action) where.action = action

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate)
        (where.createdAt as Record<string, unknown>).gte = startDate
      if (endDate) (where.createdAt as Record<string, unknown>).lte = endDate
    }

    const [logs, total] = await Promise.all([
      this._prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this._prisma.auditLog.count({ where }),
    ])

    return {
      logs: logs.map((log) => ({
        ...log,
        oldValues: log.oldValues ? JSON.parse(log.oldValues as string) : null,
        newValues: log.newValues ? JSON.parse(log.newValues as string) : null,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }
}
