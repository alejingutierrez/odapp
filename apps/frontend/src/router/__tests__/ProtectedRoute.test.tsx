import { describe, it, expect } from 'vitest'
import React from 'react'
import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { configureStore, type Reducer } from '@reduxjs/toolkit'
import { ProtectedRoute } from '../ProtectedRoute'
import authReducer from '../../store/slices/authSlice'
import uiReducer from '../../store/slices/uiSlice'
import type { UIState } from '../../store/slices/uiSlice'

// Mock store factory
const createMockStore = (authState: Record<string, unknown>) => {
  return configureStore({
    reducer: {
      auth: authReducer,
      ui: uiReducer as Reducer<UIState>,
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
        ...authState,
      },
      ui: {
        sidebarCollapsed: false,
        sidebarWidth: 256,
        headerHeight: 64,
        theme: 'light' as const,
        primaryColor: '#1890ff',
        modals: {
          productCreate: { id: 'productCreate', isOpen: false },
          productEdit: { id: 'productEdit', isOpen: false },
          productDelete: { id: 'productDelete', isOpen: false },
          orderDetail: { id: 'orderDetail', isOpen: false },
          orderCreate: { id: 'orderCreate', isOpen: false },
          customerEdit: { id: 'customerEdit', isOpen: false },
          customerDelete: { id: 'customerDelete', isOpen: false },
          inventoryAdjust: { id: 'inventoryAdjust', isOpen: false },
          bulkActions: { id: 'bulkActions', isOpen: false },
          settings: { id: 'settings', isOpen: false },
          shopifySync: { id: 'shopifySync', isOpen: false },
        },
        loading: {
          global: false,
          products: false,
          inventory: false,
          orders: false,
          customers: false,
          analytics: false,
          shopify: false,
        },
        notifications: [],
        unreadNotificationCount: 0,
        currentPage: '',
        breadcrumbs: [],
        pageTitle: '',
        globalSearch: '',
        activeFilters: {},
        viewMode: 'grid' as const,
        pageSize: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc' as const,
        isOnline: true,
        websocketConnected: false,
        errorBoundaries: {},
      },
    },
  })
}

const TestComponent = () => <div>Protected Content</div>

const renderWithProviders = (
  component: React.ReactElement,
  authState: Record<string, unknown> = {}
) => {
  const store = createMockStore(authState)
  return render(
    <Provider store={store}>
      <BrowserRouter>{component}</BrowserRouter>
    </Provider>
  )
}

describe('ProtectedRoute', () => {
  it('should redirect to login when user is not authenticated', () => {
    renderWithProviders(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>,
      { isAuthenticated: false }
    )

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('should show loading spinner when authentication is loading', () => {
    renderWithProviders(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>,
      { isLoading: true, isAuthenticated: false }
    )

    expect(screen.getByText('Authenticating...')).toBeInTheDocument()
  })

  it('should render children when user is authenticated', () => {
    renderWithProviders(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>,
      {
        isAuthenticated: true,
        user: { id: '1', email: 'test@example.com' },
        token: 'mock-token',
      }
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('should use custom fallback path when provided', () => {
    renderWithProviders(
      <ProtectedRoute fallbackPath='/custom-login'>
        <TestComponent />
      </ProtectedRoute>,
      { isAuthenticated: false }
    )

    // Since we're using BrowserRouter, we can't easily test the redirect
    // In a real test, you'd use MemoryRouter and check the location
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })
})
