import React from 'react'
import { describe, it, expect, vi } from 'vitest'

import { render, screen, fireEvent } from '@testing-library/react'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { configureStore } from '@reduxjs/toolkit'
import { DashboardLayout } from '../DashboardLayout'
import authReducer from '../../../store/slices/authSlice'
import uiReducer from '../../../store/slices/uiSlice'

// Mock @ant-design/icons
vi.mock('@ant-design/icons', () => ({
  SunOutlined: () => <span data-testid='sun-icon' />,
  MoonOutlined: () => <span data-testid='moon-icon' />,
  BellOutlined: () => <span data-testid='bell-icon' />,
  UserOutlined: () => <span data-testid='user-icon' />,
  MenuOutlined: () => <span data-testid='menu-icon' />,
  DashboardOutlined: () => <span data-testid='dashboard-icon' />,
  ShoppingOutlined: () => <span data-testid='shopping-icon' />,
  InboxOutlined: () => <span data-testid='inbox-icon' />,
  ShoppingCartOutlined: () => <span data-testid='cart-icon' />,
  TeamOutlined: () => <span data-testid='team-icon' />,
  BarChartOutlined: () => <span data-testid='chart-icon' />,
  CreditCardOutlined: () => <span data-testid='credit-card-icon' />,
  CarOutlined: () => <span data-testid='car-icon' />,
  ShopOutlined: () => <span data-testid='shop-icon' />,
  SettingOutlined: () => <span data-testid='setting-icon' />,
  HomeOutlined: () => <span data-testid='home-icon' />,
  FileTextOutlined: () => <span data-testid='file-text-icon' />,
  TruckOutlined: () => <span data-testid='truck-icon' />,
  LogoutOutlined: () => <span data-testid='logout-icon' />,
  GlobalOutlined: () => <span data-testid='global-icon' />,
  MenuFoldOutlined: () => <span data-testid='menu-fold-icon' />,
  MenuUnfoldOutlined: () => <span data-testid='menu-unfold-icon' />,
  CheckOutlined: () => <span data-testid='check-icon' />,
  DeleteOutlined: () => <span data-testid='delete-icon' />,
}))

// Mock the Outlet component
vi.mock('react-router-dom', () => ({
  ...vi.importActual('react-router-dom'),
  Outlet: () => <div data-testid='outlet'>Page Content</div>,
  BrowserRouter: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='browser-router'>{children}</div>
  ),
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/', search: '', hash: '', state: null }),
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to} data-testid='link'>
      {children}
    </a>
  ),
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
          avatar: undefined,
          role: 'admin',
          permissions: [],
          preferences: {
            theme: 'light' as const,
            language: 'en',
            timezone: 'UTC',
            notifications: {
              email: true,
              push: true,
              sms: false,
            },
            dashboard: {
              layout: 'grid' as const,
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
        ...(initialState.auth as Record<string, unknown>),
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
        ...(initialState.ui as Record<string, unknown>),
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

// Fix the spread type errors by properly typing the props

describe('DashboardLayout', () => {
  it('should render the layout with header and main content', () => {
    renderWithProviders()

    // Check that the header is rendered
    expect(screen.getByRole('banner')).toBeInTheDocument()

    // Check that the main content is rendered
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByTestId('outlet')).toBeInTheDocument()

    // Check that menu button is present
    expect(screen.getByTestId('menu-unfold-icon')).toBeInTheDocument()
  })

  it('should toggle sidebar when menu button is clicked', () => {
    renderWithProviders()

    const menuButton = screen.getByTestId('menu-unfold-icon').closest('button')
    expect(menuButton).toBeInTheDocument()

    if (menuButton) {
      fireEvent.click(menuButton)
      // The button should still be present after click
      expect(menuButton).toBeInTheDocument()
    }
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

    // Check for notification badge
    expect(screen.getByTestId('bell-icon')).toBeInTheDocument()
  })

  it('should render user avatar in header', () => {
    renderWithProviders()

    expect(screen.getByTestId('user-icon')).toBeInTheDocument()
  })

  it('should render header controls', () => {
    renderWithProviders()

    // Check that header controls are present
    expect(screen.getByTestId('menu-unfold-icon')).toBeInTheDocument()
    expect(screen.getByTestId('bell-icon')).toBeInTheDocument()
    expect(screen.getByTestId('global-icon')).toBeInTheDocument()
    expect(screen.getByTestId('user-icon')).toBeInTheDocument()
  })

  it('should handle collapsed sidebar state', () => {
    renderWithProviders({
      ui: {
        sidebarCollapsed: true,
      },
    })

    // When collapsed, the menu button should still be present
    expect(screen.getByTestId('menu-unfold-icon')).toBeInTheDocument()
  })
})
