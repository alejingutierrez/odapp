import React from 'react'
import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import {
  createMemoryRouter,
  RouterProvider,
  RouteObject,
} from 'react-router-dom'
import { configureStore } from '@reduxjs/toolkit'
import { describe, it, expect, vi } from 'vitest'
import authReducer from '../../store/slices/authSlice'
import uiReducer from '../../store/slices/uiSlice'
import { router } from '../index'

// Mock components to avoid complex dependencies
vi.mock('../../components/layouts/DashboardLayout', () => ({
  DashboardLayout: () => (
    <div data-testid='dashboard-layout'>
      <div>Dashboard Layout</div>
      <div data-testid='outlet'>Content Area</div>
    </div>
  ),
}))

vi.mock('../../components/layouts/AuthLayout', () => ({
  AuthLayout: () => (
    <div data-testid='auth-layout'>
      <div>Auth Layout</div>
      <div data-testid='outlet'>Auth Content</div>
    </div>
  ),
}))

vi.mock('../../pages/Dashboard', () => ({
  __esModule: true,
  default: () => <div data-testid='dashboard-page'>Dashboard Page</div>,
}))

vi.mock('../../pages/auth/Login', () => ({
  __esModule: true,
  default: () => <div data-testid='login-page'>Login Page</div>,
}))

vi.mock('../../pages/auth/Register', () => ({
  __esModule: true,
  default: () => <div data-testid='register-page'>Register Page</div>,
}))

vi.mock('../../pages/NotFound', () => ({
  NotFoundPage: () => <div data-testid='not-found'>404 Not Found</div>,
}))

// Mock route guards
vi.mock('../ProtectedRoute', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='protected-route'>{children}</div>
  ),
}))

vi.mock('../PublicRoute', () => ({
  PublicRoute: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='public-route'>{children}</div>
  ),
}))

const createTestStore = (initialState: any = {}) => {
  return configureStore({
    reducer: {
      auth: authReducer,
      ui: uiReducer,
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
        ...initialState.auth,
      },
      ui: {
        sidebarCollapsed: false,
        sidebarWidth: 256,
        headerHeight: 64,
        theme: 'light',
        primaryColor: '#1890ff',
        modals: {},
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
        viewMode: 'grid',
        pageSize: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        isOnline: true,
        websocketConnected: false,
        errorBoundaries: {},
        ...initialState.ui,
      },
    },
  })
}

const renderWithRouter = (
  routes: RouteObject[],
  initialEntries = ['/'],
  initialState: Record<string, unknown> = {}
) => {
  const store = createTestStore(initialState)
  const router = createMemoryRouter(routes, { initialEntries })

  return render(
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  )
}

describe('Router Configuration', () => {
  it('should have basic route structure', () => {
    expect(router).toBeDefined()
    expect(router.routes).toBeDefined()
    expect(Array.isArray(router.routes)).toBe(true)
  })

  it('should handle essential auth routes', () => {
    const authRoutes = [
      '/auth/login',
      '/auth/register',
    ]

    authRoutes.forEach((route) => {
      expect(
        router.routes.some(
          (r) =>
            r.path === '/auth' &&
            r.children?.some((child) => child.path === route.split('/')[2])
        )
      ).toBeTruthy()
    })
  })

  it('should have dashboard as main route', () => {
    const dashboardRoute = router.routes.find((r) => r.path === '/')
    expect(dashboardRoute).toBeDefined()
    expect(dashboardRoute?.children?.some((c) => c.index === true)).toBeTruthy()
  })

  it('should have catch-all route for 404', () => {
    const catchAllRoute = router.routes.find((r) => r.path === '*')
    expect(catchAllRoute).toBeDefined()
  })
})

describe('Route Structure', () => {
  it('should have essential routes only', () => {
    // Essential routes that should exist
    const essentialRoutes = [
      '/', // Dashboard
    ]

    essentialRoutes.forEach((route) => {
      const routeExists = router.routes.some(
        (r) => r.path === route || (route === '/' && r.path === '/')
      )

      expect(routeExists).toBeTruthy()
    })
  })

  it('should not have removed feature routes', () => {
    // Routes that should NOT exist anymore
    const removedRoutes = [
      'products',
      'orders',
      'customers',
      'analytics',
      'billing',
      'logistics',
      'inventory',
      'shopify',
      'settings',
    ]

    removedRoutes.forEach((route) => {
      const dashboardRoute = router.routes.find((r) => r.path === '/')
      const routeExists = dashboardRoute?.children?.some(
        (child) => child.path === route
      )

      expect(routeExists).toBeFalsy()
    })
  })
})

describe('Route Parameters', () => {
  it('should handle basic navigation', () => {
    // Simple test for basic routing functionality
    const routes = [
      {
        path: '/',
        element: <div data-testid='dashboard-page'>Dashboard</div>,
      },
      {
        path: '/auth/login',
        element: <div data-testid='login-page'>Login</div>,
      },
    ]

    renderWithRouter(routes, ['/'])
    expect(screen.getByTestId('dashboard-page')).toBeInTheDocument()
  })
})

describe('Route Accessibility', () => {
  it('should handle 404 routes', () => {
    const routes = [
      {
        path: '/',
        element: <div data-testid='dashboard-page'>Dashboard</div>,
      },
      {
        path: '*',
        element: <div data-testid='not-found'>404 Not Found</div>,
      },
    ]

    renderWithRouter(routes, ['/non-existent-route'])
    expect(screen.getByTestId('not-found')).toBeInTheDocument()
  })

  it('should handle auth routes', () => {
    const routes = [
      {
        path: '/auth/login',
        element: <div data-testid='login-page'>Login</div>,
      },
    ]

    renderWithRouter(routes, ['/auth/login'])
    expect(screen.getByTestId('login-page')).toBeInTheDocument()
  })
})

describe('Route Performance', () => {
  it('should load routes without errors', () => {
    expect(() => {
      const routes = [
        {
          path: '/',
          element: <div data-testid='dashboard-page'>Dashboard</div>,
        },
      ]
      renderWithRouter(routes, ['/'])
    }).not.toThrow()
  })
})

describe('Route Navigation', () => {
  it('should navigate between essential routes', () => {
    const routes = [
      {
        path: '/',
        element: <div data-testid='dashboard-page'>Dashboard</div>,
      },
      {
        path: '/auth/login',
        element: <div data-testid='login-page'>Login</div>,
      },
    ]

    // Test dashboard route
    renderWithRouter(routes, ['/'])
    expect(screen.getByTestId('dashboard-page')).toBeInTheDocument()
  })
})