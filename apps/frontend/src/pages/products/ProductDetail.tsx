import React from 'react'
import { Typography, Card } from 'antd'

const { Title } = Typography

const ProductDetail: React.FC = () => {
  return (
    <div>
      <Title level={2}>Product Detail</Title>
      <Card>
        <p>Product detail page will be implemented here...</p>
      </Card>
    </div>
  )
}

export default ProductDetail
