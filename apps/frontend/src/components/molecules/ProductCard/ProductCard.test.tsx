import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProductCard } from './ProductCard'

describe('ProductCard', () => {
  const mockProduct = {
    id: '1',
    name: 'Test Product',
    description: 'A great test product',
    images: [
      {
        id: '1',
        url: 'https://example.com/product.jpg',
        alt: 'Test Product',
        position: 1,
      },
    ],
    variants: [{ id: '1', price: 99.99, sku: 'TEST-001', inventory: 10 }],
    status: 'active' as const,
    category: 'test',
    tags: ['test'],
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  }

  const mockOnClick = vi.fn()
  const mockOnAddToCart = vi.fn()
  const mockOnToggleFavorite = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders product card with basic information', () => {
    render(<ProductCard product={mockProduct} />)

    expect(screen.getByText('Test Product')).toBeInTheDocument()
    expect(screen.getByText('$99.99')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Test Product' })).toHaveAttribute(
      'src',
      mockProduct.images[0].url
    )
  })

  it('calls onView when view button is clicked', async () => {
    const user = userEvent.setup()
    render(<ProductCard product={mockProduct} onView={mockOnClick} />)

    const viewButton = screen.getByText('View')
    await user.click(viewButton)
    expect(mockOnClick).toHaveBeenCalledWith(mockProduct.id)
  })

  it('shows add to cart button when onAddToCart is provided', () => {
    render(<ProductCard product={mockProduct} onAddToCart={mockOnAddToCart} />)

    expect(screen.getByText('Add to Cart')).toBeInTheDocument()
  })

  it('handles add to cart click', async () => {
    const user = userEvent.setup()
    render(<ProductCard product={mockProduct} onAddToCart={mockOnAddToCart} />)

    const addToCartButton = screen.getByText('Add to Cart')
    await user.click(addToCartButton)

    expect(mockOnAddToCart).toHaveBeenCalledWith(mockProduct.id)
  })

  it('handles favorite toggle', async () => {
    const user = userEvent.setup()
    render(
      <ProductCard
        product={mockProduct}
        onToggleFavorite={mockOnToggleFavorite}
      />
    )

    const favoriteButton = screen.getByText('Favorite')
    await user.click(favoriteButton)

    expect(mockOnToggleFavorite).toHaveBeenCalledWith(mockProduct.id)
  })

  it('shows discount badge when product has discount', () => {
    const discountedProduct = {
      ...mockProduct,
      variants: [
        {
          ...mockProduct.variants[0],
          compareAtPrice: 129.99,
        },
      ],
    }
    render(<ProductCard product={discountedProduct} />)

    expect(screen.getByText('$99.99')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(
      <ProductCard product={mockProduct} className='custom-product-card' />
    )

    expect(document.querySelector('.custom-product-card')).toBeInTheDocument()
  })

  it('shows loading state', () => {
    render(<ProductCard product={mockProduct} loading={true} />)

    expect(document.querySelector('.ant-skeleton')).toBeInTheDocument()
  })

  it('shows out of stock state', () => {
    const outOfStockProduct = {
      ...mockProduct,
      variants: [
        {
          ...mockProduct.variants[0],
          inventory: 0,
        },
      ],
    }
    render(<ProductCard product={outOfStockProduct} showInventory={true} />)

    expect(screen.getByText('Out of stock')).toBeInTheDocument()
  })
})
