import React from 'react'
import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { configureStore } from '@reduxjs/toolkit'
import { router } from '../index'
import authReducer from '../../store/slices/authSlice'
import uiReducer from '../../store/slices/uiSlice'

// Mock all the page components
jest.mock('../../pages/Dashboard', () => {
  return function Dashboard() {
    return <div>Dashboard Page</div>
  }
})

jest.mock('../../pages/auth/Login', () => {
  return function Login() {
    return <div>Login Page</div>
  }
})

jest.mock('../../pages/products/ProductList', () => {
  return function ProductList() {
    return <div>Product List Page</div>
  }
})

jest.mock('../../pages/NotFound', () => {
  return {
    NotFoundPage: function NotFound() {
      return <div>404 Not Found</div>
    },
  }
})

// Mock layout components
jest.mock('../../components/layouts/DashboardLayout', () => {
  return {
    DashboardLayout: function DashboardLayout() {
      return (
        <div>
          <div>Dashboard Layout</div>
          <div data-testid='outlet'>
            {/* Outlet content would be rendered here */}
          </div>
        </div>
      )
    },
  }
})

jest.mock('../../components/layouts/AuthLayout', () => {
  return {
    AuthLayout: function AuthLayout() {
      return (
        <div>
          <div>Auth Layout</div>
          <div data-testid='outlet'>
            {/* Outlet content would be rendered here */}
          </div>
        </div>
      )
    },
  }
})

// Mock route guards
jest.mock('../ProtectedRoute', () => {
  return {
    ProtectedRoute: function ProtectedRoute({
      children,
    }: {
      children: React.ReactNode
    }) {
      return <div>{children}</div>
    },
  }
})

jest.mock('../PublicRoute', () => {
  return {
    PublicRoute: function PublicRoute({
      children,
    }: {
      children: React.ReactNode
    }) {
      return <div>{children}</div>
    },
  }
})

// Mock store factory
const createMockStore = (authState: Record<string, unknown> = {}) => {
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
        ...authState,
      },
      ui: {
        sidebarCollapsed: false,
        sidebarWidth: 256,
        headerHeight: 64,
        theme: 'light' as const,
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

const renderWithRouter = (
  initialEntries: string[] = ['/'],
  authState: Record<string, unknown> = {}
) => {
  const store = createMockStore(authState)
  const testRouter = createMemoryRouter(router.routes, {
    initialEntries,
  })

  return render(
    <Provider store={store}>
      <RouterProvider router={testRouter} />
    </Provider>
  )
}

describe('Router Configuration', () => {
  it('should render dashboard layout for protected routes', () => {
    renderWithRouter(['/'], { isAuthenticated: true })
    expect(screen.getByText('Dashboard Layout')).toBeInTheDocument()
  })

  it('should render auth layout for public routes', () => {
    renderWithRouter(['/auth/login'])
    expect(screen.getByText('Auth Layout')).toBeInTheDocument()
  })

  it('should handle 404 routes', () => {
    renderWithRouter(['/non-existent-route'])
    expect(screen.getByText('404 Not Found')).toBeInTheDocument()
  })

  it('should handle nested product routes', () => {
    const routes = [
      '/products',
      '/products/create',
      '/products/collections',
      '/products/categories',
    ]

    routes.forEach((route) => {
      // Each route should be defined in the router configuration
      expect(
        router.routes.some(
          (r) =>
            r.path === '/' &&
            r.children?.some(
              (child) =>
                child.path === route.substring(1) ||
                child.children?.some(
                  (grandchild) =>
                    grandchild.path === route.split('/').slice(2).join('/')
                )
            )
        )
      ).toBeTruthy()
    })
  })

  it('should handle auth routes correctly', () => {
    const authRoutes = [
      '/auth/login',
      '/auth/register',
      '/auth/forgot-password',
      '/auth/reset-password',
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

  it('should redirect analytics index to sales', () => {
    // The analytics route should have a redirect from index to sales
    const analyticsRoute = router.routes
      .find((r) => r.path === '/')
      ?.children?.find((c) => c.path === 'analytics')

    expect(analyticsRoute?.children?.some((c) => c.index === true)).toBeTruthy()
  })
})
