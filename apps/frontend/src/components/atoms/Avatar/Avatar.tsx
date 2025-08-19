import React from 'react';
import { Avatar as AntAvatar, AvatarProps as AntAvatarProps, Badge } from 'antd';
import { UserOutlined } from '@ant-design/icons';

export type AvatarSize = 'small' | 'default' | 'large' | number;
export type AvatarShape = 'circle' | 'square';

export interface AvatarProps extends Omit<AntAvatarProps, 'size' | 'shape'> {
  name?: string;
  src?: string;
  size?: AvatarSize;
  shape?: AvatarShape;
  showBadge?: boolean;
  badgeCount?: number;
  badgeColor?: string;
  status?: 'online' | 'offline' | 'away' | 'busy';
  fallbackIcon?: React.ReactNode;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  src,
  size = 'default',
  shape = 'circle',
  showBadge = false,
  badgeCount,
  badgeColor,
  status,
  fallbackIcon = <UserOutlined />,
  children,
  ...props
}) => {
  const getInitials = (fullName: string): string => {
    return fullName
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = () => {
    switch (status) {
      case 'online':
        return '#52c41a';
      case 'away':
        return '#faad14';
      case 'busy':
        return '#f5222d';
      case 'offline':
      default:
        return '#d9d9d9';
    }
  };

  const renderAvatar = () => (
    <AntAvatar
      size={size}
      shape={shape}
      src={src}
      icon={!src && !name && !children ? fallbackIcon : undefined}
      {...props}
    >
      {!src && (name ? getInitials(name) : children)}
    </AntAvatar>
  );

  if (showBadge || status) {
    return (
      <Badge
        count={badgeCount}
        color={badgeColor}
        dot={status ? true : !badgeCount}
        status={status ? undefined : 'default'}
        style={{
          backgroundColor: status ? getStatusColor() : badgeColor,
        }}
      >
        {renderAvatar()}
      </Badge>
    );
  }

  return renderAvatar();
};