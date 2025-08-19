import React, { Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { Spin } from 'antd'

// Layouts
import { DashboardLayout } from '../components/layouts/DashboardLayout'
import { AuthLayout } from '../components/layouts/AuthLayout'

// Route guards
import { ProtectedRoute } from './ProtectedRoute'
import { PublicRoute } from './PublicRoute'

// Error boundaries
import { ErrorBoundary } from '../components/common/ErrorBoundary'
import { NotFoundPage } from '../pages/NotFound'

// Lazy loaded pages
const Dashboard = React.lazy(() => import('../pages/Dashboard'))
const Login = React.lazy(() => import('../pages/auth/Login'))
const Register = React.lazy(() => import('../pages/auth/Register'))
const ForgotPassword = React.lazy(() => import('../pages/auth/ForgotPassword'))
const ResetPassword = React.lazy(() => import('../pages/auth/ResetPassword'))

// Products
const ProductList = React.lazy(() => import('../pages/products/ProductList'))
const ProductDetail = React.lazy(() => import('../pages/products/ProductDetail'))
const ProductCreate = React.lazy(() => import('../pages/products/ProductCreate'))
const ProductEdit = React.lazy(() => import('../pages/products/ProductEdit'))
const Collections = React.lazy(() => import('../pages/products/Collections'))
const Categories = React.lazy(() => import('../pages/products/Categories'))

// Inventory
const StockLevels = React.lazy(() => import('../pages/inventory/StockLevels'))
const Adjustments = React.lazy(() => import('../pages/inventory/Adjustments'))
const Transfers = React.lazy(() => import('../pages/inventory/Transfers'))
const InventoryReports = React.lazy(() => import('../pages/inventory/Reports'))

// Orders
const OrderList = React.lazy(() => import('../pages/orders/OrderList'))
const OrderDetail = React.lazy(() => import('../pages/orders/OrderDetail'))
const OrderCreate = React.lazy(() => import('../pages/orders/OrderCreate'))
const Returns = React.lazy(() => import('../pages/orders/Returns'))
const Fulfillment = React.lazy(() => import('../pages/orders/Fulfillment'))

// Customers
const CustomerList = React.lazy(() => import('../pages/customers/CustomerList'))
const CustomerDetail = React.lazy(() => import('../pages/customers/CustomerDetail'))
const Segments = React.lazy(() => import('../pages/customers/Segments'))
const Loyalty = React.lazy(() => import('../pages/customers/Loyalty'))
const Communications = React.lazy(() => import('../pages/customers/Communications'))

// Analytics
const SalesAnalytics = React.lazy(() => import('../pages/analytics/Sales'))
const ProductAnalytics = React.lazy(() => import('../pages/analytics/Products'))
const CustomerAnalytics = React.lazy(() => import('../pages/analytics/Customers'))
const InventoryAnalytics = React.lazy(() => import('../pages/analytics/Inventory'))
const ShopifyAnalytics = React.lazy(() => import('../pages/analytics/Shopify'))

// Billing
const Invoices = React.lazy(() => import('../pages/billing/Invoices'))
const Payments = React.lazy(() => import('../pages/billing/Payments'))
const TaxSettings = React.lazy(() => import('../pages/billing/TaxSettings'))
const BillingReports = React.lazy(() => import('../pages/billing/Reports'))

// Logistics
const Shipping = React.lazy(() => import('../pages/logistics/Shipping'))
const Carriers = React.lazy(() => import('../pages/logistics/Carriers'))
const Tracking = React.lazy(() => import('../pages/logistics/Tracking'))
const LogisticsReturns = React.lazy(() => import('../pages/logistics/Returns'))

// Shopify
const ShopifySync = React.lazy(() => import('../pages/shopify/Sync'))
const ShopifyProducts = React.lazy(() => import('../pages/shopify/Products'))
const ShopifyOrders = React.lazy(() => import('../pages/shopify/Orders'))
const ShopifyCustomers = React.lazy(() => import('../pages/shopify/Customers'))
const ShopifySettings = React.lazy(() => import('../pages/shopify/Settings'))

// Settings
const GeneralSettings = React.lazy(() => import('../pages/settings/General'))
const Users = React.lazy(() => import('../pages/settings/Users'))
const Permissions = React.lazy(() => import('../pages/settings/Permissions'))
const Integrations = React.lazy(() => import('../pages/settings/Integrations'))
const NotificationSettings = React.lazy(() => import('../pages/settings/Notifications'))
const BackupSettings = React.lazy(() => import('../pages/settings/Backup'))

// Loading component
const PageLoader: React.FC = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '200px' 
  }}>
    <Spin size="large" />
  </div>
)

// Wrapper component for lazy loaded pages
const LazyWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary>
    <Suspense fallback={<PageLoader />}>
      {children}
    </Suspense>
  </ErrorBoundary>
)

// Router configuration
export const router = createBrowserRouter([
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
      {
        path: 'forgot-password',
        element: (
          <LazyWrapper>
            <ForgotPassword />
          </LazyWrapper>
        ),
      },
      {
        path: 'reset-password',
        element: (
          <LazyWrapper>
            <ResetPassword />
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
      // Dashboard
      {
        index: true,
        element: (
          <LazyWrapper>
            <Dashboard />
          </LazyWrapper>
        ),
      },

      // Products
      {
        path: 'products',
        children: [
          {
            index: true,
            element: (
              <LazyWrapper>
                <ProductList />
              </LazyWrapper>
            ),
          },
          {
            path: 'create',
            element: (
              <LazyWrapper>
                <ProductCreate />
              </LazyWrapper>
            ),
          },
          {
            path: ':id',
            element: (
              <LazyWrapper>
                <ProductDetail />
              </LazyWrapper>
            ),
          },
          {
            path: ':id/edit',
            element: (
              <LazyWrapper>
                <ProductEdit />
              </LazyWrapper>
            ),
          },
          {
            path: 'collections',
            element: (
              <LazyWrapper>
                <Collections />
              </LazyWrapper>
            ),
          },
          {
            path: 'categories',
            element: (
              <LazyWrapper>
                <Categories />
              </LazyWrapper>
            ),
          },
        ],
      },

      // Inventory
      {
        path: 'inventory',
        children: [
          {
            index: true,
            element: (
              <LazyWrapper>
                <StockLevels />
              </LazyWrapper>
            ),
          },
          {
            path: 'adjustments',
            element: (
              <LazyWrapper>
                <Adjustments />
              </LazyWrapper>
            ),
          },
          {
            path: 'transfers',
            element: (
              <LazyWrapper>
                <Transfers />
              </LazyWrapper>
            ),
          },
          {
            path: 'reports',
            element: (
              <LazyWrapper>
                <InventoryReports />
              </LazyWrapper>
            ),
          },
        ],
      },

      // Orders
      {
        path: 'orders',
        children: [
          {
            index: true,
            element: (
              <LazyWrapper>
                <OrderList />
              </LazyWrapper>
            ),
          },
          {
            path: 'create',
            element: (
              <LazyWrapper>
                <OrderCreate />
              </LazyWrapper>
            ),
          },
          {
            path: ':id',
            element: (
              <LazyWrapper>
                <OrderDetail />
              </LazyWrapper>
            ),
          },
          {
            path: 'returns',
            element: (
              <LazyWrapper>
                <Returns />
              </LazyWrapper>
            ),
          },
          {
            path: 'fulfillment',
            element: (
              <LazyWrapper>
                <Fulfillment />
              </LazyWrapper>
            ),
          },
        ],
      },

      // Customers
      {
        path: 'customers',
        children: [
          {
            index: true,
            element: (
              <LazyWrapper>
                <CustomerList />
              </LazyWrapper>
            ),
          },
          {
            path: ':id',
            element: (
              <LazyWrapper>
                <CustomerDetail />
              </LazyWrapper>
            ),
          },
          {
            path: 'segments',
            element: (
              <LazyWrapper>
                <Segments />
              </LazyWrapper>
            ),
          },
          {
            path: 'loyalty',
            element: (
              <LazyWrapper>
                <Loyalty />
              </LazyWrapper>
            ),
          },
          {
            path: 'communications',
            element: (
              <LazyWrapper>
                <Communications />
              </LazyWrapper>
            ),
          },
        ],
      },

      // Analytics
      {
        path: 'analytics',
        children: [
          {
            index: true,
            element: <Navigate to="/analytics/sales" replace />,
          },
          {
            path: 'sales',
            element: (
              <LazyWrapper>
                <SalesAnalytics />
              </LazyWrapper>
            ),
          },
          {
            path: 'products',
            element: (
              <LazyWrapper>
                <ProductAnalytics />
              </LazyWrapper>
            ),
          },
          {
            path: 'customers',
            element: (
              <LazyWrapper>
                <CustomerAnalytics />
              </LazyWrapper>
            ),
          },
          {
            path: 'inventory',
            element: (
              <LazyWrapper>
                <InventoryAnalytics />
              </LazyWrapper>
            ),
          },
          {
            path: 'shopify',
            element: (
              <LazyWrapper>
                <ShopifyAnalytics />
              </LazyWrapper>
            ),
          },
        ],
      },

      // Billing
      {
        path: 'billing',
        children: [
          {
            index: true,
            element: (
              <LazyWrapper>
                <Invoices />
              </LazyWrapper>
            ),
          },
          {
            path: 'payments',
            element: (
              <LazyWrapper>
                <Payments />
              </LazyWrapper>
            ),
          },
          {
            path: 'tax-settings',
            element: (
              <LazyWrapper>
                <TaxSettings />
              </LazyWrapper>
            ),
          },
          {
            path: 'reports',
            element: (
              <LazyWrapper>
                <BillingReports />
              </LazyWrapper>
            ),
          },
        ],
      },

      // Logistics
      {
        path: 'logistics',
        children: [
          {
            index: true,
            element: (
              <LazyWrapper>
                <Shipping />
              </LazyWrapper>
            ),
          },
          {
            path: 'carriers',
            element: (
              <LazyWrapper>
                <Carriers />
              </LazyWrapper>
            ),
          },
          {
            path: 'tracking',
            element: (
              <LazyWrapper>
                <Tracking />
              </LazyWrapper>
            ),
          },
          {
            path: 'returns',
            element: (
              <LazyWrapper>
                <LogisticsReturns />
              </LazyWrapper>
            ),
          },
        ],
      },

      // Shopify
      {
        path: 'shopify',
        children: [
          {
            index: true,
            element: (
              <LazyWrapper>
                <ShopifySync />
              </LazyWrapper>
            ),
          },
          {
            path: 'products',
            element: (
              <LazyWrapper>
                <ShopifyProducts />
              </LazyWrapper>
            ),
          },
          {
            path: 'orders',
            element: (
              <LazyWrapper>
                <ShopifyOrders />
              </LazyWrapper>
            ),
          },
          {
            path: 'customers',
            element: (
              <LazyWrapper>
                <ShopifyCustomers />
              </LazyWrapper>
            ),
          },
          {
            path: 'settings',
            element: (
              <LazyWrapper>
                <ShopifySettings />
              </LazyWrapper>
            ),
          },
        ],
      },

      // Settings
      {
        path: 'settings',
        children: [
          {
            index: true,
            element: (
              <LazyWrapper>
                <GeneralSettings />
              </LazyWrapper>
            ),
          },
          {
            path: 'users',
            element: (
              <LazyWrapper>
                <Users />
              </LazyWrapper>
            ),
          },
          {
            path: 'permissions',
            element: (
              <LazyWrapper>
                <Permissions />
              </LazyWrapper>
            ),
          },
          {
            path: 'integrations',
            element: (
              <LazyWrapper>
                <Integrations />
              </LazyWrapper>
            ),
          },
          {
            path: 'notifications',
            element: (
              <LazyWrapper>
                <NotificationSettings />
              </LazyWrapper>
            ),
          },
          {
            path: 'backup',
            element: (
              <LazyWrapper>
                <BackupSettings />
              </LazyWrapper>
            ),
          },
        ],
      },
    ],
  },

  // Catch all route
  {
    path: '*',
    element: <NotFoundPage />,
  },
])