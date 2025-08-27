import { Spin } from 'antd'
import React, { Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'

import { ErrorBoundary } from '../components/common/ErrorBoundary'
import { AuthLayout } from '../components/layouts/AuthLayout'
import { DashboardLayout } from '../components/layouts/DashboardLayout'
import { NotFoundPage } from '../pages/NotFound'

import { ProtectedRoute } from './ProtectedRoute'
import { PublicRoute } from './PublicRoute'

// Lazy loaded pages - only essential pages
const Dashboard = React.lazy(() => import('../pages/Dashboard'))
const Login = React.lazy(() => import('../pages/auth/Login'))
const Register = React.lazy(() => import('../pages/auth/Register'))

// Loading component
const PageLoader: React.FC = () => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '200px',
    }}
  >
    <Spin size='large' />
  </div>
)

// Wrapper component for lazy loaded pages
const LazyWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary>
    <Suspense fallback={<PageLoader />}>{children}</Suspense>
  </ErrorBoundary>
)

// Simplified router configuration with only essential routes
export const router: ReturnType<typeof createBrowserRouter> =
  createBrowserRouter([
    // Public routes (auth pages)
    {
      path: '/auth',
      element: (
        <PublicRoute>
          <AuthLayout />
        </PublicRoute>
      ),
      children: [
        {
          path: 'login',
          element: (
            <LazyWrapper>
              <Login />
            </LazyWrapper>
          ),
        },
        {
          path: 'register',
          element: (
            <LazyWrapper>
              <Register />
            </LazyWrapper>
          ),
        },
      ],
    },

    // Protected routes (main app)
    {
      path: '/',
      element: (
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      ),
      children: [
        // Dashboard - main page
        {
          index: true,
          element: (
            <LazyWrapper>
              <Dashboard />
            </LazyWrapper>
          ),
        },
      ],
    },

    // Catch all route
    {
      path: '*',
      element: <NotFoundPage />,
    },
  ])