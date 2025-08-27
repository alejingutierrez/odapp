import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import express from 'express'
import cors from 'cors'
import { z } from 'zod'

// Import the actual validation middleware - not mocked
vi.doMock('../middleware/validation.js', () => vi.importActual('../middleware/validation.js'))

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

// Create a simple test app without catch-all routes
function createValidationTestApp() {
  const app = express()
  
  app.use(cors())
  app.use(express.json({ limit: '10mb' }))
  app.use(express.urlencoded({ extended: true }))
  
  // Add error handling middleware for validation errors
  app.use((err: any, req: any, res: any, next: any) => {
    if (err.name === 'ZodError') {
      return res.status(400).json({
        message: 'Validation failed',
        errors: formatValidationError(err)
      })
    }
    
    if (err.message?.includes('validation') || err.message?.includes('Validation')) {
      return res.status(400).json({
        message: err.message || 'Validation failed',
        errors: err.errors || []
      })
    }
    
    // Handle other errors
    res.status(500).json({
      message: err.message || 'Internal server error'
    })
  })
  
  return app
}

describe('Validation Middleware', () => {
  let app: any

  beforeEach(() => {
    app = createValidationTestApp()
  })

  describe('validate middleware', () => {
    it('should validate request body successfully', async () => {
      app.post('/test', validate({ body: testUserSchema }), (req: any, res: any) => {
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
      app.post('/test', validate({ body: testUserSchema }), (req: any, res: any) => {
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
          expect.objectContaining({ field: 'name', message: 'Name is required' }),
          expect.objectContaining({ field: 'email', message: 'Invalid email format' }),
          expect.objectContaining({ field: 'age', message: 'Must be at least 18 years old' }),
          expect.objectContaining({ field: 'tags', message: 'Maximum 5 tags allowed' }),
        ])
      )
    })

    it('should validate query parameters', async () => {
      app.get('/test', validate({ query: testQuerySchema }), (req: any, res: any) => {
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

    it('should apply default values from schema', async () => {
      app.get('/test', validate({ query: testQuerySchema }), (req: any, res: any) => {
        res.json({ success: true, query: req.query })
      })

      const response = await request(app).get('/test').expect(200)

      expect(response.body.query).toEqual({
        page: 1,
        limit: 20,
        search: undefined,
      })
    })

    it('should return error for invalid route parameters', async () => {
      app.get('/test/:id', validate({ params: testParamsSchema }), (req: any, res: any) => {
        res.json({ success: true, id: req.params.id })
      })

      const response = await request(app).get('/test/invalid-uuid').expect(400)

      expect(response.body.message).toBe('Validation failed')
      expect(response.body.errors[0].field).toBe('id')
      expect(response.body.errors[0].message).toBe('Invalid ID format')
    })

    it('should validate multiple schemas', async () => {
      app.post('/test/:id', validate({
        body: testUserSchema,
        params: testParamsSchema,
        query: testQuerySchema,
      }), (req: any, res: any) => {
        res.json({ success: true, data: req.body, params: req.params, query: req.query })
      })

      const validUser = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 25,
      }

      const response = await request(app)
        .post('/test/123e4567-e89b-12d3-a456-426614174000?page=1&limit=10')
        .send(validUser)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(validUser)
      expect(response.body.params.id).toBe('123e4567-e89b-12d3-a456-426614174000')
      expect(response.body.query.page).toBe(1)
    })
  })

  describe('sanitize middleware', () => {
    it('should sanitize specified fields in request body', async () => {
      app.post('/test', sanitize(['name', 'description']), (req: any, res: any) => {
        res.json({ success: true, data: req.body })
      })

      const response = await request(app)
        .post('/test')
        .send({
          name: 'John Doe  <script>alert("xss")</script>',
          description: 'Test description',
          email: 'john@example.com',
        })
        .expect(200)

      expect(response.body.data.name).toBe('John Doe  alert("xss")')
      expect(response.body.data.description).toBe('Test description')
      expect(response.body.data.email).toBe('john@example.com')
    })

    it('should sanitize query parameters', async () => {
      app.get('/test', sanitize(['search']), (req: any, res: any) => {
        res.json({ success: true, query: req.query })
      })

      const response = await request(app)
        .get('/test?search=<script>alert("xss")</script>&other=<script>test</script>')
        .expect(200)

      expect(response.body.query.search).toBe('alert("xss")')
      expect(response.body.query.other).toBe('<script>test</script>') // Not sanitized
    })
  })

  describe('xssProtection middleware', () => {
    it('should sanitize all string values in request body', async () => {
      app.post('/test', xssProtection(), (req: any, res: any) => {
        res.json({ success: true, data: req.body })
      })

      const response = await request(app)
        .post('/test')
        .send({
          name: '<script>alert("xss")</script>John',
          description: 'Test <script>alert("xss")</script> description',
          email: 'john@example.com',
          age: 25,
          tags: ['<script>alert("xss")</script>tag1', 'tag2'],
        })
        .expect(200)

      expect(response.body.data.name).toBe('John')
      expect(response.body.data.description).toBe('Test  description')
      expect(response.body.data.email).toBe('john@example.com')
      expect(response.body.data.age).toBe(25)
      expect(response.body.data.tags).toEqual(['tag1', 'tag2'])
    })
  })

  describe('validateFileUpload middleware', () => {
    it('should accept valid file uploads', async () => {
      app.post('/test', validateFileUpload({
        maxSize: 1024 * 1024, // 1MB
        allowedMimeTypes: ['image/jpeg', 'image/png'],
        maxFiles: 2,
      }), (req: any, res: any) => {
        res.json({ success: true, files: req.files })
      })

      const response = await request(app)
        .post('/test')
        .attach('files', Buffer.from('fake image data'), 'test.jpg')
        .expect(200)

      expect(response.body.success).toBe(true)
    })

    it('should reject files that are too large', async () => {
      app.post('/test', validateFileUpload({
        maxSize: 100, // 100 bytes
        allowedMimeTypes: ['image/jpeg'],
      }), (req: any, res: any) => {
        res.json({ success: true })
      })

      const response = await request(app).post('/test').expect(400)

      expect(response.body.message).toContain('File size must be less than')
    })

    it('should reject files with invalid MIME types', async () => {
      app.post('/test', validateFileUpload({
        maxSize: 1024 * 1024,
        allowedMimeTypes: ['image/jpeg'],
      }), (req: any, res: any) => {
        res.json({ success: true })
      })

      const response = await request(app)
        .post('/test')
        .attach('files', Buffer.from('fake data'), 'test.txt')
        .expect(400)

      expect(response.body.message).toContain('File type')
      expect(response.body.message).toContain('is not allowed')
    })

    it('should reject dangerous file extensions', async () => {
      app.post('/test', validateFileUpload({
        maxSize: 1024 * 1024,
        allowedMimeTypes: ['image/jpeg'],
        dangerousExtensions: ['.exe', '.bat'],
      }), (req: any, res: any) => {
        res.json({ success: true })
      })

      const response = await request(app)
        .post('/test')
        .attach('files', Buffer.from('fake data'), 'malicious.exe')
        .expect(400)

      expect(response.body.message).toBe(
        'File type is not allowed for security reasons'
      )
    })
  })

  describe('validateRateLimit middleware', () => {
    it('should allow requests within rate limit', async () => {
      app.get('/test', validateRateLimit({
        windowMs: 1000,
        max: 2,
      }), (req: any, res: any) => {
        res.json({ success: true })
      })

      const response1 = await request(app).get('/test').expect(200)
      const response2 = await request(app).get('/test').expect(200)

      expect(response1.body.success).toBe(true)
      expect(response2.body.success).toBe(true)
    })

    it('should block requests exceeding rate limit', async () => {
      app.get('/test', validateRateLimit({
        windowMs: 1000,
        max: 2,
      }), (req: any, res: any) => {
        res.json({ success: true })
      })

      await request(app).get('/test').expect(200)
      await request(app).get('/test').expect(200)
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
        const formatted = formatValidationError(error)
        expect(formatted).toHaveLength(2)
        expect(formatted[0]).toEqual({
          field: 'name',
          message: 'Name is required',
          code: 'too_small',
          received: undefined,
        })
        expect(formatted[1]).toEqual({
          field: 'email',
          message: 'Invalid email',
          code: 'invalid_string',
          received: 'invalid',
        })
      }
    })
  })

  describe('commonValidationSchemas', () => {
    it('should have pagination schema', () => {
      expect(commonValidationSchemas.pagination).toBeDefined()
      expect(commonValidationSchemas.pagination.shape.page).toBeDefined()
      expect(commonValidationSchemas.pagination.shape.limit).toBeDefined()
    })

    it('should have search schema', () => {
      expect(commonValidationSchemas.search).toBeDefined()
      expect(commonValidationSchemas.search.shape.search).toBeDefined()
    })

    it('should have uuid schema', () => {
      expect(commonValidationSchemas.uuid).toBeDefined()
    })

    it('should have email schema', () => {
      expect(commonValidationSchemas.email).toBeDefined()
    })
  })
})
