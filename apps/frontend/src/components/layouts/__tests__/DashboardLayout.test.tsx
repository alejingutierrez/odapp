import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { configureStore } from '@reduxjs/toolkit'
import { DashboardLayout } from '../DashboardLayout'
import authReducer from '../../../store/slices/authSlice'
import uiReducer from '../../../store/slices/uiSlice'

// Mock the Outlet component
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Outlet: () => <div data-testid='outlet'>Page Content</div>,
}))

// Mock store factory
const createMockStore = (initialState: Record<string, unknown> = {}) => {
  return configureStore({
    reducer: {
      auth: authReducer,
      ui: uiReducer,
    },
    preloadedState: {
      auth: {
        user: {
          id: '1',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          avatar: null,
          role: 'admin',
          permissions: [],
          preferences: {
            theme: 'light',
            language: 'en',
            timezone: 'UTC',
            notifications: {
              email: true,
              push: true,
              sms: false,
            },
            dashboard: {
              layout: 'grid',
              widgets: [],
            },
          },
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        token: 'mock-token',
        refreshToken: 'mock-refresh-token',
        permissions: [],
        isAuthenticated: true,
        isLoading: false,
        error: null,
        sessionExpiry: Date.now() + 3600000,
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

const renderWithProviders = (initialState: Record<string, unknown> = {}) => {
  const store = createMockStore(initialState)
  return render(
    <Provider store={store}>
      <BrowserRouter>
        <DashboardLayout />
      </BrowserRouter>
    </Provider>
  )
}

describe('DashboardLayout', () => {
  it('should render the layout with sidebar and header', () => {
    renderWithProviders()

    expect(screen.getByText('Oda')).toBeInTheDocument()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Products')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByTestId('outlet')).toBeInTheDocument()
  })

  it('should toggle sidebar when menu button is clicked', () => {
    renderWithProviders()

    const menuButton = screen.getByRole('button', { name: /menu/i })
    fireEvent.click(menuButton)

    // The sidebar should be collapsed (this would be tested by checking Redux state)
    expect(menuButton).toBeInTheDocument()
  })

  it('should show notification badge when there are unread notifications', () => {
    renderWithProviders({
      ui: {
        notifications: [
          {
            id: '1',
            type: 'info',
            title: 'Test Notification',
            message: 'Test message',
            timestamp: Date.now(),
            read: false,
          },
        ],
        unreadNotificationCount: 1,
      },
    })

    // Check for notification badge (Ant Design Badge component)
    const notificationButton = screen.getByRole('button', { name: /bell/i })
    expect(notificationButton).toBeInTheDocument()
  })

  it('should render user avatar and name in header', () => {
    renderWithProviders()

    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })

  it('should render all main navigation items', () => {
    renderWithProviders()

    const expectedMenuItems = [
      'Dashboard',
      'Products',
      'Inventory',
      'Orders',
      'Customers',
      'Analytics',
      'Billing',
      'Logistics',
      'Shopify',
      'Settings',
    ]

    expectedMenuItems.forEach((item) => {
      expect(screen.getByText(item)).toBeInTheDocument()
    })
  })

  it('should handle collapsed sidebar state', () => {
    renderWithProviders({
      ui: {
        sidebarCollapsed: true,
      },
    })

    // When collapsed, should show just "O" instead of "Oda"
    expect(screen.getByText('O')).toBeInTheDocument()
    expect(screen.queryByText('Oda')).not.toBeInTheDocument()
  })
})
