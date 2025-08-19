import React, { useMemo } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { Breadcrumb } from 'antd'
import { HomeOutlined } from '@ant-design/icons'

// Route configuration for breadcrumbs
const routeConfig: Record<string, { label: string; icon?: React.ReactNode }> = {
  '/': { label: 'Dashboard', icon: <HomeOutlined /> },
  '/products': { label: 'Products' },
  '/products/create': { label: 'Create Product' },
  '/products/collections': { label: 'Collections' },
  '/products/categories': { label: 'Categories' },
  '/inventory': { label: 'Inventory' },
  '/inventory/adjustments': { label: 'Adjustments' },
  '/inventory/transfers': { label: 'Transfers' },
  '/inventory/reports': { label: 'Reports' },
  '/orders': { label: 'Orders' },
  '/orders/create': { label: 'Create Order' },
  '/orders/returns': { label: 'Returns' },
  '/orders/fulfillment': { label: 'Fulfillment' },
  '/customers': { label: 'Customers' },
  '/customers/segments': { label: 'Segments' },
  '/customers/loyalty': { label: 'Loyalty Program' },
  '/customers/communications': { label: 'Communications' },
  '/analytics': { label: 'Analytics' },
  '/analytics/sales': { label: 'Sales Analytics' },
  '/analytics/products': { label: 'Product Analytics' },
  '/analytics/customers': { label: 'Customer Analytics' },
  '/analytics/inventory': { label: 'Inventory Analytics' },
  '/analytics/shopify': { label: 'Shopify Analytics' },
  '/billing': { label: 'Billing' },
  '/billing/payments': { label: 'Payments' },
  '/billing/tax-settings': { label: 'Tax Settings' },
  '/billing/reports': { label: 'Reports' },
  '/logistics': { label: 'Logistics' },
  '/logistics/carriers': { label: 'Carriers' },
  '/logistics/tracking': { label: 'Tracking' },
  '/logistics/returns': { label: 'Returns' },
  '/shopify': { label: 'Shopify' },
  '/shopify/products': { label: 'Products' },
  '/shopify/orders': { label: 'Orders' },
  '/shopify/customers': { label: 'Customers' },
  '/shopify/settings': { label: 'Settings' },
  '/settings': { label: 'Settings' },
  '/settings/users': { label: 'Users' },
  '/settings/permissions': { label: 'Permissions' },
  '/settings/integrations': { label: 'Integrations' },
  '/settings/notifications': { label: 'Notifications' },
  '/settings/backup': { label: 'Backup' },
}

// Function to generate breadcrumb items from path
const generateBreadcrumbs = (pathname: string) => {
  const pathSegments = pathname.split('/').filter(Boolean)
  const breadcrumbs = []

  // Always include home
  breadcrumbs.push({
    title: (
      <Link to="/">
        <HomeOutlined style={{ marginRight: '4px' }} />
        Dashboard
      </Link>
    ),
  })

  // Build breadcrumbs for each segment
  let currentPath = ''
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`
    const config = routeConfig[currentPath]
    
    if (config) {
      const isLast = index === pathSegments.length - 1
      
      breadcrumbs.push({
        title: isLast ? (
          <span>
            {config.icon && <span style={{ marginRight: '4px' }}>{config.icon}</span>}
            {config.label}
          </span>
        ) : (
          <Link to={currentPath}>
            {config.icon && <span style={{ marginRight: '4px' }}>{config.icon}</span>}
            {config.label}
          </Link>
        ),
      })
    } else {
      // Handle dynamic routes (e.g., /products/:id)
      const isLast = index === pathSegments.length - 1
      const label = segment.charAt(0).toUpperCase() + segment.slice(1)
      
      breadcrumbs.push({
        title: isLast ? (
          <span>{label}</span>
        ) : (
          <Link to={currentPath}>{label}</Link>
        ),
      })
    }
  })

  return breadcrumbs
}

export const Breadcrumbs: React.FC = () => {
  const location = useLocation()

  const breadcrumbItems = useMemo(() => {
    return generateBreadcrumbs(location.pathname)
  }, [location.pathname])

  // Don't show breadcrumbs on home page
  if (location.pathname === '/') {
    return null
  }

  return (
    <Breadcrumb
      items={breadcrumbItems}
      style={{ fontSize: '14px' }}
    />
  )
}