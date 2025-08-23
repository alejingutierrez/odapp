import React from 'react'
import { Button, Card, Space, Typography } from 'antd'
import { useAppDispatch, useAppSelector } from '../hooks'
import {
  loginUser,
  logoutUser,
  selectCurrentUser,
  selectIsAuthenticated,
} from '../slices/authSlice'
import {
  addNotification,
  toggleSidebar,
  selectSidebarCollapsed,
} from '../slices/uiSlice'
import {
  useGetProductsQuery,
  useCreateProductMutation,
} from '../api/productsApi'

const { Title, Text } = Typography

/**
 * Example component demonstrating Redux usage patterns in the Oda application
 * This shows how to:
 * - Use typed hooks for dispatch and selectors
 * - Handle async actions (login/logout)
 * - Use RTK Query for API calls
 * - Manage UI state
 * - Handle notifications
 */
export const ReduxExample: React.FC = () => {
  const dispatch = useAppDispatch()

  // Auth selectors
  const currentUser = useAppSelector(selectCurrentUser)
  const isAuthenticated = useAppSelector(selectIsAuthenticated)

  // UI selectors
  const sidebarCollapsed = useAppSelector(selectSidebarCollapsed)

  // RTK Query hooks
  const {
    data: productsData,
    isLoading: productsLoading,
    error: productsError,
  } = useGetProductsQuery({
    page: 1,
    pageSize: 10,
  })

  const [createProduct, { isLoading: createProductLoading }] =
    useCreateProductMutation()

  // Event handlers
  const handleLogin = async () => {
    try {
      await dispatch(
        loginUser({
          email: 'demo@example.com',
          password: 'password123',
          rememberMe: true,
        })
      ).unwrap()

      dispatch(
        addNotification({
          type: 'success',
          title: 'Login Successful',
          message: 'Welcome back!',
        })
      )
    } catch (error) {
      dispatch(
        addNotification({
          type: 'error',
          title: 'Login Failed',
          message: 'Invalid credentials',
        })
      )
    }
  }

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap()

      dispatch(
        addNotification({
          type: 'info',
          title: 'Logged Out',
          message: 'You have been logged out successfully',
        })
      )
    } catch (error) {
      // Logout should always succeed locally even if server fails
      console.warn('Logout error:', error)
    }
  }

  const handleCreateProduct = async () => {
    try {
      const newProduct = await createProduct({
        name: 'Demo Product',
        description: 'This is a demo product created from Redux example',
        category: 'electronics',
        pricing: {
          basePrice: 99.99,
        },
        inventory: {
          tracked: true,
          quantity: 100,
          policy: 'deny',
        },
        tags: ['demo', 'example'],
      }).unwrap()

      dispatch(
        addNotification({
          type: 'success',
          title: 'Product Created',
          message: `Product "${(newProduct as { name?: string })?.name || 'Unknown'}" created successfully`,
        })
      )
    } catch (error) {
      dispatch(
        addNotification({
          type: 'error',
          title: 'Creation Failed',
          message: 'Failed to create product',
        })
      )
    }
  }

  const handleToggleSidebar = () => {
    dispatch(toggleSidebar())
  }

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <Title level={2}>Redux Store Example</Title>

      {/* Authentication Section */}
      <Card title='Authentication' style={{ marginBottom: '16px' }}>
        {isAuthenticated ? (
          <Space direction='vertical'>
            <Text>
              Welcome, {currentUser?.firstName} {currentUser?.lastName}!
            </Text>
            <Text type='secondary'>Email: {currentUser?.email}</Text>
            <Button onClick={handleLogout} type='primary' danger>
              Logout
            </Button>
          </Space>
        ) : (
          <Space direction='vertical'>
            <Text>You are not logged in</Text>
            <Button onClick={handleLogin} type='primary'>
              Login (Demo)
            </Button>
          </Space>
        )}
      </Card>

      {/* UI State Section */}
      <Card title='UI State Management' style={{ marginBottom: '16px' }}>
        <Space direction='vertical'>
          <Text>
            Sidebar is currently: {sidebarCollapsed ? 'Collapsed' : 'Expanded'}
          </Text>
          <Button onClick={handleToggleSidebar}>Toggle Sidebar</Button>
        </Space>
      </Card>

      {/* RTK Query Section */}
      <Card title='RTK Query (API Calls)' style={{ marginBottom: '16px' }}>
        <Space direction='vertical' style={{ width: '100%' }}>
          <div>
            <Text strong>Products Data:</Text>
            {(productsLoading as boolean) && <Text> Loading...</Text>}
            {productsError && (
              <Text type='danger'> Error loading products</Text>
            )}
            {productsData && (
              <div>
                <Text> Found {(productsData as { total?: number })?.total || 0} products</Text>
                <ul>
                  {(productsData as { products?: Array<{ id: string; name: string; pricing?: { basePrice?: number } }> })?.products?.slice(0, 3).map((product) => (
                    <li key={product.id}>
                      {product.name} - ${product.pricing?.basePrice || 0}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <Button
            onClick={handleCreateProduct}
            loading={createProductLoading}
            disabled={!isAuthenticated}
          >
            Create Demo Product
          </Button>

          {!isAuthenticated && (
            <Text type='secondary'>Login required to create products</Text>
          )}
        </Space>
      </Card>

      {/* Code Examples */}
      <Card title='Code Examples'>
        <Space direction='vertical' style={{ width: '100%' }}>
          <div>
            <Text strong>Using typed hooks:</Text>
            <pre
              style={{
                background: '#f5f5f5',
                padding: '8px',
                borderRadius: '4px',
              }}
            >
              {`const dispatch = useAppDispatch()
const user = useAppSelector(selectCurrentUser)
const isAuth = useAppSelector(selectIsAuthenticated)`}
            </pre>
          </div>

          <div>
            <Text strong>Async actions:</Text>
            <pre
              style={{
                background: '#f5f5f5',
                padding: '8px',
                borderRadius: '4px',
              }}
            >
              {`const result = await dispatch(loginUser(credentials)).unwrap()
dispatch(addNotification({ type: 'success', ... }))`}
            </pre>
          </div>

          <div>
            <Text strong>RTK Query:</Text>
            <pre
              style={{
                background: '#f5f5f5',
                padding: '8px',
                borderRadius: '4px',
              }}
            >
              {`const { data, isLoading, error } = useGetProductsQuery(params)
const [createProduct] = useCreateProductMutation()`}
            </pre>
          </div>
        </Space>
      </Card>
    </div>
  )
}

export default ReduxExample
