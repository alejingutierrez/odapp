import React from 'react'
import { Badge, Tooltip } from 'antd'
import { DownOutlined, RightOutlined } from '@ant-design/icons'
import './SidebarMenuItem.css'

export interface SidebarMenuItemData {
  key: string
  label: string
  icon?: React.ReactNode
  badge?: number | string
  tooltip?: string
  disabled?: boolean
  danger?: boolean
  children?: SidebarMenuItemData[]
  onClick?: () => void
}

export interface SidebarMenuItemProps {
  item: SidebarMenuItemData
  level?: number
  collapsed?: boolean
  selectedKeys?: string[]
  openKeys?: string[]
  onSelect?: (key: string) => void
  onOpenChange?: (openKeys: string[]) => void
  className?: string
}

export const SidebarMenuItem: React.FC<SidebarMenuItemProps> = ({
  item,
  level = 0,
  collapsed = false,
  selectedKeys = [],
  openKeys = [],
  onSelect,
  onOpenChange,
  className = '',
}) => {
  const hasChildren = item.children && item.children.length > 0
  const isSelected = selectedKeys.includes(item.key)
  const isOpen = openKeys.includes(item.key)

  const handleClick = () => {
    if (item.disabled) return

    if (hasChildren) {
      const newOpenKeys = isOpen
        ? openKeys.filter((key) => key !== item.key)
        : [...openKeys, item.key]
      onOpenChange?.(newOpenKeys)
    } else {
      onSelect?.(item.key)
      item.onClick?.()
    }
  }

  const renderIcon = () => {
    if (!item.icon) return null

    return <span className='sidebar-menu-item__icon'>{item.icon}</span>
  }

  const renderBadge = () => {
    if (!item.badge || collapsed) return null

    return (
      <Badge
        count={item.badge}
        size='small'
        className='sidebar-menu-item__badge'
      />
    )
  }

  const renderExpandIcon = () => {
    if (!hasChildren || collapsed) return null

    const IconComponent = isOpen ? DownOutlined : RightOutlined

    return <IconComponent className='sidebar-menu-item__expand-icon' />
  }

  const renderLabel = () => {
    if (collapsed) return null

    return <span className='sidebar-menu-item__label'>{item.label}</span>
  }

  const renderContent = () => (
    <div
      className={`
        sidebar-menu-item__content
        ${isSelected ? 'sidebar-menu-item__content--selected' : ''}
        ${item.disabled ? 'sidebar-menu-item__content--disabled' : ''}
        ${item.danger ? 'sidebar-menu-item__content--danger' : ''}
      `}
      onClick={handleClick}
    >
      <div className='sidebar-menu-item__main'>
        {renderIcon()}
        {renderLabel()}
      </div>

      <div className='sidebar-menu-item__actions'>
        {renderBadge()}
        {renderExpandIcon()}
      </div>
    </div>
  )

  const renderChildren = () => {
    if (!hasChildren || !isOpen || collapsed) return null

    return (
      <div className='sidebar-menu-item__children'>
        {item.children!.map((child) => (
          <SidebarMenuItem
            key={child.key}
            item={child}
            level={level + 1}
            collapsed={collapsed}
            selectedKeys={selectedKeys}
            openKeys={openKeys}
            onSelect={onSelect}
            onOpenChange={onOpenChange}
          />
        ))}
      </div>
    )
  }

  const menuItem = (
    <div
      className={`
        sidebar-menu-item 
        sidebar-menu-item--level-${level}
        ${collapsed ? 'sidebar-menu-item--collapsed' : ''}
        ${className}
      `}
    >
      {renderContent()}
      {renderChildren()}
    </div>
  )

  if (collapsed && item.tooltip) {
    return (
      <Tooltip
        title={item.tooltip || item.label}
        placement='right'
        mouseEnterDelay={0.5}
      >
        {menuItem}
      </Tooltip>
    )
  }

  return menuItem
}

export default SidebarMenuItem
