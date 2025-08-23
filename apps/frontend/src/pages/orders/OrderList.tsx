import { Typography, Card } from 'antd'
import React from 'react'

const { Title } = Typography

const OrderList: React.FC = () => {
  return (
    <div>
      <Title level={2}>Orders</Title>
      <Card>
        <p>Order List page will be implemented here...</p>
      </Card>
    </div>
  )
}

export default OrderList
