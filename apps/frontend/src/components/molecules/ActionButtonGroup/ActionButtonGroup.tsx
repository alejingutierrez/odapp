import React from 'react'
import { Space, Button, Dropdown, Divider } from 'antd'
import { MoreOutlined } from '@ant-design/icons'
import type { MenuProps } from 'antd'
import './ActionButtonGroup.css'

export interface ActionButton {
  key: string
  label: string
  icon?: React.ReactNode
  onClick: () => void
  disabled?: boolean
  loading?: boolean
  danger?: boolean
  type?: 'primary' | 'default' | 'dashed' | 'link' | 'text'
}

export interface ActionButtonGroupProps {
  actions: ActionButton[]
  maxVisible?: number
  size?: 'small' | 'middle' | 'large'
  direction?: 'horizontal' | 'vertical'
  split?: boolean
  className?: string
  moreMenuPlacement?: 'bottomLeft' | 'bottomRight' | 'topLeft' | 'topRight'
}

export const ActionButtonGroup: React.FC<ActionButtonGroupProps> = ({
  actions,
  maxVisible = 3,
  size = 'middle',
  direction = 'horizontal',
  split = false,
  className = '',
  moreMenuPlacement = 'bottomRight'
}) => {
  if (actions.length === 0) {
    return null
  }

  const visibleActions = actions.slice(0, maxVisible)
  const hiddenActions = actions.slice(maxVisible)

  const renderButton = (action: ActionButton) => (
    <Button
      key={action.key}
      type={action.type || 'default'}
      icon={action.icon}
      onClick={action.onClick}
      disabled={action.disabled}
      loading={action.loading}
      danger={action.danger}
      size={size}
    >
      {action.label}
    </Button>
  )

  const renderMoreMenu = (): MenuProps['items'] => {
    return hiddenActions.map(action => ({
      key: action.key,
      label: action.label,
      icon: action.icon,
      disabled: action.disabled,
      danger: action.danger,
      onClick: action.onClick
    }))
  }

  if (hiddenActions.length === 0) {
    return (
      <Space 
        direction={direction}
        size="small"
        split={split && <Divider type={direction === 'horizontal' ? 'vertical' : 'horizontal'} />}
        className={`action-button-group ${className}`}
      >
        {visibleActions.map(renderButton)}
      </Space>
    )
  }

  return (
    <Space 
      direction={direction}
      size="small"
      split={split && <Divider type={direction === 'horizontal' ? 'vertical' : 'horizontal'} />}
      className={`action-button-group ${className}`}
    >
      {visibleActions.map(renderButton)}
      <Dropdown
        menu={{ items: renderMoreMenu() }}
        placement={moreMenuPlacement}
        trigger={['click']}
      >
        <Button
          icon={<MoreOutlined />}
          size={size}
          className="action-button-group__more"
        />
      </Dropdown>
    </Space>
  )
}

export default ActionButtonGroup