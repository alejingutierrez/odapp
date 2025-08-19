import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import {
  // Common schemas
  emailSchema,
  passwordSchema,
  phoneSchema,
  urlSchema,
  slugSchema,
  colorHexSchema,
  currencySchema,
  skuSchema,
  paginationSchema,
  searchSchema,
  dateRangeSchema,
  uuidSchema,
  sanitizeString,
  sanitizeHtml,
  
  // Product schemas
  productSchema,
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
  productVariantSchema,
  productImageSchema,
  productCategorySchema,
  productCollectionSchema,
  
  // Customer schemas
  customerSchema,
  createCustomerSchema,
  updateCustomerSchema,
  customerQuerySchema,
  customerAddressSchema,
  customerPreferencesSchema,
  customerSegmentSchema,
  
  // Order schemas
  orderSchema,
  createOrderSchema,
  updateOrderSchema,
  orderQuerySchema,
  orderLineItemSchema,
  orderDiscountSchema,
  orderShippingLineSchema,
  
  // Auth schemas
  userSchema,
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  
  // Shopify schemas
  shopifyConfigSchema,
  shopifySyncConfigSchema,
  shopifyWebhookSchema,
  shopifyProductSyncSchema,
  shopifyInventorySyncSchema,
} from '../schemas.js'

describe('Common Validation Schemas', () => {
  describe('emailSchema', () => {
    it('should validate correct email addresses', () => {
      const validEmails = [
        'user@example.com',
        'test.email+tag@domain.co.uk',
        'user123@test-domain.com',
      ]
      
      validEmails.forEach(email => {
        expect(emailSchema.parse(email)).toBe(email)
      })
    })

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user..double.dot@domain.com',
      ]
      
      invalidEmails.forEach(email => {
        expect(() => emailSchema.parse(email)).toThrow()
      })
    })
  })

  describe('passwordSchema', () => {
    it('should validate strong passwords', () => {
      const validPasswords = [
        'StrongPass123!',
        'MyP@ssw0rd',
        'Complex1ty!',
      ]
      
      validPasswords.forEach(password => {
        expect(passwordSchema.parse(password)).toBe(password)
      })
    })

    it('should reject weak passwords', () => {
      const invalidPasswords = [
        'weak',
        'NoNumbers!',
        'nonumbers123!',
        'NOLOWERCASE123!',
        'nospecialchars123',
        'short1!',
      ]
      
      invalidPasswords.forEach(password => {
        expect(() => passwordSchema.parse(password)).toThrow()
      })
    })
  })

  describe('phoneSchema', () => {
    it('should validate phone numbers', () => {
      const validPhones = [
        '+1234567890',
        '(555) 123-4567',
        '555-123-4567',
        '+44 20 7946 0958',
      ]
      
      validPhones.forEach(phone => {
        expect(phoneSchema.parse(phone)).toBe(phone)
      })
    })

    it('should reject invalid phone numbers', () => {
      const invalidPhones = [
        'abc123',
        '123-abc-4567',
        'phone-number',
      ]
      
      invalidPhones.forEach(phone => {
        expect(() => phoneSchema.parse(phone)).toThrow()
      })
    })
  })

  describe('slugSchema', () => {
    it('should validate URL slugs', () => {
      const validSlugs = [
        'product-name',
        'category-123',
        'simple-slug',
        'a-very-long-slug-with-many-words',
      ]
      
      validSlugs.forEach(slug => {
        expect(slugSchema.parse(slug)).toBe(slug)
      })
    })

    it('should reject invalid slugs', () => {
      const invalidSlugs = [
        'Product Name',
        'slug_with_underscores',
        'UPPERCASE-SLUG',
        'slug-',
        '-slug',
        'slug--double-dash',
      ]
      
      invalidSlugs.forEach(slug => {
        expect(() => slugSchema.parse(slug)).toThrow()
      })
    })
  })

  describe('colorHexSchema', () => {
    it('should validate hex colors', () => {
      const validColors = [
        '#FF0000',
        '#00ff00',
        '#0000FF',
        '#f00',
        '#0F0',
        '#00F',
      ]
      
      validColors.forEach(color => {
        expect(colorHexSchema.parse(color)).toBe(color)
      })
    })

    it('should reject invalid hex colors', () => {
      const invalidColors = [
        'red',
        'FF0000',
        '#GG0000',
        '#FF00',
        '#FF00000',
      ]
      
      invalidColors.forEach(color => {
        expect(() => colorHexSchema.parse(color)).toThrow()
      })
    })
  })

  describe('skuSchema', () => {
    it('should validate SKU formats', () => {
      const validSkus = [
        'PROD-123',
        'SKU_ABC_123',
        'SIMPLE123',
        'A-B-C-1-2-3',
      ]
      
      validSkus.forEach(sku => {
        expect(skuSchema.parse(sku)).toBe(sku)
      })
    })

    it('should reject invalid SKU formats', () => {
      const invalidSkus = [
        '',
        'sku with spaces',
        'sku-with-lowercase',
        'sku@with#special',
        'a'.repeat(51), // Too long
      ]
      
      invalidSkus.forEach(sku => {
        expect(() => skuSchema.parse(sku)).toThrow()
      })
    })
  })

  describe('paginationSchema', () => {
    it('should validate pagination parameters', () => {
      const validPagination = {
        page: '2',
        limit: '50',
        sortBy: 'name',
        sortOrder: 'asc' as const,
      }
      
      const result = paginationSchema.parse(validPagination)
      expect(result).toEqual({
        page: 2,
        limit: 50,
        sortBy: 'name',
        sortOrder: 'asc',
      })
    })

    it('should apply default values', () => {
      const result = paginationSchema.parse({})
      expect(result).toEqual({
        page: 1,
        limit: 20,
        sortOrder: 'desc',
      })
    })

    it('should enforce limits', () => {
      expect(() => paginationSchema.parse({ page: '0' })).toThrow()
      expect(() => paginationSchema.parse({ limit: '101' })).toThrow()
    })
  })

  describe('dateRangeSchema', () => {
    it('should validate date ranges', () => {
      const validRange = {
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-12-31T23:59:59Z',
      }
      
      expect(dateRangeSchema.parse(validRange)).toEqual(validRange)
    })

    it('should reject invalid date ranges', () => {
      const invalidRange = {
        startDate: '2024-12-31T23:59:59Z',
        endDate: '2024-01-01T00:00:00Z',
      }
      
      expect(() => dateRangeSchema.parse(invalidRange)).toThrow()
    })
  })
})

describe('Product Validation Schemas', () => {
  describe('productVariantSchema', () => {
    it('should validate product variants', () => {
      const validVariant = {
        sku: 'PROD-123-RED-M',
        size: 'M',
        color: 'Red',
        price: 29.99,
        inventoryQuantity: 10,
      }
      
      const result = productVariantSchema.parse(validVariant)
      expect(result).toEqual(expect.objectContaining(validVariant))
    })

    it('should reject invalid variants', () => {
      const invalidVariant = {
        sku: '',
        size: '',
        color: '',
        price: -10,
        inventoryQuantity: -5,
      }
      
      expect(() => productVariantSchema.parse(invalidVariant)).toThrow()
    })
  })

  describe('productSchema', () => {
    it('should validate complete products', () => {
      const validProduct = {
        name: 'Test Product',
        slug: 'test-product',
        description: 'A test product description',
        status: 'active' as const,
        variants: [{
          sku: 'TEST-001',
          size: 'M',
          color: 'Blue',
          price: 49.99,
          inventoryQuantity: 5,
        }],
      }
      
      const result = productSchema.parse(validProduct)
      expect(result.name).toBe(validProduct.name)
      expect(result.slug).toBe(validProduct.slug)
      expect(result.description).toBe(validProduct.description)
      expect(result.status).toBe(validProduct.status)
      expect(result.variants).toHaveLength(1)
      expect(result.variants[0].sku).toBe(validProduct.variants[0].sku)
    })

    it('should require at least one variant', () => {
      const productWithoutVariants = {
        name: 'Test Product',
        slug: 'test-product',
        variants: [],
      }
      
      expect(() => productSchema.parse(productWithoutVariants)).toThrow()
    })

    it('should sanitize product name', () => {
      const productWithUnsafeName = {
        name: '  <script>alert("xss")</script>Product Name  ',
        slug: 'product-name',
        variants: [{
          sku: 'TEST-001',
          size: 'M',
          color: 'Blue',
          price: 49.99,
          inventoryQuantity: 5,
        }],
      }
      
      const result = productSchema.parse(productWithUnsafeName)
      expect(result.name).toBe('alert("xss")Product Name')
    })
  })

  describe('productQuerySchema', () => {
    it('should validate product queries', () => {
      const validQuery = {
        q: 'search term',
        status: 'active' as const,
        priceMin: '10',
        priceMax: '100',
        page: '2',
        limit: '20',
      }
      
      const result = productQuerySchema.parse(validQuery)
      expect(result).toEqual(expect.objectContaining({
        q: 'search term',
        status: 'active',
        priceMin: 10,
        priceMax: 100,
        page: 2,
        limit: 20,
      }))
    })
  })
})

describe('Customer Validation Schemas', () => {
  describe('customerAddressSchema', () => {
    it('should validate customer addresses', () => {
      const validAddress = {
        firstName: 'John',
        lastName: 'Doe',
        address1: '123 Main St',
        city: 'New York',
        country: 'US',
        zip: '10001',
      }
      
      const result = customerAddressSchema.parse(validAddress)
      expect(result).toEqual(expect.objectContaining(validAddress))
    })

    it('should sanitize address fields', () => {
      const addressWithUnsafeData = {
        firstName: '  <script>John</script>  ',
        lastName: '  Doe<>  ',
        address1: '123 Main St',
        city: 'New York',
        country: 'US',
        zip: '10001',
      }
      
      const result = customerAddressSchema.parse(addressWithUnsafeData)
      expect(result.firstName).toBe('John')
      expect(result.lastName).toBe('Doe')
    })
  })

  describe('customerSchema', () => {
    it('should validate complete customers', () => {
      const validCustomer = {
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
        status: 'active' as const,
      }
      
      const result = customerSchema.parse(validCustomer)
      expect(result).toEqual(expect.objectContaining(validCustomer))
    })

    it('should apply default values', () => {
      const minimalCustomer = {
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
      }
      
      const result = customerSchema.parse(minimalCustomer)
      expect(result.status).toBe('active')
      expect(result.addresses).toEqual([])
      expect(result.tags).toEqual([])
    })
  })
})

describe('Order Validation Schemas', () => {
  describe('orderLineItemSchema', () => {
    it('should validate order line items', () => {
      const validLineItem = {
        productId: '123e4567-e89b-12d3-a456-426614174000',
        variantId: '123e4567-e89b-12d3-a456-426614174001',
        quantity: 2,
        price: 29.99,
        title: 'Test Product',
      }
      
      const result = orderLineItemSchema.parse(validLineItem)
      expect(result).toEqual(expect.objectContaining(validLineItem))
    })

    it('should require positive quantity', () => {
      const invalidLineItem = {
        productId: '123e4567-e89b-12d3-a456-426614174000',
        variantId: '123e4567-e89b-12d3-a456-426614174001',
        quantity: 0,
        price: 29.99,
        title: 'Test Product',
      }
      
      expect(() => orderLineItemSchema.parse(invalidLineItem)).toThrow()
    })
  })

  describe('orderSchema', () => {
    it('should validate complete orders', () => {
      const validOrder = {
        email: 'customer@example.com',
        customerInfo: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'customer@example.com',
        },
        billingAddress: {
          firstName: 'John',
          lastName: 'Doe',
          address1: '123 Main St',
          city: 'New York',
          country: 'US',
          zip: '10001',
        },
        shippingAddress: {
          firstName: 'John',
          lastName: 'Doe',
          address1: '123 Main St',
          city: 'New York',
          country: 'US',
          zip: '10001',
        },
        lineItems: [{
          productId: '123e4567-e89b-12d3-a456-426614174000',
          variantId: '123e4567-e89b-12d3-a456-426614174001',
          quantity: 1,
          price: 29.99,
          title: 'Test Product',
        }],
        subtotalPrice: 29.99,
        totalPrice: 29.99,
      }
      
      const result = orderSchema.parse(validOrder)
      expect(result.email).toBe(validOrder.email)
      expect(result.customerInfo).toEqual(expect.objectContaining(validOrder.customerInfo))
      expect(result.lineItems).toHaveLength(1)
      expect(result.subtotalPrice).toBe(validOrder.subtotalPrice)
      expect(result.totalPrice).toBe(validOrder.totalPrice)
    })

    it('should require at least one line item', () => {
      const orderWithoutItems = {
        email: 'customer@example.com',
        lineItems: [],
        subtotalPrice: 0,
        totalPrice: 0,
      }
      
      expect(() => orderSchema.parse(orderWithoutItems)).toThrow()
    })
  })
})

describe('Auth Validation Schemas', () => {
  describe('loginSchema', () => {
    it('should validate login credentials', () => {
      const validLogin = {
        email: 'user@example.com',
        password: 'password123',
        rememberMe: true,
      }
      
      const result = loginSchema.parse(validLogin)
      expect(result).toEqual(validLogin)
    })

    it('should validate two-factor code format', () => {
      const loginWithTwoFactor = {
        email: 'user@example.com',
        password: 'password123',
        twoFactorCode: '123456',
      }
      
      const result = loginSchema.parse(loginWithTwoFactor)
      expect(result.twoFactorCode).toBe('123456')
      
      expect(() => loginSchema.parse({
        ...loginWithTwoFactor,
        twoFactorCode: '12345', // Too short
      })).toThrow()
    })
  })

  describe('registerSchema', () => {
    it('should validate registration data', () => {
      const validRegistration = {
        email: 'user@example.com',
        password: 'StrongPass123!',
        confirmPassword: 'StrongPass123!',
        firstName: 'John',
        lastName: 'Doe',
        acceptTerms: true,
      }
      
      const result = registerSchema.parse(validRegistration)
      expect(result).toEqual(validRegistration)
    })

    it('should enforce password confirmation', () => {
      const registrationWithMismatch = {
        email: 'user@example.com',
        password: 'StrongPass123!',
        confirmPassword: 'DifferentPass123!',
        firstName: 'John',
        lastName: 'Doe',
        acceptTerms: true,
      }
      
      expect(() => registerSchema.parse(registrationWithMismatch)).toThrow()
    })

    it('should require terms acceptance', () => {
      const registrationWithoutTerms = {
        email: 'user@example.com',
        password: 'StrongPass123!',
        confirmPassword: 'StrongPass123!',
        firstName: 'John',
        lastName: 'Doe',
        acceptTerms: false,
      }
      
      expect(() => registerSchema.parse(registrationWithoutTerms)).toThrow()
    })
  })
})

describe('Shopify Validation Schemas', () => {
  describe('shopifyConfigSchema', () => {
    it('should validate Shopify configuration', () => {
      const validConfig = {
        shopDomain: 'test-shop.myshopify.com',
        accessToken: 'shpat_test_token',
        webhookSecret: 'webhook_secret_123',
      }
      
      const result = shopifyConfigSchema.parse(validConfig)
      expect(result).toEqual(expect.objectContaining(validConfig))
      expect(result.apiVersion).toBe('2024-01')
      expect(result.isActive).toBe(true)
    })

    it('should reject invalid shop domains', () => {
      const invalidConfig = {
        shopDomain: 'invalid-domain.com',
        accessToken: 'token',
        webhookSecret: 'secret',
      }
      
      expect(() => shopifyConfigSchema.parse(invalidConfig)).toThrow()
    })
  })

  describe('shopifyWebhookSchema', () => {
    it('should validate webhook data', () => {
      const validWebhook = {
        topic: 'orders/create' as const,
        shopId: 'shop123',
        payload: { id: 123, status: 'open' },
        headers: { 'x-shopify-topic': 'orders/create' },
      }
      
      const result = shopifyWebhookSchema.parse(validWebhook)
      expect(result).toEqual(expect.objectContaining(validWebhook))
      expect(result.verified).toBe(false)
      expect(result.processed).toBe(false)
    })
  })
})

describe('Sanitization Functions', () => {
  describe('sanitizeString', () => {
    it('should remove HTML tags and trim whitespace', () => {
      expect(sanitizeString('  Hello World  ')).toBe('Hello World')
      expect(sanitizeString('<script>alert("xss")</script>')).toBe('alert("xss")')
      expect(sanitizeString('Normal text')).toBe('Normal text')
    })
  })

  describe('sanitizeHtml', () => {
    it('should remove dangerous HTML elements and attributes', () => {
      expect(sanitizeHtml('<p>Safe content</p>')).toBe('<p>Safe content</p>')
      expect(sanitizeHtml('<script>alert("xss")</script>')).toBe('')
      expect(sanitizeHtml('<div onclick="alert()">Click me</div>')).toBe('<div>Click me</div>')
      expect(sanitizeHtml('javascript:alert("xss")')).toBe('alert("xss")')
    })
  })
})

describe('Schema Integration Tests', () => {
  it('should handle complex nested validation', () => {
    const complexProduct = {
      name: 'Complex Product',
      slug: 'complex-product',
      description: '<p>Safe HTML description</p><script>alert("xss")</script>',
      variants: [
        {
          sku: 'COMPLEX-001-RED-S',
          size: 'S',
          color: 'Red',
          colorHex: '#FF0000',
          price: 29.99,
          compareAtPrice: 39.99,
          inventoryQuantity: 10,
        },
        {
          sku: 'COMPLEX-001-BLUE-M',
          size: 'M',
          color: 'Blue',
          colorHex: '#0000FF',
          price: 29.99,
          inventoryQuantity: 5,
        },
      ],
      images: [
        {
          url: 'https://example.com/image1.jpg',
          altText: 'Product image 1',
          position: 0,
        },
        {
          url: 'https://example.com/image2.jpg',
          altText: 'Product image 2',
          position: 1,
        },
      ],
      tags: ['clothing', 'shirt', 'casual'],
      seo: {
        title: 'Complex Product - Best Shirt Ever',
        description: 'The best shirt you will ever own',
        keywords: ['shirt', 'clothing', 'fashion'],
      },
    }
    
    const result = productSchema.parse(complexProduct)
    
    // Check that HTML was sanitized
    expect(result.description).toBe('<p>Safe HTML description</p>')
    
    // Check that all variants are valid
    expect(result.variants).toHaveLength(2)
    expect(result.variants[0].colorHex).toBe('#FF0000')
    expect(result.variants[1].colorHex).toBe('#0000FF')
    
    // Check that images are valid
    expect(result.images).toHaveLength(2)
    expect(result.images[0].position).toBe(0)
    expect(result.images[1].position).toBe(1)
  })

  it('should validate cross-schema relationships', () => {
    // Test that customer and order schemas work together
    const customer = {
      email: 'john@example.com',
      firstName: 'John',
      lastName: 'Doe',
    }
    
    const order = {
      email: customer.email,
      customerInfo: {
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
      },
      billingAddress: {
        firstName: customer.firstName,
        lastName: customer.lastName,
        address1: '123 Main St',
        city: 'New York',
        country: 'US',
        zip: '10001',
      },
      shippingAddress: {
        firstName: customer.firstName,
        lastName: customer.lastName,
        address1: '123 Main St',
        city: 'New York',
        country: 'US',
        zip: '10001',
      },
      lineItems: [{
        productId: '123e4567-e89b-12d3-a456-426614174000',
        variantId: '123e4567-e89b-12d3-a456-426614174001',
        quantity: 1,
        price: 29.99,
        title: 'Test Product',
      }],
      subtotalPrice: 29.99,
      totalPrice: 29.99,
    }
    
    const validCustomer = customerSchema.parse(customer)
    const validOrder = orderSchema.parse(order)
    
    expect(validCustomer.email).toBe(validOrder.email)
    expect(validCustomer.firstName).toBe(validOrder.customerInfo.firstName)
    expect(validCustomer.lastName).toBe(validOrder.customerInfo.lastName)
  })
})