import * as dotenv from 'dotenv'
import { z } from 'zod'

// Load environment variables
dotenv.config()

// Environment validation schema
const envSchema = z.object({
  // Node Environment
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  // API Configuration
  API_PORT: z.coerce.number().default(3001),
  API_HOST: z.string().default('0.0.0.0'),
  API_BASE_URL: z.string().url().default('http://localhost:3001'),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),

  // Database Configuration
  DATABASE_URL: z.string().url(),
  DATABASE_POOL_SIZE: z.coerce.number().default(10),
  DATABASE_CONNECTION_TIMEOUT: z.coerce.number().default(20000),
  DATABASE_QUERY_TIMEOUT: z.coerce.number().default(60000),
  DB_SLOW_QUERY_THRESHOLD: z.coerce.number().default(1000),
  DB_CONNECTION_POOL_MIN: z.coerce.number().default(2),
  DB_CONNECTION_POOL_MAX: z.coerce.number().default(10),

  // Redis Configuration
  REDIS_URL: z.string().url(),
  REDIS_TTL: z.coerce.number().default(3600),

  // Elasticsearch Configuration
  ELASTICSEARCH_URL: z.string().url(),
  ELASTICSEARCH_INDEX_PREFIX: z.string().default('oda'),

  // RabbitMQ Configuration
  RABBITMQ_URL: z.string().url(),

  // S3/MinIO Configuration
  S3_ENDPOINT: z.string().url(),
  S3_ACCESS_KEY: z.string(),
  S3_SECRET_KEY: z.string(),
  S3_BUCKET_NAME: z.string(),
  S3_REGION: z.string().default('us-east-1'),

  // JWT Configuration
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  // CORS Configuration
  CORS_ORIGINS: z.string().transform((val) => val.split(',')),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),

  // Email Configuration
  SMTP_HOST: z.string(),
  SMTP_PORT: z.coerce.number(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().email(),

  // Shopify Configuration
  SHOPIFY_API_KEY: z.string().optional(),
  SHOPIFY_API_SECRET: z.string().optional(),
  SHOPIFY_WEBHOOK_SECRET: z.string().optional(),
  SHOPIFY_SCOPES: z
    .string()
    .default(
      'read_products,write_products,read_orders,read_customers,write_inventory'
    ),

  // External APIs
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  PAYPAL_CLIENT_ID: z.string().optional(),
  PAYPAL_CLIENT_SECRET: z.string().optional(),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FORMAT: z.enum(['json', 'simple']).default('json'),

  // Security
  BCRYPT_ROUNDS: z.coerce.number().default(12),
  SESSION_SECRET: z.string().min(32),

  // File Upload
  MAX_FILE_SIZE: z.coerce.number().default(10485760), // 10MB
  ALLOWED_FILE_TYPES: z.string().transform((val) => val.split(',')),

  // Monitoring
  SENTRY_DSN: z.string().optional(),
  DATADOG_API_KEY: z.string().optional(),

  // Feature Flags
  ENABLE_ANALYTICS: z.coerce.boolean().default(true),
  ENABLE_NOTIFICATIONS: z.coerce.boolean().default(true),
  ENABLE_SHOPIFY_SYNC: z.coerce.boolean().default(true),

  // Health Check Configuration
  HEALTH_CHECK_INTERVAL: z.coerce.number().default(30000),
  HEALTH_CHECK_TIMEOUT: z.coerce.number().default(5000),
})

// Validate and export environment variables
export const env = envSchema.parse(process.env)

// Type for environment variables
export type Env = z.infer<typeof envSchema>

// Helper function to check if we're in development
export const isDevelopment = env.NODE_ENV === 'development'
export const isProduction = env.NODE_ENV === 'production'
export const isTest = env.NODE_ENV === 'test'
