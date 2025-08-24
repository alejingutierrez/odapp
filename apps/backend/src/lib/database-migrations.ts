import { exec } from 'child_process'
import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import { promisify } from 'util'

import { env } from '../config/env.js'
import logger from './logger'

const execAsync = promisify(exec)

export interface MigrationInfo {
  id: string
  name: string
  appliedAt: Date
  checksum: string
}

export interface MigrationStatus {
  pending: string[]
  applied: MigrationInfo[]
  current: string | null
}

export class DatabaseMigrationManager {
  private readonly migrationsPath: string
  private readonly backupPath: string

  constructor() {
    this.migrationsPath = join(process.cwd(), 'prisma', 'migrations')
    this.backupPath = join(process.cwd(), 'backups', 'migrations')

    // Ensure backup directory exists
    if (!existsSync(this.backupPath)) {
      mkdirSync(this.backupPath, { recursive: true })
    }
  }

  async getMigrationStatus(): Promise<MigrationStatus> {
    try {
      const { stdout } = await execAsync(
        'npx prisma migrate status --schema=prisma/schema.prisma'
      )

      // Parse the output to extract migration information
      const lines = stdout.split('\n')
      const applied: MigrationInfo[] = []
      const pending: string[] = []
      let current: string | null = null

      let inAppliedSection = false
      let inPendingSection = false

      for (const line of lines) {
        if (line.includes('Applied migrations:')) {
          inAppliedSection = true
          inPendingSection = false
          continue
        }

        if (line.includes('Pending migrations:')) {
          inAppliedSection = false
          inPendingSection = true
          continue
        }

        if (line.includes('Current database schema:')) {
          const match = line.match(/Current database schema: (.+)/)
          if (match) {
            current = match[1].trim()
          }
          continue
        }

        if (inAppliedSection && line.trim()) {
          const match = line.match(/(\d+_\w+)/)
          if (match) {
            applied.push({
              id: match[1],
              name: match[1],
              appliedAt: new Date(), // Would need to query database for actual date
              checksum: '', // Would need to calculate from migration file
            })
          }
        }

        if (inPendingSection && line.trim()) {
          const match = line.match(/(\d+_\w+)/)
          if (match) {
            pending.push(match[1])
          }
        }
      }

      return { applied, pending, current }
    } catch (error) {
      throw new Error(`Failed to get migration status: ${error}`)
    }
  }

  async createMigration(name: string, description?: string): Promise<string> {
    try {
      const migrationName = `${Date.now()}_${name.replace(/\s+/g, '_').toLowerCase()}`

      const { stdout } = await execAsync(
        `npx prisma migrate dev --name ${migrationName} --schema=prisma/schema.prisma`
      )

      logger.info('✅ Migration created successfully:', migrationName)
      logger.debug(stdout)

      // Create migration metadata
      const metadata = {
        name: migrationName,
        description: description || `Migration: ${name}`,
        createdAt: new Date().toISOString(),
        author: process.env.USER || 'system',
      }

      const metadataPath = join(
        this.migrationsPath,
        migrationName,
        'metadata.json'
      )
      writeFileSync(metadataPath, JSON.stringify(metadata, null, 2))

      return migrationName
    } catch (error) {
      throw new Error(`Failed to create migration: ${error}`)
    }
  }

  async applyMigrations(): Promise<void> {
    try {
      // Create backup before applying migrations
      await this.createBackup('pre_migration')

      const { stdout } = await execAsync(
        'npx prisma migrate deploy --schema=prisma/schema.prisma'
      )

      logger.info('✅ Migrations applied successfully')
      logger.debug(stdout)
    } catch (error) {
      logger.error('❌ Migration failed, attempting rollback...')
      await this.rollbackToBackup('pre_migration')
      throw new Error(`Failed to apply migrations: ${error}`)
    }
  }

  async rollbackMigration(migrationId: string): Promise<void> {
    try {
      // Create backup before rollback
      await this.createBackup(`pre_rollback_${migrationId}`)

      // Prisma doesn't have built-in rollback, so we need to handle this manually
      logger.warn('⚠️ Prisma does not support automatic rollbacks')
      logger.warn(
        'Please manually revert the schema changes and create a new migration'
      )

      throw new Error(
        'Manual rollback required - Prisma does not support automatic rollbacks'
      )
    } catch (error) {
      throw new Error(`Failed to rollback migration: ${error}`)
    }
  }

  async createBackup(name: string): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const backupName = `${name}_${timestamp}`
      const backupFile = join(this.backupPath, `${backupName}.sql`)

      // Extract database connection details
      const dbUrl = new URL(env.DATABASE_URL)
      const dbName = dbUrl.pathname.slice(1)
      const host = dbUrl.hostname
      const port = dbUrl.port || '5432'
      const username = dbUrl.username
      const password = dbUrl.password

      // Create pg_dump command
      const dumpCommand = `PGPASSWORD="${password}" pg_dump -h ${host} -p ${port} -U ${username} -d ${dbName} -f ${backupFile} --verbose --clean --if-exists --create`

      await execAsync(dumpCommand)

      logger.info('✅ Database backup created:', backupFile)

      // Create backup metadata
      const metadata = {
        name: backupName,
        file: backupFile,
        createdAt: new Date().toISOString(),
        database: dbName,
        size: 0, // Would need to get file size
      }

      const metadataFile = join(this.backupPath, `${backupName}.json`)
      writeFileSync(metadataFile, JSON.stringify(metadata, null, 2))

      return backupFile
    } catch (error) {
      throw new Error(`Failed to create backup: ${error}`)
    }
  }

  async rollbackToBackup(backupName: string): Promise<void> {
    try {
      const backupFile = join(this.backupPath, `${backupName}.sql`)

      if (!existsSync(backupFile)) {
        throw new Error(`Backup file not found: ${backupFile}`)
      }

      // Extract database connection details
      const dbUrl = new URL(env.DATABASE_URL)
      const dbName = dbUrl.pathname.slice(1)
      const host = dbUrl.hostname
      const port = dbUrl.port || '5432'
      const username = dbUrl.username
      const password = dbUrl.password

      // Create psql restore command
      const restoreCommand = `PGPASSWORD="${password}" psql -h ${host} -p ${port} -U ${username} -d ${dbName} -f ${backupFile} --verbose`

      await execAsync(restoreCommand)

      logger.info('✅ Database restored from backup:', backupFile)
    } catch (error) {
      throw new Error(`Failed to restore from backup: ${error}`)
    }
  }

  async validateMigrations(): Promise<{ valid: boolean; errors: string[] }> {
    try {
      const errors: string[] = []

      // Check if migrations directory exists
      if (!existsSync(this.migrationsPath)) {
        errors.push('Migrations directory does not exist')
        return { valid: false, errors }
      }

      // Validate schema
      try {
        await execAsync('npx prisma validate --schema=prisma/schema.prisma')
      } catch (error) {
        errors.push(`Schema validation failed: ${error}`)
      }

      // Check migration status
      try {
        const status = await this.getMigrationStatus()
        if (status.pending.length > 0) {
          errors.push(`${status.pending.length} pending migrations found`)
        }
      } catch (error) {
        errors.push(`Failed to check migration status: ${error}`)
      }

      return { valid: errors.length === 0, errors }
    } catch (error) {
      return {
        valid: false,
        errors: [`Validation failed: ${error}`],
      }
    }
  }

  async generateClient(): Promise<void> {
    try {
      await execAsync('npx prisma generate --schema=prisma/schema.prisma')
      logger.info('✅ Prisma client generated successfully')
    } catch (error) {
      throw new Error(`Failed to generate Prisma client: ${error}`)
    }
  }

  async resetDatabase(): Promise<void> {
    try {
      logger.warn('⚠️ Resetting database - all data will be lost!')

      // Create backup before reset
      await this.createBackup('pre_reset')

      await execAsync(
        'npx prisma migrate reset --force --schema=prisma/schema.prisma'
      )

      logger.info('✅ Database reset successfully')
    } catch (error) {
      throw new Error(`Failed to reset database: ${error}`)
    }
  }
}

// Singleton instance
export const migrationManager = new DatabaseMigrationManager()

// CLI-like interface for common operations
export async function runMigrations() {
  try {
    logger.info('🚀 Starting database migrations...')
    await migrationManager.applyMigrations()
    await migrationManager.generateClient()
    logger.info('✅ All migrations completed successfully')
  } catch (error) {
    logger.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

export async function createMigration(name: string, description?: string) {
  try {
    const migrationName = await migrationManager.createMigration(
      name,
      description
    )
    logger.info(`✅ Migration created: ${migrationName}`)
  } catch (error) {
    logger.error('❌ Failed to create migration:', error)
    process.exit(1)
  }
}

export async function checkMigrationStatus() {
  try {
    const status = await migrationManager.getMigrationStatus()
    logger.info('📊 Migration Status:')
    logger.info(`Applied: ${status.applied.length}`)
    logger.info(`Pending: ${status.pending.length}`)
    logger.info(`Current: ${status.current || 'Unknown'}`)

    if (status.pending.length > 0) {
      logger.info('\n⏳ Pending migrations:')
      status.pending.forEach((migration) => logger.info(`  - ${migration}`))
    }
  } catch (error) {
    logger.error('❌ Failed to check migration status:', error)
    process.exit(1)
  }
}
