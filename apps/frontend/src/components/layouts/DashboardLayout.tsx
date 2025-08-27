import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  UserOutlined,
  SettingOutlined,
  BellOutlined,
  LogoutOutlined,
  SunOutlined,
  MoonOutlined,
  GlobalOutlined,
} from '@ant-design/icons'
import {
  Layout,
  Menu,
  Button,
  Avatar,
  Dropdown,
  Badge,
  Switch,
  Drawer,
  Grid,
  theme as antdTheme,
} from 'antd'
import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'

import { useAccessibility } from '../../hooks/useAccessibility'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { usePerformanceMonitoring } from '../../hooks/usePerformanceMonitoring'
import { useRouteAnalytics } from '../../hooks/useRouteAnalytics'
import { useWebSocket } from '../../hooks/useWebSocket'
import { AppDispatch } from '../../store'
import { selectCurrentUser, logoutUser } from '../../store/slices/authSlice'
import {
  selectSidebarCollapsed,
  selectTheme,
  selectUnreadNotificationCount,
  toggleSidebar,
  setSidebarCollapsed,
  setTheme,
} from '../../store/slices/uiSlice'
import { Breadcrumbs } from '../common/Breadcrumbs'
import { NotificationCenter } from '../common/NotificationCenter'
import { ThemeProvider } from '../common/ThemeProvider'

const { Header, Sider, Content } = Layout
const { useBreakpoint } = Grid

// Simplified menu items configuration - only essential navigation
const menuItems = [
  {
    key: '/',
    icon: <DashboardOutlined />,
    label: 'Dashboard',
  },
]

export const DashboardLayout: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const location = useLocation()
  const screens = useBreakpoint()
  const { token } = antdTheme.useToken()

  // Redux state
  const collapsed = useSelector(selectSidebarCollapsed)
  const currentTheme = useSelector(selectTheme)
  const unreadCount = useSelector(selectUnreadNotificationCount)
  const currentUser = useSelector(selectCurrentUser)

  // Local state
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState(false)

  // Responsive behavior
  const isMobile = !screens.md

  // Hooks for enhanced functionality
  const { announceToScreenReader } = useAccessibility()
  const { trackEvent } = useRouteAnalytics()
  const { trackUserTiming } = usePerformanceMonitoring()
  useDocumentTitle()

  // WebSocket for real-time updates
  useWebSocket()

  // Auto-collapse sidebar on mobile
  useEffect(() => {
    if (isMobile && !collapsed) {
      dispatch(setSidebarCollapsed(true))
    }
  }, [isMobile, collapsed, dispatch])

  // Get selected menu keys based on current path
  const getSelectedKeys = () => {
    const path = location.pathname
    return [path]
  }

  // Get open menu keys based on current path
  const getOpenKeys = () => {
    const path = location.pathname
    const segments = path.split('/').filter(Boolean)

    if (segments.length > 1) {
      return [`/${segments[0]}`]
    }

    return []
  }

  // Handle menu click
  const handleMenuClick = ({ key }: { key: string }) => {
    const startTime = performance.now()

    navigate(key)

    // Track navigation analytics
    trackEvent('navigation', { destination: key, source: 'sidebar' })

    // Track performance
    trackUserTiming('navigation', startTime)

    // Announce navigation to screen readers
    const pageName = key.split('/').pop() || 'page'
    announceToScreenReader(`Navigating to ${pageName}`)

    // Close mobile drawer after navigation
    if (isMobile) {
      setMobileDrawerOpen(false)
    }
  }

  // Handle logout
  const handleLogout = () => {
    dispatch(logoutUser())
  }

  // Handle theme toggle
  const handleThemeToggle = (checked: boolean) => {
    dispatch(setTheme(checked ? 'dark' : 'light'))
  }

  // User dropdown menu
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
      onClick: () => {
        // TODO: Implement profile page
      },
    },
    {
      key: 'preferences',
      icon: <SettingOutlined />,
      label: 'Preferences',
      onClick: () => {
        // TODO: Implement preferences page
      },
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'theme',
      icon: currentTheme === 'dark' ? <SunOutlined /> : <MoonOutlined />,
      label: (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>Dark Mode</span>
          <Switch
            size='small'
            checked={currentTheme === 'dark'}
            onChange={handleThemeToggle}
          />
        </div>
      ),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: handleLogout,
    },
  ]

  // Sidebar content
  const sidebarContent = (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo */}
      <div
        style={{
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
          padding: collapsed && !isMobile ? '0' : '0 24px',
          borderBottom: `1px solid ${token.colorBorder}`,
        }}
      >
        {collapsed && !isMobile ? (
          <div
            style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: token.colorPrimary,
            }}
          >
            O
          </div>
        ) : (
          <div
            style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: token.colorPrimary,
            }}
          >
            Oda
          </div>
        )}
      </div>

      {/* Menu */}
      <Menu
        id='navigation'
        mode='inline'
        theme={currentTheme === 'dark' ? 'dark' : 'light'}
        selectedKeys={getSelectedKeys()}
        defaultOpenKeys={getOpenKeys()}
        items={menuItems}
        onClick={handleMenuClick}
        style={{ flex: 1, borderRight: 0 }}
        role='navigation'
        aria-label='Main navigation menu'
      />
    </div>
  )

  return (
    <ThemeProvider>
      {/* Skip Links for Accessibility */}
      <div className='skip-links'>
        <a
          href='#main-content'
          className='skip-link'
          style={{
            position: 'absolute',
            top: '-40px',
            left: '6px',
            background: token.colorPrimary,
            color: 'white',
            padding: '8px',
            textDecoration: 'none',
            zIndex: 1000,
            borderRadius: '4px',
          }}
          onFocus={(e) => {
            e.target.style.top = '6px'
          }}
          onBlur={(e) => {
            e.target.style.top = '-40px'
          }}
        >
          Skip to main content
        </a>
        <a
          href='#navigation'
          className='skip-link'
          style={{
            position: 'absolute',
            top: '-40px',
            left: '150px',
            background: token.colorPrimary,
            color: 'white',
            padding: '8px',
            textDecoration: 'none',
            zIndex: 1000,
            borderRadius: '4px',
          }}
          onFocus={(e) => {
            e.target.style.top = '6px'
          }}
          onBlur={(e) => {
            e.target.style.top = '-40px'
          }}
        >
          Skip to navigation
        </a>
      </div>

      <Layout style={{ minHeight: '100vh' }}>
        {/* Desktop Sidebar */}
        {!isMobile && (
          <Sider
            trigger={null}
            collapsible
            collapsed={collapsed}
            width={256}
            collapsedWidth={80}
            style={{
              background:
                currentTheme === 'dark' ? token.colorBgContainer : '#fff',
            }}
            role='navigation'
            aria-label='Main navigation'
          >
            {sidebarContent}
          </Sider>
        )}

        {/* Mobile Drawer */}
        {isMobile && (
          <Drawer
            title='Navigation'
            placement='left'
            onClose={() => setMobileDrawerOpen(false)}
            open={mobileDrawerOpen}
            bodyStyle={{ padding: 0 }}
            width={256}
          >
            {sidebarContent}
          </Drawer>
        )}

        <Layout>
          {/* Header */}
          <Header
            style={{
              padding: '0 16px',
              background: token.colorBgContainer,
              borderBottom: `1px solid ${token.colorBorder}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {/* Sidebar toggle */}
              <Button
                type='text'
                icon={
                  isMobile ? (
                    <MenuUnfoldOutlined />
                  ) : collapsed ? (
                    <MenuUnfoldOutlined />
                  ) : (
                    <MenuFoldOutlined />
                  )
                }
                onClick={() => {
                  if (isMobile) {
                    setMobileDrawerOpen(true)
                  } else {
                    dispatch(toggleSidebar())
                  }
                }}
                style={{ fontSize: '16px' }}
              />

              {/* Breadcrumbs */}
              <Breadcrumbs />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {/* Notifications */}
              <Badge count={unreadCount} size='small'>
                <Button
                  type='text'
                  icon={<BellOutlined />}
                  onClick={() => setNotificationDrawerOpen(true)}
                  style={{ fontSize: '16px' }}
                />
              </Badge>

              {/* Language selector */}
              <Button
                type='text'
                icon={<GlobalOutlined />}
                style={{ fontSize: '16px' }}
              />

              {/* User menu */}
              <Dropdown
                menu={{ items: userMenuItems }}
                placement='bottomRight'
                trigger={['click']}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    gap: '8px',
                  }}
                >
                  <Avatar
                    src={currentUser?.avatar}
                    icon={<UserOutlined />}
                    size='small'
                  />
                  {!isMobile && (
                    <span style={{ fontSize: '14px' }}>
                      {currentUser?.firstName} {currentUser?.lastName}
                    </span>
                  )}
                </div>
              </Dropdown>
            </div>
          </Header>

          {/* Content */}
          <Content
            id='main-content'
            role='main'
            aria-label='Main content'
            tabIndex={-1}
            style={{
              margin: '16px',
              padding: '24px',
              background: token.colorBgContainer,
              borderRadius: token.borderRadius,
              minHeight: 'calc(100vh - 112px)',
            }}
          >
            <Outlet />
          </Content>
        </Layout>

        {/* Notification Drawer */}
        <NotificationCenter
          open={notificationDrawerOpen}
          onClose={() => setNotificationDrawerOpen(false)}
        />
      </Layout>
    </ThemeProvider>
  )
}
