import { Button, ButtonProps, Tooltip } from 'antd'
import React from 'react'

export type IconButtonSize = 'small' | 'middle' | 'large'
export type IconButtonVariant =
  | 'primary'
  | 'dashed'
  | 'text'
  | 'link'
  | 'outlined'
  | 'solid'
  | 'filled'

export interface IconButtonProps
  extends Omit<ButtonProps, 'size' | 'type' | 'variant'> {
  icon: React.ReactNode
  tooltip?: string
  size?: IconButtonSize
  variant?: IconButtonVariant
  circular?: boolean
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  tooltip,
  size = 'middle',
  variant = 'outlined',
  circular = false,
  style,
  onClick,
  disabled,
  loading,
  className,
}) => {
  const buttonStyle = {
    ...style,
    ...(circular && {
      borderRadius: '50%',
      aspectRatio: '1',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }),
  }

  const button = (
    <Button
      type={
        variant === 'outlined'
          ? 'default'
          : variant === 'solid'
            ? 'primary'
            : variant === 'filled'
              ? 'primary'
              : (variant as 'default' | 'primary' | 'dashed' | 'text' | 'link')
      }
      size={size}
      icon={icon}
      style={buttonStyle}
      onClick={onClick}
      disabled={disabled}
      loading={loading}
      className={className}
    />
  )

  return tooltip ? <Tooltip title={tooltip}>{button}</Tooltip> : button
}
