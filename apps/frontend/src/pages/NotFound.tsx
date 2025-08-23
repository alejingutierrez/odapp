import { HomeOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { Result, Button } from 'antd'
import React from 'react'
import { useNavigate } from 'react-router-dom'

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        padding: '24px',
      }}
    >
      <Result
        status='404'
        title='404'
        subTitle='Sorry, the page you visited does not exist.'
        extra={[
          <Button
            type='primary'
            key='home'
            icon={<HomeOutlined />}
            onClick={() => navigate('/')}
          >
            Back Home
          </Button>,
          <Button
            key='back'
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
          >
            Go Back
          </Button>,
        ]}
      />
    </div>
  )
}
