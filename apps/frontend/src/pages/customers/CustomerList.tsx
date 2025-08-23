import React from 'react'
import { Typography, Card } from 'antd'

const { Title } = Typography

const CustomerList: React.FC = () => {
  return (
    <div>
      <Title level={2}>Customers</Title>
      <Card>
        <p>Customer List page will be implemented here...</p>
      </Card>
    </div>
  )
}

export default CustomerList
