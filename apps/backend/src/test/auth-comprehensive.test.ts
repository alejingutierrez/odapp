import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { PrismaClient } from '@prisma/client'
import { createTestApp } from './test-app'
import { AuthService } from '../lib/auth'
import { TwoFactorService } from '../lib/two-factor'
import { SecurityAuditService, SecurityEventType } from '../lib/security-audit'

const prisma = new PrismaClient()
const app = createTestApp()

describe('Comprehensive Authentication System Tests', () => {
  beforeAll(async () => {
    // All mocks are already set up in test-app.ts via vi.mock()
    // No additional setup needed
  })

  afterAll(async () => {
    // All mocks are already configured, no cleanup needed
  })

  describe('Password Security', () => {
    it('should validate password strength correctly', () => {
      const weakPassword = '123456'
      const mediumPassword = 'Password123'
      const strongPassword = 'MyStr0ng!P@ssw0rd'

      const weakResult = AuthService.calculatePasswordStrength(weakPassword)
      const mediumResult = AuthService.calculatePasswordStrength(mediumPassword)
      const strongResult = AuthService.calculatePasswordStrength(strongPassword)

      expect(weakResult.score).toBeLessThan(3)
      expect(weakResult.feedback.length).toBeGreaterThan(0)

      expect(mediumResult.score).toBeGreaterThan(weakResult.score)
      expect(strongResult.score).toBeGreaterThan(mediumResult.score)
    })

    it('should validate password policy', () => {
      const validPassword = 'ValidP@ssw0rd123'
      const invalidPassword = 'weak'

      const validResult = AuthService.validatePasswordPolicy(validPassword)
      const invalidResult = AuthService.validatePasswordPolicy(invalidPassword)

      expect(validResult.isValid).toBe(true)
      expect(validResult.errors).toHaveLength(0)

      expect(invalidResult.isValid).toBe(false)
      expect(invalidResult.errors.length).toBeGreaterThan(0)
    })
  })

  describe('Two-Factor Authentication with Backup Codes', () => {
    let testUser: {
      id: string
      email: string
      firstName: string
      lastName: string
      passwordHash: string
      emailVerified: boolean
    }
    let accessToken: string

    beforeAll(async () => {
      // Create test user
      testUser = await prisma.user.create({
        data: {
          email: 'comprehensive-test-2fa@example.com',
          firstName: 'TwoFactor',
          lastName: 'Test',
          passwordHash: await AuthService.hashPassword('TestPassword123!'),
          emailVerified: true,
        },
      })

      // Assign role
      const userRole = await prisma.role.findUnique({
        where: { name: 'employee' },
      })
      if (userRole) {
        await prisma.userRole.create({
          data: { userId: testUser.id, roleId: userRole.id },
        })
      }

      // Login to get token
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'comprehensive-test-2fa@example.com',
          password: 'TestPassword123!',
        })
        .expect(200)

      accessToken = loginResponse.body.data.tokens.accessToken
    })

    it('should setup TOTP and generate backup codes', async () => {
      const response = await request(app)
        .post('/api/v1/two-factor/totp/setup')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.secret).toBeTruthy()
      expect(response.body.data.qrCodeUrl).toBeTruthy()
      expect(response.body.data.backupCodes).toBeTruthy()
      expect(Array.isArray(response.body.data.backupCodes)).toBe(true)
      expect(response.body.data.backupCodes.length).toBe(10)
    })

    it('should enable TOTP with valid token', async () => {
      const setupData = TwoFactorService.generateTOTPSecret(
        'comprehensive-test-2fa@example.com'
      )
      const token = '123456' // Mock token for testing

      // Mock the TOTP verification to return true
      const originalVerify = TwoFactorService.verifyTOTPToken
      TwoFactorService.verifyTOTPToken = () => true

      const response = await request(app)
        .post('/api/v1/two-factor/totp/enable')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          secret: setupData.secret,
          token: token,
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe(
        'Two-factor authentication enabled successfully'
      )

      // Restore original function
      TwoFactorService.verifyTOTPToken = originalVerify
    })

    it('should store and verify backup codes', async () => {
      const backupCodes = TwoFactorService.generateBackupCodes()

      // Store backup codes
      await TwoFactorService.storeBackupCodes(testUser.id, backupCodes)

      // Verify a backup code
      const isValid = await TwoFactorService.verifyBackupCode(
        testUser.id,
        backupCodes[0]
      )
      expect(isValid).toBe(true)

      // Try to use the same backup code again (should fail)
      const isValidAgain = await TwoFactorService.verifyBackupCode(
        testUser.id,
        backupCodes[0]
      )
      expect(isValidAgain).toBe(false)

      // Verify another backup code
      const isValid2 = await TwoFactorService.verifyBackupCode(
        testUser.id,
        backupCodes[1]
      )
      expect(isValid2).toBe(true)
    })

    it('should get correct 2FA status with backup codes count', async () => {
      const status = await TwoFactorService.getTwoFactorStatus(testUser.id)

      expect(status.enabled).toBe(true)
      expect(status.hasSecret).toBe(true)
      expect(status.backupCodesCount).toBe(8) // 10 - 2 used = 8
    })
  })

  describe('SMS Verification', () => {
    it('should store and verify SMS codes', async () => {
      const phoneNumber = '+1234567890'
      const code = TwoFactorService.generateSMSCode()

      // Store SMS code
      await TwoFactorService.storeSMSCode(phoneNumber, code)

      // Verify SMS code
      const isValid = await TwoFactorService.verifySMSCode(phoneNumber, code)
      expect(isValid).toBe(true)

      // Try to use the same code again (should fail)
      const isValidAgain = await TwoFactorService.verifySMSCode(
        phoneNumber,
        code
      )
      expect(isValidAgain).toBe(false)
    })

    it('should reject expired SMS codes', async () => {
      const phoneNumber = '+1234567891'
      const code = '123456'

      // Manually create expired SMS code
      await prisma.smsVerificationCode.create({
        data: {
          phoneNumber,
          code,
          expiresAt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
        },
      })

      // Try to verify expired code
      const isValid = await TwoFactorService.verifySMSCode(phoneNumber, code)
      expect(isValid).toBe(false)
    })

    it('should clean up expired SMS codes', async () => {
      const phoneNumber = '+1234567892'
      const code = '654321'

      // Create expired SMS code
      await prisma.smsVerificationCode.create({
        data: {
          phoneNumber,
          code,
          expiresAt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
        },
      })

      // Clean up expired codes
      await TwoFactorService.cleanupExpiredSMSCodes()

      // Verify the expired code was deleted
      const expiredCode = await prisma.smsVerificationCode.findFirst({
        where: { phoneNumber },
      })
      expect(expiredCode).toBeNull()
    })
  })

  describe('Security Audit Logging', () => {
    let auditTestUser: {
      id: string
      email: string
      firstName: string
      lastName: string
      passwordHash: string
      emailVerified: boolean
    }

    beforeAll(async () => {
      auditTestUser = await prisma.user.create({
        data: {
          email: 'comprehensive-test-audit@example.com',
          firstName: 'Audit',
          lastName: 'Test',
          passwordHash: await AuthService.hashPassword('TestPassword123!'),
          emailVerified: true,
        },
      })
    })

    it('should log security events', async () => {
      await SecurityAuditService.logSecurityEvent({
        type: SecurityEventType.LOGIN_SUCCESS,
        userId: auditTestUser.id,
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        severity: 'low',
      })

      const events = await SecurityAuditService.getUserSecurityEvents(
        auditTestUser.id
      )
      expect(events.length).toBeGreaterThan(0)
      expect(events[0].action).toBe(SecurityEventType.LOGIN_SUCCESS)
    })

    it('should get security statistics', async () => {
      // Log multiple events
      await SecurityAuditService.logSecurityEvent({
        type: SecurityEventType.LOGIN_FAILED,
        userId: auditTestUser.id,
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        severity: 'medium',
      })

      await SecurityAuditService.logSecurityEvent({
        type: SecurityEventType.SUSPICIOUS_ACTIVITY,
        userId: auditTestUser.id,
        ipAddress: '192.168.1.1',
        userAgent: 'suspicious-agent',
        metadata: { reason: 'Multiple IP addresses' },
        severity: 'high',
      })

      const stats = await SecurityAuditService.getSecurityStatistics(1)
      expect(stats.totalEvents).toBeGreaterThan(0)
      expect(stats.eventsByType).toBeTruthy()
      expect(stats.suspiciousActivityCount).toBeGreaterThan(0)
    })
  })

  describe('Suspicious Activity Detection', () => {
    let suspiciousTestUser: {
      id: string
      email: string
      firstName: string
      lastName: string
      passwordHash: string
      emailVerified: boolean
    }

    beforeAll(async () => {
      suspiciousTestUser = await prisma.user.create({
        data: {
          email: 'comprehensive-test-suspicious@example.com',
          firstName: 'Suspicious',
          lastName: 'Test',
          passwordHash: await AuthService.hashPassword('TestPassword123!'),
          emailVerified: true,
        },
      })
    })

    it('should detect suspicious activity with multiple IPs', async () => {
      // Create multiple sessions with different IPs
      const sessions = []
      for (let i = 0; i < 6; i++) {
        const session = await AuthService.createSession(
          suspiciousTestUser.id,
          `192.168.1.${i}`,
          'test-agent'
        )
        sessions.push(session)
      }

      const result = await AuthService.checkSuspiciousActivity(
        suspiciousTestUser.id,
        '192.168.1.10',
        'test-agent'
      )

      expect(result.isSuspicious).toBe(true)
      expect(result.reason).toBe('Multiple IP addresses detected')

      // Clean up sessions
      for (const session of sessions) {
        await AuthService.revokeSession(session.id)
      }
    })

    it('should detect suspicious activity with too many sessions', async () => {
      // Create many sessions
      const sessions = []
      for (let i = 0; i < 12; i++) {
        const session = await AuthService.createSession(
          suspiciousTestUser.id,
          '127.0.0.1',
          'test-agent'
        )
        sessions.push(session)
      }

      const result = await AuthService.checkSuspiciousActivity(
        suspiciousTestUser.id,
        '127.0.0.1',
        'test-agent'
      )

      expect(result.isSuspicious).toBe(true)
      expect(result.reason).toBe('Too many login attempts')

      // Clean up sessions
      for (const session of sessions) {
        await AuthService.revokeSession(session.id)
      }
    })
  })

  describe('Session Management', () => {
    let sessionTestUser: {
      id: string
      email: string
      firstName: string
      lastName: string
      passwordHash: string
      emailVerified: boolean
    }
    let sessionToken: string

    beforeAll(async () => {
      sessionTestUser = await prisma.user.create({
        data: {
          email: 'comprehensive-test-session@example.com',
          firstName: 'Session',
          lastName: 'Test',
          passwordHash: await AuthService.hashPassword('TestPassword123!'),
          emailVerified: true,
        },
      })

      // Login to get token
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'comprehensive-test-session@example.com',
          password: 'TestPassword123!',
        })
        .expect(200)

      sessionToken = loginResponse.body.data.tokens.accessToken
    })

    it('should get user login history', async () => {
      const history = await AuthService.getUserLoginHistory(sessionTestUser.id)
      expect(Array.isArray(history)).toBe(true)
      expect(history.length).toBeGreaterThan(0)
      expect(history[0]).toHaveProperty('ipAddress')
      expect(history[0]).toHaveProperty('userAgent')
      expect(history[0]).toHaveProperty('createdAt')
    })

    it('should get user sessions via API', async () => {
      const response = await request(app)
        .get('/api/v1/auth/sessions')
        .set('Authorization', `Bearer ${sessionToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(response.body.data.length).toBeGreaterThan(0)
      expect(response.body.data[0]).toHaveProperty('isCurrent')
    })

    it('should revoke specific session', async () => {
      // Create another session
      const session = await AuthService.createSession(sessionTestUser.id)

      const response = await request(app)
        .delete(`/api/v1/auth/sessions/${session.id}`)
        .set('Authorization', `Bearer ${sessionToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Session revoked successfully')

      // Verify session was deleted
      const deletedSession = await prisma.userSession.findUnique({
        where: { id: session.id },
      })
      expect(deletedSession).toBeNull()
    })
  })

  describe('Integration Tests', () => {
    it('should handle complete authentication flow with 2FA and backup codes', async () => {
      // 1. Register user
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'comprehensive-test-integration@example.com',
          password: 'TestPassword123!',
          firstName: 'Integration',
          lastName: 'Test',
        })
        .expect(201)

      expect(registerResponse.body.success).toBe(true)

      // 2. Verify email
      await request(app)
        .post('/api/v1/auth/verify-email')
        .send({
          token: 'valid-token',
          email: 'comprehensive-test-integration@example.com',
        })
        .expect(200)

      // 3. Login
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'comprehensive-test-integration@example.com',
          password: 'TestPassword123!',
        })
        .expect(200)

      const accessToken = loginResponse.body.data.tokens.accessToken

      // 4. Setup 2FA
      const setupResponse = await request(app)
        .post('/api/v1/two-factor/totp/setup')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)

      const backupCodes = setupResponse.body.data.backupCodes

      // 5. Enable 2FA (mock verification)
      const originalVerify = TwoFactorService.verifyTOTPToken
      TwoFactorService.verifyTOTPToken = () => true

      await request(app)
        .post('/api/v1/two-factor/totp/enable')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          secret: setupResponse.body.data.secret,
          token: '123456',
        })
        .expect(200)

      TwoFactorService.verifyTOTPToken = originalVerify

      // 6. Test login with backup code
      const loginWith2FAResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'comprehensive-test-integration@example.com',
          password: 'TestPassword123!',
          backupCode: backupCodes[0],
        })
        .expect(200)

      expect(loginWith2FAResponse.body.success).toBe(true)
      expect(loginWith2FAResponse.body.data.tokens.accessToken).toBeTruthy()

      // 7. Verify backup code was consumed
      const newAccessToken = loginWith2FAResponse.body.data.tokens.accessToken
      const statusResponse = await request(app)
        .get('/api/v1/two-factor/status')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .expect(200)

      expect(statusResponse.body.data.backupCodesCount).toBe(9) // One used
    })
  })
})
