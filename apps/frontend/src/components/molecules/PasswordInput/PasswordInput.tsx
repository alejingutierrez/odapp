import React, { useState, useMemo } from 'react'
import { Input, Progress, Typography, Space, Tooltip } from 'antd'
import { EyeInvisibleOutlined, EyeTwoTone, InfoCircleOutlined } from '@ant-design/icons'
import './PasswordInput.css'

export interface PasswordStrengthConfig {
  minLength: number
  requireUppercase: boolean
  requireLowercase: boolean
  requireNumbers: boolean
  requireSpecialChars: boolean
}

export interface PasswordInputProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  showStrengthIndicator?: boolean
  strengthConfig?: Partial<PasswordStrengthConfig>
  showRequirements?: boolean
  disabled?: boolean
  size?: 'small' | 'middle' | 'large'
  className?: string
}

const defaultStrengthConfig: PasswordStrengthConfig = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  value = '',
  onChange,
  placeholder = 'Enter password',
  showStrengthIndicator = true,
  strengthConfig = {},
  showRequirements = true,
  disabled = false,
  size = 'middle',
  className = ''
}) => {
  const [visible, setVisible] = useState(false)
  const config = { ...defaultStrengthConfig, ...strengthConfig }

  const passwordStrength = useMemo(() => {
    if (!value) return { score: 0, level: 'weak', checks: {} }

    const checks = {
      length: value.length >= config.minLength,
      uppercase: config.requireUppercase ? /[A-Z]/.test(value) : true,
      lowercase: config.requireLowercase ? /[a-z]/.test(value) : true,
      numbers: config.requireNumbers ? /\d/.test(value) : true,
      specialChars: config.requireSpecialChars ? /[!@#$%^&*(),.?":{}|<>]/.test(value) : true
    }

    const passedChecks = Object.values(checks).filter(Boolean).length
    const totalChecks = Object.values(checks).length
    const score = (passedChecks / totalChecks) * 100

    let level: 'weak' | 'fair' | 'good' | 'strong'
    if (score < 40) level = 'weak'
    else if (score < 60) level = 'fair'
    else if (score < 80) level = 'good'
    else level = 'strong'

    return { score, level, checks }
  }, [value, config])

  const getStrengthColor = () => {
    switch (passwordStrength.level) {
      case 'weak':
        return '#ff4d4f'
      case 'fair':
        return '#faad14'
      case 'good':
        return '#52c41a'
      case 'strong':
        return '#1890ff'
      default:
        return '#d9d9d9'
    }
  }

  const getStrengthText = () => {
    switch (passwordStrength.level) {
      case 'weak':
        return 'Weak'
      case 'fair':
        return 'Fair'
      case 'good':
        return 'Good'
      case 'strong':
        return 'Strong'
      default:
        return ''
    }
  }

  const renderRequirements = () => {
    if (!showRequirements || !value) return null

    const requirements = [
      {
        key: 'length',
        text: `At least ${config.minLength} characters`,
        met: passwordStrength.checks.length
      },
      {
        key: 'uppercase',
        text: 'One uppercase letter',
        met: passwordStrength.checks.uppercase,
        show: config.requireUppercase
      },
      {
        key: 'lowercase',
        text: 'One lowercase letter',
        met: passwordStrength.checks.lowercase,
        show: config.requireLowercase
      },
      {
        key: 'numbers',
        text: 'One number',
        met: passwordStrength.checks.numbers,
        show: config.requireNumbers
      },
      {
        key: 'specialChars',
        text: 'One special character',
        met: passwordStrength.checks.specialChars,
        show: config.requireSpecialChars
      }
    ].filter(req => req.show !== false)

    return (
      <div className="password-input__requirements">
        <Typography.Text type="secondary" className="password-input__requirements-title">
          Password requirements:
        </Typography.Text>
        <ul className="password-input__requirements-list">
          {requirements.map(req => (
            <li
              key={req.key}
              className={`password-input__requirement ${req.met ? 'password-input__requirement--met' : ''}`}
            >
              {req.text}
            </li>
          ))}
        </ul>
      </div>
    )
  }

  const renderStrengthIndicator = () => {
    if (!showStrengthIndicator || !value) return null

    return (
      <div className="password-input__strength">
        <Space size="small" align="center">
          <Typography.Text type="secondary" className="password-input__strength-label">
            Strength:
          </Typography.Text>
          <Progress
            percent={passwordStrength.score}
            strokeColor={getStrengthColor()}
            showInfo={false}
            size="small"
            className="password-input__strength-bar"
          />
          <Typography.Text
            className="password-input__strength-text"
            style={{ color: getStrengthColor() }}
          >
            {getStrengthText()}
          </Typography.Text>
          <Tooltip title="Password strength is calculated based on length, character variety, and complexity">
            <InfoCircleOutlined className="password-input__strength-info" />
          </Tooltip>
        </Space>
      </div>
    )
  }

  return (
    <div className={`password-input ${className}`}>
      <Input.Password
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        size={size}
        visibilityToggle={{
          visible,
          onVisibleChange: setVisible
        }}
        iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
        className="password-input__field"
      />
      
      {renderStrengthIndicator()}
      {renderRequirements()}
    </div>
  )
}

export default PasswordInput