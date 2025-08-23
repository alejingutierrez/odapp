import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import express from 'express'
import { PrismaClient } from '@prisma/client'
import {
  authenticate,
  requirePermission,
  requireRole,
  requireAnyPermission,
  requireAllPermissions,
  requireAnyRole,
  requireSelfOrAdmin,
  authRateLimit,
} from '../middleware/auth'
import { AuthService } from '../lib/auth'

const prisma = new PrismaClient()

// Create test app
const createTestApp = () => {
  const app = express()
  app.use(express.json())

  // Test routes
  app.get('/protected', authenticate, (req, res) => {
    res.json({ success: true, user: req.user?.email })
  })

  app.get('/admin-only', authenticate, requireRole('admin'), (req, res) => {
    res.json({ success: true, message: 'Admin access granted' })
  })

  app.get(
    '/manager-or-admin',
    authenticate,
    requireAnyRole(['manager', 'admin']),
    (req, res) => {
      res.json({ success: true, message: 'Manager or admin access granted' })
    }
  )

  app.get(
    '/products-read',
    authenticate,
    requirePermission('products:read'),
    (req, res) => {
      res.json({ success: true, message: 'Products read access granted' })
    }
  )

  app.get(
    '/products-any',
    authenticate,
    requireAnyPermission(['products:read', 'products:write']),
    (req, res) => {
      res.json({ success: true, message: 'Products access granted' })
    }
  )

  app.get(
    '/products-all',
    authenticate,
    requireAllPermissions(['products:read', 'products:write']),
    (req, res) => {
      res.json({ success: true, message: 'Full products access granted' })
    }
  )

  app.get('/user/:userId', authenticate, requireSelfOrAdmin(), (req, res) => {
    res.json({
      success: true,
      message: 'User access granted',
      userId: req.params.userId,
    })
  })

  app.post('/rate-limited', authRateLimit(3, 1), (req, res) => {
    res.json({ success: true, message: 'Request processed' })
  })

  return app
}

describe('Authentication Middleware', () => {
  let app: express.Application
  let testUser: {
    id: string
    email: string
    firstName: string
    lastName: string
    passwordHash: string
    emailVerified: boolean
  }
  let adminUser: {
    id: string
    email: string
    firstName: string
    lastName: string
    passwordHash: string
    emailVerified: boolean
  }
  let managerUser: {
    id: string
    email: string
    firstName: string
    lastName: string
    passwordHash: string
    emailVerified: boolean
  }
  let testUserToken: string
  let adminUserToken: string
  let managerUserToken: string

  beforeAll(async () => {
    app = createTestApp()

    // Clean up test data
    await prisma.userSession.deleteMany()
    await prisma.userRole.deleteMany()
    await prisma.user.deleteMany({
      where: { email: { contains: 'middleware-test' } },
    })

    // Create test users
    testUser = await prisma.user.create({
      data: {
        email: 'middleware-test-user@example.com',
        firstName: 'Test',
        lastName: 'User',
        passwordHash: await AuthService.hashPassword('TestPassword123!'),
        emailVerified: true,
      },
    })

    adminUser = await prisma.user.create({
      data: {
        email: 'middleware-test-admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        passwordHash: await AuthService.hashPassword('AdminPassword123!'),
        emailVerified: true,
      },
    })

    managerUser = await prisma.user.create({
      data: {
        email: 'middleware-test-manager@example.com',
        firstName: 'Manager',
        lastName: 'User',
        passwordHash: await AuthService.hashPassword('ManagerPassword123!'),
        emailVerified: true,
      },
    })

    // Assign roles
    const userRole = await prisma.role.findUnique({
      where: { name: 'employee' },
    })
    const adminRole = await prisma.role.findUnique({ where: { name: 'admin' } })
    const managerRole = await prisma.role.findUnique({
      where: { name: 'manager' },
    })

    if (userRole) {
      await prisma.userRole.create({
        data: { userId: testUser.id, roleId: userRole.id },
      })
    }

    if (adminRole) {
      await prisma.userRole.create({
        data: { userId: adminUser.id, roleId: adminRole.id },
      })
    }

    if (managerRole) {
      await prisma.userRole.create({
        data: { userId: managerUser.id, roleId: managerRole.id },
      })
    }

    // Create sessions and tokens
    const testUserSession = await AuthService.createSession(testUser.id)
    const adminUserSession = await AuthService.createSession(adminUser.id)
    const managerUserSession = await AuthService.createSession(managerUser.id)

    const testUserWithRoles = await AuthService.getUserWithRoles(testUser.id)
    const adminUserWithRoles = await AuthService.getUserWithRoles(adminUser.id)
    const managerUserWithRoles = await AuthService.getUserWithRoles(
      managerUser.id
    )

    if (testUserWithRoles && adminUserWithRoles && managerUserWithRoles) {
      const testTokens = await AuthService.generateTokens(
        testUserWithRoles,
        testUserSession.id
      )
      const adminTokens = await AuthService.generateTokens(
        adminUserWithRoles,
        adminUserSession.id
      )
      const managerTokens = await AuthService.generateTokens(
        managerUserWithRoles,
        managerUserSession.id
      )

      testUserToken = testTokens.accessToken
      adminUserToken = adminTokens.accessToken
      managerUserToken = managerTokens.accessToken
    }
  })

  afterAll(async () => {
    // Clean up test data
    await prisma.userSession.deleteMany()
    await prisma.userRole.deleteMany()
    await prisma.user.deleteMany({
      where: { email: { contains: 'middleware-test' } },
    })
    await prisma.$disconnect()
  })

  describe('authenticate middleware', () => {
    it('should allow access with valid token', async () => {
      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.user).toBe('middleware-test-user@example.com')
    })

    it('should reject access without token', async () => {
      const response = await request(app).get('/protected').expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Authentication required')
      expect(response.body.code).toBe('AUTH_REQUIRED')
    })

    it('should reject access with invalid token', async () => {
      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Invalid authentication token')
      expect(response.body.code).toBe('TOKEN_INVALID')
    })

    it('should reject access with malformed authorization header', async () => {
      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'InvalidFormat token')
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Authentication required')
      expect(response.body.code).toBe('AUTH_REQUIRED')
    })
  })

  describe('requireRole middleware', () => {
    it('should allow access for user with required role', async () => {
      const response = await request(app)
        .get('/admin-only')
        .set('Authorization', `Bearer ${adminUserToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Admin access granted')
    })

    it('should reject access for user without required role', async () => {
      const response = await request(app)
        .get('/admin-only')
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(403)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Insufficient role privileges')
      expect(response.body.code).toBe('ROLE_DENIED')
      expect(response.body.required).toBe('admin')
    })
  })

  describe('requireAnyRole middleware', () => {
    it('should allow access for user with any of the required roles (admin)', async () => {
      const response = await request(app)
        .get('/manager-or-admin')
        .set('Authorization', `Bearer ${adminUserToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Manager or admin access granted')
    })

    it('should allow access for user with any of the required roles (manager)', async () => {
      const response = await request(app)
        .get('/manager-or-admin')
        .set('Authorization', `Bearer ${managerUserToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Manager or admin access granted')
    })

    it('should reject access for user without any required roles', async () => {
      const response = await request(app)
        .get('/manager-or-admin')
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(403)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Insufficient role privileges')
      expect(response.body.code).toBe('ROLE_DENIED')
      expect(Array.isArray(response.body.required)).toBe(true)
    })
  })

  describe('requirePermission middleware', () => {
    it('should allow access for user with required permission', async () => {
      const response = await request(app)
        .get('/products-read')
        .set('Authorization', `Bearer ${managerUserToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Products read access granted')
    })

    it('should allow access for admin with wildcard permission', async () => {
      const response = await request(app)
        .get('/products-read')
        .set('Authorization', `Bearer ${adminUserToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Products read access granted')
    })

    it('should reject access for user without required permission', async () => {
      const response = await request(app)
        .get('/products-read')
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(403)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Insufficient permissions')
      expect(response.body.code).toBe('PERMISSION_DENIED')
      expect(response.body.required).toBe('products:read')
    })
  })

  describe('requireAnyPermission middleware', () => {
    it('should allow access for user with any required permission', async () => {
      const response = await request(app)
        .get('/products-any')
        .set('Authorization', `Bearer ${managerUserToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Products access granted')
    })

    it('should reject access for user without any required permissions', async () => {
      // Create a user with no product permissions
      const limitedUser = await prisma.user.create({
        data: {
          email: 'limited-middleware-test@example.com',
          firstName: 'Limited',
          lastName: 'User',
          passwordHash: await AuthService.hashPassword('LimitedPassword123!'),
          emailVerified: true,
        },
      })

      const viewerRole = await prisma.role.findUnique({
        where: { name: 'viewer' },
      })
      if (viewerRole) {
        await prisma.userRole.create({
          data: { userId: limitedUser.id, roleId: viewerRole.id },
        })
      }

      const limitedSession = await AuthService.createSession(limitedUser.id)
      const limitedUserWithRoles = await AuthService.getUserWithRoles(
        limitedUser.id
      )

      if (limitedUserWithRoles) {
        const limitedTokens = await AuthService.generateTokens(
          limitedUserWithRoles,
          limitedSession.id
        )

        const response = await request(app)
          .get('/products-any')
          .set('Authorization', `Bearer ${limitedTokens.accessToken}`)
          .expect(200) // Viewer role has products:read permission

        expect(response.body.success).toBe(true)
      }

      // Clean up
      await prisma.userRole.deleteMany({ where: { userId: limitedUser.id } })
      await prisma.userSession.deleteMany({ where: { userId: limitedUser.id } })
      await prisma.user.delete({ where: { id: limitedUser.id } })
    })
  })

  describe('requireAllPermissions middleware', () => {
    it('should allow access for user with all required permissions', async () => {
      const response = await request(app)
        .get('/products-all')
        .set('Authorization', `Bearer ${managerUserToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Full products access granted')
    })

    it('should reject access for user missing some required permissions', async () => {
      const response = await request(app)
        .get('/products-all')
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(403)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Insufficient permissions')
      expect(response.body.code).toBe('PERMISSION_DENIED')
      expect(Array.isArray(response.body.required)).toBe(true)
    })
  })

  describe('requireSelfOrAdmin middleware', () => {
    it('should allow user to access their own data', async () => {
      const response = await request(app)
        .get(`/user/${testUser.id}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('User access granted')
      expect(response.body.userId).toBe(testUser.id)
    })

    it('should allow admin to access any user data', async () => {
      const response = await request(app)
        .get(`/user/${testUser.id}`)
        .set('Authorization', `Bearer ${adminUserToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('User access granted')
      expect(response.body.userId).toBe(testUser.id)
    })

    it('should reject non-admin user accessing other user data', async () => {
      const response = await request(app)
        .get(`/user/${adminUser.id}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(403)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe(
        'Access denied - can only access own data or admin required'
      )
      expect(response.body.code).toBe('ACCESS_DENIED')
    })
  })

  describe('authRateLimit middleware', () => {
    it('should allow requests within rate limit', async () => {
      // Make 3 requests (within limit)
      for (let i = 0; i < 3; i++) {
        const response = await request(app)
          .post('/rate-limited')
          .send({ test: true })
          .expect(200)

        expect(response.body.success).toBe(true)
        expect(response.body.message).toBe('Request processed')
      }
    })

    it('should reject requests exceeding rate limit', async () => {
      // Make 4th request (exceeds limit of 3)
      const response = await request(app)
        .post('/rate-limited')
        .send({ test: true })
        .expect(429)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Too many authentication attempts')
      expect(response.body.code).toBe('RATE_LIMIT_EXCEEDED')
      expect(response.body.retryAfter).toBeTruthy()
    })
  })

  describe('Error handling', () => {
    it('should handle authentication errors gracefully', async () => {
      // Mock a scenario where session validation fails
      const expiredToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0IiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwicm9sZXMiOltdLCJwZXJtaXNzaW9ucyI6W10sInNlc3Npb25JZCI6InRlc3QiLCJpYXQiOjE2MDk0NTkyMDAsImV4cCI6MTYwOTQ1OTIwMH0.invalid'

      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Invalid authentication token')
      expect(response.body.code).toBe('TOKEN_INVALID')
    })
  })
})
