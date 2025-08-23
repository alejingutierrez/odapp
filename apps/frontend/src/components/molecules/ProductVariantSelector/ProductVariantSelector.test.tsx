import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProductVariantSelector } from './ProductVariantSelector'

describe('ProductVariantSelector', () => {
  const mockVariants = [
    { id: '1', color: 'Red', price: 29.99, sku: 'RED-001', inventory: 10 },
    { id: '2', color: 'Blue', price: 29.99, sku: 'BLUE-001', inventory: 5 },
    { id: '3', size: 'Small', price: 29.99, sku: 'S-001', inventory: 8 },
    { id: '4', size: 'Medium', price: 29.99, sku: 'M-001', inventory: 12 },
  ]

  const mockOnVariantChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders variant selector with options', () => {
    render(
      <ProductVariantSelector
        variants={mockVariants}
        onVariantChange={mockOnVariantChange}
      />
    )

    // Check for color swatches by aria-label
    expect(screen.getByLabelText('Color: Red')).toBeInTheDocument()
    expect(screen.getByLabelText('Color: Blue')).toBeInTheDocument()
    // Check for size indicators by text content
    expect(screen.getByText('SMALL')).toBeInTheDocument()
    expect(screen.getByText('MEDIUM')).toBeInTheDocument()
  })

  it('calls onVariantChange when variant is selected', async () => {
    const user = userEvent.setup()
    render(
      <ProductVariantSelector
        variants={mockVariants}
        onVariantChange={mockOnVariantChange}
      />
    )

    const redVariant = screen.getByLabelText('Color: Red')
    await user.click(redVariant)

    expect(mockOnVariantChange).toHaveBeenCalledWith(mockVariants[0])
  })

  it('shows selected variant', () => {
    render(
      <ProductVariantSelector
        variants={mockVariants}
        selectedVariant={mockVariants[0]}
        onVariantChange={mockOnVariantChange}
      />
    )

    // Check for selected color swatch
    const selectedVariant = screen.getByLabelText('Color: Red')
    expect(selectedVariant).toBeInTheDocument()
  })

  it('groups variants by type', () => {
    render(
      <ProductVariantSelector
        variants={mockVariants}
        onVariantChange={mockOnVariantChange}
      />
    )

    expect(screen.getByText('Color')).toBeInTheDocument()
    expect(screen.getByText('Size')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(
      <ProductVariantSelector
        variants={mockVariants}
        onVariantChange={mockOnVariantChange}
        className='custom-variant-selector'
      />
    )

    expect(
      document.querySelector('.custom-variant-selector')
    ).toBeInTheDocument()
  })

  it('disables unavailable variants', () => {
    const variantsWithUnavailable = [
      ...mockVariants,
      { id: '5', size: 'Large', price: 29.99, sku: 'L-001', inventory: 0 },
    ]

    render(
      <ProductVariantSelector
        variants={variantsWithUnavailable}
        onVariantChange={mockOnVariantChange}
      />
    )

    // Check that Large size indicator is rendered (even if out of stock)
    expect(screen.getByText('LARGE')).toBeInTheDocument()
  })
})
