import { CloseOutlined } from '@ant-design/icons'
import { Tag } from 'antd'
import React from 'react'

export interface FilterChipProps {
  label: string
  onRemove?: () => void
  color?: string
}

export const FilterChip: React.FC<FilterChipProps> = ({
  label,
  onRemove,
  color,
}) => {
  return (
    <Tag
      closable={!!onRemove}
      onClose={onRemove}
      color={color}
      closeIcon={<CloseOutlined />}
    >
      {label}
    </Tag>
  )
}

export default FilterChip
