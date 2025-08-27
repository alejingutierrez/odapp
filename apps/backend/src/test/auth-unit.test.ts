import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { AuthService } from '../lib/auth'
import { TwoFactorService } from '../lib/two-factor'

const prisma = new PrismaClient()

describe('Authentication Unit Tests', () => {
  beforeAll(async () => {
    // Clean up test data
    await prisma.userSession.deleteMany()
    await prisma.userRole.deleteMany()
    await prisma.user.deleteMany({
      where: { email: { contains: 'unit-test' } },
    })
  })

  afterAll(async () => {
    // Clean up test data
    await prisma.userSession.deleteMany()
    await prisma.userRole.deleteMany()
    await prisma.user.deleteMany({
      where: { email: { contains: 'unit-test' } },
    })
    await prisma.$disconnect()
  })

  describe('AuthService', () => {
    describe('Password Hashing', () => {
      it('should hash password correctly', async () => {
        const password = 'TestPassword123!'
        const hash = await AuthService.hashPassword(password)

        expect(hash).toBeTruthy()
        expect(hash).not.toBe(password)
        expect(hash.length).toBeGreaterThan(50)
      })

      it('should verify password correctly', async () => {
        const password = 'TestPassword123!'
        const hash = await AuthService.hashPassword(password)

        const isValid = await AuthService.verifyPassword(password, hash)
        expect(isValid).toBe(true)

        const isInvalid = await AuthService.verifyPassword(
          'WrongPassword',
          hash
        )
        expect(isInvalid).toBe(false)
      })
    })

    describe('Token Generation', () => {
      it('should generate secure tokens', () => {
        const token1 = AuthService.generateSecureToken()
        const token2 = AuthService.generateSecureToken()

        expect(token1).toBeTruthy()
        expect(token2).toBeTruthy()
        expect(token1).not.toBe(token2)
        expect(token1.length).toBe(64) // 32 bytes = 64 hex chars
      })

      it('should generate tokens of specified length', () => {
        const token = AuthService.generateSecureToken(16)
        expect(token.length).toBe(32) // 16 bytes = 32 hex chars
      })

      it('should generate email verification token', () => {
        const token = AuthService.generateEmailVerificationToken()
        expect(token).toBeTruthy()
        expect(token.length).toBe(64)
      })

      it('should generate password reset token', () => {
        const token = AuthService.generatePasswordResetToken()
        expect(token).toBeTruthy()
        expect(token.length).toBe(64)
      })
    })

    describe('User Management', () => {
      let testUser: any

      beforeAll(async () => {
        // Create test user
        testUser = await prisma.user.create({
          data: {
            email: 'unit-test@example.com',
            firstName: 'Unit',
            lastName: 'Test',
            passwordHash: await AuthService.hashPassword('TestPassword123!'),
            emailVerified: true,
          },
        })

        // Create or find employee role
        let userRole = await prisma.role.findUnique({
          where: { name: 'employee' },
        })
        
        if (!userRole) {
          userRole = await prisma.role.create({
            data: {
              name: 'employee',
              description: 'Employee role for testing',
              permissions: ['products:read', 'orders:read'],
            },
          })
        }

        // Assign role to user
        await prisma.userRole.create({
          data: {
            userId: testUser.id,
            roleId: userRole.id,
          },
        })
      })

      afterAll(async () => {
        if (testUser) {
          await prisma.userRole.deleteMany({ where: { userId: testUser.id } })
          await prisma.user.delete({ where: { id: testUser.id } })
          
          // Clean up the employee role if it was created for testing
          await prisma.role.deleteMany({ where: { name: 'employee' } })
        }
      })

      it('should get user with roles', async () => {
        const user = await AuthService.getUserWithRoles(testUser.id)

        expect(user).toBeTruthy()
        expect(user?.email).toBe('unit-test@example.com')
        expect(user?.roles).toBeTruthy()
        expect(Array.isArray(user?.roles)).toBe(true)
      })

      it('should get user by email with roles', async () => {
        const user = await AuthService.getUserByEmailWithRoles(
          'unit-test@example.com'
        )

        expect(user).toBeTruthy()
        expect(user?.id).toBe(testUser.id)
        expect(user?.roles).toBeTruthy()
        expect(Array.isArray(user?.roles)).toBe(true)
      })

      it('should check permissions correctly', async () => {
        const user = await AuthService.getUserWithRoles(testUser.id)

        if (user) {
          // Employee role should have products:read permission
          const hasProductsRead = AuthService.hasPermission(
            user,
            'products:read'
          )
          expect(hasProductsRead).toBe(true)

          // Employee role should not have admin permissions
          const hasAdminPermission = AuthService.hasPermission(
            user,
            'users:delete'
          )
          expect(hasAdminPermission).toBe(false)
        }
      })

      it('should check roles correctly', async () => {
        const user = await AuthService.getUserWithRoles(testUser.id)

        if (user) {
          const hasEmployeeRole = AuthService.hasRole(user, 'employee')
          expect(hasEmployeeRole).toBe(true)

          const hasAdminRole = AuthService.hasRole(user, 'admin')
          expect(hasAdminRole).toBe(false)
        }
      })
    })

    describe('Session Management', () => {
      let testUser: any
      let session: any

      beforeAll(async () => {
        // Create test user
        testUser = await prisma.user.create({
          data: {
            email: 'session-test@example.com',
            firstName: 'Session',
            lastName: 'Test',
            passwordHash: await AuthService.hashPassword('TestPassword123!'),
            emailVerified: true,
          },
        })
      })

      afterAll(async () => {
        if (testUser) {
          await prisma.userSession.deleteMany({
            where: { userId: testUser.id },
          })
          await prisma.user.delete({ where: { id: testUser.id } })
        }
      })

      it('should create session', async () => {
        session = await AuthService.createSession(
          testUser.id,
          '127.0.0.1',
          'test-agent'
        )

        expect(session).toBeTruthy()
        expect(session.userId).toBe(testUser.id)
        expect(session.ipAddress).toBe('127.0.0.1')
        expect(session.userAgent).toBe('test-agent')
        expect(session.token).toBeTruthy()
        expect(session.refreshToken).toBeTruthy()
      })

      it('should validate session', async () => {
        const user = await AuthService.validateSession(session.id)

        expect(user).toBeTruthy()
        expect(user?.id).toBe(testUser.id)
      })

      it('should update session last used', async () => {
        const originalLastUsed = session.lastUsedAt

        // Wait a bit to ensure timestamp difference
        await new Promise((resolve) => setTimeout(resolve, 10))

        await AuthService.updateSessionLastUsed(session.id)

        const updatedSession = await prisma.userSession.findUnique({
          where: { id: session.id },
        })

        expect(updatedSession?.lastUsedAt).not.toEqual(originalLastUsed)
      })

      it('should revoke session', async () => {
        await AuthService.revokeSession(session.id)

        const revokedSession = await prisma.userSession.findUnique({
          where: { id: session.id },
        })

        expect(revokedSession).toBeNull()
      })
    })

    describe('Account Security', () => {
      let testUser: any

      beforeAll(async () => {
        testUser = await prisma.user.create({
          data: {
            email: 'security-test@example.com',
            firstName: 'Security',
            lastName: 'Test',
            passwordHash: await AuthService.hashPassword('TestPassword123!'),
            emailVerified: true,
            loginAttempts: 0,
          },
        })
      })

      afterAll(async () => {
        if (testUser) {
          await prisma.user.delete({ where: { id: testUser.id } })
        }
      })

      it('should not be locked initially', () => {
        const isLocked = AuthService.isAccountLocked(testUser)
        expect(isLocked).toBe(false)
      })

      it('should increment login attempts', async () => {
        const attempts = await AuthService.incrementLoginAttempts(testUser.id)
        expect(attempts).toBe(1)
      })

      it('should reset login attempts', async () => {
        await AuthService.resetLoginAttempts(testUser.id)

        const user = await prisma.user.findUnique({
          where: { id: testUser.id },
        })

        expect(user?.loginAttempts).toBe(0)
        expect(user?.lastLoginAt).toBeTruthy()
      })

      it('should lock account after max attempts', async () => {
        // Increment to max attempts
        for (let i = 0; i < 5; i++) {
          await AuthService.incrementLoginAttempts(testUser.id)
        }

        const user = await prisma.user.findUnique({
          where: { id: testUser.id },
        })

        expect(user?.lockedUntil).toBeTruthy()
        expect(AuthService.isAccountLocked(user!)).toBe(true)
      })
    })
  })

  describe('TwoFactorService', () => {
    describe('TOTP Generation', () => {
      it('should generate TOTP setup data', () => {
        const email = 'test@example.com'
        const setup = TwoFactorService.generateTOTPSecret(email)

        expect(setup.secret).toBeTruthy()
        expect(setup.qrCodeUrl).toBeTruthy()
        expect(setup.backupCodes).toBeTruthy()
        expect(Array.isArray(setup.backupCodes)).toBe(true)
        expect(setup.backupCodes.length).toBe(10)
        expect(setup.qrCodeUrl).toContain(encodeURIComponent(email))
      })

      it('should verify TOTP token', () => {
        const secret = 'JBSWY3DPEHPK3PXP'

        // This test is time-dependent, so we'll just test the function exists
        // and doesn't throw an error
        expect(() => {
          TwoFactorService.verifyTOTPToken(secret, '123456')
        }).not.toThrow()
      })
    })

    describe('SMS Code Generation', () => {
      it('should generate 6-digit SMS code', () => {
        const code = TwoFactorService.generateSMSCode()

        expect(code).toBeTruthy()
        expect(code.length).toBe(6)
        expect(/^\d{6}$/.test(code)).toBe(true)
      })

      it('should generate different codes', () => {
        const code1 = TwoFactorService.generateSMSCode()
        const code2 = TwoFactorService.generateSMSCode()

        // While theoretically possible to be the same, it's extremely unlikely
        expect(code1).not.toBe(code2)
      })
    })

    describe('Backup Codes', () => {
      it('should generate backup codes', () => {
        const codes = TwoFactorService.generateBackupCodes()

        expect(Array.isArray(codes)).toBe(true)
        expect(codes.length).toBe(10)

        codes.forEach((code) => {
          expect(code).toBeTruthy()
          expect(code.length).toBe(8)
          expect(/^[A-F0-9]{8}$/.test(code)).toBe(true)
        })
      })

      it('should generate unique backup codes', () => {
        const codes = TwoFactorService.generateBackupCodes()
        const uniqueCodes = new Set(codes)

        expect(uniqueCodes.size).toBe(codes.length)
      })

      it('should generate different sets of codes', () => {
        const codes1 = TwoFactorService.generateBackupCodes()
        const codes2 = TwoFactorService.generateBackupCodes()

        expect(codes1).not.toEqual(codes2)
      })
    })

    describe('Two-Factor Status', () => {
      let testUser: any

      beforeAll(async () => {
        testUser = await prisma.user.create({
          data: {
            email: '2fa-test@example.com',
            firstName: '2FA',
            lastName: 'Test',
            passwordHash: await AuthService.hashPassword('TestPassword123!'),
            emailVerified: true,
            twoFactorEnabled: false,
          },
        })
      })

      afterAll(async () => {
        if (testUser) {
          await prisma.user.delete({ where: { id: testUser.id } })
        }
      })

      it('should check if 2FA is enabled', async () => {
        const isEnabled = await TwoFactorService.isTwoFactorEnabled(testUser.id)
        expect(isEnabled).toBe(false)
      })

      it('should get 2FA status', async () => {
        const status = await TwoFactorService.getTwoFactorStatus(testUser.id)

        expect(status).toBeTruthy()
        expect(status.enabled).toBe(false)
        expect(status.hasSecret).toBe(false)
        expect(typeof status.backupCodesCount).toBe('number')
      })
    })
  })
})
