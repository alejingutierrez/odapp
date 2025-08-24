import {
  UserOutlined,
  MailOutlined,
  LockOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
} from '@ant-design/icons'
import { Form, Input, Button, Typography, Space, Divider } from 'antd'
import React from 'react'
import { Link, useNavigate } from 'react-router-dom'

const { Title, Text } = Typography

interface RegisterFormData {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
}

const Register: React.FC = () => {
  const navigate = useNavigate()
  const [form] = Form.useForm()

  const handleSubmit = async (_values: RegisterFormData) => {
    try {
      // TODO: Implement registration API call
      // console.log('Register values:', _values)
      navigate('/auth/login')
    } catch (_error) {
      // console.error('Registration failed:', _error)
    }
  }

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <Title level={3} style={{ margin: 0 }}>
          Create Account
        </Title>
        <Text type='secondary'>Join Oda to manage your fashion business</Text>
      </div>

      <Form
        form={form}
        name='register'
        layout='vertical'
        onFinish={handleSubmit}
        autoComplete='off'
        size='large'
      >
        <Space.Compact style={{ width: '100%' }}>
          <Form.Item
            name='firstName'
            label='First Name'
            rules={[
              { required: true, message: 'Please input your first name!' },
            ]}
            style={{ width: '50%', marginRight: '8px' }}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder='First name'
              autoComplete='given-name'
            />
          </Form.Item>

          <Form.Item
            name='lastName'
            label='Last Name'
            rules={[
              { required: true, message: 'Please input your last name!' },
            ]}
            style={{ width: '50%', marginLeft: '8px' }}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder='Last name'
              autoComplete='family-name'
            />
          </Form.Item>
        </Space.Compact>

        <Form.Item
          name='email'
          label='Email'
          rules={[
            { required: true, message: 'Please input your email!' },
            { type: 'email', message: 'Please enter a valid email!' },
          ]}
        >
          <Input
            prefix={<MailOutlined />}
            placeholder='Enter your email'
            autoComplete='email'
          />
        </Form.Item>

        <Form.Item
          name='password'
          label='Password'
          rules={[
            { required: true, message: 'Please input your password!' },
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
            placeholder='Create a password'
            autoComplete='new-password'
            iconRender={(visible) =>
              visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
            }
          />
        </Form.Item>

        <Form.Item
          name='confirmPassword'
          label='Confirm Password'
          dependencies={['password']}
          rules={[
            { required: true, message: 'Please confirm your password!' },
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
            placeholder='Confirm your password'
            autoComplete='new-password'
            iconRender={(visible) =>
              visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
            }
          />
        </Form.Item>

        <Form.Item>
          <Button type='primary' htmlType='submit' block size='large'>
            Create Account
          </Button>
        </Form.Item>
      </Form>

      <Divider>
        <Text type='secondary'>Already have an account?</Text>
      </Divider>

      <div style={{ textAlign: 'center' }}>
        <Link to='/auth/login'>
          <Text type='secondary' underline>
            Sign in here
          </Text>
        </Link>
      </div>
    </div>
  )
}

export default Register
