import React from 'react'
import { Collapse, CollapseProps } from 'antd'
import { CaretRightOutlined } from '@ant-design/icons'
import './Accordion.css'

const { Panel } = Collapse

export interface AccordionItem {
  key: string
  title: React.ReactNode
  content: React.ReactNode
  disabled?: boolean
  icon?: React.ReactNode
  extra?: React.ReactNode
}

interface PanelProps {
  isActive?: boolean
}

export interface AccordionProps extends Omit<CollapseProps, 'children' | 'items'> {
  /** Accordion items */
  items: AccordionItem[]
  /** Whether to allow multiple panels open */
  multiple?: boolean
  /** Whether to show expand/collapse icons */
  showArrow?: boolean
  /** Custom expand icon */
  expandIcon?: (panelProps: PanelProps) => React.ReactNode
  /** Accordion variant */
  variant?: 'default' | 'bordered' | 'ghost' | 'filled'
  /** Accordion size */
  size?: 'small' | 'middle' | 'large'
  /** Whether to animate panel transitions */
  animated?: boolean
  /** Custom header renderer */
  headerRender?: (item: AccordionItem, expanded: boolean) => React.ReactNode
}

export const Accordion: React.FC<AccordionProps> = ({
  items = [],
  multiple = false,
  showArrow = true,
  expandIcon,
  variant = 'default',
  size = 'medium',
  headerRender,
  className = '',
  ...props
}) => {
  const accordionClasses = [
    'oda-accordion',
    `oda-accordion--${variant}`,
    `oda-accordion--${size}`,
    !showArrow && 'oda-accordion--no-arrow',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const defaultExpandIcon = (panelProps: PanelProps) => (
    <CaretRightOutlined
      className={`oda-accordion__expand-icon ${
        panelProps.isActive ? 'oda-accordion__expand-icon--active' : ''
      }`}
      rotate={panelProps.isActive ? 90 : 0}
    />
  )

  const renderHeader = (item: AccordionItem, expanded: boolean) => {
    if (headerRender) {
      return headerRender(item, expanded)
    }

    return (
      <div className='oda-accordion__header'>
        {item.icon && (
          <span className='oda-accordion__header-icon'>{item.icon}</span>
        )}
        <span className='oda-accordion__header-title'>{item.title}</span>
        {item.extra && (
          <span className='oda-accordion__header-extra'>{item.extra}</span>
        )}
      </div>
    )
  }

  return (
    <Collapse
      className={accordionClasses}
      accordion={!multiple}
      expandIcon={showArrow ? expandIcon || defaultExpandIcon : undefined}
      ghost={variant === 'ghost'}
      bordered={variant === 'bordered'}
      size={size === 'large' ? 'large' : size === 'small' ? 'small' : 'middle'}
      {...props}
    >
      {items.map((item) => (
        <Panel
          key={item.key}
          header={renderHeader(item, false)}
          disabled={item.disabled}
          className='oda-accordion__panel'
        >
          <div className='oda-accordion__content'>{item.content}</div>
        </Panel>
      ))}
    </Collapse>
  )
}

Accordion.displayName = 'Accordion'
