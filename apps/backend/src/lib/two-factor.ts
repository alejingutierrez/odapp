import crypto from 'crypto'

import { authenticator } from 'otplib'

import { prisma } from './prisma'

export interface TwoFactorSetupResult {
  secret: string
  qrCodeUrl: string
  backupCodes: string[]
}

export interface SMSProvider {
  sendSMS(_phoneNumber: string, _message: string): Promise<boolean>
}

export class TwoFactorService {
  private static smsProvider: SMSProvider | null = null

  /**
   * Set SMS provider for sending SMS codes
   */
  static setSMSProvider(provider: SMSProvider): void {
    this.smsProvider = provider
  }

  /**
   * Generate TOTP secret for user
   */
  static generateTOTPSecret(userEmail: string): TwoFactorSetupResult {
    const secret = authenticator.generateSecret()
    const serviceName = 'Oda Fashion Platform'
    const qrCodeUrl = authenticator.keyuri(userEmail, serviceName, secret)

    // Generate backup codes
    const backupCodes = this.generateBackupCodes()

    return {
      secret,
      qrCodeUrl,
      backupCodes,
    }
  }

  /**
   * Verify TOTP token
   */
  static verifyTOTPToken(secret: string, token: string): boolean {
    try {
      return authenticator.verify({ token, secret })
    } catch (_error) {
      return false
    }
  }

  /**
   * Enable two-factor authentication for user
   */
  static async enableTwoFactor(
    userId: string,
    secret: string,
    verificationToken: string
  ): Promise<boolean> {
    // Verify the token first
    if (!this.verifyTOTPToken(secret, verificationToken)) {
      return false
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: secret,
      },
    })

    return true
  }

  /**
   * Disable two-factor authentication for user
   */
  static async disableTwoFactor(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    })
  }

  /**
   * Verify two-factor authentication token for user
   */
  static async verifyUserTwoFactor(
    userId: string,
    token: string
  ): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return false
    }

    return this.verifyTOTPToken(user.twoFactorSecret, token)
  }

  /**
   * Generate SMS verification code
   */
  static generateSMSCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  /**
   * Send SMS verification code
   */
  static async sendSMSCode(
    phoneNumber: string,
    code: string
  ): Promise<boolean> {
    if (!this.smsProvider) {
      throw new Error('SMS provider not configured')
    }

    const message = `Your Oda verification code is: ${code}. This code will expire in 5 minutes.`
    return this.smsProvider.sendSMS(phoneNumber, message)
  }

  /**
   * Store SMS verification code in database
   */
  static async storeSMSCode(phoneNumber: string, code: string): Promise<void> {
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 5) // 5 minutes expiration

    // Delete existing code for this phone number
    await prisma.smsVerificationCode.deleteMany({
      where: { phoneNumber },
    })

    // Store new verification code
    await prisma.smsVerificationCode.create({
      data: {
        phoneNumber,
        code,
        expiresAt,
      },
    })
  }

  /**
   * Verify SMS code
   */
  static async verifySMSCode(
    phoneNumber: string,
    code: string
  ): Promise<boolean> {
    try {
      const smsCode = await prisma.smsVerificationCode.findFirst({
        where: {
          phoneNumber,
          expiresAt: {
            gt: new Date(),
          },
        },
      })

      if (!smsCode) {
        return false
      }

      const isValid = smsCode.code === code

      if (isValid) {
        // Delete the used code
        await prisma.smsVerificationCode.delete({
          where: { id: smsCode.id },
        })
      }

      return isValid
    } catch (error) {
      console.error('Error verifying SMS code:', error)
      return false
    }
  }

  /**
   * Generate backup codes for two-factor authentication
   */
  static generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = []

    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric code
      const code = crypto.randomBytes(4).toString('hex').toUpperCase()
      codes.push(code)
    }

    return codes
  }

  /**
   * Store backup codes for user
   */
  static async storeBackupCodes(
    userId: string,
    codes: string[]
  ): Promise<void> {
    // Delete existing backup codes
    await prisma.userBackupCode.deleteMany({
      where: { userId },
    })

    // Hash the backup codes before storing
    const bcrypt = await import('bcryptjs')
    const hashedCodes = await Promise.all(
      codes.map(async (code) => ({
        userId,
        codeHash: await bcrypt.hash(code, 10),
      }))
    )

    // Store new backup codes
    await prisma.userBackupCode.createMany({
      data: hashedCodes,
    })
  }

  /**
   * Verify backup code
   */
  static async verifyBackupCode(
    userId: string,
    code: string
  ): Promise<boolean> {
    try {
      // Get unused backup codes for user
      const backupCodes = await prisma.userBackupCode.findMany({
        where: {
          userId,
          used: false,
        },
      })

      const bcrypt = await import('bcryptjs')

      // Check each backup code
      for (const backupCode of backupCodes) {
        const isValid = await bcrypt.compare(code, backupCode.codeHash)

        if (isValid) {
          // Mark backup code as used
          await prisma.userBackupCode.update({
            where: { id: backupCode.id },
            data: {
              used: true,
              usedAt: new Date(),
            },
          })

          return true
        }
      }

      return false
    } catch (error) {
      console.error('Error verifying backup code:', error)
      return false
    }
  }

  /**
   * Check if user has two-factor authentication enabled
   */
  static async isTwoFactorEnabled(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorEnabled: true },
    })

    return user?.twoFactorEnabled ?? false
  }

  /**
   * Get two-factor authentication status for user
   */
  static async getTwoFactorStatus(userId: string): Promise<{
    enabled: boolean
    hasSecret: boolean
    backupCodesCount: number
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        twoFactorEnabled: true,
        twoFactorSecret: true,
      },
    })

    // Count unused backup codes
    const backupCodesCount = await prisma.userBackupCode.count({
      where: {
        userId,
        used: false,
      },
    })

    return {
      enabled: user?.twoFactorEnabled ?? false,
      hasSecret: !!user?.twoFactorSecret,
      backupCodesCount,
    }
  }

  /**
   * Clean up expired SMS codes
   */
  static async cleanupExpiredSMSCodes(): Promise<void> {
    try {
      await prisma.smsVerificationCode.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      })
    } catch (error) {
      console.error('Error cleaning up expired SMS codes:', error)
    }
  }
}

// Default SMS provider implementation (placeholder)
export class ConsoleSMSProvider implements SMSProvider {
  async sendSMS(_phoneNumber: string, _message: string): Promise<boolean> {
    console.log(`SMS to ${_phoneNumber}: ${_message}`)
    return true
  }
}

// Set default SMS provider for development
if (process.env.NODE_ENV === 'development') {
  TwoFactorService.setSMSProvider(new ConsoleSMSProvider())
}
