import {
  ShoppingOutlined,
  InboxOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons'
import { Row, Col, Card, Statistic, Typography, Space } from 'antd'
import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux'

import { AppDispatch } from '../store'
import { setPageTitle, setBreadcrumbs } from '../store/slices/uiSlice'

const { Title } = Typography

const Dashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()

  useEffect(() => {
    dispatch(setPageTitle('Dashboard'))
    dispatch(setBreadcrumbs([{ label: 'Dashboard' }]))
  }, [dispatch])

  return (
    <div>
      <Title level={2}>Dashboard</Title>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title='Total Products'
              value={1128}
              prefix={<ShoppingOutlined />}
              valueStyle={{ color: '#3f8600' }}
              suffix={
                <Space>
                  <ArrowUpOutlined />
                  <span style={{ fontSize: '12px' }}>12%</span>
                </Space>
              }
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title='Low Stock Items'
              value={23}
              prefix={<InboxOutlined />}
              valueStyle={{ color: '#cf1322' }}
              suffix={
                <Space>
                  <ArrowUpOutlined />
                  <span style={{ fontSize: '12px' }}>5%</span>
                </Space>
              }
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title='Pending Orders'
              value={45}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: '#1890ff' }}
              suffix={
                <Space>
                  <ArrowDownOutlined />
                  <span style={{ fontSize: '12px' }}>3%</span>
                </Space>
              }
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title='Active Customers'
              value={892}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#722ed1' }}
              suffix={
                <Space>
                  <ArrowUpOutlined />
                  <span style={{ fontSize: '12px' }}>8%</span>
                </Space>
              }
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
        <Col xs={24} lg={12}>
          <Card title='Recent Activity' size='small'>
            <p>Recent activity content will go here...</p>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title='Quick Actions' size='small'>
            <p>Quick action buttons will go here...</p>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard
