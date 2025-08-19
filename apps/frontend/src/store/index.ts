import { configureStore, combineReducers, Middleware } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist'
import storage from 'redux-persist/lib/storage'

// Import API and slices
import { baseApi } from './api/baseApi'
import authReducer from './slices/authSlice'
import uiReducer from './slices/uiSlice'
import productsReducer from './slices/productsSlice'
import inventoryReducer from './slices/inventorySlice'
import ordersReducer from './slices/ordersSlice'
import customersReducer from './slices/customersSlice'

// Persist configuration
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth', 'ui'], // Only persist auth and UI state
  blacklist: ['api'], // Don't persist API cache
}

const authPersistConfig = {
  key: 'auth',
  storage,
  whitelist: ['user', 'token', 'refreshToken', 'rememberMe', 'preferences'],
}

const uiPersistConfig = {
  key: 'ui',
  storage,
  whitelist: ['theme', 'sidebarCollapsed', 'viewMode', 'pageSize'],
}

// Combine reducers
const rootReducer = combineReducers({
  // API slice
  [baseApi.reducerPath]: baseApi.reducer,

  // Persisted slices
  auth: persistReducer(authPersistConfig, authReducer),
  ui: persistReducer(uiPersistConfig, uiReducer),

  // Non-persisted slices (will be rehydrated from API)
  products: productsReducer,
  inventory: inventoryReducer,
  orders: ordersReducer,
  customers: customersReducer,
})

const persistedReducer = persistReducer(persistConfig, rootReducer)

// Custom middleware for session management
const sessionMiddleware: Middleware = (store) => (next) => (action) => {
  // Check for session expiry on each action
  if (action.type !== 'auth/updateLastActivity') {
    const state = store.getState()
    if (state.auth.isAuthenticated) {
      const now = Date.now()
      const sessionExpiry = state.auth.sessionExpiry
      const lastActivity = state.auth.lastActivity

      // Auto-logout if session expired
      if (sessionExpiry && now > sessionExpiry) {
        store.dispatch({ type: 'auth/logout' })
        return next(action)
      }

      // Update last activity if user is active
      if (now - lastActivity > 60000) {
        // Update every minute
        store.dispatch({ type: 'auth/updateLastActivity' })
      }
    }
  }

  return next(action)
}

// Custom middleware for error handling
const errorMiddleware: Middleware = (store) => (next) => (action) => {
  // Handle RTK Query errors globally
  if (action.type?.endsWith('/rejected') && action.payload?.status) {
    const { status, data } = action.payload

    // Handle authentication errors
    if (status === 401) {
      store.dispatch({ type: 'auth/clearCredentials' })
      store.dispatch({
        type: 'ui/addNotification',
        payload: {
          type: 'error',
          title: 'Authentication Error',
          message: 'Your session has expired. Please log in again.',
        },
      })
    }

    // Handle server errors
    if (status >= 500) {
      store.dispatch({
        type: 'ui/addNotification',
        payload: {
          type: 'error',
          title: 'Server Error',
          message:
            data?.message || 'An unexpected error occurred. Please try again.',
        },
      })
    }

    // Handle network errors
    if (status === 'FETCH_ERROR') {
      store.dispatch({
        type: 'ui/addNotification',
        payload: {
          type: 'error',
          title: 'Network Error',
          message:
            'Unable to connect to the server. Please check your connection.',
        },
      })
    }
  }

  return next(action)
}

// Configure store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          FLUSH,
          REHYDRATE,
          PAUSE,
          PERSIST,
          PURGE,
          REGISTER,
          'persist/PERSIST',
        ],
        ignoredActionsPaths: ['meta.arg', 'payload.timestamp'],
        ignoredPaths: [
          'items.dates',
          'auth.sessionExpiry',
          'auth.lastActivity',
        ],
      },
      immutableCheck: {
        ignoredPaths: ['auth.user', 'products.items', 'inventory.items'],
      },
    })
      .concat(baseApi.middleware)
      .concat(sessionMiddleware)
      .concat(errorMiddleware),
  devTools: process.env.NODE_ENV !== 'production' && {
    name: 'Oda Store',
    trace: true,
    traceLimit: 25,
  },
})

// Setup RTK Query listeners (skip in test environment)
if (process.env.NODE_ENV !== 'test') {
  setupListeners(store.dispatch)
}

// Create persistor (skip for test environment to avoid open handles)
export const persistor =
  process.env.NODE_ENV === 'test'
    ? {
        persist: () => {},
        purge: async () => {},
        flush: async () => {},
        pause: () => {},
        resume: () => {},
        subscribe: () => () => {},
      }
    : persistStore(store)

// Types
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

// Utility function to reset store (for logout)
export const resetStore = () => {
  store.dispatch({ type: 'auth/resetAuthState' })
  store.dispatch({ type: 'ui/resetUIState' })
  store.dispatch({ type: 'products/resetProductsState' })
  store.dispatch({ type: 'inventory/resetInventoryState' })
  store.dispatch({ type: 'orders/resetOrdersState' })
  store.dispatch({ type: 'customers/resetCustomersState' })
  store.dispatch(baseApi.util.resetApiState())
}

// Utility function to check if store is rehydrated
export const isStoreRehydrated = (state: RootState) => {
  return state._persist?.rehydrated === true
}
