import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../index'

describe('Basic API Infrastructure', () => {
  describe('Core Functionality', () => {
    it('should serve API root endpoint', async () => {
      const response = await request(app).get('/api/v1').expect(200)

      expect(response.body).toHaveProperty('success', true)
      expect(response.body.data).toHaveProperty('message')
      expect(response.body.meta).toHaveProperty('version', 'v1')
    })

    it('should set security headers', async () => {
      const response = await request(app).get('/api/v1').expect(200)

      expect(response.headers).toHaveProperty(
        'x-content-type-options',
        'nosniff'
      )
      expect(response.headers).toHaveProperty('x-frame-options', 'DENY')
      expect(response.headers).not.toHaveProperty('x-powered-by')
    })

    it('should set request ID', async () => {
      const response = await request(app).get('/api/v1').expect(200)

      expect(response.headers).toHaveProperty('x-request-id')
      expect(response.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/)
    })

    it('should serve Swagger documentation', async () => {
      const response = await request(app).get('/api-docs.json').expect(200)

      expect(response.body).toHaveProperty('openapi')
      expect(response.body).toHaveProperty('info')
      expect(response.body.info).toHaveProperty(
        'title',
        'Oda Fashion Platform API'
      )
    })

    it('should handle CORS', async () => {
      const response = await request(app)
        .options('/api/v1')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'GET')
        .expect(204)

      expect(response.headers).toHaveProperty('access-control-allow-origin')
    })

    it('should return liveness status', async () => {
      const response = await request(app).get('/health/live').expect(200)

      expect(response.body).toHaveProperty('success', true)
      expect(response.body.data).toHaveProperty('status', 'alive')
      expect(response.body.data).toHaveProperty('uptime')
    })
  })

  describe('Error Handling', () => {
    it('should handle validation errors from auth endpoint', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({}) // Empty body should trigger validation error
        .expect(400)

      expect(response.body).toHaveProperty('success', false)
      expect(response.body).toHaveProperty('error')
    })

    it('should sanitize query parameters', async () => {
      const response = await request(app)
        .get('/api/v1')
        .query({ test: '<script>alert("xss")</script>' })
        .expect(200)

      expect(response.body).toHaveProperty('success', true)
    })
  })

  describe('API Versioning', () => {
    it('should handle API version headers', async () => {
      const response = await request(app)
        .get('/api/v1')
        .set('X-API-Version', 'v1')
        .expect(200)

      expect(response.headers).toHaveProperty('x-api-version', 'v1')
      expect(response.headers).toHaveProperty('x-supported-versions')
    })

    it('should set versioned content type', async () => {
      const response = await request(app)
        .get('/api/v1')
        .set('Accept', 'application/vnd.oda.v1+json')
        .expect(200)

      expect(response.headers['content-type']).toMatch(
        /application\/vnd\.oda\.v1\+json/
      )
    })
  })
})
