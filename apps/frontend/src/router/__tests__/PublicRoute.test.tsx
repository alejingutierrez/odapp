import { describe, it, expect } from 'vitest'
import React from 'react'
import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { configureStore } from '@reduxjs/toolkit'
import { PublicRoute } from '../PublicRoute'
import authReducer from '../../store/slices/authSlice'

// Mock store factory
const createMockStore = (authState: Record<string, unknown>) => {
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
        ...authState,
      },
    },
  })
}

const TestComponent = () => <div>Public Content</div>

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

describe('PublicRoute', () => {
  it('should render children when user is not authenticated', () => {
    renderWithProviders(
      <PublicRoute>
        <TestComponent />
      </PublicRoute>,
      { isAuthenticated: false }
    )

    expect(screen.getByText('Public Content')).toBeInTheDocument()
  })

  it('should redirect to dashboard when user is authenticated', () => {
    renderWithProviders(
      <PublicRoute>
        <TestComponent />
      </PublicRoute>,
      {
        isAuthenticated: true,
        user: { id: '1', email: 'test@example.com' },
        token: 'mock-token',
      }
    )

    expect(screen.queryByText('Public Content')).not.toBeInTheDocument()
  })

  it('should use custom redirect path when provided', () => {
    renderWithProviders(
      <PublicRoute redirectTo='/custom-dashboard'>
        <TestComponent />
      </PublicRoute>,
      {
        isAuthenticated: true,
        user: { id: '1', email: 'test@example.com' },
        token: 'mock-token',
      }
    )

    expect(screen.queryByText('Public Content')).not.toBeInTheDocument()
  })
})
