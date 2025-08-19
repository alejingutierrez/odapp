import React from 'react'
import { Tooltip as AntTooltip, TooltipProps as AntTooltipProps } from 'antd'
import { designTokens } from '../../../config/theme'
import './Tooltip.css'

export interface TooltipProps extends Omit<AntTooltipProps, 'placement'> {
  /** Content to display in tooltip */
  content: React.ReactNode
  /** Positioning of tooltip */
  placement?: 
    | 'top' | 'topLeft' | 'topRight'
    | 'bottom' | 'bottomLeft' | 'bottomRight'
    | 'left' | 'leftTop' | 'leftBottom'
    | 'right' | 'rightTop' | 'rightBottom'
  /** Delay before showing tooltip (ms) */
  showDelay?: number
  /** Delay before hiding tooltip (ms) */
  hideDelay?: number
  /** Whether tooltip supports rich content (HTML) */
  richContent?: boolean
  /** Maximum width of tooltip */
  maxWidth?: number
  /** Tooltip variant for different contexts */
  variant?: 'default' | 'info' | 'warning' | 'error' | 'success'
  /** Whether to show arrow */
  arrow?: boolean
  /** Custom trigger element */
  children: React.ReactElement
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  placement = 'top',
  showDelay = 100,
  hideDelay = 100,
  richContent = false,
  maxWidth = 300,
  variant = 'default',
  arrow = true,
  children,
  className = '',
  ...props
}) => {
  const tooltipClasses = [
    'oda-tooltip',
    `oda-tooltip--${variant}`,
    richContent && 'oda-tooltip--rich',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const tooltipStyle = {
    maxWidth: `${maxWidth}px`,
    ...props.overlayStyle,
  }

  return (
    <AntTooltip
      title={content}
      placement={placement}
      mouseEnterDelay={showDelay / 1000}
      mouseLeaveDelay={hideDelay / 1000}
      arrow={arrow}
      classNames={{ root: tooltipClasses }}
      styles={{ root: tooltipStyle }}
      {...props}
    >
      {children}
    </AntTooltip>
  )
}

Tooltip.displayName = 'Tooltip'