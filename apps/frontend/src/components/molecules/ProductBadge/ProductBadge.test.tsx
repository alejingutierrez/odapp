import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { ProductBadge } from './ProductBadge'

describe('ProductBadge', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders product badge with text', () => {
    render(<ProductBadge text="New Arrival" type="new" />)
    
    expect(screen.getByText('New Arrival')).toBeInTheDocument()
  })

  it('applies different badge types', () => {
    const { rerender } = render(<ProductBadge text="Sale" type="sale" />)
    
    expect(document.querySelector('.product-badge')).toBeInTheDocument()
    
    rerender(<ProductBadge text="Featured" type="featured" />)
    expect(document.querySelector('.product-badge')).toBeInTheDocument()
  })

  it('renders badge with tooltip', () => {
    render(<ProductBadge text="Sale" type="sale" tooltip="Special offer" />)
    
    expect(screen.getByText('Sale')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(
      <ProductBadge 
        text="Custom Badge"
        type="new"
        className="custom-product-badge"
      />
    )
    
    expect(document.querySelector('.custom-product-badge')).toBeInTheDocument()
  })

  it('renders with icon', () => {
    render(<ProductBadge text="Hot" type="sale" />)
    
    expect(screen.getByText('Hot')).toBeInTheDocument()
  })

  it('applies different sizes', () => {
    const { rerender } = render(<ProductBadge text="Small" type="new" size="small" />)
    
    expect(document.querySelector('.product-badge--small')).toBeInTheDocument()
    
    rerender(<ProductBadge text="Large" type="new" size="large" />)
    expect(document.querySelector('.product-badge--large')).toBeInTheDocument()
  })

  it('shows discount percentage when provided', () => {
    render(<ProductBadge type="sale" discount={25} />)
    
    expect(screen.getByText('-25%')).toBeInTheDocument()
  })
})
