import { prisma } from './prisma'
import { EmailService } from './email'

export enum SecurityEventType {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGIN_LOCKED = 'LOGIN_LOCKED',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  PASSWORD_RESET_REQUESTED = 'PASSWORD_RESET_REQUESTED',
  PASSWORD_RESET_COMPLETED = 'PASSWORD_RESET_COMPLETED',
  TWO_FACTOR_ENABLED = 'TWO_FACTOR_ENABLED',
  TWO_FACTOR_DISABLED = 'TWO_FACTOR_DISABLED',
  TWO_FACTOR_BACKUP_CODE_USED = 'TWO_FACTOR_BACKUP_CODE_USED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  SESSION_CREATED = 'SESSION_CREATED',
  SESSION_REVOKED = 'SESSION_REVOKED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  EMAIL_VERIFIED = 'EMAIL_VERIFIED',
  ACCOUNT_CREATED = 'ACCOUNT_CREATED'
}

export interface SecurityEvent {
  type: SecurityEventType
  userId?: string
  ipAddress?: string
  userAgent?: string
  metadata?: Record<string, unknown>
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export class SecurityAuditService {
  /**
   * Log a security event
   */
  static async logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          action: event.type,
          entity: 'security',
          entityId: event.userId || 'system',
          userId: event.userId,
          ipAddress: event.ipAddress,
          userAgent: event.userAgent,
          newValues: event.metadata as any || {}
        }
      })

      // Handle high-severity events
      if (event.severity === 'high' || event.severity === 'critical') {
        await this.handleHighSeverityEvent(event)
      }

      console.log(`Security event logged: ${event.type}`, {
        userId: event.userId,
        severity: event.severity,
        ipAddress: event.ipAddress
      })
    } catch (error) {
      console.error('Failed to log security event:', error)
    }
  }

  /**
   * Handle high-severity security events
   */
  private static async handleHighSeverityEvent(event: SecurityEvent): Promise<void> {
    try {
      // Get user information if available
      let user = null
      if (event.userId) {
        user = await prisma.user.findUnique({
          where: { id: event.userId },
          select: {
            email: true,
            firstName: true,
            lastName: true
          }
        })
      }

      // Send security alert email
      if (user && user.email) {
        await this.sendSecurityAlert(user.email, event, user.firstName || 'User')
      }

      // Log to external monitoring system (if configured)
      await this.sendToMonitoring(event)
    } catch (error) {
      console.error('Failed to handle high-severity security event:', error)
    }
  }

  /**
   * Send security alert email
   */
  private static async sendSecurityAlert(
    email: string,
    event: SecurityEvent,
    userName: string
  ): Promise<void> {
    const subject = this.getSecurityAlertSubject(event.type)
    const message = this.getSecurityAlertMessage(event, userName)

    await EmailService.sendEmail({
      to: email,
      subject,
      html: this.generateSecurityAlertHTML(event, userName, message),
      text: message
    })
  }

  /**
   * Get security alert subject
   */
  private static getSecurityAlertSubject(eventType: SecurityEventType): string {
    switch (eventType) {
      case SecurityEventType.LOGIN_LOCKED:
        return 'Security Alert: Account Temporarily Locked'
      case SecurityEventType.SUSPICIOUS_ACTIVITY:
        return 'Security Alert: Suspicious Activity Detected'
      case SecurityEventType.PASSWORD_CHANGED:
        return 'Security Alert: Password Changed'
      case SecurityEventType.TWO_FACTOR_DISABLED:
        return 'Security Alert: Two-Factor Authentication Disabled'
      default:
        return 'Security Alert: Account Activity'
    }
  }

  /**
   * Get security alert message
   */
  private static getSecurityAlertMessage(event: SecurityEvent, userName: string): string {
    const timestamp = new Date().toLocaleString()
    const ipAddress = event.ipAddress || 'Unknown'

    switch (event.type) {
      case SecurityEventType.LOGIN_LOCKED:
        return `Hello ${userName},\n\nYour account has been temporarily locked due to multiple failed login attempts.\n\nTime: ${timestamp}\nIP Address: ${ipAddress}\n\nIf this wasn't you, please contact support immediately.`
      
      case SecurityEventType.SUSPICIOUS_ACTIVITY:
        return `Hello ${userName},\n\nSuspicious activity has been detected on your account.\n\nTime: ${timestamp}\nIP Address: ${ipAddress}\nReason: ${event.metadata?.reason || 'Unknown'}\n\nIf this wasn't you, please secure your account immediately.`
      
      case SecurityEventType.PASSWORD_CHANGED:
        return `Hello ${userName},\n\nYour password has been changed.\n\nTime: ${timestamp}\nIP Address: ${ipAddress}\n\nIf you didn't make this change, please contact support immediately.`
      
      case SecurityEventType.TWO_FACTOR_DISABLED:
        return `Hello ${userName},\n\nTwo-factor authentication has been disabled on your account.\n\nTime: ${timestamp}\nIP Address: ${ipAddress}\n\nIf you didn't make this change, please contact support immediately.`
      
      default:
        return `Hello ${userName},\n\nSecurity event detected on your account: ${event.type}\n\nTime: ${timestamp}\nIP Address: ${ipAddress}\n\nIf you have concerns, please contact support.`
    }
  }

  /**
   * Generate security alert HTML
   */
  private static generateSecurityAlertHTML(
    event: SecurityEvent,
    userName: string,
    message: string
  ): string {
    const severityColor = {
      low: '#52c41a',
      medium: '#fa8c16',
      high: '#fa541c',
      critical: '#ff4d4f'
    }[event.severity]

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Security Alert</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${severityColor}; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; }
          .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; }
          .alert { background: #fff2e8; border-left: 4px solid ${severityColor}; padding: 15px; margin: 20px 0; }
          .details { background: #f9f9f9; padding: 15px; margin: 20px 0; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔒 Security Alert</h1>
          </div>
          <div class="content">
            <div class="alert">
              <strong>Security Event: ${event.type}</strong>
              <p>Severity: <strong style="color: ${severityColor};">${event.severity.toUpperCase()}</strong></p>
            </div>
            <p>${message.replace(/\n/g, '<br>')}</p>
            <div class="details">
              <h3>Event Details:</h3>
              <ul>
                <li><strong>Time:</strong> ${new Date().toLocaleString()}</li>
                <li><strong>IP Address:</strong> ${event.ipAddress || 'Unknown'}</li>
                <li><strong>User Agent:</strong> ${event.userAgent || 'Unknown'}</li>
              </ul>
            </div>
            <p><strong>What should you do?</strong></p>
            <ul>
              <li>If this was you, no action is needed</li>
              <li>If this wasn't you, change your password immediately</li>
              <li>Enable two-factor authentication if not already enabled</li>
              <li>Contact support if you need assistance</li>
            </ul>
          </div>
          <div class="footer">
            <p>&copy; 2024 Oda Fashion Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  /**
   * Send to external monitoring system
   */
  private static async sendToMonitoring(event: SecurityEvent): Promise<void> {
    // This would integrate with external monitoring systems like DataDog, Sentry, etc.
    // For now, we'll just log to console
    console.warn('HIGH SEVERITY SECURITY EVENT:', {
      type: event.type,
      severity: event.severity,
      userId: event.userId,
      ipAddress: event.ipAddress,
      timestamp: new Date().toISOString(),
      metadata: event.metadata
    })
  }

  /**
   * Get security events for a user
   */
  static async getUserSecurityEvents(
    userId: string,
    limit: number = 50
  ): Promise<Array<{
    id: string
    action: string
    ipAddress: string | null
    userAgent: string | null
    createdAt: Date
    metadata: unknown
  }>> {
    return prisma.auditLog.findMany({
      where: {
        userId,
        entity: 'security'
      },
      select: {
        id: true,
        action: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        newValues: true
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    }).then(logs => logs.map(log => ({
      id: log.id,
      action: log.action,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      createdAt: log.createdAt,
      metadata: log.newValues
    })))
  }

  /**
   * Get system-wide security statistics
   */
  static async getSecurityStatistics(days: number = 7): Promise<{
    totalEvents: number
    eventsByType: Record<string, number>
    eventsBySeverity: Record<string, number>
    suspiciousActivityCount: number
    lockedAccountsCount: number
  }> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const events = await prisma.auditLog.findMany({
      where: {
        entity: 'security',
        createdAt: { gte: since }
      },
      select: {
        action: true,
        newValues: true
      }
    })

    const eventsByType: Record<string, number> = {}
    const eventsBySeverity: Record<string, number> = {}
    let suspiciousActivityCount = 0
    let lockedAccountsCount = 0

    events.forEach(event => {
      // Count by type
      eventsByType[event.action] = (eventsByType[event.action] || 0) + 1

      // Count by severity (if available in metadata)
      const severity = (event.newValues as Record<string, unknown>)?.severity as string || 'unknown'
      eventsBySeverity[severity] = (eventsBySeverity[severity] || 0) + 1

      // Count specific event types
      if (event.action === SecurityEventType.SUSPICIOUS_ACTIVITY) {
        suspiciousActivityCount++
      }
      if (event.action === SecurityEventType.LOGIN_LOCKED) {
        lockedAccountsCount++
      }
    })

    return {
      totalEvents: events.length,
      eventsByType,
      eventsBySeverity,
      suspiciousActivityCount,
      lockedAccountsCount
    }
  }
}