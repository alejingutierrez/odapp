import { Tabs, Badge, Tooltip } from 'antd'
import type { TabsProps } from 'antd'
import React, { useState } from 'react'
import './TabNavigation.css'

// Define los tipos específicos para evitar problemas de importación
type TabsType = 'line' | 'card' | 'editable-card'
type SizeType = 'small' | 'middle' | 'large'
type TabPosition = 'top' | 'bottom' | 'left' | 'right'

export interface TabItem {
  key: string
  label: string
  content?: React.ReactNode
  icon?: React.ReactNode
  badge?: number | string
  disabled?: boolean
  closable?: boolean
  tooltip?: string
}

export interface TabNavigationProps {
  items: TabItem[]
  activeKey?: string
  defaultActiveKey?: string
  onChange?: (activeKey: string) => void
  onEdit?: (
    targetKey: React.MouseEvent | React.KeyboardEvent | string,
    action: 'add' | 'remove'
  ) => void
  type?: TabsType
  size?: SizeType
  position?: TabPosition
  centered?: boolean
  animated?: boolean
  destroyOnHidden?: boolean
  className?: string
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
  items,
  activeKey,
  defaultActiveKey,
  onChange,
  onEdit,
  type = 'line',
  size = 'middle',
  position = 'top',
  centered = false,
  animated = true,
  destroyOnHidden = false,
  className = '',
}) => {
  const [internalActiveKey, setInternalActiveKey] = useState(
    defaultActiveKey || items[0]?.key
  )

  const handleChange = (key: string) => {
    setInternalActiveKey(key)
    onChange?.(key)
  }

  const renderTabLabel = (item: TabItem) => {
    const labelContent = (
      <span className='tab-navigation__label'>
        {item.icon && <span className='tab-navigation__icon'>{item.icon}</span>}
        <span className='tab-navigation__text'>{item.label}</span>
        {item.badge && (
          <Badge
            count={item.badge}
            size='small'
            className='tab-navigation__badge'
          />
        )}
      </span>
    )

    if (item.tooltip) {
      return <Tooltip title={item.tooltip}>{labelContent}</Tooltip>
    }

    return labelContent
  }

  const tabItems: TabsProps['items'] = items.map((item) => ({
    key: item.key,
    label: renderTabLabel(item),
    children: item.content,
    disabled: item.disabled,
    closable: item.closable,
  }))

  return (
    <Tabs
      activeKey={activeKey || internalActiveKey}
      defaultActiveKey={defaultActiveKey}
      onChange={handleChange}
      onEdit={onEdit}
      type={type}
      size={size}
      tabPosition={position}
      centered={centered}
      animated={animated}
      destroyOnHidden={destroyOnHidden}
      items={tabItems}
      className={`tab-navigation ${className}`}
    />
  )
}

export default TabNavigation
