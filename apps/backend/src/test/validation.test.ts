import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import { z } from 'zod'
import {
  validate,
  sanitize,
  xssProtection,
  validateFileUpload,
  validateRateLimit,
  formatValidationError,
  commonValidationSchemas,
} from '../middleware/validation.js'
import { ApiError } from '../lib/errors.js'

// Test schemas
const testUserSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(50, 'Name must be less than 50 characters'),
  email: z.string().email('Invalid email format'),
  age: z
    .number()
    .min(18, 'Must be at least 18 years old')
    .max(120, 'Age must be realistic'),
  tags: z.array(z.string()).max(5, 'Maximum 5 tags allowed').optional(),
})

const testQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
})

const testParamsSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
})

describe('Validation Middleware', () => {
  let app: express.Application

  beforeEach(() => {
    app = express()
    app.use(express.json())

    // Add error handler
    app.use(
      (
        error: any,
        _req: express.Request,
        res: express.Response,
        _next: express.NextFunction
      ) => {
        if (error instanceof ApiError) {
          res.status(error.statusCode).json({
            message: error.message,
            errors: error.errors,
          })
        } else {
          res.status(500).json({ message: error.message })
        }
      }
    )
  })

  describe('validate middleware', () => {
    it('should validate request body successfully', async () => {
      app.post('/test', validate({ body: testUserSchema }), (req, res) => {
        res.json({ success: true, data: req.body })
      })

      const validUser = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 25,
        tags: ['developer', 'javascript'],
      }

      const response = await request(app)
        .post('/test')
        .send(validUser)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(validUser)
    })

    it('should return validation errors for invalid body', async () => {
      app.post('/test', validate({ body: testUserSchema }), (req, res) => {
        res.json({ success: true })
      })

      const invalidUser = {
        name: '', // Invalid: empty string
        email: 'invalid-email', // Invalid: not an email
        age: 15, // Invalid: under 18
        tags: ['a', 'b', 'c', 'd', 'e', 'f'], // Invalid: too many tags
      }

      const response = await request(app)
        .post('/test')
        .send(invalidUser)
        .expect(400)

      expect(response.body.message).toBe('Validation failed')
      expect(response.body.errors).toHaveLength(4)
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'name',
            message: 'Name is required',
          }),
          expect.objectContaining({
            field: 'email',
            message: 'Invalid email format',
          }),
          expect.objectContaining({
            field: 'age',
            message: 'Must be at least 18 years old',
          }),
          expect.objectContaining({
            field: 'tags',
            message: 'Maximum 5 tags allowed',
          }),
        ])
      )
    })

    it('should validate query parameters', async () => {
      app.get('/test', validate({ query: testQuerySchema }), (req, res) => {
        res.json({ success: true, query: req.query })
      })

      const response = await request(app)
        .get('/test?page=2&limit=50&search=test')
        .expect(200)

      expect(response.body.query).toEqual({
        page: 2,
        limit: 50,
        search: 'test',
      })
    })

    it('should validate route parameters', async () => {
      app.get(
        '/test/:id',
        validate({ params: testParamsSchema }),
        (req, res) => {
          res.json({ success: true, params: req.params })
        }
      )

      const validUuid = '123e4567-e89b-12d3-a456-426614174000'

      const response = await request(app).get(`/test/${validUuid}`).expect(200)

      expect(response.body.params.id).toBe(validUuid)
    })

    it('should return error for invalid route parameters', async () => {
      app.get(
        '/test/:id',
        validate({ params: testParamsSchema }),
        (req, res) => {
          res.json({ success: true })
        }
      )

      const response = await request(app).get('/test/invalid-uuid').expect(400)

      expect(response.body.message).toBe('Validation failed')
      expect(response.body.errors[0].field).toBe('id')
      expect(response.body.errors[0].message).toBe('Invalid ID format')
    })

    it('should apply default values from schema', async () => {
      app.get('/test', validate({ query: testQuerySchema }), (req, res) => {
        res.json({ success: true, query: req.query })
      })

      const response = await request(app).get('/test').expect(200)

      expect(response.body.query).toEqual({
        page: 1,
        limit: 20,
      })
    })
  })

  describe('sanitize middleware', () => {
    it('should sanitize specified fields in request body', async () => {
      app.post('/test', sanitize(['name', 'description']), (req, res) => {
        res.json({ success: true, data: req.body })
      })

      const response = await request(app)
        .post('/test')
        .send({
          name: '  John Doe  <script>alert("xss")</script>  ',
          description: 'Test description<>',
          email: 'john@example.com', // Should not be sanitized
        })
        .expect(200)

      expect(response.body.data.name).toBe('John Doe  alert("xss")')
      expect(response.body.data.description).toBe('Test description')
      expect(response.body.data.email).toBe('john@example.com')
    })

    it('should sanitize query parameters', async () => {
      app.get('/test', sanitize(['search']), (req, res) => {
        res.json({ success: true, query: req.query })
      })

      const response = await request(app)
        .get(
          '/test?search=<script>alert("xss")</script>&other=<script>test</script>'
        )
        .expect(200)

      expect(response.body.query.search).toBe('alert("xss")')
      expect(response.body.query.other).toBe('<script>test</script>') // Not sanitized
    })
  })

  describe('xssProtection middleware', () => {
    it('should sanitize all string values in request body', async () => {
      app.post('/test', xssProtection(), (req, res) => {
        res.json({ success: true, data: req.body })
      })

      const response = await request(app)
        .post('/test')
        .send({
          name: '<script>alert("xss")</script>John',
          nested: {
            description: 'javascript:alert("xss")',
            tags: ['<script>tag1</script>', 'tag2'],
          },
        })
        .expect(200)

      expect(response.body.data.name).toBe('John')
      expect(response.body.data.nested.description).toBe('alert("xss")')
      expect(response.body.data.nested.tags[0]).toBe('tag1')
      expect(response.body.data.nested.tags[1]).toBe('tag2')
    })
  })

  describe('validateFileUpload middleware', () => {
    it('should validate file upload requirements', async () => {
      const mockFile = {
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024 * 1024, // 1MB
      } as Express.Multer.File

      app.post(
        '/test',
        (req, res, next) => {
          req.file = mockFile
          next()
        },
        validateFileUpload({
          allowedMimeTypes: ['image/jpeg', 'image/png'],
          maxFileSize: 5 * 1024 * 1024, // 5MB
          required: true,
        }),
        (req, res) => {
          res.json({ success: true })
        }
      )

      await request(app).post('/test').expect(200)
    })

    it('should reject files that are too large', async () => {
      const mockFile = {
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 10 * 1024 * 1024, // 10MB
      } as Express.Multer.File

      app.post(
        '/test',
        (req, res, next) => {
          req.file = mockFile
          next()
        },
        validateFileUpload({
          maxFileSize: 5 * 1024 * 1024, // 5MB
        }),
        (req, res) => {
          res.json({ success: true })
        }
      )

      const response = await request(app).post('/test').expect(400)

      expect(response.body.message).toContain('File size must be less than')
    })

    it('should reject files with invalid MIME types', async () => {
      const mockFile = {
        originalname: 'test.exe',
        mimetype: 'application/x-executable',
        size: 1024,
      } as Express.Multer.File

      app.post(
        '/test',
        (req, res, next) => {
          req.file = mockFile
          next()
        },
        validateFileUpload({
          allowedMimeTypes: ['image/jpeg', 'image/png'],
        }),
        (req, res) => {
          res.json({ success: true })
        }
      )

      const response = await request(app).post('/test').expect(400)

      expect(response.body.message).toContain('File type')
      expect(response.body.message).toContain('is not allowed')
    })

    it('should reject dangerous file extensions', async () => {
      const mockFile = {
        originalname: 'malicious.exe',
        mimetype: 'image/jpeg', // Spoofed MIME type
        size: 1024,
      } as Express.Multer.File

      app.post(
        '/test',
        (req, res, next) => {
          req.file = mockFile
          next()
        },
        validateFileUpload({}),
        (req, res) => {
          res.json({ success: true })
        }
      )

      const response = await request(app).post('/test').expect(400)

      expect(response.body.message).toBe(
        'File type is not allowed for security reasons'
      )
    })
  })

  describe('validateRateLimit middleware', () => {
    it('should allow requests within rate limit', async () => {
      const rateLimiter = validateRateLimit({
        windowMs: 60000, // 1 minute
        maxRequests: 5,
      })

      app.get('/test', rateLimiter, (req, res) => {
        res.json({ success: true })
      })

      // Make 5 requests (should all succeed)
      for (let i = 0; i < 5; i++) {
        await request(app).get('/test').expect(200)
      }
    })

    it('should block requests exceeding rate limit', async () => {
      const rateLimiter = validateRateLimit({
        windowMs: 60000, // 1 minute
        maxRequests: 2,
      })

      app.get('/test', rateLimiter, (req, res) => {
        res.json({ success: true })
      })

      // Make 2 requests (should succeed)
      await request(app).get('/test').expect(200)
      await request(app).get('/test').expect(200)

      // Third request should be blocked
      const response = await request(app).get('/test').expect(429)

      expect(response.body.message).toContain('Too many requests')
      expect(response.headers['x-ratelimit-limit']).toBe('2')
      expect(response.headers['x-ratelimit-remaining']).toBe('0')
    })
  })

  describe('formatValidationError', () => {
    it('should format Zod validation errors correctly', () => {
      const schema = z.object({
        name: z.string().min(1, 'Name is required'),
        email: z.string().email('Invalid email'),
      })

      try {
        schema.parse({ name: '', email: 'invalid' })
      } catch (error) {
        if (error instanceof z.ZodError) {
          const formatted = formatValidationError(error)

          expect(formatted.message).toBe('Validation failed')
          expect(formatted.errors).toHaveLength(2)
          expect(formatted.errors).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                field: 'name',
                message: 'Name is required',
              }),
              expect.objectContaining({
                field: 'email',
                message: 'Invalid email',
              }),
            ])
          )
        }
      }
    })
  })

  describe('commonValidationSchemas', () => {
    it('should validate ID schema', () => {
      const validId = '123e4567-e89b-12d3-a456-426614174000'
      const result = commonValidationSchemas.id.safeParse({ id: validId })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.id).toBe(validId)
      }
    })

    it('should validate pagination schema', () => {
      const result = commonValidationSchemas.pagination.safeParse({
        page: '2',
        limit: '50',
        sortBy: 'name',
        sortOrder: 'asc',
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual({
          page: 2,
          limit: 50,
          sortBy: 'name',
          sortOrder: 'asc',
        })
      }
    })

    it('should validate date range schema', () => {
      const validRange = {
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-12-31T23:59:59Z',
      }

      const result = commonValidationSchemas.dateRange.safeParse(validRange)
      expect(result.success).toBe(true)
    })

    it('should reject invalid date range', () => {
      const invalidRange = {
        startDate: '2024-12-31T23:59:59Z',
        endDate: '2024-01-01T00:00:00Z',
      }

      const result = commonValidationSchemas.dateRange.safeParse(invalidRange)
      expect(result.success).toBe(false)
    })
  })

  describe('Error handling', () => {
    it('should handle non-Zod errors gracefully', async () => {
      app.post(
        '/test',
        (_req, _res, _next) => {
          throw new Error('Unexpected error')
        },
        validate({ body: testUserSchema }),
        (_req, res) => {
          res.json({ success: true })
        }
      )

      // Add error handler
      app.use(
        (
          error: any,
          _req: express.Request,
          res: express.Response,
          _next: express.NextFunction
        ) => {
          res.status(500).json({ message: error.message })
        }
      )

      const response = await request(app)
        .post('/test')
        .send({ name: 'John', email: 'john@example.com', age: 25 })
        .expect(500)

      expect(response.body.message).toBe('Unexpected error')
    })
  })
})
