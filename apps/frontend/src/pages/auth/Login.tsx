import {
  UserOutlined,
  LockOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
} from '@ant-design/icons'
import {
  Form,
  Input,
  Button,
  Checkbox,
  Typography,
  Alert,
  Space,
  Divider,
} from 'antd'
import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate, useLocation } from 'react-router-dom'

import { AppDispatch } from '../../store'
import {
  loginUser,
  selectAuthLoading,
  selectAuthError,
} from '../../store/slices/authSlice'

const { Title, Text } = Typography

interface LoginFormData {
  email: string
  password: string
  rememberMe: boolean
}

const Login: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const location = useLocation()

  const isLoading = useSelector(selectAuthLoading)
  const error = useSelector(selectAuthError)

  const [form] = Form.useForm()

  const from = (location.state as { from?: string })?.from || '/'

  const handleSubmit = async (values: LoginFormData) => {
    try {
      await dispatch(loginUser(values)).unwrap()
      navigate(from, { replace: true })
    } catch (error) {
      // Error is handled by the slice
      console.error('Login failed:', error)
    }
  }

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <Title level={3} style={{ margin: 0 }}>
          Welcome Back
        </Title>
        <Text type='secondary'>Sign in to your Oda account</Text>
      </div>

      {error && (
        <Alert
          message='Login Failed'
          description={error}
          type='error'
          showIcon
          closable
          style={{ marginBottom: '24px' }}
        />
      )}

      <Form
        form={form}
        name='login'
        layout='vertical'
        onFinish={handleSubmit}
        autoComplete='off'
        size='large'
      >
        <Form.Item
          name='email'
          label='Email'
          rules={[
            { required: true, message: 'Please input your email!' },
            { type: 'email', message: 'Please enter a valid email!' },
          ]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder='Enter your email'
            autoComplete='email'
          />
        </Form.Item>

        <Form.Item
          name='password'
          label='Password'
          rules={[
            { required: true, message: 'Please input your password!' },
            { min: 6, message: 'Password must be at least 6 characters!' },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder='Enter your password'
            autoComplete='current-password'
            iconRender={(visible) =>
              visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
            }
          />
        </Form.Item>

        <Form.Item>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Form.Item name='rememberMe' valuePropName='checked' noStyle>
              <Checkbox>Remember me</Checkbox>
            </Form.Item>
            <Link to='/auth/forgot-password'>
              <Text type='secondary'>Forgot password?</Text>
            </Link>
          </div>
        </Form.Item>

        <Form.Item>
          <Button
            type='primary'
            htmlType='submit'
            loading={isLoading}
            block
            size='large'
          >
            Sign In
          </Button>
        </Form.Item>
      </Form>

      <Divider>
        <Text type='secondary'>New to Oda?</Text>
      </Divider>

      <div style={{ textAlign: 'center' }}>
        <Space direction='vertical' size='small'>
          <Text type='secondary'>
            Don't have an account?{' '}
            <Link to='/auth/register'>
              <Text type='secondary' underline>
                Sign up here
              </Text>
            </Link>
          </Text>
        </Space>
      </div>
    </div>
  )
}

export default Login
