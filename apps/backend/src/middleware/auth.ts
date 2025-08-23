import { Request, Response, NextFunction } from 'express'
import { AuthService, TokenPayload, UserWithRoles } from '../lib/auth'
import { TwoFactorService } from '../lib/two-factor'

// Extend Express Request type to include user
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: UserWithRoles
      tokenPayload?: TokenPayload
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user: UserWithRoles
  tokenPayload: TokenPayload
}

/**
 * Authentication middleware - verifies JWT token and loads user
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
      })
      return
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    // Verify JWT token
    const tokenPayload = await AuthService.verifyToken(token)

    // Validate session
    const user = await AuthService.validateSession(tokenPayload.sessionId)

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired session',
        code: 'SESSION_INVALID',
      })
      return
    }

    // Check if account is locked
    if (AuthService.isAccountLocked(user)) {
      res.status(423).json({
        success: false,
        error: 'Account is temporarily locked',
        code: 'ACCOUNT_LOCKED',
      })
      return
    }

    // Attach user and token payload to request
    req.user = user
    req.tokenPayload = tokenPayload

    next()
  } catch (error) {
    console.error('Authentication error:', error)
    res.status(401).json({
      success: false,
      error: 'Invalid authentication token',
      code: 'TOKEN_INVALID',
    })
  }
}

/**
 * Optional authentication middleware - doesn't fail if no token provided
 */
export const optionalAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next()
      return
    }

    const token = authHeader.substring(7)
    const tokenPayload = await AuthService.verifyToken(token)
    const user = await AuthService.validateSession(tokenPayload.sessionId)

    if (user && !AuthService.isAccountLocked(user)) {
      req.user = user
      req.tokenPayload = tokenPayload
    }

    next()
  } catch (error) {
    // Silently continue without authentication
    next()
  }
}

/**
 * Two-factor authentication middleware
 */
export const requireTwoFactor = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
      })
      return
    }

    const twoFactorEnabled = await TwoFactorService.isTwoFactorEnabled(
      req.user.id
    )

    if (!twoFactorEnabled) {
      next()
      return
    }

    const twoFactorToken = req.headers['x-two-factor-token'] as string
    const backupCode = req.headers['x-backup-code'] as string

    if (!twoFactorToken && !backupCode) {
      res.status(403).json({
        success: false,
        error: 'Two-factor authentication required',
        code: 'TWO_FACTOR_REQUIRED',
      })
      return
    }

    let isValid = false

    // Try TOTP token first
    if (twoFactorToken) {
      isValid = await TwoFactorService.verifyUserTwoFactor(
        req.user.id,
        twoFactorToken
      )
    }

    // If TOTP failed, try backup code
    if (!isValid && backupCode) {
      isValid = await TwoFactorService.verifyBackupCode(req.user.id, backupCode)
    }

    if (!isValid) {
      res.status(403).json({
        success: false,
        error: 'Invalid two-factor authentication code or backup code',
        code: 'TWO_FACTOR_INVALID',
      })
      return
    }

    next()
  } catch (error) {
    console.error('Two-factor authentication error:', error)
    res.status(500).json({
      success: false,
      error: 'Two-factor authentication failed',
      code: 'TWO_FACTOR_ERROR',
    })
  }
}

/**
 * Permission-based authorization middleware
 */
export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
      })
      return
    }

    if (!AuthService.hasPermission(req.user, permission)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        code: 'PERMISSION_DENIED',
        required: permission,
      })
      return
    }

    next()
  }
}

/**
 * Multiple permissions authorization (user must have ANY of the permissions)
 */
export const requireAnyPermission = (permissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
      })
      return
    }

    if (!AuthService.hasAnyPermission(req.user, permissions)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        code: 'PERMISSION_DENIED',
        required: permissions,
      })
      return
    }

    next()
  }
}

/**
 * Multiple permissions authorization (user must have ALL permissions)
 */
export const requireAllPermissions = (permissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
      })
      return
    }

    if (!AuthService.hasAllPermissions(req.user, permissions)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        code: 'PERMISSION_DENIED',
        required: permissions,
      })
      return
    }

    next()
  }
}

/**
 * Role-based authorization middleware
 */
export const requireRole = (roleName: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
      })
      return
    }

    if (!AuthService.hasRole(req.user, roleName)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient role privileges',
        code: 'ROLE_DENIED',
        required: roleName,
      })
      return
    }

    next()
  }
}

/**
 * Multiple roles authorization (user must have ANY of the roles)
 */
export const requireAnyRole = (roleNames: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
      })
      return
    }

    const hasAnyRole = roleNames.some((roleName) =>
      AuthService.hasRole(req.user!, roleName)
    )

    if (!hasAnyRole) {
      res.status(403).json({
        success: false,
        error: 'Insufficient role privileges',
        code: 'ROLE_DENIED',
        required: roleNames,
      })
      return
    }

    next()
  }
}

/**
 * Admin-only middleware
 */
export const requireAdmin = requireRole('admin')

/**
 * Self or admin middleware - allows access if user is accessing their own data or is admin
 */
export const requireSelfOrAdmin = (userIdParam: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
      })
      return
    }

    const targetUserId = req.params[userIdParam]
    const isOwner = req.user.id === targetUserId
    const isAdmin = AuthService.hasRole(req.user, 'admin')

    if (!isOwner && !isAdmin) {
      res.status(403).json({
        success: false,
        error: 'Access denied - can only access own data or admin required',
        code: 'ACCESS_DENIED',
      })
      return
    }

    next()
  }
}

/**
 * Authorization middleware - checks if user has required permissions
 */
export const authorize = (permissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
      })
      return
    }

    const hasPermission = permissions.some((permission) =>
      AuthService.hasPermission(req.user!, permission)
    )

    if (!hasPermission) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        code: 'PERMISSION_DENIED',
        required: permissions,
      })
      return
    }

    next()
  }
}

/**
 * Rate limiting middleware for authentication endpoints
 */
export const authRateLimit = (
  maxAttempts: number = 5,
  windowMinutes: number = 15
) => {
  const attempts = new Map<string, { count: number; resetTime: number }>()

  return (req: Request, res: Response, next: NextFunction): void => {
    const clientId = req.ip || 'unknown'
    const now = Date.now()
    const windowMs = windowMinutes * 60 * 1000

    const clientAttempts = attempts.get(clientId)

    if (!clientAttempts || now > clientAttempts.resetTime) {
      attempts.set(clientId, { count: 1, resetTime: now + windowMs })
      next()
      return
    }

    if (clientAttempts.count >= maxAttempts) {
      res.status(429).json({
        success: false,
        error: 'Too many authentication attempts',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((clientAttempts.resetTime - now) / 1000),
      })
      return
    }

    clientAttempts.count++
    next()
  }
}
