import { QuestionCircleOutlined } from '@ant-design/icons'
import { Form, Space, Tooltip } from 'antd'
import React from 'react'

import { Label } from '../../atoms'
import './FormField.css'

export interface FormFieldProps {
  label?: string
  required?: boolean
  error?: string
  warning?: string
  help?: string
  tooltip?: string
  children: React.ReactNode
  layout?: 'vertical' | 'horizontal'
  labelCol?: object
  wrapperCol?: object
  className?: string
  validateStatus?: 'success' | 'warning' | 'error' | 'validating'
  hasFeedback?: boolean
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  required = false,
  error,
  warning,
  help,
  tooltip,
  children,

  labelCol,
  wrapperCol,
  className = '',
  validateStatus,
  hasFeedback = false,
}) => {
  const getValidateStatus = () => {
    if (validateStatus) return validateStatus
    if (error) return 'error'
    if (warning) return 'warning'
    return undefined
  }

  const getHelpText = () => {
    if (error) return error
    if (warning) return warning
    if (help) return help
    return undefined
  }

  const renderLabel = () => {
    if (!label) return undefined

    const labelContent = (
      <Space size='small'>
        <Label required={required}>{label}</Label>
        {tooltip && (
          <Tooltip title={tooltip}>
            <QuestionCircleOutlined className='form-field__tooltip-icon' />
          </Tooltip>
        )}
      </Space>
    )

    return labelContent
  }

  return (
    <Form.Item
      label={renderLabel()}
      required={required}
      validateStatus={getValidateStatus()}
      help={getHelpText()}
      hasFeedback={hasFeedback}
      labelCol={labelCol}
      wrapperCol={wrapperCol}
      className={`form-field ${className}`}
    >
      {children}
    </Form.Item>
  )
}

export default FormField
