import { z } from 'zod'
import { 
  uuidSchema, 
  emailSchema, 
  passwordSchema, 
  phoneSchema,
  sanitizeString
} from './common.js'

// User role and permission schemas
export const userRoleSchema = z.enum([
  'super_admin',
  'admin',
  'manager',
  'employee',
  'viewer'
])

export const permissionSchema = z.enum([
  // Product permissions
  'products:read',
  'products:write',
  'products:delete',
  'products:import',
  'products:export',
  
  // Inventory permissions
  'inventory:read',
  'inventory:write',
  'inventory:adjust',
  'inventory:transfer',
  
  // Order permissions
  'orders:read',
  'orders:write',
  'orders:fulfill',
  'orders:refund',
  'orders:cancel',
  
  // Customer permissions
  'customers:read',
  'customers:write',
  'customers:delete',
  'customers:export',
  
  // Analytics permissions
  'analytics:read',
  'analytics:export',
  
  // Settings permissions
  'settings:read',
  'settings:write',
  
  // User management permissions
  'users:read',
  'users:write',
  'users:delete',
  
  // Shopify integration permissions
  'shopify:read',
  'shopify:write',
  'shopify:sync',
  
  // System permissions
  'system:backup',
  'system:restore',
  'system:logs',
])

// User schema
export const userSchema = z.object({
  id: uuidSchema.optional(),
  email: emailSchema,
  firstName: z.string().min(1, 'First name is required').max(50, 'First name must be less than 50 characters').transform(sanitizeString),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name must be less than 50 characters').transform(sanitizeString),
  phone: phoneSchema.optional(),
  avatar: z.string().url('Invalid avatar URL').optional(),
  role: userRoleSchema,
  permissions: z.array(permissionSchema).default([]),
  isActive: z.boolean().default(true),
  emailVerified: z.boolean().default(false),
  phoneVerified: z.boolean().default(false),
  twoFactorEnabled: z.boolean().default(false),
  twoFactorSecret: z.string().optional(),
  backupCodes: z.array(z.string()).default([]),
  lastLoginAt: z.string().datetime().optional(),
  lastLoginIp: z.string().ip().optional(),
  passwordChangedAt: z.string().datetime().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
})

// Authentication schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().default(false),
  twoFactorCode: z.string().regex(/^\d{6}$/, 'Two-factor code must be 6 digits').optional(),
})

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  firstName: z.string().min(1, 'First name is required').max(50, 'First name must be less than 50 characters').transform(sanitizeString),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name must be less than 50 characters').transform(sanitizeString),
  phone: phoneSchema.optional(),
  acceptTerms: z.boolean().refine(val => val === true, 'You must accept the terms and conditions'),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export const forgotPasswordSchema = z.object({
  email: emailSchema,
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
})

export const resendVerificationSchema = z.object({
  email: emailSchema,
})

// Two-factor authentication schemas
export const enableTwoFactorSchema = z.object({
  password: z.string().min(1, 'Password is required'),
})

export const confirmTwoFactorSchema = z.object({
  secret: z.string().min(1, 'Secret is required'),
  code: z.string().regex(/^\d{6}$/, 'Code must be 6 digits'),
})

export const disableTwoFactorSchema = z.object({
  password: z.string().min(1, 'Password is required'),
  code: z.string().regex(/^\d{6}$/, 'Code must be 6 digits'),
})

export const verifyTwoFactorSchema = z.object({
  code: z.string().regex(/^\d{6}$/, 'Code must be 6 digits'),
})

export const generateBackupCodesSchema = z.object({
  password: z.string().min(1, 'Password is required'),
})

export const useBackupCodeSchema = z.object({
  code: z.string().regex(/^[A-Z0-9]{8}$/, 'Backup code must be 8 characters'),
})

// SMS verification schemas
export const sendSmsVerificationSchema = z.object({
  phone: phoneSchema,
})

export const verifySmsSchema = z.object({
  phone: phoneSchema,
  code: z.string().regex(/^\d{6}$/, 'Verification code must be 6 digits'),
})

// User management schemas
export const createUserSchema = userSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true,
  lastLoginIp: true,
  passwordChangedAt: true,
  twoFactorSecret: true,
  backupCodes: true,
}).extend({
  password: passwordSchema,
  sendWelcomeEmail: z.boolean().default(true),
})

export const updateUserSchema = userSchema.partial().extend({
  id: uuidSchema,
}).omit({
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true,
  lastLoginIp: true,
  passwordChangedAt: true,
  twoFactorSecret: true,
  backupCodes: true,
})

export const updateUserProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name must be less than 50 characters').transform(sanitizeString),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name must be less than 50 characters').transform(sanitizeString),
  phone: phoneSchema.optional(),
  avatar: z.string().url('Invalid avatar URL').optional(),
})

export const updateUserRoleSchema = z.object({
  userId: uuidSchema,
  role: userRoleSchema,
  permissions: z.array(permissionSchema).optional(),
})

// Session and token schemas
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
})

export const revokeTokenSchema = z.object({
  token: z.string().min(1, 'Token is required'),
})

export const sessionSchema = z.object({
  id: uuidSchema.optional(),
  userId: uuidSchema,
  token: z.string(),
  refreshToken: z.string(),
  userAgent: z.string().optional(),
  ipAddress: z.string().ip().optional(),
  expiresAt: z.string().datetime(),
  createdAt: z.string().datetime().optional(),
  lastUsedAt: z.string().datetime().optional(),
})

// API key schemas
export const apiKeySchema = z.object({
  id: uuidSchema.optional(),
  name: z.string().min(1, 'API key name is required').max(100, 'Name must be less than 100 characters'),
  key: z.string().optional(), // Generated server-side
  permissions: z.array(permissionSchema).min(1, 'At least one permission is required'),
  isActive: z.boolean().default(true),
  expiresAt: z.string().datetime().optional(),
  lastUsedAt: z.string().datetime().optional(),
  createdBy: uuidSchema,
  createdAt: z.string().datetime().optional(),
})

export const createApiKeySchema = apiKeySchema.omit({
  id: true,
  key: true,
  lastUsedAt: true,
  createdAt: true,
})

export const updateApiKeySchema = apiKeySchema.partial().extend({
  id: uuidSchema,
}).omit({
  key: true,
  lastUsedAt: true,
  createdAt: true,
  createdBy: true,
})

// Audit log schema
export const auditLogSchema = z.object({
  id: uuidSchema.optional(),
  userId: uuidSchema.optional(),
  action: z.string().min(1, 'Action is required'),
  resource: z.string().min(1, 'Resource is required'),
  resourceId: z.string().optional(),
  details: z.record(z.any()).optional(),
  ipAddress: z.string().ip().optional(),
  userAgent: z.string().optional(),
  createdAt: z.string().datetime().optional(),
})

// Password policy schema
export const passwordPolicySchema = z.object({
  minLength: z.number().int().min(8).max(128).default(8),
  requireUppercase: z.boolean().default(true),
  requireLowercase: z.boolean().default(true),
  requireNumbers: z.boolean().default(true),
  requireSpecialChars: z.boolean().default(true),
  maxAge: z.number().int().min(30).max(365).default(90), // days
  preventReuse: z.number().int().min(1).max(24).default(5), // last N passwords
})

// Security settings schema
export const securitySettingsSchema = z.object({
  passwordPolicy: passwordPolicySchema.default({}),
  sessionTimeout: z.number().int().min(300).max(86400).default(3600), // seconds
  maxLoginAttempts: z.number().int().min(3).max(10).default(5),
  lockoutDuration: z.number().int().min(300).max(3600).default(900), // seconds
  requireTwoFactor: z.boolean().default(false),
  allowedIpRanges: z.array(z.string()).default([]),
  trustedDevices: z.boolean().default(true),
})

// Type exports
export type UserRole = z.infer<typeof userRoleSchema>
export type Permission = z.infer<typeof permissionSchema>
export type User = z.infer<typeof userSchema>
export type Login = z.infer<typeof loginSchema>
export type Register = z.infer<typeof registerSchema>
export type ForgotPassword = z.infer<typeof forgotPasswordSchema>
export type ResetPassword = z.infer<typeof resetPasswordSchema>
export type ChangePassword = z.infer<typeof changePasswordSchema>
export type VerifyEmail = z.infer<typeof verifyEmailSchema>
export type ResendVerification = z.infer<typeof resendVerificationSchema>
export type EnableTwoFactor = z.infer<typeof enableTwoFactorSchema>
export type ConfirmTwoFactor = z.infer<typeof confirmTwoFactorSchema>
export type DisableTwoFactor = z.infer<typeof disableTwoFactorSchema>
export type VerifyTwoFactor = z.infer<typeof verifyTwoFactorSchema>
export type GenerateBackupCodes = z.infer<typeof generateBackupCodesSchema>
export type UseBackupCode = z.infer<typeof useBackupCodeSchema>
export type SendSmsVerification = z.infer<typeof sendSmsVerificationSchema>
export type VerifySms = z.infer<typeof verifySmsSchema>
export type CreateUser = z.infer<typeof createUserSchema>
export type UpdateUser = z.infer<typeof updateUserSchema>
export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>
export type UpdateUserRole = z.infer<typeof updateUserRoleSchema>
export type RefreshToken = z.infer<typeof refreshTokenSchema>
export type RevokeToken = z.infer<typeof revokeTokenSchema>
export type Session = z.infer<typeof sessionSchema>
export type ApiKey = z.infer<typeof apiKeySchema>
export type CreateApiKey = z.infer<typeof createApiKeySchema>
export type UpdateApiKey = z.infer<typeof updateApiKeySchema>
export type AuditLog = z.infer<typeof auditLogSchema>
export type PasswordPolicy = z.infer<typeof passwordPolicySchema>
export type SecuritySettings = z.infer<typeof securitySettingsSchema>