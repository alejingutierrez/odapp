/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import * as yup from 'yup'
import {
  validationSchemas,
  sanitizeString,
  sanitizeHtml,
  createRealTimeValidator,
  zodToYup,
} from '../utils/validation'
import {
  useFormValidation as useFormValidationHook,
  useDynamicFormArray,
  useConditionalValidation,
  useAsyncValidation,
  useFormPersistence,
} from '../hooks/useFormValidation'
import { z } from 'zod'

describe('Validation Utils', () => {
  describe('validationSchemas', () => {
    describe('common schemas', () => {
      it('should validate email correctly', async () => {
        const { email } = validationSchemas.common

        await expect(email.validate('test@example.com')).resolves.toBe(
          'test@example.com'
        )
        await expect(email.validate('invalid-email')).rejects.toThrow(
          'Invalid email format'
        )
        await expect(email.validate('')).rejects.toThrow('Email is required')
      })

      it('should validate strong password', async () => {
        const { password } = validationSchemas.common

        await expect(password.validate('StrongPass123!')).resolves.toBe(
          'StrongPass123!'
        )
        await expect(password.validate('weak')).rejects.toThrow()
        await expect(password.validate('NoNumbers!')).rejects.toThrow()
        await expect(password.validate('nonumbers123!')).rejects.toThrow()
      })

      it('should validate phone number', async () => {
        const { phone } = validationSchemas.common

        await expect(phone.validate('+1234567890')).resolves.toBe('+1234567890')
        await expect(phone.validate('(555) 123-4567')).resolves.toBe(
          '(555) 123-4567'
        )
        await expect(phone.validate('invalid-phone')).rejects.toThrow()
      })

      it('should validate SKU format', async () => {
        const { sku } = validationSchemas.common

        await expect(sku.validate('PROD-123-ABC')).resolves.toBe('PROD-123-ABC')
        await expect(sku.validate('SIMPLE123')).resolves.toBe('SIMPLE123')
        await expect(sku.validate('invalid-sku!')).rejects.toThrow(
          'Invalid SKU format'
        )
        await expect(sku.validate('')).rejects.toThrow('SKU is required')
      })

      it('should validate hex color', async () => {
        const { hexColor } = validationSchemas.common

        await expect(hexColor.validate('#FF0000')).resolves.toBe('#FF0000')
        await expect(hexColor.validate('#f00')).resolves.toBe('#f00')
        await expect(hexColor.validate('red')).rejects.toThrow()
        await expect(hexColor.validate('#GG0000')).rejects.toThrow()
      })
    })

    describe('product schemas', () => {
      it('should validate product name', async () => {
        const { name } = validationSchemas.product

        await expect(name.validate('Valid Product Name')).resolves.toBe(
          'Valid Product Name'
        )
        await expect(name.validate('')).rejects.toThrow(
          'Product name is required'
        )
        await expect(name.validate('a'.repeat(256))).rejects.toThrow(
          'Product name must be less than 255 characters'
        )
      })

      it('should validate product variant', async () => {
        const { variant } = validationSchemas.product

        const validVariant = {
          sku: 'PROD-123',
          size: 'M',
          color: 'Red',
          price: 29.99,
          inventoryQuantity: 10,
        }

        await expect(variant.validate(validVariant)).resolves.toEqual(
          expect.objectContaining(validVariant)
        )

        const invalidVariant = {
          sku: '',
          size: '',
          color: '',
          price: -10,
          inventoryQuantity: -5,
        }

        await expect(variant.validate(invalidVariant)).rejects.toThrow()
      })

      it('should validate product image', async () => {
        const { image } = validationSchemas.product

        const validImage = {
          url: 'https://example.com/image.jpg',
          altText: 'Product image',
          position: 0,
        }

        await expect(image.validate(validImage)).resolves.toEqual(
          expect.objectContaining(validImage)
        )

        await expect(image.validate({ url: 'invalid-url' })).rejects.toThrow()
      })
    })

    describe('customer schemas', () => {
      it('should validate customer name', async () => {
        const { firstName, lastName } = validationSchemas.customer

        await expect(firstName.validate('John')).resolves.toBe('John')
        await expect(lastName.validate('Doe')).resolves.toBe('Doe')
        await expect(firstName.validate('')).rejects.toThrow(
          'First name is required'
        )
        await expect(lastName.validate('a'.repeat(51))).rejects.toThrow()
      })

      it('should validate customer address', async () => {
        const { address } = validationSchemas.customer

        const validAddress = {
          firstName: 'John',
          lastName: 'Doe',
          address1: '123 Main St',
          city: 'New York',
          country: 'US',
          zip: '10001',
        }

        await expect(address.validate(validAddress)).resolves.toEqual(
          expect.objectContaining(validAddress)
        )

        const invalidAddress = {
          firstName: '',
          lastName: '',
          address1: '',
          city: '',
          country: 'USA', // Should be 2 characters
          zip: '',
        }

        await expect(address.validate(invalidAddress)).rejects.toThrow()
      })
    })

    describe('auth schemas', () => {
      it('should validate login form', async () => {
        const { login } = validationSchemas.auth

        const validLogin = {
          email: 'user@example.com',
          password: 'password123',
          rememberMe: true,
        }

        await expect(login.validate(validLogin)).resolves.toEqual(
          expect.objectContaining(validLogin)
        )

        await expect(
          login.validate({
            email: 'invalid-email',
            password: '',
          })
        ).rejects.toThrow()
      })

      it('should validate registration form', async () => {
        const { register } = validationSchemas.auth

        const validRegistration = {
          email: 'user@example.com',
          password: 'StrongPass123!',
          confirmPassword: 'StrongPass123!',
          firstName: 'John',
          lastName: 'Doe',
          acceptTerms: true,
        }

        await expect(register.validate(validRegistration)).resolves.toEqual(
          expect.objectContaining(validRegistration)
        )

        // Test password mismatch
        await expect(
          register.validate({
            ...validRegistration,
            confirmPassword: 'DifferentPassword123!',
          })
        ).rejects.toThrow('Passwords must match')

        // Test terms not accepted
        await expect(
          register.validate({
            ...validRegistration,
            acceptTerms: false,
          })
        ).rejects.toThrow('You must accept the terms and conditions')
      })
    })

    describe('file validation', () => {
      it('should validate image files', async () => {
        const { image } = validationSchemas.file

        const OriginalFile = global.File
        class MockFile {
          size: number
          type: string
          constructor(size: number, type: string) {
            this.size = size
            this.type = type
          }
        }
        // Use mock implementation to satisfy instanceof checks
        global.File = MockFile as unknown as typeof File

        const createFile = (size: number, type: string) =>
          new File(size, type) as unknown as File

        const validImageFile = createFile(1 * 1024 * 1024, 'image/jpeg')

        await expect(image.validate(validImageFile)).resolves.toBe(
          validImageFile
        )

        // Test file too large
        const largeFile = createFile(10 * 1024 * 1024, 'image/jpeg')

        await expect(image.validate(largeFile)).rejects.toThrow(
          'File size must be less than 5MB'
        )

        // Test invalid file type
        const invalidFile = createFile(1024, 'application/pdf')

        await expect(image.validate(invalidFile)).rejects.toThrow(
          'Only image files are allowed'
        )

        global.File = OriginalFile
      })
    })
  })

  describe('Sanitization functions', () => {
    it('should sanitize strings correctly', () => {
      expect(sanitizeString('  Hello World  ')).toBe('Hello World')
      expect(sanitizeString('<script>alert("xss")</script>')).toBe(
        'alert("xss")'
      )
      expect(sanitizeString('Normal text')).toBe('Normal text')
    })

    it('should sanitize HTML correctly', () => {
      expect(sanitizeHtml('<p>Valid HTML</p>')).toBe('<p>Valid HTML</p>')
      expect(sanitizeHtml('<script>alert("xss")</script>')).toBe('')
      expect(sanitizeHtml('<div onclick="alert()">Click me</div>')).toBe(
        '<div>Click me</div>'
      )
      expect(sanitizeHtml('javascript:alert("xss")')).toBe('alert("xss")')
    })
  })

  describe('Real-time validator', () => {
    it('should create real-time validator', async () => {
      const schema = yup.object({
        name: yup.string().required('Name is required'),
        email: yup.string().email('Invalid email'),
      })

      const validator = createRealTimeValidator(schema)

      // Valid data
      const validResult = await validator.validate({
        name: 'John Doe',
        email: 'john@example.com',
      })

      expect(validResult.isValid).toBe(true)
      expect(validResult.errors).toEqual([])

      // Invalid data
      const invalidResult = await validator.validate({
        name: '',
        email: 'invalid-email',
      })

      expect(invalidResult.isValid).toBe(false)
      expect(invalidResult.errors.length).toBeGreaterThan(0)
    })

    it('should validate individual fields', async () => {
      const schema = yup.object({
        email: yup
          .string()
          .email('Invalid email')
          .required('Email is required'),
      })

      const validator = createRealTimeValidator(schema)

      const validField = await validator.validateField(
        'email',
        'test@example.com'
      )
      expect(validField.isValid).toBe(true)
      expect(validField.error).toBeNull()

      const invalidField = await validator.validateField(
        'email',
        'invalid-email'
      )
      expect(invalidField.isValid).toBe(false)
      expect(invalidField.error).toBe('Invalid email')
    })
  })

  describe('Zod to Yup conversion', () => {
    it('should convert basic Zod schemas to Yup', () => {
      const zodString = z.string().email().min(5).max(50)
      const yupSchema = zodToYup(zodString)

      expect(yupSchema).toBeDefined()
      // Note: This is a simplified test as the conversion is basic
    })

    it('should convert Zod object schemas to Yup', () => {
      const zodObject = z.object({
        name: z.string(),
        age: z.number(),
        active: z.boolean(),
      })

      const yupSchema = zodToYup(zodObject)
      expect(yupSchema).toBeDefined()
    })
  })
})

describe('Form Validation Hooks', () => {
  describe('useFormValidation', () => {
    const testSchema = yup.object({
      name: yup.string().required('Name is required'),
      email: yup.string().email('Invalid email').required('Email is required'),
      age: yup
        .number()
        .min(18, 'Must be at least 18')
        .required('Age is required'),
    })

    it('should initialize with default values', () => {
      const { result } = renderHook(() =>
        useFormValidationHook({
          schema: testSchema,
          defaultValues: { name: '', email: '', age: 0 },
        })
      )

      expect(result.current.getValues()).toEqual({
        name: '',
        email: '',
        age: 0,
      })
    })

    it('should validate form correctly', async () => {
      const { result } = renderHook(() =>
        useFormValidationHook({
          schema: testSchema,
          defaultValues: { name: '', email: '', age: 0 },
        })
      )

      // Set valid values
      act(() => {
        result.current.setValue('name', 'John Doe')
        result.current.setValue('email', 'john@example.com')
        result.current.setValue('age', 25)
      })

      const isValid = await act(async () => {
        return await result.current.validateForm()
      })

      expect(isValid).toBe(true)
    })

    it('should handle validation errors', async () => {
      const onValidationError = vi.fn()

      const { result } = renderHook(() =>
        useFormValidationHook({
          schema: testSchema,
          defaultValues: { name: '', email: '', age: 0 },
          onValidationError,
        })
      )

      const isValid = await act(async () => {
        return await result.current.validateForm()
      })

      expect(isValid).toBe(false)
      expect(onValidationError).toHaveBeenCalled()
      expect(result.current.hasErrors).toBe(true)
    })

    it('should validate individual fields', async () => {
      const { result } = renderHook(() =>
        useFormValidationHook({
          schema: testSchema,
          defaultValues: { name: '', email: '', age: 0 },
        })
      )

      const isValid = await act(async () => {
        return await result.current.validateField('email', 'john@example.com')
      })

      expect(isValid).toBe(true)
      expect(result.current.isFieldValid('email')).toBe(true)
    })
  })

  describe('useDynamicFormArray', () => {
    const itemSchema = yup.object({
      name: yup.string().required(),
      value: yup.number().required(),
    })

    it('should validate array items', async () => {
      const { result } = renderHook(() =>
        useDynamicFormArray({
          name: 'items',
          schema: itemSchema,
          maxItems: 5,
          minItems: 1,
        })
      )

      const isValid = await act(async () => {
        return await result.current.validateItem(0, {
          name: 'Test Item',
          value: 100,
        })
      })

      expect(isValid).toBe(true)
      expect(result.current.isItemValid(0)).toBe(true)
    })

    it('should enforce array limits', () => {
      const { result } = renderHook(() =>
        useDynamicFormArray({
          name: 'items',
          schema: itemSchema,
          maxItems: 3,
          minItems: 1,
        })
      )

      expect(result.current.canAddItem(2)).toBe(true)
      expect(result.current.canAddItem(3)).toBe(false)
      expect(result.current.canRemoveItem(2)).toBe(true)
      expect(result.current.canRemoveItem(1)).toBe(false)
    })
  })

  describe('useConditionalValidation', () => {
    const baseSchema = yup.object({
      type: yup.string().required(),
      name: yup.string().required(),
    })

    const extendedSchema = yup.object({
      type: yup.string().required(),
      name: yup.string().required(),
      description: yup.string().required(),
    })

    it('should update schema based on condition', () => {
      const { result } = renderHook(() =>
        useConditionalValidation({
          condition: (values: Record<string, unknown>) =>
            values.type === 'detailed',
          schema: extendedSchema,
          alternativeSchema: baseSchema,
        })
      )

      expect(result.current.currentSchema).toBe(extendedSchema)

      act(() => {
        result.current.updateSchema({ type: 'simple', name: 'Test' })
      })

      expect(result.current.currentSchema).toBe(baseSchema)
    })
  })

  describe('useAsyncValidation', () => {
    it('should handle async validation', async () => {
      const mockValidator = vi.fn().mockResolvedValue(true)

      const { result } = renderHook(() =>
        useAsyncValidation({
          validator: mockValidator,
          errorMessage: 'Validation failed',
          debounceMs: 100,
        })
      )

      act(() => {
        result.current.validate('test-value')
      })

      expect(result.current.isValidating).toBe(true)

      // Wait for debounce and validation
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 150))
      })

      expect(mockValidator).toHaveBeenCalledWith('test-value')
      expect(result.current.isValidating).toBe(false)
      expect(result.current.validationResult?.isValid).toBe(true)
    })

    it('should handle validation errors', async () => {
      const mockValidator = vi.fn().mockResolvedValue(false)

      const { result } = renderHook(() =>
        useAsyncValidation({
          validator: mockValidator,
          errorMessage: 'Validation failed',
          debounceMs: 100,
        })
      )

      act(() => {
        result.current.validate('invalid-value')
      })

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 150))
      })

      expect(result.current.validationResult?.isValid).toBe(false)
      expect(result.current.validationResult?.error).toBe('Validation failed')
    })
  })

  describe('useFormPersistence', () => {
    const mockStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    } as unknown as Storage

    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should save form data', () => {
      const { result } = renderHook(() =>
        useFormPersistence({
          key: 'test-form',
          storage: mockStorage,
        })
      )

      const formData = { name: 'John', email: 'john@example.com' }

      act(() => {
        result.current.saveFormData(formData)
      })

      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'test-form',
        JSON.stringify(formData)
      )
    })

    it('should load form data', () => {
      const savedData = { name: 'John', email: 'john@example.com' }
      ;(mockStorage.getItem as any).mockReturnValue(JSON.stringify(savedData))

      const { result } = renderHook(() =>
        useFormPersistence({
          key: 'test-form',
          storage: mockStorage,
        })
      )

      const loadedData = result.current.loadFormData()

      expect(mockStorage.getItem).toHaveBeenCalledWith('test-form')
      expect(loadedData).toEqual(savedData)
    })

    it('should exclude specified fields when saving', () => {
      const { result } = renderHook(() =>
        useFormPersistence({
          key: 'test-form',
          storage: mockStorage,
          exclude: ['password'],
        })
      )

      const formData = {
        name: 'John',
        email: 'john@example.com',
        password: 'secret123',
      }

      act(() => {
        result.current.saveFormData(formData)
      })

      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'test-form',
        JSON.stringify({ name: 'John', email: 'john@example.com' })
      )
    })

    it('should clear form data', () => {
      const { result } = renderHook(() =>
        useFormPersistence({
          key: 'test-form',
          storage: mockStorage,
        })
      )

      act(() => {
        result.current.clearFormData()
      })

      expect(mockStorage.removeItem).toHaveBeenCalledWith('test-form')
    })
  })
})
