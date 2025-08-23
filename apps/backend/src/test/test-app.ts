import express, { type Express } from 'express'
import * as cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'

import authRoutes from '../routes/auth'
import twoFactorRoutes from '../routes/two-factor'

// Create test app without starting server
export function createTestApp(): Express {
  const app: Express = express()

  // Security middleware
  app.use(helmet())
  app.use(
    cors({
      origin: ['http://localhost:3000'],
      credentials: true,
    })
  )

  // General middleware
  app.use(compression())
  app.use(express.json({ limit: '10mb' }))
  app.use(express.urlencoded({ extended: true }))

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: 'test',
      version: '1.0.0',
    })
  })

  // API routes
  app.get('/api/v1', (req, res) => {
    res.json({
      message: 'Oda Fashion Platform API',
      version: '1.0.0',
      environment: 'test',
    })
  })

  // Authentication routes
  app.use('/api/v1/auth', authRoutes)
  app.use('/api/v1/two-factor', twoFactorRoutes)

  // Error handling middleware
  app.use(
    (
      err: Error,
      req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ) => {
      console.error(err.stack)
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
      })
    }
  )

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      error: 'Route not found',
    })
  })

  return app
}
