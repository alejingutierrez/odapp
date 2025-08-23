import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  ExclamationOutlined,
  MinusOutlined,
} from '@ant-design/icons'
import { Tag, TagProps } from 'antd'
import React from 'react'

export type PriorityType = 'low' | 'medium' | 'high' | 'urgent'

export interface PriorityTagProps extends Omit<TagProps, 'color'> {
  priority: PriorityType
  text?: string
  showIcon?: boolean
}

const priorityConfig = {
  low: { color: 'green', icon: ArrowDownOutlined },
  medium: { color: 'blue', icon: MinusOutlined },
  high: { color: 'orange', icon: ArrowUpOutlined },
  urgent: { color: 'red', icon: ExclamationOutlined },
} as const

export const PriorityTag: React.FC<PriorityTagProps> = ({
  priority,
  text,
  showIcon = true,
  children,
  ...props
}) => {
  const config = priorityConfig[priority]
  const IconComponent = config.icon

  return (
    <Tag color={config.color} {...props}>
      {showIcon && <IconComponent style={{ marginRight: 4 }} />}
      {text || children || priority.charAt(0).toUpperCase() + priority.slice(1)}
    </Tag>
  )
}
