import { FilterOutlined, ClearOutlined, DownOutlined } from '@ant-design/icons'
import { Collapse, Button, Space, Typography, Divider, Badge } from 'antd'
import React, { useState } from 'react'
import './FilterPanel.css'

export interface FilterSection {
  key: string
  title: string
  content: React.ReactNode
  badge?: number
  collapsible?: boolean
  defaultExpanded?: boolean
}

export interface FilterPanelProps {
  sections: FilterSection[]
  title?: string
  showClearAll?: boolean
  showApplyButton?: boolean
  activeFiltersCount?: number
  onClearAll?: () => void
  onApply?: () => void
  collapsible?: boolean
  defaultExpanded?: boolean
  className?: string
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  sections,
  title = 'Filters',
  showClearAll = true,
  showApplyButton = false,
  activeFiltersCount = 0,
  onClearAll,
  onApply,
  collapsible = true,
  defaultExpanded = true,
  className = '',
}) => {
  const [expandedKeys, setExpandedKeys] = useState<string[]>(
    sections
      .filter((section) => section.defaultExpanded !== false)
      .map((section) => section.key)
  )

  const handleCollapseChange = (keys: string | string[]) => {
    setExpandedKeys(Array.isArray(keys) ? keys : [keys])
  }

  const renderHeader = () => (
    <div className='filter-panel__header'>
      <Space size='small'>
        <FilterOutlined className='filter-panel__icon' />
        <Typography.Title level={5} className='filter-panel__title'>
          {title}
        </Typography.Title>
        {activeFiltersCount > 0 && (
          <Badge
            count={activeFiltersCount}
            size='small'
            className='filter-panel__badge'
          />
        )}
      </Space>

      {showClearAll && activeFiltersCount > 0 && (
        <Button
          type='text'
          size='small'
          icon={<ClearOutlined />}
          onClick={onClearAll}
          className='filter-panel__clear'
        >
          Clear All
        </Button>
      )}
    </div>
  )

  const renderSectionHeader = (section: FilterSection) => (
    <Space size='small' className='filter-panel__section-header'>
      <Typography.Text strong>{section.title}</Typography.Text>
      {section.badge && section.badge > 0 && (
        <Badge count={section.badge} size='small' />
      )}
    </Space>
  )

  const collapseItems = sections.map((section) => ({
    key: section.key,
    label: renderSectionHeader(section),
    children: (
      <div className='filter-panel__section-content'>{section.content}</div>
    ),
    collapsible:
      section.collapsible === false ? ('disabled' as const) : undefined,
  }))

  const panelContent = (
    <div className='filter-panel__content'>
      <Collapse
        items={collapseItems}
        activeKey={expandedKeys}
        onChange={handleCollapseChange}
        ghost
        expandIcon={({ isActive }) => (
          <DownOutlined rotate={isActive ? 180 : 0} />
        )}
        className='filter-panel__collapse'
      />

      {showApplyButton && (
        <>
          <Divider className='filter-panel__divider' />
          <div className='filter-panel__actions'>
            <Button
              type='primary'
              block
              onClick={onApply}
              disabled={activeFiltersCount === 0}
            >
              Apply Filters ({activeFiltersCount})
            </Button>
          </div>
        </>
      )}
    </div>
  )

  if (collapsible) {
    return (
      <div className={`filter-panel ${className}`}>
        <Collapse
          items={[
            {
              key: 'main',
              label: renderHeader(),
              children: panelContent,
            },
          ]}
          defaultActiveKey={defaultExpanded ? ['main'] : []}
          ghost
          className='filter-panel__main-collapse'
        />
      </div>
    )
  }

  return (
    <div className={`filter-panel ${className}`}>
      {renderHeader()}
      <Divider className='filter-panel__header-divider' />
      {panelContent}
    </div>
  )
}

export default FilterPanel
