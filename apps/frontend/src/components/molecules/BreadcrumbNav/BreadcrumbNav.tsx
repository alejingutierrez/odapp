import React from 'react'
import { Breadcrumb, Dropdown } from 'antd'
import { HomeOutlined, MoreOutlined } from '@ant-design/icons'
import type { MenuProps } from 'antd'
import './BreadcrumbNav.css'

export interface BreadcrumbItem {
  key: string
  title: string
  href?: string
  icon?: React.ReactNode
  onClick?: () => void
  disabled?: boolean
}

export interface BreadcrumbNavProps {
  items: BreadcrumbItem[]
  maxItems?: number
  showHome?: boolean
  homeHref?: string
  onHomeClick?: () => void
  separator?: React.ReactNode
  className?: string
}

export const BreadcrumbNav: React.FC<BreadcrumbNavProps> = ({
  items,
  maxItems = 5,
  showHome = true,
  homeHref = '/',
  onHomeClick,
  separator,
  className = '',
}) => {
  const processedItems = [...items]

  // Add home item if requested
  if (showHome) {
    const homeItem: BreadcrumbItem = {
      key: 'home',
      title: 'Home',
      icon: <HomeOutlined />,
      href: homeHref,
      onClick: onHomeClick,
    }
    processedItems.unshift(homeItem)
  }

  // Handle overflow with dropdown
  const shouldCollapse = processedItems.length > maxItems
  let displayItems = processedItems

  if (shouldCollapse) {
    const firstItem = processedItems[0]
    const lastItems = processedItems.slice(-2) // Always show last 2 items
    // const hiddenItems = processedItems.slice(1, -2) // Items to hide in dropdown

    // Dropdown menu for hidden items (unused but kept for future implementation)
    // const dropdownMenu: MenuProps['items'] = hiddenItems.map(item => ({
    //   key: item.key,
    //   label: item.title,
    //   icon: item.icon,
    //   disabled: item.disabled,
    //   onClick: item.onClick
    // }))

    const ellipsisItem: BreadcrumbItem = {
      key: 'ellipsis',
      title: '...',
      onClick: () => {}, // Handled by dropdown
    }

    displayItems = [firstItem, ellipsisItem, ...lastItems]
  }

  const renderBreadcrumbItem = (item: BreadcrumbItem) => {
    const isEllipsis = item.key === 'ellipsis'

    if (isEllipsis && shouldCollapse) {
      const hiddenItems = processedItems.slice(1, -2)
      const dropdownMenu: MenuProps['items'] = hiddenItems.map(
        (hiddenItem) => ({
          key: hiddenItem.key,
          label: hiddenItem.title,
          icon: hiddenItem.icon,
          disabled: hiddenItem.disabled,
          onClick: hiddenItem.onClick,
        })
      )

      return {
        key: item.key,
        title: (
          <Dropdown menu={{ items: dropdownMenu }} placement='bottomLeft'>
            <span className='breadcrumb-nav__ellipsis'>
              <MoreOutlined />
            </span>
          </Dropdown>
        ),
      }
    }

    const content = (
      <span className='breadcrumb-nav__item'>
        {item.icon && <span className='breadcrumb-nav__icon'>{item.icon}</span>}
        <span className='breadcrumb-nav__title'>{item.title}</span>
      </span>
    )

    return {
      key: item.key,
      title: item.href ? (
        <a
          href={item.href}
          onClick={(e) => {
            if (item.onClick) {
              e.preventDefault()
              item.onClick()
            }
          }}
          className={item.disabled ? 'breadcrumb-nav__link--disabled' : ''}
        >
          {content}
        </a>
      ) : (
        <span
          onClick={item.onClick}
          className={`breadcrumb-nav__text ${item.onClick ? 'breadcrumb-nav__text--clickable' : ''} ${item.disabled ? 'breadcrumb-nav__text--disabled' : ''}`}
        >
          {content}
        </span>
      ),
    }
  }

  const breadcrumbItems = displayItems.map(renderBreadcrumbItem)

  return (
    <Breadcrumb
      separator={separator}
      items={breadcrumbItems}
      className={`breadcrumb-nav ${className}`}
    />
  )
}

export default BreadcrumbNav
