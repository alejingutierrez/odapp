import { Router } from 'express'
import { sendSuccess } from '../lib/api-response.js'

const router = Router()

// Simple health check
router.get('/health', async (req, res) => {
  return sendSuccess(res, {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'oda-backend',
  })
})

// Simple API info
router.get('/info', async (req, res) => {
  return sendSuccess(res, {
    name: 'ODA Backend API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  })
})

export default router
