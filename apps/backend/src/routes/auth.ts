import { Router, Request, Response } from 'express'
import { body, validationResult } from 'express-validator'

import { env } from '../config/env'
import { AuthService, UserWithRoles } from '../lib/auth'
import { EmailService } from '../lib/email'
import { prisma } from '../lib/prisma'
import { SecurityAuditService, SecurityEventType } from '../lib/security-audit'
import { TwoFactorService } from '../lib/two-factor'
import {
  authenticate,
  authRateLimit,
  requireTwoFactor,
} from '../middleware/auth'

const router = Router()

// Validation rules
const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
  body('firstName')
    .trim()
    .isLength({ min: 1 })
    .withMessage('First name is required'),
  body('lastName')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Last name is required'),
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters'),
]

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
]

const forgotPasswordValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
]

const resetPasswordValidation = [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
]

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
]

/**
 * POST /api/v1/auth/register
 * Register a new user
 */
router.post(
  '/register',
  authRateLimit(10, 60),
  registerValidation,
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
        })
      }

      const { email, password, firstName, lastName, username } = req.body

      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ email }, ...(username ? [{ username }] : [])],
        },
      })

      if (existingUser) {
        return res.status(409).json({
          success: false,
          error:
            existingUser.email === email
              ? 'Email already registered'
              : 'Username already taken',
        })
      }

      // Hash password
      const passwordHash = await AuthService.hashPassword(password)

      // Generate email verification token
      const emailVerificationToken =
        AuthService.generateEmailVerificationToken()

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          username,
          firstName,
          lastName,
          passwordHash,
          emailVerified: false,
        },
      })

      // Log security event
      await SecurityAuditService.logSecurityEvent({
        type: SecurityEventType.ACCOUNT_CREATED,
        userId: user.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        severity: 'low',
      })

      // Store email verification token (in a real app, you'd store this in Redis or database)
      // For now, we'll create a simple verification URL
      const verificationUrl = `${env.FRONTEND_URL}/verify-email?token=${emailVerificationToken}&email=${encodeURIComponent(email)}`

      // Send verification email
      await EmailService.sendEmailVerification(email, {
        userName: firstName,
        verificationUrl,
      })

      // Assign default role (user)
      const defaultRole = await prisma.role.findUnique({
        where: { name: 'user' },
      })

      if (defaultRole) {
        await prisma.userRole.create({
          data: {
            userId: user.id,
            roleId: defaultRole.id,
          },
        })
      }

      res.status(201).json({
        success: true,
        message:
          'User registered successfully. Please check your email to verify your account.',
        data: {
          userId: user.id,
          email: user.email,
          emailVerified: user.emailVerified,
        },
      })
    } catch (error) {
      console.error('Registration error:', error)
      res.status(500).json({
        success: false,
        error: 'Registration failed',
      })
    }
  }
)

/**
 * POST /api/v1/auth/login
 * Login user
 */
router.post(
  '/login',
  authRateLimit(10, 15),
  loginValidation,
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
        })
      }

      const { email, password, twoFactorToken, backupCode } = req.body
      const ipAddress = req.ip
      const userAgent = req.get('User-Agent')

      // Get user with roles
      const user = await AuthService.getUserByEmailWithRoles(email)

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials',
        })
      }

      // Check if account is locked
      if (AuthService.isAccountLocked(user)) {
        // Log account locked event
        await SecurityAuditService.logSecurityEvent({
          type: SecurityEventType.LOGIN_LOCKED,
          userId: user.id,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          severity: 'high',
        })

        return res.status(423).json({
          success: false,
          error:
            'Account is temporarily locked due to multiple failed login attempts',
        })
      }

      // Verify password
      const isPasswordValid = await AuthService.verifyPassword(
        password,
        user.passwordHash
      )

      if (!isPasswordValid) {
        const attempts = await AuthService.incrementLoginAttempts(user.id)

        // Log failed login attempt
        await SecurityAuditService.logSecurityEvent({
          type: SecurityEventType.LOGIN_FAILED,
          userId: user.id,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          metadata: { attempts, reason: 'invalid_password' },
          severity: attempts >= 3 ? 'medium' : 'low',
        })

        return res.status(401).json({
          success: false,
          error: 'Invalid credentials',
        })
      }

      // Check if email is verified
      if (!user.emailVerified) {
        return res.status(403).json({
          success: false,
          error:
            'Email not verified. Please check your email and verify your account.',
          code: 'EMAIL_NOT_VERIFIED',
        })
      }

      // Check two-factor authentication
      const twoFactorEnabled = await TwoFactorService.isTwoFactorEnabled(
        user.id
      )

      if (twoFactorEnabled) {
        if (!twoFactorToken && !backupCode) {
          return res.status(403).json({
            success: false,
            error: 'Two-factor authentication required',
            code: 'TWO_FACTOR_REQUIRED',
          })
        }

        let isTwoFactorValid = false

        // Try TOTP token first
        if (twoFactorToken) {
          isTwoFactorValid = await TwoFactorService.verifyUserTwoFactor(
            user.id,
            twoFactorToken
          )
        }

        // If TOTP failed, try backup code
        if (!isTwoFactorValid && backupCode) {
          isTwoFactorValid = await TwoFactorService.verifyBackupCode(
            user.id,
            backupCode
          )
        }

        if (!isTwoFactorValid) {
          return res.status(403).json({
            success: false,
            error: 'Invalid two-factor authentication code or backup code',
          })
        }
      }

      // Create session
      const session = await AuthService.createSession(
        user.id,
        ipAddress,
        userAgent
      )

      // Generate tokens
      const tokens = await AuthService.generateTokens(user, session.id)

      // Check for suspicious activity
      const suspiciousActivity = await AuthService.checkSuspiciousActivity(
        user.id,
        ipAddress,
        userAgent
      )

      if (suspiciousActivity.isSuspicious) {
        await SecurityAuditService.logSecurityEvent({
          type: SecurityEventType.SUSPICIOUS_ACTIVITY,
          userId: user.id,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          metadata: { reason: suspiciousActivity.reason },
          severity: 'high',
        })
      }

      // Reset login attempts
      await AuthService.resetLoginAttempts(user.id)

      // Log successful login
      await SecurityAuditService.logSecurityEvent({
        type: SecurityEventType.LOGIN_SUCCESS,
        userId: user.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        severity: 'low',
      })

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            avatar: user.avatar,
            roles: user.roles.map((ur) => ur.role.name),
            permissions: AuthService.hasPermission(user, '*')
              ? ['*']
              : user.roles.flatMap((ur) => ur.role.permissions as string[]),
          },
          tokens: {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresAt: tokens.expiresAt,
          },
        },
      })
    } catch (error) {
      console.error('Login error:', error)
      res.status(500).json({
        success: false,
        error: 'Login failed',
      })
    }
  }
)

/**
 * POST /api/v1/auth/refresh
 * Refresh access token
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required',
      })
    }

    // Find session by refresh token
    const session = await prisma.userSession.findUnique({
      where: { refreshToken },
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
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired refresh token',
      })
    }

    const user = session.user as UserWithRoles

    // Check if account is locked
    if (AuthService.isAccountLocked(user)) {
      return res.status(423).json({
        success: false,
        error: 'Account is temporarily locked',
      })
    }

    // Generate new tokens
    const tokens = await AuthService.generateTokens(user, session.id)

    // Update session
    await prisma.userSession.update({
      where: { id: session.id },
      data: {
        token: tokens.accessToken,
        expiresAt: tokens.expiresAt,
        lastUsedAt: new Date(),
      },
    })

    res.json({
      success: true,
      data: {
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: tokens.expiresAt,
        },
      },
    })
  } catch (error) {
    console.error('Token refresh error:', error)
    res.status(500).json({
      success: false,
      error: 'Token refresh failed',
    })
  }
})

/**
 * POST /api/v1/auth/logout
 * Logout user (revoke session)
 */
router.post('/logout', authenticate, async (req: Request, res: Response) => {
  try {
    const sessionId = req.tokenPayload?.sessionId

    if (sessionId) {
      await AuthService.revokeSession(sessionId)
    }

    res.json({
      success: true,
      message: 'Logged out successfully',
    })
  } catch (error) {
    console.error('Logout error:', error)
    res.status(500).json({
      success: false,
      error: 'Logout failed',
    })
  }
})

/**
 * POST /api/v1/auth/logout-all
 * Logout from all devices (revoke all sessions)
 */
router.post(
  '/logout-all',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      await AuthService.revokeAllUserSessions(req.user!.id)

      res.json({
        success: true,
        message: 'Logged out from all devices successfully',
      })
    } catch (error) {
      console.error('Logout all error:', error)
      res.status(500).json({
        success: false,
        error: 'Logout from all devices failed',
      })
    }
  }
)

/**
 * POST /api/v1/auth/forgot-password
 * Request password reset
 */
router.post(
  '/forgot-password',
  authRateLimit(5, 60),
  forgotPasswordValidation,
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
        })
      }

      const { email } = req.body

      const user = await prisma.user.findUnique({
        where: { email },
      })

      // Always return success to prevent email enumeration
      if (!user) {
        return res.json({
          success: true,
          message:
            'If an account with that email exists, a password reset link has been sent.',
        })
      }

      // Generate reset token
      const resetToken = AuthService.generatePasswordResetToken()
      const resetTokenExpiry = new Date()
      resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1) // 1 hour expiry

      // Store reset token (in production, use Redis or database)
      // For now, we'll create a simple reset URL
      const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`

      // Send password reset email
      await EmailService.sendPasswordReset(email, {
        userName: user.firstName || 'User',
        resetUrl,
      })

      res.json({
        success: true,
        message:
          'If an account with that email exists, a password reset link has been sent.',
      })
    } catch (error) {
      console.error('Forgot password error:', error)
      res.status(500).json({
        success: false,
        error: 'Password reset request failed',
      })
    }
  }
)

/**
 * POST /api/v1/auth/reset-password
 * Reset password with token
 */
router.post(
  '/reset-password',
  authRateLimit(5, 60),
  resetPasswordValidation,
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
        })
      }

      const { password, email } = req.body

      // In production, you would validate the token from Redis/database
      // For now, we'll just check if user exists
      const user = await prisma.user.findUnique({
        where: { email },
      })

      if (!user) {
        return res.status(400).json({
          success: false,
          error: 'Invalid or expired reset token',
        })
      }

      // Hash new password
      const passwordHash = await AuthService.hashPassword(password)

      // Update password and clear any account locks
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          loginAttempts: 0,
          lockedUntil: null,
        },
      })

      // Revoke all existing sessions for security
      await AuthService.revokeAllUserSessions(user.id)

      // Log password reset completion
      await SecurityAuditService.logSecurityEvent({
        type: SecurityEventType.PASSWORD_RESET_COMPLETED,
        userId: user.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        severity: 'medium',
      })

      res.json({
        success: true,
        message:
          'Password reset successfully. Please log in with your new password.',
      })
    } catch (error) {
      console.error('Reset password error:', error)
      res.status(500).json({
        success: false,
        error: 'Password reset failed',
      })
    }
  }
)

/**
 * POST /api/v1/auth/change-password
 * Change password (authenticated)
 */
router.post(
  '/change-password',
  authenticate,
  requireTwoFactor,
  changePasswordValidation,
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
        })
      }

      const { currentPassword, newPassword } = req.body
      const user = req.user!

      // Verify current password
      const isCurrentPasswordValid = await AuthService.verifyPassword(
        currentPassword,
        user.passwordHash
      )

      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          error: 'Current password is incorrect',
        })
      }

      // Hash new password
      const passwordHash = await AuthService.hashPassword(newPassword)

      // Update password
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      })

      // Revoke all other sessions for security (keep current session)
      await prisma.userSession.deleteMany({
        where: {
          userId: user.id,
          id: { not: req.tokenPayload!.sessionId },
        },
      })

      // Log password change
      await SecurityAuditService.logSecurityEvent({
        type: SecurityEventType.PASSWORD_CHANGED,
        userId: user.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        severity: 'medium',
      })

      res.json({
        success: true,
        message: 'Password changed successfully',
      })
    } catch (error) {
      console.error('Change password error:', error)
      res.status(500).json({
        success: false,
        error: 'Password change failed',
      })
    }
  }
)

/**
 * POST /api/v1/auth/verify-email
 * Verify email address
 */
router.post('/verify-email', async (req: Request, res: Response) => {
  try {
    const { token, email } = req.body

    if (!token || !email) {
      return res.status(400).json({
        success: false,
        error: 'Token and email are required',
      })
    }

    // In production, you would validate the token from Redis/database
    // For now, we'll just mark the email as verified
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid verification token',
      })
    }

    if (user.emailVerified) {
      return res.json({
        success: true,
        message: 'Email already verified',
      })
    }

    // Mark email as verified
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
    })

    // Log email verification
    await SecurityAuditService.logSecurityEvent({
      type: SecurityEventType.EMAIL_VERIFIED,
      userId: user.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      severity: 'low',
    })

    // Send welcome email
    await EmailService.sendWelcomeEmail(email, {
      userName: user.firstName || 'User',
      loginUrl: `${env.FRONTEND_URL}/login`,
    })

    res.json({
      success: true,
      message: 'Email verified successfully',
    })
  } catch (error) {
    console.error('Email verification error:', error)
    res.status(500).json({
      success: false,
      error: 'Email verification failed',
    })
  }
})

/**
 * GET /api/v1/auth/me
 * Get current user profile
 */
router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const user = req.user!

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        phone: user.phone,
        emailVerified: user.emailVerified,
        twoFactorEnabled: user.twoFactorEnabled,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        roles: user.roles.map((ur) => ({
          id: ur.role.id,
          name: ur.role.name,
          description: ur.role.description,
          permissions: ur.role.permissions,
        })),
        permissions: AuthService.hasPermission(user, '*')
          ? ['*']
          : user.roles.flatMap((ur) => ur.role.permissions as string[]),
      },
    })
  } catch (error) {
    console.error('Get profile error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get user profile',
    })
  }
})

/**
 * GET /api/v1/auth/sessions
 * Get user sessions
 */
router.get('/sessions', authenticate, async (req: Request, res: Response) => {
  try {
    const sessions = await prisma.userSession.findMany({
      where: { userId: req.user!.id },
      orderBy: { lastUsedAt: 'desc' },
      select: {
        id: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        lastUsedAt: true,
        expiresAt: true,
      },
    })

    res.json({
      success: true,
      data: sessions.map((session) => ({
        ...session,
        isCurrent: session.id === req.tokenPayload!.sessionId,
      })),
    })
  } catch (error) {
    console.error('Get sessions error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get sessions',
    })
  }
})

/**
 * DELETE /api/v1/auth/sessions/:sessionId
 * Revoke specific session
 */
router.delete(
  '/sessions/:sessionId',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params
      const currentSessionId = req.tokenPayload!.sessionId

      if (sessionId === currentSessionId) {
        return res.status(400).json({
          success: false,
          error: 'Cannot revoke current session. Use logout instead.',
        })
      }

      await prisma.userSession.deleteMany({
        where: {
          id: sessionId,
          userId: req.user!.id,
        },
      })

      res.json({
        success: true,
        message: 'Session revoked successfully',
      })
    } catch (error) {
      console.error('Revoke session error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to revoke session',
      })
    }
  }
)

export default router
