import React from 'react'
import { render, RenderOptions, waitFor } from '@testing-library/react'
import { act } from '@testing-library/react'
import { expect } from 'vitest'
import { ConfigProvider } from 'antd'
import { theme } from '../config/theme'

// Timeout configuration for test utilities
const TEST_TIMEOUT = 60000 // 1 minute
const POLLING_INTERVAL = 100 // 100ms between checks
const MAX_ATTEMPTS = 50 // Maximum attempts for polling

// Helper para envolver operaciones asíncronas en act() con timeout
export const waitForAsync = async (
  callback: () => void | Promise<void>,
  timeout: number = TEST_TIMEOUT
) => {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Operation timed out after ${timeout}ms`)), timeout)
  })

  await Promise.race([
    act(async () => {
      await callback()
    }),
    timeoutPromise
  ])
}

// Helper para esperar que los elementos aparezcan con timeout
export const waitForElement = async (
  callback: () => Element | null,
  timeout: number = TEST_TIMEOUT
): Promise<Element> => {
  const startTime = Date.now()
  
  return new Promise((resolve, reject) => {
    const checkElement = () => {
      const element = callback()
      if (element) {
        resolve(element)
        return
      }
      
      const elapsed = Date.now() - startTime
      if (elapsed >= timeout) {
        reject(new Error(`Element not found after ${timeout}ms`))
        return
      }
      
      setTimeout(checkElement, POLLING_INTERVAL)
    }
    
    checkElement()
  })
}

// Helper para esperar que una condición se cumpla
export const waitForCondition = async (
  condition: () => boolean | Promise<boolean>,
  timeout: number = TEST_TIMEOUT
): Promise<void> => {
  const startTime = Date.now()
  
  return new Promise((resolve, reject) => {
    const checkCondition = async () => {
      try {
        const result = await condition()
        if (result) {
          resolve()
          return
        }
        
        const elapsed = Date.now() - startTime
        if (elapsed >= timeout) {
          reject(new Error(`Condition not met after ${timeout}ms`))
          return
        }
        
        setTimeout(checkCondition, POLLING_INTERVAL)
      } catch (error) {
        reject(error)
      }
    }
    
    checkCondition()
  })
}

// Helper para limpiar el DOM después de cada test
export const cleanupDOM = () => {
  act(() => {
    // Clean up any remaining elements
    const root = document.getElementById('root')
    if (root) {
      root.innerHTML = ''
    }
  })
}

// Wrapper component for providers
const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ConfigProvider theme={theme}>
      {children}
    </ConfigProvider>
  )
}

// Custom render function that includes providers
const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
): ReturnType<typeof render> => {
  return render(ui, { wrapper: AllTheProviders, ...options })
}

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }

// Export timeout constants for use in tests
export const TEST_TIMEOUTS = {
  SHORT: 5000,    // 5 seconds
  MEDIUM: 15000,  // 15 seconds
  LONG: 30000,    // 30 seconds
  VERY_LONG: 60000, // 1 minute
} as const