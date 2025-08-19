import { describe, it, expect, beforeEach, vi } from 'vitest'
import { store, resetStore } from '../index'
import { setCredentials, clearCredentials } from '../slices/authSlice'
import { addNotification, setLoading } from '../slices/uiSlice'
import { addProduct } from '../slices/productsSlice'

// Mock localStorage for redux-persist
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

describe('Store Configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset store to initial state
    resetStore()
  })

  it('should have the correct initial state structure', () => {
    const state = store.getState()
    
    expect(state).toHaveProperty('auth')
    expect(state).toHaveProperty('ui')
    expect(state).toHaveProperty('products')
    expect(state).toHaveProperty('inventory')
    expect(state).toHaveProperty('orders')
    expect(state).toHaveProperty('customers')
    expect(state).toHaveProperty('api')
  })

  it('should handle auth actions correctly', () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'admin',
      permissions: [],
      preferences: {
        theme: 'light' as const,
        language: 'en',
        timezone: 'UTC',
        notifications: {
          email: true,
          push: true,
          sms: false,
        },
        dashboard: {
          layout: 'grid' as const,
          widgets: ['sales'],
        },
      },
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
    }

    const credentials = {
      user: mockUser,
      token: 'test-token',
      refreshToken: 'test-refresh-token',
      expiresIn: 3600,
    }

    store.dispatch(setCredentials(credentials))

    const authState = store.getState().auth
    expect(authState.isAuthenticated).toBe(true)
    expect(authState.user).toEqual(mockUser)
    expect(authState.token).toBe('test-token')

    store.dispatch(clearCredentials())

    const clearedAuthState = store.getState().auth
    expect(clearedAuthState.isAuthenticated).toBe(false)
    expect(clearedAuthState.user).toBeNull()
    expect(clearedAuthState.token).toBeNull()
  })

  it('should handle UI actions correctly', () => {
    const notification = {
      type: 'success' as const,
      title: 'Test Notification',
      message: 'This is a test notification',
    }

    store.dispatch(addNotification(notification))

    const uiState = store.getState().ui
    expect(uiState.notifications).toHaveLength(1)
    expect(uiState.notifications[0]).toMatchObject(notification)
    expect(uiState.unreadNotificationCount).toBe(1)

    store.dispatch(setLoading({ key: 'products', loading: true }))
    expect(store.getState().ui.loading.products).toBe(true)
  })

  it('should handle products actions correctly', () => {
    const mockProduct = {
      id: '1',
      name: 'Test Product',
      description: 'Test description',
      slug: 'test-product',
      sku: 'TEST-001',
      status: 'active' as const,
      type: 'simple' as const,
      category: 'electronics',
      tags: ['test'],
      images: [],
      variants: [],
      collections: [],
      seo: {},
      pricing: {
        basePrice: 99.99,
        taxable: true,
      },
      inventory: {
        tracked: true,
        quantity: 50,
        policy: 'deny' as const,
      },
      shipping: {
        requiresShipping: true,
      },
      attributes: [],
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
    }

    store.dispatch(addProduct(mockProduct))

    const productsState = store.getState().products
    expect(productsState.products.ids).toContain('1')
    expect(productsState.products.entities['1']).toEqual(mockProduct)
  })

  it('should handle cross-slice interactions', () => {
    // Test that actions in one slice don't interfere with others
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'admin',
      permissions: [],
      preferences: {
        theme: 'light' as const,
        language: 'en',
        timezone: 'UTC',
        notifications: {
          email: true,
          push: true,
          sms: false,
        },
        dashboard: {
          layout: 'grid' as const,
          widgets: ['sales'],
        },
      },
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
    }

    const credentials = {
      user: mockUser,
      token: 'test-token',
      refreshToken: 'test-refresh-token',
      expiresIn: 3600,
    }

    const notification = {
      type: 'info' as const,
      title: 'User Logged In',
      message: 'Welcome back!',
    }

    // Dispatch actions to multiple slices
    store.dispatch(setCredentials(credentials))
    store.dispatch(addNotification(notification))
    store.dispatch(setLoading({ key: 'global', loading: true }))

    const state = store.getState()

    // Verify each slice maintained its state correctly
    expect(state.auth.isAuthenticated).toBe(true)
    expect(state.auth.user?.email).toBe('test@example.com')
    expect(state.ui.notifications).toHaveLength(1)
    expect(state.ui.loading.global).toBe(true)
    expect(state.products.products.ids).toHaveLength(0) // Should remain empty
  })

  it('should reset store correctly', () => {
    // Set up some state
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'admin',
      permissions: [],
      preferences: {
        theme: 'light' as const,
        language: 'en',
        timezone: 'UTC',
        notifications: {
          email: true,
          push: true,
          sms: false,
        },
        dashboard: {
          layout: 'grid' as const,
          widgets: ['sales'],
        },
      },
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
    }

    store.dispatch(setCredentials({
      user: mockUser,
      token: 'test-token',
      refreshToken: 'test-refresh-token',
      expiresIn: 3600,
    }))

    store.dispatch(addNotification({
      type: 'info',
      title: 'Test',
      message: 'Test message',
    }))

    // Verify state is set
    expect(store.getState().auth.isAuthenticated).toBe(true)
    expect(store.getState().ui.notifications).toHaveLength(1)

    // Reset store
    resetStore()

    // Verify state is reset
    const resetState = store.getState()
    expect(resetState.auth.isAuthenticated).toBe(false)
    expect(resetState.auth.user).toBeNull()
    expect(resetState.ui.notifications).toHaveLength(0)
  })

  it('should handle DevTools configuration', () => {
    // In test environment, DevTools should be enabled
    expect(store).toBeDefined()
    // We can't easily test DevTools configuration, but we can ensure store works
    const state = store.getState()
    expect(state).toBeDefined()
  })

  it('should handle middleware correctly', () => {
    // Test that middleware doesn't break normal operations
    const startTime = Date.now()
    
    store.dispatch(setLoading({ key: 'products', loading: true }))
    store.dispatch(setLoading({ key: 'products', loading: false }))
    
    const endTime = Date.now()
    
    // Middleware should not significantly slow down operations
    expect(endTime - startTime).toBeLessThan(100)
    
    // State should be updated correctly
    expect(store.getState().ui.loading.products).toBe(false)
  })
})