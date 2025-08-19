import { describe, it, expect, beforeEach, vi } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'
import authReducer, {
  loginUser,
  logoutUser,
  refreshToken,
  updateUserProfile,
  setCredentials,
  clearCredentials,
  updateLastActivity,
  setRememberMe,
  clearError,
  updateUserPreferences,
  selectCurrentUser,
  selectToken,
  selectIsAuthenticated,
  selectPermissions,
  selectHasPermission,
  selectIsSessionValid,
  type AuthState,
  type User,
} from '../authSlice'

// Mock fetch
global.fetch = vi.fn()

const mockUser: User = {
  id: '1',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: 'admin',
  permissions: [
    {
      id: '1',
      name: 'read_products',
      resource: 'products',
      action: 'read',
    },
    {
      id: '2',
      name: 'write_products',
      resource: 'products',
      action: 'write',
    },
  ],
  preferences: {
    theme: 'light',
    language: 'en',
    timezone: 'UTC',
    notifications: {
      email: true,
      push: true,
      sms: false,
    },
    dashboard: {
      layout: 'grid',
      widgets: ['sales', 'inventory'],
    },
  },
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
}

const createTestStore = (initialState?: Partial<AuthState>) => {
  return configureStore({
    reducer: {
      auth: authReducer,
    },
    preloadedState: {
      auth: {
        user: null,
        token: null,
        refreshToken: null,
        permissions: [],
        isAuthenticated: false,
        isLoading: false,
        error: null,
        sessionExpiry: null,
        lastActivity: Date.now(),
        rememberMe: false,
        ...initialState,
      },
    },
  })
}

describe('authSlice', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('reducers', () => {
    it('should handle setCredentials', () => {
      const store = createTestStore()
      const credentials = {
        user: mockUser,
        token: 'test-token',
        refreshToken: 'test-refresh-token',
        expiresIn: 3600,
      }

      store.dispatch(setCredentials(credentials))

      const state = store.getState().auth
      expect(state.user).toEqual(mockUser)
      expect(state.token).toBe('test-token')
      expect(state.refreshToken).toBe('test-refresh-token')
      expect(state.isAuthenticated).toBe(true)
      expect(state.permissions).toEqual(mockUser.permissions)
      expect(state.sessionExpiry).toBeGreaterThan(Date.now())
      expect(state.error).toBeNull()
    })

    it('should handle clearCredentials', () => {
      const store = createTestStore({
        user: mockUser,
        token: 'test-token',
        isAuthenticated: true,
      })

      store.dispatch(clearCredentials())

      const state = store.getState().auth
      expect(state.user).toBeNull()
      expect(state.token).toBeNull()
      expect(state.refreshToken).toBeNull()
      expect(state.isAuthenticated).toBe(false)
      expect(state.permissions).toEqual([])
      expect(state.sessionExpiry).toBeNull()
      expect(state.error).toBeNull()
    })

    it('should handle updateLastActivity', () => {
      const store = createTestStore({ lastActivity: 1000 })
      const beforeUpdate = store.getState().auth.lastActivity

      store.dispatch(updateLastActivity())

      const afterUpdate = store.getState().auth.lastActivity
      expect(afterUpdate).toBeGreaterThan(beforeUpdate)
    })

    it('should handle setRememberMe', () => {
      const store = createTestStore()

      store.dispatch(setRememberMe(true))
      expect(store.getState().auth.rememberMe).toBe(true)

      store.dispatch(setRememberMe(false))
      expect(store.getState().auth.rememberMe).toBe(false)
    })

    it('should handle clearError', () => {
      const store = createTestStore({ error: 'Test error' })

      store.dispatch(clearError())
      expect(store.getState().auth.error).toBeNull()
    })

    it('should handle updateUserPreferences', () => {
      const store = createTestStore({ user: mockUser })
      const newPreferences = {
        theme: 'dark' as const,
        language: 'es',
      }

      store.dispatch(updateUserPreferences(newPreferences))

      const state = store.getState().auth
      expect(state.user?.preferences.theme).toBe('dark')
      expect(state.user?.preferences.language).toBe('es')
      expect(state.user?.preferences.timezone).toBe('UTC') // Should preserve other preferences
    })
  })

  describe('async thunks', () => {
    describe('loginUser', () => {
      it('should handle successful login', async () => {
        const mockResponse = {
          user: mockUser,
          token: 'test-token',
          refreshToken: 'test-refresh-token',
          expiresIn: 3600,
        }

        ;(fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        })

        const store = createTestStore()
        const credentials = { email: 'test@example.com', password: 'password' }

        await store.dispatch(loginUser(credentials))

        const state = store.getState().auth
        expect(state.isLoading).toBe(false)
        expect(state.user).toEqual(mockUser)
        expect(state.token).toBe('test-token')
        expect(state.isAuthenticated).toBe(true)
        expect(state.error).toBeNull()
      })

      it('should handle login failure', async () => {
        const errorMessage = 'Invalid credentials'
        ;(fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
          ok: false,
          json: async () => ({ message: errorMessage }),
        })

        const store = createTestStore()
        const credentials = {
          email: 'test@example.com',
          password: 'wrong-password',
        }

        await store.dispatch(loginUser(credentials))

        const state = store.getState().auth
        expect(state.isLoading).toBe(false)
        expect(state.user).toBeNull()
        expect(state.token).toBeNull()
        expect(state.isAuthenticated).toBe(false)
        expect(state.error).toBe(errorMessage)
      })

      it('should handle network error', async () => {
        ;(fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
          new Error('Network error')
        )

        const store = createTestStore()
        const credentials = { email: 'test@example.com', password: 'password' }

        await store.dispatch(loginUser(credentials))

        const state = store.getState().auth
        expect(state.isLoading).toBe(false)
        expect(state.error).toBe('Network error occurred')
      })
    })

    describe('logoutUser', () => {
      it('should handle successful logout', async () => {
        ;(fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
          ok: true,
        })

        const store = createTestStore({
          user: mockUser,
          token: 'test-token',
          isAuthenticated: true,
        })

        await store.dispatch(logoutUser())

        const state = store.getState().auth
        expect(state.user).toBeNull()
        expect(state.token).toBeNull()
        expect(state.isAuthenticated).toBe(false)
      })

      it('should clear state even if server logout fails', async () => {
        ;(fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
          ok: false,
        })

        const store = createTestStore({
          user: mockUser,
          token: 'test-token',
          isAuthenticated: true,
        })

        await store.dispatch(logoutUser())

        const state = store.getState().auth
        expect(state.user).toBeNull()
        expect(state.token).toBeNull()
        expect(state.isAuthenticated).toBe(false)
      })
    })

    describe('refreshToken', () => {
      it('should handle successful token refresh', async () => {
        const mockResponse = {
          token: 'new-token',
          refreshToken: 'new-refresh-token',
          expiresIn: 3600,
        }

        ;(fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        })

        const store = createTestStore({
          refreshToken: 'old-refresh-token',
        })

        await store.dispatch(refreshToken())

        const state = store.getState().auth
        expect(state.token).toBe('new-token')
        expect(state.refreshToken).toBe('new-refresh-token')
        expect(state.sessionExpiry).toBeGreaterThan(Date.now())
      })

      it('should clear credentials if refresh fails', async () => {
        ;(fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
          ok: false,
        })

        const store = createTestStore({
          user: mockUser,
          token: 'old-token',
          refreshToken: 'old-refresh-token',
          isAuthenticated: true,
        })

        await store.dispatch(refreshToken())

        const state = store.getState().auth
        expect(state.user).toBeNull()
        expect(state.token).toBeNull()
        expect(state.isAuthenticated).toBe(false)
      })
    })

    describe('updateUserProfile', () => {
      it('should handle successful profile update', async () => {
        const updatedUser = { ...mockUser, firstName: 'Jane' }
        ;(fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
          ok: true,
          json: async () => updatedUser,
        })

        const store = createTestStore({
          user: mockUser,
          token: 'test-token',
        })

        const updates = { firstName: 'Jane' }
        await store.dispatch(updateUserProfile(updates))

        const state = store.getState().auth
        expect(state.isLoading).toBe(false)
        expect(state.user?.firstName).toBe('Jane')
        expect(state.error).toBeNull()
      })

      it('should handle profile update failure', async () => {
        const errorMessage = 'Update failed'
        ;(fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
          ok: false,
          json: async () => ({ message: errorMessage }),
        })

        const store = createTestStore({
          user: mockUser,
          token: 'test-token',
        })

        const updates = { firstName: 'Jane' }
        await store.dispatch(updateUserProfile(updates))

        const state = store.getState().auth
        expect(state.isLoading).toBe(false)
        expect(state.error).toBe(errorMessage)
      })
    })
  })

  describe('selectors', () => {
    it('should select current user', () => {
      const store = createTestStore({ user: mockUser })
      const state = store.getState()

      expect(selectCurrentUser(state)).toEqual(mockUser)
    })

    it('should select token', () => {
      const store = createTestStore({ token: 'test-token' })
      const state = store.getState()

      expect(selectToken(state)).toBe('test-token')
    })

    it('should select authentication status', () => {
      const store = createTestStore({ isAuthenticated: true })
      const state = store.getState()

      expect(selectIsAuthenticated(state)).toBe(true)
    })

    it('should select permissions', () => {
      const store = createTestStore({ permissions: mockUser.permissions })
      const state = store.getState()

      expect(selectPermissions(state)).toEqual(mockUser.permissions)
    })

    it('should check if user has specific permission', () => {
      const store = createTestStore({ permissions: mockUser.permissions })
      const state = store.getState()

      const hasReadPermission = selectHasPermission('products', 'read')(state)
      const hasDeletePermission = selectHasPermission(
        'products',
        'delete'
      )(state)

      expect(hasReadPermission).toBe(true)
      expect(hasDeletePermission).toBe(false)
    })

    it('should check if session is valid', () => {
      const futureExpiry = Date.now() + 3600000 // 1 hour from now
      const pastExpiry = Date.now() - 3600000 // 1 hour ago

      const validStore = createTestStore({ sessionExpiry: futureExpiry })
      const expiredStore = createTestStore({ sessionExpiry: pastExpiry })
      const noExpiryStore = createTestStore({ sessionExpiry: null })

      expect(selectIsSessionValid(validStore.getState())).toBe(true)
      expect(selectIsSessionValid(expiredStore.getState())).toBe(false)
      expect(selectIsSessionValid(noExpiryStore.getState())).toBe(false)
    })
  })
})
