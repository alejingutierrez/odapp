import { useCallback, useState } from 'react'
import { useForm, UseFormProps, UseFormReturn, FieldValues, Path, PathValue } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { debounce } from 'lodash-es'

// Enhanced form validation hook
export interface UseFormValidationOptions<T extends FieldValues> extends UseFormProps<T> {
  schema: yup.Schema<T>
  realTimeValidation?: boolean
  debounceMs?: number
  onValidationError?: (errors: Record<string, string>) => void
  onValidationSuccess?: () => void
}

export interface UseFormValidationReturn<T extends FieldValues> extends UseFormReturn<T> {
  validateField: (field: Path<T>, value: PathValue<T, Path<T>>) => Promise<boolean>
  validateForm: () => Promise<boolean>
  isFieldValid: (field: Path<T>) => boolean
  getFieldError: (field: Path<T>) => string | undefined
  clearFieldError: (field: Path<T>) => void
  setFieldError: (field: Path<T>, error: string) => void
  isFormValid: boolean
  hasErrors: boolean
}

export const useFormValidation = <T extends FieldValues>({
  schema,
  realTimeValidation = true,
  debounceMs = 300,
  onValidationError,
  onValidationSuccess,
  ...formOptions
}: UseFormValidationOptions<T>): UseFormValidationReturn<T> => {
  const [fieldValidationStates, setFieldValidationStates] = useState<Record<string, boolean>>({})

  const form = useForm<T>({
    resolver: yupResolver(schema),
    mode: realTimeValidation ? 'onChange' : 'onSubmit',
    reValidateMode: 'onChange',
    ...formOptions,
  })

  const {
    formState: { errors, isValid },
    setError,
    clearErrors,
    trigger,
    getValues,
  } = form

  // Debounced field validation
  const debouncedValidateField = useCallback(
    debounce(async (field: Path<T>, value: PathValue<T, Path<T>>) => {
      try {
        await schema.validateAt(field as string, { [field]: value })
        setFieldValidationStates(prev => ({ ...prev, [field]: true }))
        clearErrors(field)
        return true
      } catch (error) {
        if (error instanceof yup.ValidationError) {
          setFieldValidationStates(prev => ({ ...prev, [field]: false }))
          setError(field, { type: 'validation', message: error.message })
          return false
        }
        return false
      }
    }, debounceMs),
    [schema, debounceMs, setError, clearErrors]
  )

  // Validate individual field
  const validateField = useCallback(
    async (field: Path<T>, value: PathValue<T, Path<T>>): Promise<boolean> => {
      try {
        await schema.validateAt(field as string, { [field]: value })
        setFieldValidationStates(prev => ({ ...prev, [field]: true }))
        clearErrors(field)
        return true
      } catch (error) {
        if (error instanceof yup.ValidationError) {
          setFieldValidationStates(prev => ({ ...prev, [field]: false }))
          setError(field, { type: 'validation', message: error.message })
          return false
        }
        return false
      }
    },
    [schema, setError, clearErrors]
  )

  // Validate entire form
  const validateForm = useCallback(async (): Promise<boolean> => {
    try {
      const values = getValues()
      await schema.validate(values, { abortEarly: false })
      
      if (onValidationSuccess) {
        onValidationSuccess()
      }
      
      return true
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        const errorMap: Record<string, string> = {}
        
        error.inner.forEach(err => {
          if (err.path) {
            errorMap[err.path] = err.message
            setError(err.path as Path<T>, { type: 'validation', message: err.message })
          }
        })
        
        if (onValidationError) {
          onValidationError(errorMap)
        }
      }
      
      return false
    }
  }, [schema, getValues, setError, onValidationError, onValidationSuccess])

  // Check if field is valid
  const isFieldValid = useCallback(
    (field: Path<T>): boolean => {
      return !errors[field] && (fieldValidationStates[field] === true || fieldValidationStates[field] === undefined)
    },
    [errors, fieldValidationStates]
  )

  // Get field error message
  const getFieldError = useCallback(
    (field: Path<T>): string | undefined => {
      return errors[field]?.message as string | undefined
    },
    [errors]
  )

  // Clear field error
  const clearFieldError = useCallback(
    (field: Path<T>) => {
      clearErrors(field)
      setFieldValidationStates(prev => ({ ...prev, [field]: true }))
    },
    [clearErrors]
  )

  // Set field error
  const setFieldError = useCallback(
    (field: Path<T>, error: string) => {
      setError(field, { type: 'manual', message: error })
      setFieldValidationStates(prev => ({ ...prev, [field]: false }))
    },
    [setError]
  )

  const isFormValid = isValid && Object.keys(errors).length === 0
  const hasErrors = Object.keys(errors).length > 0

  return {
    ...form,
    validateField,
    validateForm,
    isFieldValid,
    getFieldError,
    clearFieldError,
    setFieldError,
    isFormValid,
    hasErrors,
  }
}

// Hook for dynamic form arrays with validation
export interface UseDynamicFormArrayOptions<T extends FieldValues> {
  name: Path<T>
  schema: yup.Schema<any>
  defaultValue?: any
  maxItems?: number
  minItems?: number
}

export const useDynamicFormArray = <T extends FieldValues>({
  name,
  schema,
  defaultValue = {},
  maxItems = 10,
  minItems = 0,
}: UseDynamicFormArrayOptions<T>) => {
  const [validationStates, setValidationStates] = useState<Record<number, boolean>>({})

  const validateItem = useCallback(
    async (index: number, value: any): Promise<boolean> => {
      try {
        await schema.validate(value)
        setValidationStates(prev => ({ ...prev, [index]: true }))
        return true
      } catch (error) {
        setValidationStates(prev => ({ ...prev, [index]: false }))
        return false
      }
    },
    [schema]
  )

  const canAddItem = useCallback(
    (currentLength: number): boolean => {
      return currentLength < maxItems
    },
    [maxItems]
  )

  const canRemoveItem = useCallback(
    (currentLength: number): boolean => {
      return currentLength > minItems
    },
    [minItems]
  )

  const isItemValid = useCallback(
    (index: number): boolean => {
      return validationStates[index] !== false
    },
    [validationStates]
  )

  return {
    validateItem,
    canAddItem,
    canRemoveItem,
    isItemValid,
    defaultValue,
  }
}

// Hook for conditional validation
export interface UseConditionalValidationOptions<T extends FieldValues> {
  condition: (values: T) => boolean
  schema: yup.Schema<T>
  alternativeSchema?: yup.Schema<T>
}

export const useConditionalValidation = <T extends FieldValues>({
  condition,
  schema,
  alternativeSchema,
}: UseConditionalValidationOptions<T>) => {
  const [currentSchema, setCurrentSchema] = useState<yup.Schema<T>>(schema)

  const updateSchema = useCallback(
    (values: T) => {
      const shouldUseMainSchema = condition(values)
      const newSchema = shouldUseMainSchema ? schema : (alternativeSchema || yup.object().shape({}))
      
      if (newSchema !== currentSchema) {
        setCurrentSchema(newSchema)
      }
    },
    [condition, schema, alternativeSchema, currentSchema]
  )

  return {
    currentSchema,
    updateSchema,
  }
}

// Hook for async validation
export interface UseAsyncValidationOptions {
  validator: (value: any) => Promise<boolean>
  errorMessage: string
  debounceMs?: number
}

export const useAsyncValidation = ({
  validator,
  errorMessage,
  debounceMs = 500,
}: UseAsyncValidationOptions) => {
  const [isValidating, setIsValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean
    error?: string
  } | null>(null)

  const debouncedValidate = useCallback(
    debounce(async (value: any) => {
      if (!value) {
        setValidationResult(null)
        setIsValidating(false)
        return
      }

      setIsValidating(true)
      
      try {
        const isValid = await validator(value)
        setValidationResult({
          isValid,
          error: isValid ? undefined : errorMessage,
        })
      } catch (error) {
        setValidationResult({
          isValid: false,
          error: errorMessage,
        })
      } finally {
        setIsValidating(false)
      }
    }, debounceMs),
    [validator, errorMessage, debounceMs]
  )

  const validate = useCallback(
    (value: any) => {
      if (value) {
        setIsValidating(true)
      }
      debouncedValidate(value)
    },
    [debouncedValidate]
  )

  return {
    validate,
    isValidating,
    validationResult,
  }
}

// Hook for form persistence
export interface UseFormPersistenceOptions<T extends FieldValues> {
  key: string
  storage?: Storage
  exclude?: (keyof T)[]
}

export const useFormPersistence = <T extends FieldValues>({
  key,
  storage = localStorage,
  exclude = [],
}: UseFormPersistenceOptions<T>) => {
  const saveFormData = useCallback(
    (data: T) => {
      try {
        const dataToSave = { ...data }
        
        // Remove excluded fields
        exclude.forEach(field => {
          delete dataToSave[field]
        })
        
        storage.setItem(key, JSON.stringify(dataToSave))
      } catch (error) {
        console.warn('Failed to save form data:', error)
      }
    },
    [key, storage, exclude]
  )

  const loadFormData = useCallback((): Partial<T> | null => {
    try {
      const saved = storage.getItem(key)
      return saved ? JSON.parse(saved) : null
    } catch (error) {
      console.warn('Failed to load form data:', error)
      return null
    }
  }, [key, storage])

  const clearFormData = useCallback(() => {
    try {
      storage.removeItem(key)
    } catch (error) {
      console.warn('Failed to clear form data:', error)
    }
  }, [key, storage])

  return {
    saveFormData,
    loadFormData,
    clearFormData,
  }
}