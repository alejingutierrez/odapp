import React from 'react'
import { Typography, Card } from 'antd'

const { Title } = Typography

const General: React.FC = () => {
  return (
    <div>
      <Title level={2}>General Settings</Title>
      <Card>
        <p>General Settings page will be implemented here...</p>
      </Card>
    </div>
  )
}

export default General