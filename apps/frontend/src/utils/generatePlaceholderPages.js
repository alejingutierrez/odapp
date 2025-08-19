const fs = require('fs')
const path = require('path')

const pages = [
  // Products
  'products/ProductCreate',
  'products/ProductEdit', 
  'products/Collections',
  'products/Categories',
  
  // Inventory
  'inventory/StockLevels',
  'inventory/Adjustments',
  'inventory/Transfers',
  'inventory/Reports',
  
  // Orders
  'orders/OrderList',
  'orders/OrderDetail',
  'orders/OrderCreate',
  'orders/Returns',
  'orders/Fulfillment',
  
  // Customers
  'customers/CustomerList',
  'customers/CustomerDetail',
  'customers/Segments',
  'customers/Loyalty',
  'customers/Communications',
  
  // Analytics
  'analytics/Sales',
  'analytics/Products',
  'analytics/Customers',
  'analytics/Inventory',
  'analytics/Shopify',
  
  // Billing
  'billing/Invoices',
  'billing/Payments',
  'billing/TaxSettings',
  'billing/Reports',
  
  // Logistics
  'logistics/Shipping',
  'logistics/Carriers',
  'logistics/Tracking',
  'logistics/Returns',
  
  // Shopify
  'shopify/Sync',
  'shopify/Products',
  'shopify/Orders',
  'shopify/Customers',
  'shopify/Settings',
  
  // Settings
  'settings/General',
  'settings/Users',
  'settings/Permissions',
  'settings/Integrations',
  'settings/Notifications',
  'settings/Backup'
]

const template = (componentName, title) => `import React from 'react'
import { Typography, Card } from 'antd'

const { Title } = Typography

const ${componentName}: React.FC = () => {
  return (
    <div>
      <Title level={2}>${title}</Title>
      <Card>
        <p>${title} page will be implemented here...</p>
      </Card>
    </div>
  )
}

export default ${componentName}`

pages.forEach(pagePath => {
  const [folder, fileName] = pagePath.split('/')
  const componentName = fileName
  const title = fileName.replace(/([A-Z])/g, ' $1').trim()
  
  const filePath = path.join(__dirname, '..', 'pages', `${pagePath}.tsx`)
  const dirPath = path.dirname(filePath)
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
  
  // Write file
  fs.writeFileSync(filePath, template(componentName, title))
  console.log(`Created: ${filePath}`)
})

console.log('All placeholder pages created!')