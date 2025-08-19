import { Router, Request, Response } from 'express'
import { body, validationResult } from 'express-validator'
import { TwoFactorService } from '../lib/two-factor'
import { EmailService } from '../lib/email'
import { authenticate, requireTwoFactor } from '../middleware/auth'
import { prisma } from '../lib/prisma'
import { SecurityAuditService, SecurityEventType } from '../lib/security-audit'

const router = Router()

// Validation rules
const enableTotpValidation = [
  body('token').isLength({ min: 6, max: 6 }).isNumeric().withMessage('TOTP token must be 6 digits')
]

const verifyTotpValidation = [
  body('token').isLength({ min: 6, max: 6 }).isNumeric().withMessage('TOTP token must be 6 digits')
]

const sendSmsValidation = [
  body('phoneNumber').isMobilePhone('any').withMessage('Valid phone number is required')
]

const verifySmsValidation = [
  body('phoneNumber').isMobilePhone('any').withMessage('Valid phone number is required'),
  body('code').isLength({ min: 6, max: 6 }).isNumeric().withMessage('SMS code must be 6 digits')
]

/**
 * GET /api/v1/two-factor/status
 * Get two-factor authentication status
 */
router.get('/status', authenticate, async (req: Request, res: Response) => {
  try {
    const status = await TwoFactorService.getTwoFactorStatus(req.user!.id)

    res.json({
      success: true,
      data: status
    })
  } catch (error) {
    console.error('Get 2FA status error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get two-factor authentication status'
    })
  }
})

/**
 * POST /api/v1/two-factor/totp/setup
 * Setup TOTP (Time-based One-Time Password) authentication
 */
router.post('/totp/setup', authenticate, async (req: Request, res: Response) => {
  try {
    const user = req.user!

    // Check if 2FA is already enabled
    const isEnabled = await TwoFactorService.isTwoFactorEnabled(user.id)
    if (isEnabled) {
      return res.status(400).json({
        success: false,
        error: 'Two-factor authentication is already enabled'
      })
    }

    // Generate TOTP secret and QR code
    const setupResult = TwoFactorService.generateTOTPSecret(user.email)

    res.json({
      success: true,
      message: 'TOTP setup initiated. Scan the QR code with your authenticator app.',
      data: {
        secret: setupResult.secret,
        qrCodeUrl: setupResult.qrCodeUrl,
        backupCodes: setupResult.backupCodes
      }
    })
  } catch (error) {
    console.error('TOTP setup error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to setup TOTP authentication'
    })
  }
})

/**
 * POST /api/v1/two-factor/totp/enable
 * Enable TOTP authentication
 */
router.post('/totp/enable', authenticate, enableTotpValidation, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      })
    }

    const { secret, token } = req.body
    const user = req.user!

    if (!secret) {
      return res.status(400).json({
        success: false,
        error: 'TOTP secret is required'
      })
    }

    // Enable two-factor authentication
    const success = await TwoFactorService.enableTwoFactor(user.id, secret, token)

    if (!success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid TOTP token. Please try again.'
      })
    }

    // Send confirmation email
    await EmailService.sendTwoFactorSetupEmail(user.email, user.firstName || 'User')

    // Log 2FA enabled event
    await SecurityAuditService.logSecurityEvent({
      type: SecurityEventType.TWO_FACTOR_ENABLED,
      userId: user.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      severity: 'low'
    })

    res.json({
      success: true,
      message: 'Two-factor authentication enabled successfully'
    })
  } catch (error) {
    console.error('Enable TOTP error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to enable TOTP authentication'
    })
  }
})

/**
 * POST /api/v1/two-factor/totp/disable
 * Disable TOTP authentication
 */
router.post('/totp/disable', authenticate, requireTwoFactor, async (req: Request, res: Response) => {
  try {
    const user = req.user!

    // Disable two-factor authentication
    await TwoFactorService.disableTwoFactor(user.id)

    // Log 2FA disabled event
    await SecurityAuditService.logSecurityEvent({
      type: SecurityEventType.TWO_FACTOR_DISABLED,
      userId: user.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      severity: 'high'
    })

    res.json({
      success: true,
      message: 'Two-factor authentication disabled successfully'
    })
  } catch (error) {
    console.error('Disable TOTP error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to disable TOTP authentication'
    })
  }
})

/**
 * POST /api/v1/two-factor/totp/verify
 * Verify TOTP token
 */
router.post('/totp/verify', authenticate, verifyTotpValidation, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      })
    }

    const { token } = req.body
    const user = req.user!

    const isValid = await TwoFactorService.verifyUserTwoFactor(user.id, token)

    if (!isValid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid TOTP token'
      })
    }

    res.json({
      success: true,
      message: 'TOTP token verified successfully'
    })
  } catch (error) {
    console.error('Verify TOTP error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to verify TOTP token'
    })
  }
})

/**
 * POST /api/v1/two-factor/sms/send
 * Send SMS verification code
 */
router.post('/sms/send', authenticate, sendSmsValidation, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      })
    }

    const { phoneNumber } = req.body

    // Generate SMS code
    const code = TwoFactorService.generateSMSCode()

    // Store code for verification
    await TwoFactorService.storeSMSCode(phoneNumber, code)

    // Send SMS
    const sent = await TwoFactorService.sendSMSCode(phoneNumber, code)

    if (!sent) {
      return res.status(500).json({
        success: false,
        error: 'Failed to send SMS code'
      })
    }

    res.json({
      success: true,
      message: 'SMS verification code sent successfully'
    })
  } catch (error) {
    console.error('Send SMS error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to send SMS verification code'
    })
  }
})

/**
 * POST /api/v1/two-factor/sms/verify
 * Verify SMS code
 */
router.post('/sms/verify', authenticate, verifySmsValidation, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      })
    }

    const { phoneNumber, code } = req.body

    const isValid = await TwoFactorService.verifySMSCode(phoneNumber, code)

    if (!isValid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired SMS code'
      })
    }

    res.json({
      success: true,
      message: 'SMS code verified successfully'
    })
  } catch (error) {
    console.error('Verify SMS error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to verify SMS code'
    })
  }
})

/**
 * POST /api/v1/two-factor/backup-codes/generate
 * Generate new backup codes
 */
router.post('/backup-codes/generate', authenticate, requireTwoFactor, async (req: Request, res: Response) => {
  try {
    const user = req.user!

    // Check if 2FA is enabled
    const isEnabled = await TwoFactorService.isTwoFactorEnabled(user.id)
    if (!isEnabled) {
      return res.status(400).json({
        success: false,
        error: 'Two-factor authentication must be enabled first'
      })
    }

    // Generate backup codes
    const backupCodes = TwoFactorService.generateBackupCodes()

    // Store backup codes (hashed)
    await TwoFactorService.storeBackupCodes(user.id, backupCodes)

    res.json({
      success: true,
      message: 'Backup codes generated successfully. Store them in a safe place.',
      data: {
        backupCodes
      }
    })
  } catch (error) {
    console.error('Generate backup codes error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to generate backup codes'
    })
  }
})

/**
 * POST /api/v1/two-factor/backup-codes/verify
 * Verify backup code
 */
router.post('/backup-codes/verify', authenticate, async (req: Request, res: Response) => {
  try {
    const { code } = req.body
    const user = req.user!

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Backup code is required'
      })
    }

    const isValid = await TwoFactorService.verifyBackupCode(user.id, code)

    if (!isValid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid backup code'
      })
    }

    res.json({
      success: true,
      message: 'Backup code verified successfully'
    })
  } catch (error) {
    console.error('Verify backup code error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to verify backup code'
    })
  }
})

export default router