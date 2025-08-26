import * as yup from 'yup'
import { z } from 'zod'

// Custom validation methods for Yup
yup.addMethod(yup.string, 'sku', function (message = 'Invalid SKU format') {
  return this.matches(/^[A-Z0-9-_]+$/, message)
})

yup.addMethod(yup.string, 'slug', function (message = 'Invalid slug format') {
  return this.matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, message)
})

yup.addMethod(
  yup.string,
  'hexColor',
  function (message = 'Invalid hex color format') {
    return this.matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, message)
  }
)

yup.addMethod(
  yup.string,
  'currency',
  function (message = 'Invalid currency code') {
    return this.matches(/^[A-Z]{3}$/, message)
  }
)

yup.addMethod(
  yup.string,
  'strongPassword',
  function (
    message = 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  ) {
    return this.matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      message
    )
  }
)

// Declare module augmentation for TypeScript
declare module 'yup' {
  interface StringSchema {
    sku(message?: string): StringSchema
    slug(message?: string): StringSchema
    hexColor(message?: string): StringSchema
    currency(message?: string): StringSchema
    strongPassword(message?: string): StringSchema
  }
}

// Common validation schemas
export const commonSchemas = {
  email: yup
    .string()
    .email('Invalid email format')
    .required('Email is required'),

  password: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .strongPassword()
    .required('Password is required'),

  phone: yup
    .string()
    .matches(/^\+?[\d\s-()]+$/, 'Invalid phone number format')
    .nullable(),

  url: yup.string().url('Invalid URL format').nullable(),

  uuid: yup.string().uuid('Invalid UUID format'),

  sku: yup.string().required('SKU is required').sku(),

  slug: yup.string().slug().required('Slug is required'),

  hexColor: yup.string().hexColor().nullable(),

  currency: yup.string().currency().required('Currency is required'),

  positiveNumber: yup.number().min(0, 'Must be a positive number'),

  requiredString: yup.string().required('This field is required'),

  optionalString: yup.string().nullable(),
}

// Product validation schemas
export const productSchemas = {
  name: yup
    .string()
    .min(1, 'Product name is required')
    .max(255, 'Product name must be less than 255 characters')
    .required('Product name is required'),

  description: yup
    .string()
    .max(5000, 'Description must be less than 5000 characters')
    .nullable(),

  shortDescription: yup
    .string()
    .max(500, 'Short description must be less than 500 characters')
    .nullable(),

  status: yup
    .string()
    .oneOf(['draft', 'active', 'archived'], 'Invalid product status')
    .required('Status is required'),

  vendor: yup
    .string()
    .max(100, 'Vendor must be less than 100 characters')
    .nullable(),

  productType: yup
    .string()
    .max(100, 'Product type must be less than 100 characters')
    .nullable(),

  tags: yup
    .array()
    .of(yup.string().max(50, 'Tag must be less than 50 characters'))
    .max(20, 'Maximum 20 tags allowed'),

  variant: yup.object({
    sku: commonSchemas.sku,
    size: yup
      .string()
      .required('Size is required')
      .max(20, 'Size must be less than 20 characters'),
    color: yup
      .string()
      .required('Color is required')
      .max(50, 'Color must be less than 50 characters'),
    colorHex: commonSchemas.hexColor,
    material: yup
      .string()
      .max(100, 'Material must be less than 100 characters')
      .nullable(),
    price: commonSchemas.positiveNumber.required('Price is required'),
    compareAtPrice: commonSchemas.positiveNumber.nullable(),
    cost: commonSchemas.positiveNumber.nullable(),
    weight: commonSchemas.positiveNumber.nullable(),
    barcode: yup
      .string()
      .max(50, 'Barcode must be less than 50 characters')
      .nullable(),
    inventoryQuantity: yup
      .number()
      .integer()
      .min(0, 'Inventory quantity must be non-negative')
      .required(),
    requiresShipping: yup.boolean().default(true),
    taxable: yup.boolean().default(true),
  }),

  image: yup.object({
    url: commonSchemas.url.required('Image URL is required'),
    altText: yup
      .string()
      .max(255, 'Alt text must be less than 255 characters')
      .nullable(),
    position: yup
      .number()
      .integer()
      .min(0, 'Position must be non-negative')
      .default(0),
  }),

  seo: yup.object({
    title: yup
      .string()
      .max(60, 'SEO title must be less than 60 characters')
      .nullable(),
    description: yup
      .string()
      .max(160, 'SEO description must be less than 160 characters')
      .nullable(),
    keywords: yup
      .array()
      .of(yup.string())
      .max(10, 'Maximum 10 keywords allowed')
      .nullable(),
  }),
}

// Customer validation schemas
export const customerSchemas = {
  firstName: yup
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters')
    .required('First name is required'),

  lastName: yup
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters')
    .required('Last name is required'),

  email: commonSchemas.email,

  phone: commonSchemas.phone,

  dateOfBirth: yup
    .date()
    .max(new Date(), 'Date of birth cannot be in the future')
    .nullable(),

  gender: yup
    .string()
    .oneOf(['male', 'female', 'other', 'prefer_not_to_say'], 'Invalid gender')
    .nullable(),

  status: yup
    .string()
    .oneOf(['active', 'inactive', 'blocked'], 'Invalid customer status')
    .required('Status is required'),

  address: yup.object({
    type: yup
      .string()
      .oneOf(['billing', 'shipping', 'both'], 'Invalid address type')
      .default('both'),
    firstName: yup
      .string()
      .min(1, 'First name is required')
      .max(50, 'First name must be less than 50 characters')
      .required('First name is required'),
    lastName: yup
      .string()
      .min(1, 'Last name is required')
      .max(50, 'Last name must be less than 50 characters')
      .required('Last name is required'),
    company: yup
      .string()
      .max(100, 'Company must be less than 100 characters')
      .nullable(),
    address1: yup
      .string()
      .required('Address line 1 is required')
      .max(255, 'Address line 1 must be less than 255 characters'),
    address2: yup
      .string()
      .max(255, 'Address line 2 must be less than 255 characters')
      .nullable(),
    city: yup
      .string()
      .required('City is required')
      .max(100, 'City must be less than 100 characters'),
    province: yup
      .string()
      .max(100, 'Province must be less than 100 characters')
      .nullable(),
    country: yup
      .string()
      .length(2, 'Country must be 2 characters')
      .required('Country is required'),
    zip: yup
      .string()
      .required('ZIP code is required')
      .max(20, 'ZIP code must be less than 20 characters'),
    phone: commonSchemas.phone,
    isDefault: yup.boolean().default(false),
  }),

  preferences: yup.object({
    language: yup
      .string()
      .matches(/^[a-z]{2}(-[A-Z]{2})?$/, 'Invalid language format')
      .default('en'),
    currency: commonSchemas.currency.default('USD'),
    timezone: yup.string().default('UTC'),
    emailMarketing: yup.boolean().default(true),
    smsMarketing: yup.boolean().default(false),
    pushNotifications: yup.boolean().default(true),
    newsletter: yup.boolean().default(true),
  }),
}

// Order validation schemas
export const orderSchemas = {
  customerInfo: yup.object({
    firstName: yup
      .string()
      .min(1, 'First name is required')
      .max(50, 'First name must be less than 50 characters')
      .required('First name is required'),
    lastName: yup
      .string()
      .min(1, 'Last name is required')
      .max(50, 'Last name must be less than 50 characters')
      .required('Last name is required'),
    email: commonSchemas.email,
    phone: commonSchemas.phone,
  }),

  lineItem: yup.object({
    productId: commonSchemas.uuid.required('Product ID is required'),
    variantId: commonSchemas.uuid.required('Variant ID is required'),
    quantity: yup
      .number()
      .integer()
      .min(1, 'Quantity must be at least 1')
      .required('Quantity is required'),
    price: commonSchemas.positiveNumber.required('Price is required'),
    compareAtPrice: commonSchemas.positiveNumber.nullable(),
    totalDiscount: commonSchemas.positiveNumber.default(0),
    title: yup
      .string()
      .required('Product title is required')
      .max(255, 'Title must be less than 255 characters'),
    variantTitle: yup
      .string()
      .max(255, 'Variant title must be less than 255 characters')
      .nullable(),
    sku: yup.string().max(50, 'SKU must be less than 50 characters').nullable(),
    requiresShipping: yup.boolean().default(true),
    taxable: yup.boolean().default(true),
  }),

  discount: yup.object({
    code: yup
      .string()
      .max(50, 'Discount code must be less than 50 characters')
      .nullable(),
    type: yup
      .string()
      .oneOf(
        ['percentage', 'fixed_amount', 'shipping'],
        'Invalid discount type'
      )
      .required(),
    value: commonSchemas.positiveNumber.required('Discount value is required'),
    amount: commonSchemas.positiveNumber.required(
      'Discount amount is required'
    ),
    title: yup
      .string()
      .max(255, 'Discount title must be less than 255 characters')
      .required(),
  }),

  shippingLine: yup.object({
    title: yup
      .string()
      .required('Shipping title is required')
      .max(255, 'Title must be less than 255 characters'),
    price: commonSchemas.positiveNumber.required('Shipping price is required'),
    code: yup
      .string()
      .max(50, 'Shipping code must be less than 50 characters')
      .nullable(),
    carrier: yup
      .string()
      .max(100, 'Carrier must be less than 100 characters')
      .nullable(),
  }),

  status: yup
    .string()
    .oneOf(
      [
        'pending',
        'confirmed',
        'processing',
        'shipped',
        'delivered',
        'cancelled',
        'refunded',
        'partially_refunded',
      ],
      'Invalid order status'
    )
    .default('pending'),

  paymentStatus: yup
    .string()
    .oneOf(
      [
        'pending',
        'authorized',
        'paid',
        'partially_paid',
        'refunded',
        'partially_refunded',
        'voided',
        'failed',
      ],
      'Invalid payment status'
    )
    .default('pending'),

  fulfillmentStatus: yup
    .string()
    .oneOf(
      ['unfulfilled', 'partial', 'fulfilled', 'restocked'],
      'Invalid fulfillment status'
    )
    .default('unfulfilled'),
}

// Authentication validation schemas
export const authSchemas = {
  login: yup.object({
    email: commonSchemas.email,
    password: yup.string().required('Password is required'),
    rememberMe: yup.boolean().default(false),
    twoFactorCode: yup
      .string()
      .matches(/^\d{6}$/, 'Two-factor code must be 6 digits')
      .nullable(),
  }),

  register: yup.object({
    email: commonSchemas.email,
    password: commonSchemas.password,
    confirmPassword: yup
      .string()
      .required('Please confirm your password')
      .oneOf([yup.ref('password')], 'Passwords must match'),
    firstName: customerSchemas.firstName,
    lastName: customerSchemas.lastName,
    phone: commonSchemas.phone,
    acceptTerms: yup
      .boolean()
      .oneOf([true], 'You must accept the terms and conditions')
      .required('You must accept the terms and conditions'),
  }),

  forgotPassword: yup.object({
    email: commonSchemas.email,
  }),

  resetPassword: yup.object({
    token: yup.string().required('Reset token is required'),
    password: commonSchemas.password,
    confirmPassword: yup
      .string()
      .required('Please confirm your password')
      .oneOf([yup.ref('password')], 'Passwords must match'),
  }),

  changePassword: yup.object({
    currentPassword: yup.string().required('Current password is required'),
    newPassword: commonSchemas.password,
    confirmPassword: yup
      .string()
      .required('Please confirm your password')
      .oneOf([yup.ref('newPassword')], 'Passwords must match'),
  }),

  twoFactorCode: yup.object({
    code: yup
      .string()
      .matches(/^\d{6}$/, 'Code must be 6 digits')
      .required('Code is required'),
  }),
}

// Utility functions
export const sanitizeString = (str: string): string => {
  return str
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, (match) => {
      // Extract content between script tags
      const content = match.replace(/<\/?script[^>]*>/gi, '')
      return content
    })
    .replace(/[<>]/g, '')
}

export const sanitizeHtml = (html: string): string => {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\s+on\w+="[^"]*"/gi, '')
    .replace(/javascript:/gi, '')
    .trim()
}

// Real-time validation helpers
export const createRealTimeValidator = <T>(schema: yup.Schema<T>) => {
  return {
    validate: async (value: T) => {
      try {
        await schema.validate(value, { abortEarly: false })
        return { isValid: true, errors: [] }
      } catch (error) {
        if (error instanceof yup.ValidationError) {
          return {
            isValid: false,
            errors: error.errors,
          }
        }
        return { isValid: false, errors: ['Validation failed'] }
      }
    },

    validateField: async (field: string, value: unknown) => {
      try {
        await schema.validateAt(field, { [field]: value })
        return { isValid: true, error: null }
      } catch (error) {
        if (error instanceof yup.ValidationError) {
          return {
            isValid: false,
            error: error.message,
          }
        }
        return { isValid: false, error: 'Validation failed' }
      }
    },
  }
}

// Form validation hook
export const useFormValidation = <T>(schema: yup.Schema<T>) => {
  const validator = createRealTimeValidator(schema)

  return {
    validate: validator.validate,
    validateField: validator.validateField,
    schema,
  }
}

// Convert Zod schema to Yup schema (basic conversion)
export const zodToYup = (zodSchema: z.ZodSchema): yup.Schema<unknown> => {
  // This is a simplified conversion - in practice, you might want to use a library
  // or implement more comprehensive conversion logic
  if (zodSchema instanceof z.ZodString) {
    let yupSchema = yup.string()

    // Add string-specific validations
    const checks =
      (
        zodSchema as {
          _def: {
            checks?: Array<{
              kind: string
              message?: string
              value?: number
              regex?: RegExp
            }>
          }
        }
      )._def.checks || []
    for (const check of checks) {
      switch (check.kind) {
        case 'email':
          yupSchema = yupSchema.email(check.message)
          break
        case 'min':
          if (check.value !== undefined) {
            yupSchema = yupSchema.min(check.value, check.message)
          }
          break
        case 'max':
          if (check.value !== undefined) {
            yupSchema = yupSchema.max(check.value, check.message)
          }
          break
        case 'regex':
          if (check.regex !== undefined) {
            yupSchema = yupSchema.matches(check.regex, check.message)
          }
          break
      }
    }

    return yupSchema
  }

  if (zodSchema instanceof z.ZodNumber) {
    return yup.number()
  }

  if (zodSchema instanceof z.ZodBoolean) {
    return yup.boolean()
  }

  if (zodSchema instanceof z.ZodArray) {
    return yup.array()
  }

  if (zodSchema instanceof z.ZodObject) {
    const shape: Record<string, unknown> = {}
    const zodShape = (
      zodSchema as { _def: { shape: () => Record<string, unknown> } }
    )._def.shape()

    for (const [key, value] of Object.entries(zodShape)) {
      shape[key] = zodToYup(value as z.ZodSchema)
    }

    return yup.object(shape as Record<string, yup.Schema>)
  }

  // Fallback for unsupported types
  return yup.mixed()
}

// File validation
export const fileValidation = {
  image: yup
    .mixed()
    .test('fileSize', 'File size must be less than 5MB', (value: unknown) => {
      if (!value || !(value instanceof File)) return true
      return value.size <= 5 * 1024 * 1024
    })
    .test('fileType', 'Only image files are allowed', (value: unknown) => {
      if (!value || !(value instanceof File)) return true
      return [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
      ].includes(value.type)
    }),

  document: yup
    .mixed()
    .test('fileSize', 'File size must be less than 10MB', (value: unknown) => {
      if (!value || !(value instanceof File)) return true
      return value.size <= 10 * 1024 * 1024
    })
    .test(
      'fileType',
      'Only PDF, DOC, and DOCX files are allowed',
      (value: unknown) => {
        if (!value || !(value instanceof File)) return true
        return [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ].includes(value.type)
      }
    ),
}

// Export all schemas for easy access
export const validationSchemas = {
  common: commonSchemas,
  product: productSchemas,
  customer: customerSchemas,
  order: orderSchemas,
  auth: authSchemas,
  file: fileValidation,
}
