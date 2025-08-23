import {
  LockOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
  CheckCircleOutlined,
} from '@ant-design/icons'
import { Form, Input, Button, Typography, Alert, Result } from 'antd'
import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

const { Title, Text } = Typography

interface ResetPasswordFormData {
  password: string
  confirmPassword: string
}

const ResetPassword: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [form] = Form.useForm()
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const token = searchParams.get('token')

  // Redirect if no token
  if (!token) {
    return (
      <Result
        status='error'
        title='Invalid Reset Link'
        subTitle='The password reset link is invalid or has expired. Please request a new one.'
        extra={[
          <Button key='forgot' type='primary'>
            <Link to='/auth/forgot-password'>Request New Link</Link>
          </Button>,
          <Button key='login'>
            <Link to='/auth/login'>Back to Login</Link>
          </Button>,
        ]}
      />
    )
  }

  const handleSubmit = async (values: ResetPasswordFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      // TODO: Implement reset password API call
      console.log('Reset password values:', { ...values, token })
      setIsSuccess(true)
    } catch (error: unknown) {
      setError((error as Error)?.message || 'Failed to reset password. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <Result
        icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
        title='Password Reset Successful'
        subTitle='Your password has been successfully reset. You can now sign in with your new password.'
        extra={[
          <Button
            key='login'
            type='primary'
            onClick={() => navigate('/auth/login')}
          >
            Sign In Now
          </Button>,
        ]}
      />
    )
  }

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <Title level={3} style={{ margin: 0 }}>
          Reset Password
        </Title>
        <Text type='secondary'>Enter your new password below</Text>
      </div>

      {error && (
        <Alert
          message='Reset Failed'
          description={error}
          type='error'
          showIcon
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: '24px' }}
        />
      )}

      <Form
        form={form}
        name='resetPassword'
        layout='vertical'
        onFinish={handleSubmit}
        autoComplete='off'
        size='large'
      >
        <Form.Item
          name='password'
          label='New Password'
          rules={[
            { required: true, message: 'Please input your new password!' },
            { min: 8, message: 'Password must be at least 8 characters!' },
            {
              pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
              message:
                'Password must contain at least one uppercase letter, one lowercase letter, and one number!',
            },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder='Enter your new password'
            autoComplete='new-password'
            iconRender={(visible) =>
              visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
            }
          />
        </Form.Item>

        <Form.Item
          name='confirmPassword'
          label='Confirm New Password'
          dependencies={['password']}
          rules={[
            { required: true, message: 'Please confirm your new password!' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve()
                }
                return Promise.reject(new Error('Passwords do not match!'))
              },
            }),
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder='Confirm your new password'
            autoComplete='new-password'
            iconRender={(visible) =>
              visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
            }
          />
        </Form.Item>

        <Form.Item>
          <Button
            type='primary'
            htmlType='submit'
            loading={isLoading}
            block
            size='large'
          >
            Reset Password
          </Button>
        </Form.Item>

        <Form.Item>
          <div style={{ textAlign: 'center' }}>
            <Link to='/auth/login'>
              <Text type='secondary' underline>
                Back to Login
              </Text>
            </Link>
          </div>
        </Form.Item>
      </Form>
    </div>
  )
}

export default ResetPassword
