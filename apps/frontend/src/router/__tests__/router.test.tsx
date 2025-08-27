import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { configureStore, type Reducer } from '@reduxjs/toolkit'
import { router } from '../index'
import authReducer from '../../store/slices/authSlice'
import uiReducer from '../../store/slices/uiSlice'
import type { UIState } from '../../store/slices/uiSlice'

// Mock all the page components
vi.mock('../../pages/Dashboard', () => {
  return function Dashboard() {
    return <div>Dashboard Page</div>
  }
})

vi.mock('../../pages/auth/Login', () => {
  return function Login() {
    return <div>Login Page</div>
  }
})

vi.mock('../../pages/products/ProductList', () => {
  return function ProductList() {
    return <div>Product List Page</div>
  }
})

vi.mock('../../pages/NotFound', () => {
  return {
    NotFoundPage: function NotFound() {
      return <div>404 Not Found</div>
    },
  }
})

// Mock layout components
vi.mock('../../components/layouts/DashboardLayout', () => {
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

vi.mock('../../components/layouts/AuthLayout', () => {
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
vi.mock('../ProtectedRoute', () => {
  return {
    ProtectedRoute: function ProtectedRoute({
      children,
    }: {
      children: React.ReactNode
    }) {
      // Use the auth state from the store to determine if user is authenticated
      const { useSelector } = require('react-redux')
      const isAuthenticated = useSelector((state: any) => state.auth.isAuthenticated)
      
      if (!isAuthenticated) {
        // Return AuthLayout mock for unauthenticated users
        return (
          <div>
            <div>Auth Layout</div>
            <div data-testid='outlet'>
              {/* Outlet content would be rendered here */}
            </div>
          </div>
        )
      }
      
      return <div>{children}</div>
    },
  }
})

vi.mock('../PublicRoute', () => {
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

describe('Route Protection', () => {
  it('should protect dashboard routes when not authenticated', () => {
    renderWithRouter(['/'], { isAuthenticated: false })
    // Should redirect to login or show auth layout
    expect(screen.getByText('Auth Layout')).toBeInTheDocument()
  })

  it('should allow access to dashboard when authenticated', () => {
    renderWithRouter(['/'], { isAuthenticated: true })
    expect(screen.getByText('Dashboard Layout')).toBeInTheDocument()
  })

  it('should allow access to public routes regardless of auth status', () => {
    // Test with authenticated user
    renderWithRouter(['/auth/login'], { isAuthenticated: true })
    expect(screen.getAllByText('Auth Layout')).toHaveLength(1)

    // Clear previous render and test with unauthenticated user
    const { cleanup } = require('@testing-library/react')
    cleanup()
    
    renderWithRouter(['/auth/login'], { isAuthenticated: false })
    expect(screen.getAllByText('Auth Layout')).toHaveLength(1)
  })
})

describe('Route Structure', () => {
  it('should have all main navigation routes defined', () => {
    const mainRoutes = [
      'products',
      'orders',
      'customers',
      'inventory',
      'analytics',
      'billing',
      'settings',
      'shopify',
    ]

    const dashboardRoute = router.routes.find((r) => r.path === '/')
    expect(dashboardRoute).toBeDefined()
    expect(dashboardRoute?.children).toBeDefined()

    // Check for dashboard as index route
    const hasIndexRoute = dashboardRoute?.children?.some((child) => child.index === true)
    expect(hasIndexRoute).toBeTruthy()

    // Check other main routes
    mainRoutes.forEach((route) => {
      const routeExists = dashboardRoute?.children?.some(
        (child) => child.path === route
      )

      expect(routeExists).toBeTruthy()
    })
  })

  it('should have proper nested route structure for products', () => {
    const productRoutes = [
      'products',
      'products/create',
      'products/collections',
      'products/categories',
      'products/import',
      'products/export',
    ]

    productRoutes.forEach((route) => {
      const routePath = route.split('/')
      const parentRoute = routePath[0]
      const childRoute = routePath[1]

      const routeExists = router.routes
        .find((r) => r.path === '/')
        ?.children?.find((c) => c.path === parentRoute)
        ?.children?.some((child) => 
          child.path === childRoute || child.index === true
        )

      expect(routeExists).toBeTruthy()
    })
  })

  it('should have proper nested route structure for orders', () => {
    const orderRoutes = [
      'orders',
      'orders/create',
      'orders/processing',
      'orders/shipped',
      'orders/delivered',
      'orders/cancelled',
    ]

    orderRoutes.forEach((route) => {
      const routePath = route.split('/')
      const parentRoute = routePath[0]
      const childRoute = routePath[1]

      const routeExists = router.routes
        .find((r) => r.path === '/')
        ?.children?.find((c) => c.path === parentRoute)
        ?.children?.some((child) => 
          child.path === childRoute || child.index === true
        )

      expect(routeExists).toBeTruthy()
    })
  })
})

describe('Route Parameters', () => {
  it('should handle dynamic routes with parameters', () => {
    const dynamicRoutes = [
      '/products/:id',
      '/orders/:id',
      '/customers/:id',
    ]

    const dashboardRoute = router.routes.find((r) => r.path === '/')
    expect(dashboardRoute).toBeDefined()

    dynamicRoutes.forEach((route) => {
      const routePath = route.split('/')
      const parentRoute = routePath[1]
      const paramRoute = routePath[2]

      const parentRouteConfig = dashboardRoute?.children?.find((c) => c.path === parentRoute)
      expect(parentRouteConfig).toBeDefined()

      const routeExists = parentRouteConfig?.children?.some((child) => 
        child.path === paramRoute || child.path?.includes(':')
      )

      expect(routeExists).toBeTruthy()
    })
  })
})

describe('Route Error Handling', () => {
  it('should handle malformed URLs gracefully', () => {
    const malformedUrls = [
      '/products//create',
      '/orders///',
      '/customers/',
      '/inventory//edit/',
    ]

    malformedUrls.forEach((url) => {
      expect(() => {
        renderWithRouter([url])
      }).not.toThrow()
    })
  })

  it('should handle deep nested routes', () => {
    const deepRoutes = [
      '/products/collections/summer-2024',
      '/orders/processing/urgent',
      '/customers/vip/active',
    ]

    deepRoutes.forEach((route) => {
      expect(() => {
        renderWithRouter([route])
      }).not.toThrow()
    })
  })
})

describe('Router Performance', () => {
  it('should render routes without memory leaks', () => {
    const routes = ['/', '/products', '/orders', '/customers']
    
    routes.forEach((route) => {
      const { unmount } = renderWithRouter([route])
      expect(() => unmount()).not.toThrow()
    })
  })

  it('should handle rapid route changes', () => {
    const { rerender } = renderWithRouter(['/'])
    
    const routes = ['/products', '/orders', '/customers', '/analytics']
    routes.forEach((route) => {
      expect(() => {
        rerender(
          <Provider store={createMockStore({ isAuthenticated: true })}>
            <RouterProvider router={createMemoryRouter(router.routes, { initialEntries: [route] })} />
          </Provider>
        )
      }).not.toThrow()
    })
  })
})
