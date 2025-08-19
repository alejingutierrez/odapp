import React from 'react'
import { Card, Space, Image, Tooltip } from 'antd'
import { 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined, 
  HeartOutlined,
  ShoppingCartOutlined 
} from '@ant-design/icons'
import { Typography, Badge, Button } from '../../atoms'
import { StatusIndicator } from '../StatusIndicator'
import { PriceDisplay } from '../PriceDisplay'
import { ActionButtonGroup, type ActionButton } from '../ActionButtonGroup'
import './ProductCard.css'

export interface ProductVariant {
  id: string
  size?: string
  color?: string
  material?: string
  price: number
  compareAtPrice?: number
  sku: string
  inventory: number
}

export interface ProductImage {
  id: string
  url: string
  alt?: string
  position: number
}

export interface Product {
  id: string
  name: string
  description?: string
  images: ProductImage[]
  variants: ProductVariant[]
  status: 'active' | 'draft' | 'archived'
  category?: string
  tags?: string[]
  createdAt: string
  updatedAt: string
}

export interface ProductCardProps {
  product: Product
  onEdit?: (product: Product) => void
  onDelete?: (productId: string) => void
  onView?: (productId: string) => void
  onAddToCart?: (productId: string) => void
  onToggleFavorite?: (productId: string) => void
  showActions?: boolean
  showStatus?: boolean
  showVariantCount?: boolean
  showInventory?: boolean
  compact?: boolean
  className?: string
  loading?: boolean
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onEdit,
  onDelete,
  onView,
  onAddToCart,
  onToggleFavorite,
  showActions = true,
  showStatus = true,
  showVariantCount = true,
  showInventory = false,
  compact = false,
  className = '',
  loading = false
}) => {
  const primaryImage = product.images.find(img => img.position === 0) || product.images[0]
  const basePrice = Math.min(...product.variants.map(v => v.price))
  const compareAtPrice = product.variants.find(v => v.compareAtPrice)?.compareAtPrice
  const totalInventory = product.variants.reduce((sum, v) => sum + v.inventory, 0)

  const actions: ActionButton[] = []

  if (onView) {
    actions.push({
      key: 'view',
      label: 'View',
      icon: <EyeOutlined />,
      onClick: () => onView(product.id)
    })
  }

  if (onEdit) {
    actions.push({
      key: 'edit',
      label: 'Edit',
      icon: <EditOutlined />,
      onClick: () => onEdit(product)
    })
  }

  if (onAddToCart) {
    actions.push({
      key: 'cart',
      label: 'Add to Cart',
      icon: <ShoppingCartOutlined />,
      onClick: () => onAddToCart(product.id),
      type: 'primary'
    })
  }

  if (onToggleFavorite) {
    actions.push({
      key: 'favorite',
      label: 'Favorite',
      icon: <HeartOutlined />,
      onClick: () => onToggleFavorite(product.id)
    })
  }

  if (onDelete) {
    actions.push({
      key: 'delete',
      label: 'Delete',
      icon: <DeleteOutlined />,
      onClick: () => onDelete(product.id),
      danger: true
    })
  }

  const cardActions = showActions && actions.length > 0 ? [
    <ActionButtonGroup 
      key="actions"
      actions={actions}
      maxVisible={compact ? 2 : 3}
      size="small"
    />
  ] : undefined

  return (
    <Card
      loading={loading}
      hoverable
      className={`product-card ${compact ? 'product-card--compact' : ''} ${className}`}
      cover={
        <div className="product-card__image-container">
          <Image
            src={primaryImage?.url}
            alt={primaryImage?.alt || product.name}
            fallback="/placeholder-product.png"
            preview={false}
            className="product-card__image"
          />
          {showStatus && (
            <div className="product-card__status-overlay">
              <StatusIndicator 
                status={product.status === 'active' ? 'success' : 'default'}
                text={product.status}
                size="small"
              />
            </div>
          )}
        </div>
      }
      actions={cardActions}
    >
      <Card.Meta
        title={
          <Tooltip title={product.name}>
            <Typography.Title 
              level={5} 
              ellipsis={{ rows: 2 }}
              className="product-card__title"
            >
              {product.name}
            </Typography.Title>
          </Tooltip>
        }
        description={
          <div className="product-card__details">
            <PriceDisplay
              price={basePrice}
              compareAtPrice={compareAtPrice}
              size="small"
            />
            
            <Space size="small" className="product-card__meta">
              {showVariantCount && product.variants.length > 1 && (
                <Badge 
                  count={product.variants.length} 
                  showZero={false}
                  size="small"
                  title={`${product.variants.length} variants`}
                />
              )}
              
              {showInventory && (
                <Typography.Text 
                  type={totalInventory > 0 ? 'success' : 'danger'}
                  className="product-card__inventory"
                >
                  {totalInventory > 0 ? `${totalInventory} in stock` : 'Out of stock'}
                </Typography.Text>
              )}
            </Space>

            {product.category && (
              <Typography.Text 
                type="secondary" 
                className="product-card__category"
              >
                {product.category}
              </Typography.Text>
            )}
          </div>
        }
      />
    </Card>
  )
}

export default ProductCard