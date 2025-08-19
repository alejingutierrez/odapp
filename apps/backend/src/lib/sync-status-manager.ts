import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { logger } from './logger';
import { SyncStatus } from '../types/shopify';

export class SyncStatusManager {
  constructor(private _prisma: PrismaClient) {}

  async startSync(entityType: string, direction: 'push' | 'pull'): Promise<string> {
    const syncId = uuidv4();
    
    try {
      await this._prisma.syncStatus.create({
        data: {
          id: syncId,
          entityType,
          direction,
          status: 'running',
          startedAt: new Date(),
          successful: 0,
          failed: 0,
          total: 0,
          errors: [],
        },
      });

      logger.info(`Started sync ${syncId} for ${entityType} (${direction})`);
      return syncId;
    } catch (error) {
      logger.error('Failed to create sync status:', error);
      throw error;
    }
  }

  async completeSync(syncId: string, results: { successful: number; failed: number; total: number }): Promise<void> {
    try {
      await this._prisma.syncStatus.update({
        where: { id: syncId },
        data: {
          status: 'completed',
          completedAt: new Date(),
          successful: results.successful,
          failed: results.failed,
          total: results.total,
        },
      });

      logger.info(`Completed sync ${syncId}: ${results.successful}/${results.total} successful`);
    } catch (error) {
      logger.error('Failed to update sync status:', error);
      throw error;
    }
  }

  async failSync(syncId: string, error: Error): Promise<void> {
    try {
      await this._prisma.syncStatus.update({
        where: { id: syncId },
        data: {
          status: 'failed',
          completedAt: new Date(),
          errors: [error.message],
        },
      });

      logger.error(`Failed sync ${syncId}: ${error.message}`);
    } catch (updateError) {
      logger.error('Failed to update sync status:', updateError);
      throw updateError;
    }
  }

  async updateSyncProgress(
    syncId: string, 
    progress: { successful: number; failed: number; total: number; errors?: string[] }
  ): Promise<void> {
    try {
      await this._prisma.syncStatus.update({
        where: { id: syncId },
        data: {
          successful: progress.successful,
          failed: progress.failed,
          total: progress.total,
          ...(progress.errors && { errors: progress.errors }),
        },
      });
    } catch (error) {
      logger.error('Failed to update sync progress:', error);
    }
  }

  async getSyncStatus(syncId: string): Promise<SyncStatus | null> {
    try {
      const status = await this._prisma.syncStatus.findUnique({
        where: { id: syncId },
      });

      return status as SyncStatus | null;
    } catch (error) {
      logger.error('Failed to get sync status:', error);
      return null;
    }
  }

  async getAllSyncStatuses(): Promise<SyncStatus[]> {
    try {
      const statuses = await this._prisma.syncStatus.findMany({
        orderBy: { startedAt: 'desc' },
        take: 100, // Limit to recent syncs
      });

      return statuses as SyncStatus[];
    } catch (error) {
      logger.error('Failed to get sync statuses:', error);
      return [];
    }
  }

  async getSyncHistory(entityType?: string): Promise<SyncStatus[]> {
    try {
      const statuses = await this._prisma.syncStatus.findMany({
        where: entityType ? { entityType } : undefined,
        orderBy: { startedAt: 'desc' },
        take: 50,
      });

      return statuses as SyncStatus[];
    } catch (error) {
      logger.error('Failed to get sync history:', error);
      return [];
    }
  }

  async getLastSyncTime(entityType: string): Promise<Date | undefined> {
    try {
      const lastSync = await this._prisma.syncStatus.findFirst({
        where: {
          entityType,
          status: 'completed',
        },
        orderBy: { completedAt: 'desc' },
      });

      return lastSync?.completedAt || undefined;
    } catch (error) {
      logger.error('Failed to get last sync time:', error);
      return undefined;
    }
  }

  async getActiveSyncs(): Promise<SyncStatus[]> {
    try {
      const activeSyncs = await this._prisma.syncStatus.findMany({
        where: {
          status: { in: ['pending', 'running'] },
        },
        orderBy: { startedAt: 'desc' },
      });

      return activeSyncs as SyncStatus[];
    } catch (error) {
      logger.error('Failed to get active syncs:', error);
      return [];
    }
  }

  async cleanupOldSyncs(daysToKeep: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await this._prisma.syncStatus.deleteMany({
        where: {
          startedAt: {
            lt: cutoffDate,
          },
          status: { in: ['completed', 'failed'] },
        },
      });

      logger.info(`Cleaned up ${result.count} old sync records`);
      return result.count;
    } catch (error) {
      logger.error('Failed to cleanup old syncs:', error);
      return 0;
    }
  }

  async getSyncMetrics(entityType?: string, days: number = 7): Promise<{
    totalSyncs: number;
    successfulSyncs: number;
    failedSyncs: number;
    averageDuration: number;
    successRate: number;
  }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const syncs = await this._prisma.syncStatus.findMany({
        where: {
          ...(entityType && { entityType }),
          startedAt: { gte: startDate },
          status: { in: ['completed', 'failed'] },
        },
      });

      const totalSyncs = syncs.length;
      const successfulSyncs = syncs.filter(s => s.status === 'completed').length;
      const failedSyncs = syncs.filter(s => s.status === 'failed').length;

      const completedSyncs = syncs.filter(s => s.completedAt);
      const totalDuration = completedSyncs.reduce((sum, sync) => {
        const duration = sync.completedAt!.getTime() - sync.startedAt.getTime();
        return sum + duration;
      }, 0);

      const averageDuration = completedSyncs.length > 0 ? totalDuration / completedSyncs.length : 0;
      const successRate = totalSyncs > 0 ? (successfulSyncs / totalSyncs) * 100 : 0;

      return {
        totalSyncs,
        successfulSyncs,
        failedSyncs,
        averageDuration,
        successRate,
      };
    } catch (error) {
      logger.error('Failed to get sync metrics:', error);
      return {
        totalSyncs: 0,
        successfulSyncs: 0,
        failedSyncs: 0,
        averageDuration: 0,
        successRate: 0,
      };
    }
  }
}