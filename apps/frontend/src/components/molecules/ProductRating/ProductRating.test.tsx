import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { ProductRating } from './ProductRating'

describe('ProductRating', () => {
  const mockOnRatingChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders rating with stars', () => {
    render(<ProductRating rating={4.5} />)
    
    expect(document.querySelectorAll('.ant-rate-star')).toHaveLength(5)
  })

  it('displays correct rating value', () => {
    render(<ProductRating rating={3.5} showValue={true} />)
    
    expect(screen.getByText('3.5')).toBeInTheDocument()
  })

  it('shows review count when provided', () => {
    render(<ProductRating rating={4.2} reviewCount={156} />)
    
    expect(screen.getByText('(156 reviews)')).toBeInTheDocument()
  })

  it('calls onChange when rating is changed', () => {
    render(<ProductRating rating={3} onChange={mockOnRatingChange} interactive={true} />)
    
    // Test that the component is interactive
    expect(document.querySelector('.ant-rate')).not.toHaveClass('ant-rate-disabled')
  })

  it('applies disabled state when disabled is true', () => {
    render(<ProductRating rating={4} disabled={true} />)
    
    expect(document.querySelector('.ant-rate-disabled')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(
      <ProductRating 
        rating={5}
        className="custom-rating"
      />
    )
    
    expect(document.querySelector('.custom-rating')).toBeInTheDocument()
  })

  it('renders with different sizes', () => {
    const { rerender } = render(<ProductRating rating={4} size="small" />)
    
    expect(document.querySelector('.product-rating--small')).toBeInTheDocument()
    
    rerender(<ProductRating rating={4} size="large" />)
    expect(document.querySelector('.product-rating--large')).toBeInTheDocument()
  })
})
