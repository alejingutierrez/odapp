import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../index'

// Types
export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  avatar?: string
  role: string
  permissions: Permission[]
  preferences: UserPreferences
  lastLoginAt?: string
  createdAt: string
  updatedAt: string
}

export interface Permission {
  id: string
  name: string
  resource: string
  action: string
  conditions?: Record<string, unknown>
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto'
  language: string
  timezone: string
  notifications: {
    email: boolean
    push: boolean
    sms: boolean
  }
  dashboard: {
    layout: 'grid' | 'list'
    widgets: string[]
  }
}

export interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  permissions: Permission[]
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  sessionExpiry: number | null
  lastActivity: number
  rememberMe: boolean
}

// Initial state
const initialState: AuthState = {
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
}

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/login',
  async (
    credentials: { email: string; password: string; rememberMe?: boolean },
    { rejectWithValue }
  ) => {
    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      })

      if (!response.ok) {
        const error = await response.json()
        return rejectWithValue(error.message || 'Login failed')
      }

      const data = await response.json()
      return data
    } catch (error) {
      return rejectWithValue('Network error occurred')
    }
  }
)

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { getState }) => {
    try {
      const state = getState() as RootState
      const response = await fetch('/api/v1/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${state.auth.token}`,
        },
        body: JSON.stringify({
          refreshToken: state.auth.refreshToken,
        }),
      })

      if (!response.ok) {
        // Even if logout fails on server, we should clear local state
        console.warn('Server logout failed, clearing local state')
      }

      return true
    } catch (error) {
      // Even if network fails, we should clear local state
      console.warn('Logout network error, clearing local state')
      return true
    }
  }
)

export const refreshToken = createAsyncThunk(
  'auth/refresh',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState
      const response = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refreshToken: state.auth.refreshToken,
        }),
      })

      if (!response.ok) {
        return rejectWithValue('Token refresh failed')
      }

      const data = await response.json()
      return data
    } catch (error) {
      return rejectWithValue('Network error occurred')
    }
  }
)

export const updateUserProfile = createAsyncThunk(
  'auth/updateProfile',
  async (
    updates: Partial<
      Pick<User, 'firstName' | 'lastName' | 'avatar' | 'preferences'>
    >,
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as RootState
      const response = await fetch('/api/v1/auth/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${state.auth.token}`,
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const error = await response.json()
        return rejectWithValue(error.message || 'Profile update failed')
      }

      const data = await response.json()
      return data
    } catch (error) {
      return rejectWithValue('Network error occurred')
    }
  }
)

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        user: User
        token: string
        refreshToken: string
        expiresIn: number
      }>
    ) => {
      const { user, token, refreshToken, expiresIn } = action.payload
      state.user = user
      state.token = token
      state.refreshToken = refreshToken
      state.permissions = user.permissions
      state.isAuthenticated = true
      state.sessionExpiry = Date.now() + expiresIn * 1000
      state.error = null
    },

    clearCredentials: (state) => {
      state.user = null
      state.token = null
      state.refreshToken = null
      state.permissions = []
      state.isAuthenticated = false
      state.sessionExpiry = null
      state.error = null
    },

    updateLastActivity: (state) => {
      state.lastActivity = Date.now()
    },

    setRememberMe: (state, action: PayloadAction<boolean>) => {
      state.rememberMe = action.payload
    },

    clearError: (state) => {
      state.error = null
    },

    updateUserPreferences: (
      state,
      action: PayloadAction<Partial<UserPreferences>>
    ) => {
      if (state.user) {
        state.user.preferences = {
          ...state.user.preferences,
          ...action.payload,
        }
      }
    },

    resetAuthState: () => initialState,
  },

  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false
        const { user, token, refreshToken, expiresIn } = action.payload
        state.user = user
        state.token = token
        state.refreshToken = refreshToken
        state.permissions = user.permissions
        state.isAuthenticated = true
        state.sessionExpiry = Date.now() + expiresIn * 1000
        state.lastActivity = Date.now()
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
        state.isAuthenticated = false
      })

    // Logout
    builder
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true
      })
      .addCase(logoutUser.fulfilled, () => {
        return initialState
      })
      .addCase(logoutUser.rejected, () => {
        // Clear state even if logout failed
        return initialState
      })

    // Refresh token
    builder
      .addCase(refreshToken.fulfilled, (state, action) => {
        const { token, refreshToken, expiresIn } = action.payload
        state.token = token
        state.refreshToken = refreshToken
        state.sessionExpiry = Date.now() + expiresIn * 1000
      })
      .addCase(refreshToken.rejected, () => {
        // Clear credentials if refresh fails
        return initialState
      })

    // Update profile
    builder
      .addCase(updateUserProfile.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.isLoading = false
        if (state.user) {
          state.user = { ...state.user, ...action.payload }
        }
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
  },
})

// Actions
export const {
  setCredentials,
  clearCredentials,
  updateLastActivity,
  setRememberMe,
  clearError,
  updateUserPreferences,
  resetAuthState,
} = authSlice.actions

// Selectors
export const selectCurrentUser = (state: RootState) => state.auth.user
export const selectToken = (state: RootState) => state.auth.token
export const selectIsAuthenticated = (state: RootState) =>
  state.auth.isAuthenticated
export const selectPermissions = (state: RootState) => state.auth.permissions
export const selectAuthLoading = (state: RootState) => state.auth.isLoading
export const selectAuthError = (state: RootState) => state.auth.error
export const selectSessionExpiry = (state: RootState) =>
  state.auth.sessionExpiry
export const selectUserPreferences = (state: RootState) =>
  state.auth.user?.preferences

// Permission selectors
export const selectHasPermission =
  (resource: string, action: string) => (state: RootState) => {
    return state.auth.permissions.some(
      (permission) =>
        permission.resource === resource && permission.action === action
    )
  }

export const selectCanAccessResource =
  (resource: string) => (state: RootState) => {
    return state.auth.permissions.some(
      (permission) => permission.resource === resource
    )
  }

// Session selectors
export const selectIsSessionValid = (state: RootState) => {
  if (!state.auth.sessionExpiry) return false
  return Date.now() < state.auth.sessionExpiry
}

export const selectSessionTimeRemaining = (state: RootState) => {
  if (!state.auth.sessionExpiry) return 0
  return Math.max(0, state.auth.sessionExpiry - Date.now())
}

export default authSlice.reducer
