import { z } from 'zod'

// Frontend environment validation schema
const envSchema = z.object({
  // API Configuration
  VITE_API_BASE_URL: z.string().url().default('http://localhost:3001'),
  VITE_WS_URL: z.string().url().default('ws://localhost:3001'),

  // App Configuration
  VITE_APP_NAME: z.string().default('Oda Fashion Platform'),
  VITE_APP_VERSION: z.string().default('1.0.0'),

  // External Services
  VITE_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  VITE_GOOGLE_ANALYTICS_ID: z.string().optional(),
  VITE_SENTRY_DSN: z.string().optional(),

  // Feature Flags
  VITE_ENABLE_ANALYTICS: z.coerce.boolean().default(true),
  VITE_ENABLE_NOTIFICATIONS: z.coerce.boolean().default(true),
  VITE_ENABLE_SHOPIFY_SYNC: z.coerce.boolean().default(true),
  VITE_ENABLE_DEV_TOOLS: z.coerce.boolean().default(false),

  // Environment
  MODE: z.enum(['development', 'production', 'test']).default('development'),
  DEV: z.coerce.boolean().default(true),
  PROD: z.coerce.boolean().default(false),
})

// Validate environment variables
const validateEnv = () => {
  try {
    return envSchema.parse(import.meta.env)
  } catch (error) {
    console.error('❌ Invalid environment variables:', error)
    throw new Error('Invalid environment configuration')
  }
}

export const env = validateEnv()

// Type for environment variables
export type Env = z.infer<typeof envSchema>

// Helper functions
export const isDevelopment = env.MODE === 'development'
export const isProduction = env.MODE === 'production'
export const isTest = env.MODE === 'test'
