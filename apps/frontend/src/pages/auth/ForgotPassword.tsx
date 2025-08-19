import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Form,
  Input,
  Button,
  Typography,
  Alert,
  Result,
} from 'antd'
import {
  MailOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons'

const { Title, Text } = Typography

interface ForgotPasswordFormData {
  email: string
}

const ForgotPassword: React.FC = () => {
  const [form] = Form.useForm()
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [email, setEmail] = useState('')

  const handleSubmit = async (values: ForgotPasswordFormData) => {
    setIsLoading(true)
    try {
      // TODO: Implement forgot password API call
      console.log('Forgot password values:', values)
      setEmail(values.email)
      setIsSubmitted(true)
    } catch (error) {
      console.error('Forgot password failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <Result
        status="success"
        title="Check Your Email"
        subTitle={
          <div>
            <Text>
              We've sent a password reset link to <strong>{email}</strong>
            </Text>
            <br />
            <Text type="secondary">
              Please check your email and follow the instructions to reset your password.
            </Text>
          </div>
        }
        extra={[
          <Button key="back" icon={<ArrowLeftOutlined />}>
            <Link to="/auth/login">Back to Login</Link>
          </Button>,
          <Button
            key="resend"
            type="primary"
            onClick={() => setIsSubmitted(false)}
          >
            Resend Email
          </Button>,
        ]}
      />
    )
  }

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <Title level={3} style={{ margin: 0 }}>
          Forgot Password
        </Title>
        <Text type="secondary">
          Enter your email to receive a password reset link
        </Text>
      </div>

      <Alert
        message="Password Reset Instructions"
        description="We'll send you an email with instructions on how to reset your password. Make sure to check your spam folder if you don't see it in your inbox."
        type="info"
        showIcon
        style={{ marginBottom: '24px' }}
      />

      <Form
        form={form}
        name="forgotPassword"
        layout="vertical"
        onFinish={handleSubmit}
        autoComplete="off"
        size="large"
      >
        <Form.Item
          name="email"
          label="Email Address"
          rules={[
            { required: true, message: 'Please input your email!' },
            { type: 'email', message: 'Please enter a valid email!' },
          ]}
        >
          <Input
            prefix={<MailOutlined />}
            placeholder="Enter your email address"
            autoComplete="email"
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={isLoading}
            block
            size="large"
          >
            Send Reset Link
          </Button>
        </Form.Item>

        <Form.Item>
          <div style={{ textAlign: 'center' }}>
            <Link to="/auth/login">
              <Button type="link" icon={<ArrowLeftOutlined />}>
                Back to Login
              </Button>
            </Link>
          </div>
        </Form.Item>
      </Form>
    </div>
  )
}

export default ForgotPassword