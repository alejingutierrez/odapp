import React from 'react';
import { Empty, Button, EmptyProps } from 'antd';

export type EmptyStateSize = 'small' | 'default';

export interface EmptyStateProps extends Omit<EmptyProps, 'children'> {
  title?: string;
  description?: React.ReactNode;
  actionText?: string;
  onAction?: () => void;
  actionIcon?: React.ReactNode;
  actionType?: 'primary' | 'default' | 'dashed';
  size?: EmptyStateSize;
  showImage?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No data',
  description,
  actionText,
  onAction,
  actionIcon,
  actionType = 'primary',
  size = 'default',
  showImage = true,
  icon,
  children,
  image,
  ...props
}) => {
  const getImageSize = () => {
    return size === 'small' ? 60 : 100;
  };

  const renderAction = () => {
    if (actionText && onAction) {
      return (
        <Button
          type={actionType}
          icon={actionIcon}
          onClick={onAction}
          size={size === 'small' ? 'small' : 'middle'}
        >
          {actionText}
        </Button>
      );
    }
    return children;
  };

  return (
    <Empty
      image={showImage ? (icon || image || Empty.PRESENTED_IMAGE_DEFAULT) : false}
      styles={{
        image: {
          height: showImage ? getImageSize() : 0,
          marginBottom: showImage ? (size === 'small' ? 8 : 16) : 0,
        },
      }}
      description={
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            fontSize: size === 'small' ? 14 : 16, 
            fontWeight: 500,
            marginBottom: description ? 4 : 0,
          }}>
            {title}
          </div>
          {description && (
            <div style={{ 
              fontSize: size === 'small' ? 12 : 14,
              color: '#666',
            }}>
              {description}
            </div>
          )}
        </div>
      }
      {...props}
    >
      {renderAction()}
    </Empty>
  );
};