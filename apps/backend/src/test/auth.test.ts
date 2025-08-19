import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import { PrismaClient } from '@prisma/client'
import { createTestApp } from './test-app'
import { AuthService } from '../lib/auth'
import { TwoFactorService } from '../lib/two-factor'

const prisma = new PrismaClient()
const app = createTestApp()

describe('Authentication System', () => {
  let testUser: any
  let adminUser: any
  let accessToken: string
  let refreshToken: string

  beforeAll(async () => {
    // Clean up test data
    await prisma.userSession.deleteMany()
    await prisma.userRole.deleteMany()
    await prisma.user.deleteMany({ where: { email: { contains: 'test' } } })
  })

  afterAll(async () => {
    // Clean up test data
    await prisma.userSession.deleteMany()
    await prisma.userRole.deleteMany()
    await prisma.user.deleteMany({ where: { email: { contains: 'test' } } })
    await prisma.$disconnect()
  })

  beforeEach(async () => {
    // Clean up sessions before each test
    await prisma.userSession.deleteMany()
  })

  describe('User Registration', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User',
        username: 'testuser'
      }

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.email).toBe(userData.email)
      expect(response.body.data.emailVerified).toBe(false)

      // Verify user was created in database
      const user = await prisma.user.findUnique({
        where: { email: userData.email }
      })
      expect(user).toBeTruthy()
      expect(user?.firstName).toBe(userData.firstName)
      expect(user?.lastName).toBe(userData.lastName)
      expect(user?.username).toBe(userData.username)

      testUser = user
    })

    it('should reject registration with invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User'
      }

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Validation failed')
    })

    it('should reject registration with weak password', async () => {
      const userData = {
        email: 'test2@example.com',
        password: 'weak',
        firstName: 'Test',
        lastName: 'User'
      }

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Validation failed')
    })

    it('should reject registration with duplicate email', async () => {
      const userData = {
        email: 'test@example.com', // Same as first test
        password: 'TestPassword123!',
        firstName: 'Test2',
        lastName: 'User2'
      }

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(409)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Email already registered')
    })
  })

  describe('Email Verification', () => {
    it('should verify email successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/verify-email')
        .send({
          token: 'valid-token',
          email: 'test@example.com'
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Email verified successfully')

      // Verify email was marked as verified
      const user = await prisma.user.findUnique({
        where: { email: 'test@example.com' }
      })
      expect(user?.emailVerified).toBe(true)
    })

    it('should reject verification with missing token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/verify-email')
        .send({
          email: 'test@example.com'
        })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Token and email are required')
    })
  })

  describe('User Login', () => {
    it('should login successfully with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'TestPassword123!'
      }

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.user.email).toBe(loginData.email)
      expect(response.body.data.tokens.accessToken).toBeTruthy()
      expect(response.body.data.tokens.refreshToken).toBeTruthy()

      accessToken = response.body.data.tokens.accessToken
      refreshToken = response.body.data.tokens.refreshToken
    })

    it('should reject login with invalid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'WrongPassword123!'
      }

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Invalid credentials')
    })

    it('should reject login with non-existent email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'TestPassword123!'
      }

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Invalid credentials')
    })

    it('should reject login with unverified email', async () => {
      // Create unverified user
      const unverifiedUser = await prisma.user.create({
        data: {
          email: 'unverified@example.com',
          firstName: 'Unverified',
          lastName: 'User',
          passwordHash: await AuthService.hashPassword('TestPassword123!'),
          emailVerified: false
        }
      })

      const loginData = {
        email: 'unverified@example.com',
        password: 'TestPassword123!'
      }

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(403)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Email not verified. Please check your email and verify your account.')
      expect(response.body.code).toBe('EMAIL_NOT_VERIFIED')

      // Clean up
      await prisma.user.delete({ where: { id: unverifiedUser.id } })
    })
  })

  describe('Token Refresh', () => {
    it('should refresh tokens successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.tokens.accessToken).toBeTruthy()
      expect(response.body.data.tokens.refreshToken).toBeTruthy()

      // Update tokens for subsequent tests
      accessToken = response.body.data.tokens.accessToken
      refreshToken = response.body.data.tokens.refreshToken
    })

    it('should reject refresh with invalid token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Invalid or expired refresh token')
    })
  })

  describe('Protected Routes', () => {
    it('should access protected route with valid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.email).toBe('test@example.com')
      expect(response.body.data.roles).toBeTruthy()
      expect(response.body.data.permissions).toBeTruthy()
    })

    it('should reject access without token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Authentication required')
      expect(response.body.code).toBe('AUTH_REQUIRED')
    })

    it('should reject access with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Invalid authentication token')
      expect(response.body.code).toBe('TOKEN_INVALID')
    })
  })

  describe('Password Management', () => {
    it('should request password reset successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'test@example.com' })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toContain('password reset link has been sent')
    })

    it('should handle password reset for non-existent email gracefully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toContain('password reset link has been sent')
    })

    it('should reset password successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: 'valid-reset-token',
          password: 'NewPassword123!',
          email: 'test@example.com'
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Password reset successfully. Please log in with your new password.')
    })

    it('should change password successfully', async () => {
      // First login with new password
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'NewPassword123!'
        })
        .expect(200)

      const newAccessToken = loginResponse.body.data.tokens.accessToken

      const response = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .send({
          currentPassword: 'NewPassword123!',
          newPassword: 'AnotherPassword123!'
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Password changed successfully')
    })

    it('should reject password change with wrong current password', async () => {
      // Login to get fresh token
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'AnotherPassword123!'
        })
        .expect(200)

      const newAccessToken = loginResponse.body.data.tokens.accessToken

      const response = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .send({
          currentPassword: 'WrongPassword123!',
          newPassword: 'YetAnotherPassword123!'
        })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Current password is incorrect')
    })
  })

  describe('Session Management', () => {
    it('should get user sessions', async () => {
      // Login to create a session
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'AnotherPassword123!'
        })
        .expect(200)

      const newAccessToken = loginResponse.body.data.tokens.accessToken

      const response = await request(app)
        .get('/api/v1/auth/sessions')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(response.body.data.length).toBeGreaterThan(0)
      expect(response.body.data[0]).toHaveProperty('id')
      expect(response.body.data[0]).toHaveProperty('isCurrent')
    })

    it('should logout successfully', async () => {
      // Login to get token
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'AnotherPassword123!'
        })
        .expect(200)

      const newAccessToken = loginResponse.body.data.tokens.accessToken

      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Logged out successfully')

      // Verify token is no longer valid
      await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .expect(401)
    })

    it('should logout from all devices successfully', async () => {
      // Login to get token
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'AnotherPassword123!'
        })
        .expect(200)

      const newAccessToken = loginResponse.body.data.tokens.accessToken

      const response = await request(app)
        .post('/api/v1/auth/logout-all')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Logged out from all devices successfully')

      // Verify token is no longer valid
      await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .expect(401)
    })
  })

  describe('Account Locking', () => {
    it('should lock account after multiple failed login attempts', async () => {
      // Create a test user for this test
      const lockedTestUser = await prisma.user.create({
        data: {
          email: 'locked-test@example.com',
          firstName: 'Locked',
          lastName: 'User',
          passwordHash: await AuthService.hashPassword('TestPassword123!'),
          emailVerified: true
        }
      })

      // Make 5 failed login attempts
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/v1/auth/login')
          .send({
            email: 'locked-test@example.com',
            password: 'WrongPassword123!'
          })
          .expect(401)
      }

      // 6th attempt should result in account lock
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'locked-test@example.com',
          password: 'TestPassword123!' // Even with correct password
        })
        .expect(423)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Account is temporarily locked due to multiple failed login attempts')

      // Clean up
      await prisma.user.delete({ where: { id: lockedTestUser.id } })
    })
  })

  describe('Two-Factor Authentication', () => {
    let userWithTwoFactor: any
    let twoFactorToken: string

    beforeAll(async () => {
      // Create user for 2FA tests
      userWithTwoFactor = await prisma.user.create({
        data: {
          email: 'twofactor-test@example.com',
          firstName: 'TwoFactor',
          lastName: 'User',
          passwordHash: await AuthService.hashPassword('TestPassword123!'),
          emailVerified: true
        }
      })

      // Assign user role
      const userRole = await prisma.role.findUnique({ where: { name: 'employee' } })
      if (userRole) {
        await prisma.userRole.create({
          data: {
            userId: userWithTwoFactor.id,
            roleId: userRole.id
          }
        })
      }
    })

    afterAll(async () => {
      if (userWithTwoFactor) {
        await prisma.userRole.deleteMany({ where: { userId: userWithTwoFactor.id } })
        await prisma.user.delete({ where: { id: userWithTwoFactor.id } })
      }
    })

    it('should get 2FA status', async () => {
      // Login first
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'twofactor-test@example.com',
          password: 'TestPassword123!'
        })
        .expect(200)

      const token = loginResponse.body.data.tokens.accessToken

      const response = await request(app)
        .get('/api/v1/two-factor/status')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('enabled')
      expect(response.body.data).toHaveProperty('hasSecret')
      expect(response.body.data).toHaveProperty('backupCodesCount')
    })

    it('should setup TOTP', async () => {
      // Login first
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'twofactor-test@example.com',
          password: 'TestPassword123!'
        })
        .expect(200)

      const token = loginResponse.body.data.tokens.accessToken

      const response = await request(app)
        .post('/api/v1/two-factor/totp/setup')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('secret')
      expect(response.body.data).toHaveProperty('qrCodeUrl')
      expect(response.body.data).toHaveProperty('backupCodes')

      // Store secret for next test
      const secret = response.body.data.secret
      twoFactorToken = TwoFactorService.generateTOTPSecret('twofactor-test@example.com').secret
    })
  })
})

describe('AuthService Unit Tests', () => {
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
      
      const isInvalid = await AuthService.verifyPassword('WrongPassword', hash)
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
  })
})

describe('TwoFactorService Unit Tests', () => {
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
      
      codes.forEach(code => {
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
  })
})