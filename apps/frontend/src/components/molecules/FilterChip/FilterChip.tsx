import React from 'react'
import { Tag } from 'antd'
import { CloseOutlined } from '@ant-design/icons'

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
