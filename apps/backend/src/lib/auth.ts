import * as jwt from 'jsonwebtoken'
import * as bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { env } from '../config/env'
import { prisma } from './prisma'
import type { User, Role, UserSession } from '@prisma/client'

export interface TokenPayload {
  userId: string
  email: string
  roles: string[]
  permissions: string[]
  sessionId: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresAt: Date
}

export interface UserWithRoles extends User {
  roles: Array<{
    role: Role
  }>
}

export class AuthService {
  /**
   * Hash a password using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, env.BCRYPT_ROUNDS)
  }

  /**
   * Verify a password against its hash
   */
  static async verifyPassword(
    password: string,
    hash: string
  ): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }

  /**
   * Generate JWT tokens (access and refresh)
   */
  static async generateTokens(
    user: UserWithRoles,
    sessionId: string
  ): Promise<AuthTokens> {
    const permissions = this.extractPermissions(user.roles)
    const roleNames = user.roles.map((ur) => ur.role.name)

    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      roles: roleNames,
      permissions,
      sessionId,
    }

    // @ts-expect-error - JWT secret type compatibility issue
    const accessToken = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
      issuer: 'oda-api',
      audience: 'oda-client',
    })

    // @ts-expect-error - JWT secret type compatibility issue
    const refreshToken = jwt.sign(
      { userId: user.id, sessionId },
      env.JWT_SECRET,
      {
        expiresIn: env.JWT_REFRESH_EXPIRES_IN,
        issuer: 'oda-api',
        audience: 'oda-client',
      }
    )

    const expiresAt = new Date()
    expiresAt.setTime(
      expiresAt.getTime() + this.parseExpirationTime(env.JWT_EXPIRES_IN)
    )

    return {
      accessToken,
      refreshToken,
      expiresAt,
    }
  }

  /**
   * Verify and decode JWT token
   */
  static async verifyToken(token: string): Promise<TokenPayload> {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET, {
        issuer: 'oda-api',
        audience: 'oda-client',
      }) as TokenPayload

      return decoded
    } catch (error) {
      throw new Error('Invalid or expired token')
    }
  }

  /**
   * Create a new user session
   */
  static async createSession(
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<UserSession> {
    const token = crypto.randomBytes(32).toString('hex')
    const refreshToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setTime(
      expiresAt.getTime() + this.parseExpirationTime(env.JWT_EXPIRES_IN)
    )

    return prisma.userSession.create({
      data: {
        userId,
        token,
        refreshToken,
        expiresAt,
        ipAddress,
        userAgent,
        lastUsedAt: new Date(),
      },
    })
  }

  /**
   * Update session last used timestamp
   */
  static async updateSessionLastUsed(sessionId: string): Promise<void> {
    await prisma.userSession.update({
      where: { id: sessionId },
      data: { lastUsedAt: new Date() },
    })
  }

  /**
   * Revoke a session
   */
  static async revokeSession(sessionId: string): Promise<void> {
    await prisma.userSession.delete({
      where: { id: sessionId },
    })
  }

  /**
   * Revoke all sessions for a user
   */
  static async revokeAllUserSessions(userId: string): Promise<void> {
    await prisma.userSession.deleteMany({
      where: { userId },
    })
  }

  /**
   * Clean up expired sessions
   */
  static async cleanupExpiredSessions(): Promise<void> {
    await prisma.userSession.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    })
  }

  /**
   * Get user with roles by ID
   */
  static async getUserWithRoles(userId: string): Promise<UserWithRoles | null> {
    return prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    })
  }

  /**
   * Get user by email with roles
   */
  static async getUserByEmailWithRoles(
    email: string
  ): Promise<UserWithRoles | null> {
    return prisma.user.findUnique({
      where: { email },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    })
  }

  /**
   * Check if user has permission
   */
  static hasPermission(user: UserWithRoles, permission: string): boolean {
    const permissions = this.extractPermissions(user.roles)
    return permissions.includes(permission) || permissions.includes('*')
  }

  /**
   * Check if user has any of the specified permissions
   */
  static hasAnyPermission(user: UserWithRoles, permissions: string[]): boolean {
    return permissions.some((permission) =>
      this.hasPermission(user, permission)
    )
  }

  /**
   * Check if user has all specified permissions
   */
  static hasAllPermissions(
    user: UserWithRoles,
    permissions: string[]
  ): boolean {
    return permissions.every((permission) =>
      this.hasPermission(user, permission)
    )
  }

  /**
   * Check if user has role
   */
  static hasRole(user: UserWithRoles, roleName: string): boolean {
    return user.roles.some((ur) => ur.role.name === roleName)
  }

  /**
   * Extract permissions from user roles
   */
  private static extractPermissions(roles: Array<{ role: Role }>): string[] {
    const permissions = new Set<string>()

    roles.forEach((userRole) => {
      const rolePermissions = userRole.role.permissions as string[]
      rolePermissions.forEach((permission) => permissions.add(permission))
    })

    return Array.from(permissions)
  }

  /**
   * Parse expiration time string to milliseconds
   */
  private static parseExpirationTime(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/)
    if (!match) {
      throw new Error('Invalid expiration time format')
    }

    const value = parseInt(match[1])
    const unit = match[2]

    switch (unit) {
      case 's':
        return value * 1000
      case 'm':
        return value * 60 * 1000
      case 'h':
        return value * 60 * 60 * 1000
      case 'd':
        return value * 24 * 60 * 60 * 1000
      default:
        throw new Error('Invalid time unit')
    }
  }

  /**
   * Generate secure random token
   */
  static generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex')
  }

  /**
   * Generate email verification token
   */
  static generateEmailVerificationToken(): string {
    return this.generateSecureToken(32)
  }

  /**
   * Generate password reset token
   */
  static generatePasswordResetToken(): string {
    return this.generateSecureToken(32)
  }

  /**
   * Validate session and get user
   */
  static async validateSession(
    sessionId: string
  ): Promise<UserWithRoles | null> {
    const session = await prisma.userSession.findUnique({
      where: { id: sessionId },
      include: {
        user: {
          include: {
            roles: {
              include: {
                role: true,
              },
            },
          },
        },
      },
    })

    if (!session || session.expiresAt < new Date()) {
      return null
    }

    // Update last used timestamp
    await this.updateSessionLastUsed(sessionId)

    return session.user as UserWithRoles
  }

  /**
   * Check if user account is locked
   */
  static isAccountLocked(user: User): boolean {
    return user.lockedUntil ? user.lockedUntil > new Date() : false
  }

  /**
   * Lock user account
   */
  static async lockAccount(
    userId: string,
    lockDurationMinutes: number = 30
  ): Promise<void> {
    const lockedUntil = new Date()
    lockedUntil.setMinutes(lockedUntil.getMinutes() + lockDurationMinutes)

    await prisma.user.update({
      where: { id: userId },
      data: {
        lockedUntil,
        loginAttempts: 0,
      },
    })
  }

  /**
   * Increment login attempts
   */
  static async incrementLoginAttempts(userId: string): Promise<number> {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        loginAttempts: {
          increment: 1,
        },
      },
    })

    // Lock account after 5 failed attempts
    if (user.loginAttempts >= 5) {
      await this.lockAccount(userId)
    }

    return user.loginAttempts
  }

  /**
   * Reset login attempts
   */
  static async resetLoginAttempts(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        loginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    })
  }

  /**
   * Get user login history
   */
  static async getUserLoginHistory(
    userId: string,
    limit: number = 10
  ): Promise<
    Array<{
      id: string
      ipAddress: string | null
      userAgent: string | null
      createdAt: Date
      lastUsedAt: Date | null
    }>
  > {
    return prisma.userSession.findMany({
      where: { userId },
      select: {
        id: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        lastUsedAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }

  /**
   * Check for suspicious login activity
   */
  static async checkSuspiciousActivity(
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{
    isSuspicious: boolean
    reason?: string
  }> {
    // Get recent sessions
    const recentSessions = await prisma.userSession.findMany({
      where: {
        userId,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      select: {
        ipAddress: true,
        userAgent: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Check for multiple different IP addresses
    const uniqueIPs = new Set(
      recentSessions.map((s) => s.ipAddress).filter(Boolean)
    )
    if (uniqueIPs.size > 5) {
      return {
        isSuspicious: true,
        reason: 'Multiple IP addresses detected',
      }
    }

    // Check for rapid session creation
    if (recentSessions.length > 10) {
      return {
        isSuspicious: true,
        reason: 'Too many login attempts',
      }
    }

    // Check for completely new device/location
    const hasKnownSession = recentSessions.some(
      (session) =>
        session.ipAddress === ipAddress ||
        (session.userAgent &&
          userAgent &&
          session.userAgent.includes(userAgent.split(' ')[0]))
    )

    if (!hasKnownSession && recentSessions.length > 0) {
      return {
        isSuspicious: true,
        reason: 'Login from unknown device/location',
      }
    }

    return { isSuspicious: false }
  }

  /**
   * Generate password strength score
   */
  static calculatePasswordStrength(password: string): {
    score: number
    feedback: string[]
  } {
    let score = 0
    const feedback: string[] = []

    // Length check
    if (password.length >= 8) score += 1
    else feedback.push('Password should be at least 8 characters long')

    if (password.length >= 12) score += 1
    else if (password.length >= 8)
      feedback.push('Consider using a longer password (12+ characters)')

    // Character variety
    if (/[a-z]/.test(password)) score += 1
    else feedback.push('Add lowercase letters')

    if (/[A-Z]/.test(password)) score += 1
    else feedback.push('Add uppercase letters')

    if (/\d/.test(password)) score += 1
    else feedback.push('Add numbers')

    if (/[^a-zA-Z\d]/.test(password)) score += 1
    else feedback.push('Add special characters')

    // Common patterns check
    const commonPatterns = [
      /123456/,
      /password/i,
      /qwerty/i,
      /abc123/i,
      /admin/i,
    ]

    if (commonPatterns.some((pattern) => pattern.test(password))) {
      score -= 2
      feedback.push('Avoid common patterns and dictionary words')
    }

    // Repetitive characters
    if (/(.)\1{2,}/.test(password)) {
      score -= 1
      feedback.push('Avoid repetitive characters')
    }

    return {
      score: Math.max(0, Math.min(6, score)),
      feedback,
    }
  }

  /**
   * Validate password against policy
   */
  static validatePasswordPolicy(password: string): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    // Minimum length
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long')
    }

    // Maximum length (prevent DoS)
    if (password.length > 128) {
      errors.push('Password must be less than 128 characters long')
    }

    // Character requirements
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number')
    }

    if (!/[^a-zA-Z\d]/.test(password)) {
      errors.push('Password must contain at least one special character')
    }

    // Check for common weak passwords
    const commonPasswords = [
      'password',
      'password123',
      '123456',
      'qwerty',
      'abc123',
      'admin',
      'admin123',
      'root',
      'user',
      'guest',
    ]

    if (
      commonPasswords.some((common) => password.toLowerCase().includes(common))
    ) {
      errors.push('Password contains common patterns that are not allowed')
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }
}
