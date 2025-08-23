import {
  DownOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'
import { Collapse, Typography, Space, Badge } from 'antd'
import React, { useState } from 'react'
import './FormSection.css'

export interface ValidationSummary {
  errors: number
  warnings: number
  valid: boolean
}

export interface FormSectionProps {
  title: string
  description?: string
  children: React.ReactNode
  collapsible?: boolean
  defaultExpanded?: boolean
  required?: boolean
  validation?: ValidationSummary
  showValidationSummary?: boolean
  disabled?: boolean
  className?: string
}

export const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  children,
  collapsible = true,
  defaultExpanded = true,
  required = false,
  validation,
  showValidationSummary = true,
  disabled = false,
  className = '',
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded)

  const getValidationStatus = () => {
    if (!validation) return null

    if (validation.errors > 0) return 'error'
    if (validation.warnings > 0) return 'warning'
    if (validation.valid) return 'success'
    return null
  }

  const getValidationIcon = () => {
    const status = getValidationStatus()

    switch (status) {
      case 'error':
        return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
      case 'warning':
        return <ExclamationCircleOutlined style={{ color: '#faad14' }} />
      case 'success':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />
      default:
        return null
    }
  }

  const renderValidationSummary = () => {
    if (!showValidationSummary || !validation) return null

    const { errors, warnings } = validation
    const hasIssues = errors > 0 || warnings > 0

    if (!hasIssues) return null

    return (
      <div className='form-section__validation-summary'>
        <Space size='small'>
          {errors > 0 && (
            <Badge
              count={errors}
              size='small'
              style={{ backgroundColor: '#ff4d4f' }}
            />
          )}
          {warnings > 0 && (
            <Badge
              count={warnings}
              size='small'
              style={{ backgroundColor: '#faad14' }}
            />
          )}
          <Typography.Text
            type='secondary'
            className='form-section__validation-text'
          >
            {errors > 0 && `${errors} error${errors !== 1 ? 's' : ''}`}
            {errors > 0 && warnings > 0 && ', '}
            {warnings > 0 && `${warnings} warning${warnings !== 1 ? 's' : ''}`}
          </Typography.Text>
        </Space>
      </div>
    )
  }

  const renderHeader = () => (
    <div className='form-section__header'>
      <div className='form-section__title-section'>
        <Space size='small' align='center'>
          <Typography.Title
            level={5}
            className={`form-section__title ${required ? 'form-section__title--required' : ''}`}
          >
            {title}
            {required && (
              <span className='form-section__required-indicator'>*</span>
            )}
          </Typography.Title>
          {getValidationIcon()}
        </Space>

        {description && (
          <Typography.Text
            type='secondary'
            className='form-section__description'
          >
            {description}
          </Typography.Text>
        )}
      </div>

      {renderValidationSummary()}
    </div>
  )

  const renderContent = () => (
    <div
      className={`form-section__content ${disabled ? 'form-section__content--disabled' : ''}`}
    >
      {children}
    </div>
  )

  if (!collapsible) {
    return (
      <div className={`form-section form-section--static ${className}`}>
        {renderHeader()}
        {renderContent()}
      </div>
    )
  }

  const collapseItems = [
    {
      key: 'content',
      label: renderHeader(),
      children: renderContent(),
      showArrow: true,
    },
  ]

  return (
    <div className={`form-section form-section--collapsible ${className}`}>
      <Collapse
        items={collapseItems}
        activeKey={expanded ? ['content'] : []}
        onChange={(keys) => setExpanded(keys.includes('content'))}
        expandIcon={({ isActive }) => (
          <DownOutlined
            rotate={isActive ? 180 : 0}
            className='form-section__expand-icon'
          />
        )}
        ghost
        className='form-section__collapse'
      />
    </div>
  )
}

export default FormSection
