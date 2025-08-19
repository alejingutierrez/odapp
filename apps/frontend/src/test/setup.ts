import '@testing-library/jest-dom'
import { vi } from 'vitest'
import React from 'react'

// Global timeout configuration
beforeEach(() => {
  // Set individual test timeout to 1 minute
  vi.setConfig({ testTimeout: 60000 })
})

afterEach(() => {
  // Clean up any pending timers
  vi.clearAllTimers()
  vi.clearAllMocks()
})

// Global error handler for tests
const originalError = console.error
console.error = vi.fn().mockImplementation((...args) => {
  // Filter out expected React warnings
  const message = args[0]
  if (
    typeof message === 'string' &&
    (message.includes('Warning: ReactDOM.render is no longer supported') ||
     message.includes('Warning: findDOMNode') ||
     message.includes('Warning: componentWillReceiveProps') ||
     message.includes('Warning: componentWillUpdate'))
  ) {
    return
  }
  originalError(...args)
})

// Mock environment variables for tests
vi.mock('../config/env', () => ({
  env: {
    VITE_API_BASE_URL: 'http://localhost:3001',
    VITE_WS_URL: 'ws://localhost:3001',
    VITE_APP_NAME: 'Oda Fashion Platform',
    VITE_APP_VERSION: '1.0.0',
    MODE: 'test',
    DEV: false,
    PROD: false,
  },
  isDevelopment: false,
  isProduction: false,
  isTest: true,
}))

// Mock Ant Design icons with dynamic proxy
vi.mock('@ant-design/icons', () => {
  const iconMocks = new Proxy({}, {
    get: (target, prop) => {
      if (typeof prop === 'string' && prop.endsWith('Outlined')) {
        return vi.fn(() => {
          const iconName = prop.replace('Outlined', '').toLowerCase()
          const testId = iconName.replace(/([A-Z])/g, '-$1').toLowerCase() + '-icon'
          return React.createElement('span', { 
            'data-testid': testId,
            'aria-label': prop
          }, '🔸')
        })
      }
      if (typeof prop === 'string' && prop.endsWith('Filled')) {
        return vi.fn(() => {
          const iconName = prop.replace('Filled', '').toLowerCase()
          const testId = iconName.replace(/([A-Z])/g, '-$1').toLowerCase() + '-icon'
          return React.createElement('span', { 
            'data-testid': testId,
            'aria-label': prop
          }, '🔹')
        })
      }
      if (typeof prop === 'string' && prop.endsWith('TwoTone')) {
        return vi.fn(() => {
          const iconName = prop.replace('TwoTone', '').toLowerCase()
          const testId = iconName.replace(/([A-Z])/g, '-$1').toLowerCase() + '-icon'
          return React.createElement('span', { 
            'data-testid': testId,
            'aria-label': prop
          }, '🔷')
        })
      }
      // Default fallback for any other icon patterns
      if (typeof prop === 'string') {
        return vi.fn(() => {
          const testId = prop.replace(/([A-Z])/g, '-$1').toLowerCase() + '-icon'
          return React.createElement('span', { 
            'data-testid': testId,
            'aria-label': prop
          }, '🔸')
        })
      }
      return undefined
    }
  })
  
  return iconMocks
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock getComputedStyle to avoid JSDOM errors
Object.defineProperty(window, 'getComputedStyle', {
  value: vi.fn().mockImplementation(() => ({
    getPropertyValue: vi.fn().mockReturnValue(''),
  })),
})

// Mock File API
global.File = vi.fn().mockImplementation((content, name, options) => ({
  name: name || 'test-file.txt',
  size: content ? content.length : 0,
  type: options?.type || 'text/plain',
  lastModified: Date.now(),
}))

global.FileReader = vi.fn().mockImplementation(() => ({
  readAsText: vi.fn(),
  readAsDataURL: vi.fn(),
  result: '',
  onload: null,
  onerror: null,
}))

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url')

// Mock console.warn to reduce noise in tests
const originalWarn = console.warn
console.warn = vi.fn().mockImplementation((...args) => {
  // Filter out specific warnings that are expected
  const message = args[0]
  if (
    typeof message === 'string' &&
    (message.includes('findDOMNode') ||
     message.includes('destroyInactiveTabPane') ||
     message.includes('strokeWidth') ||
     message.includes('overlayStyle') ||
     message.includes('overlayClassName'))
  ) {
    return
  }
  originalWarn(...args)
})

// Mock fetch for API calls
global.fetch = vi.fn()

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
})
