import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { RatingInput } from './RatingInput'

describe('RatingInput', () => {
  it('renders with default props', () => {
    const { container } = render(<RatingInput />)
    expect(container.querySelector('.oda-rating-input')).toBeInTheDocument()
  })

  it('displays correct number of stars', () => {
    const { container } = render(<RatingInput max={10} />)
    expect(container.querySelectorAll('.ant-rate-star')).toHaveLength(10)
  })

  it('handles value changes', () => {
    const mockOnChange = vi.fn()
    render(<RatingInput onChange={mockOnChange} />)

    const stars = screen.getAllByRole('radio')
    fireEvent.click(stars[2])
    expect(mockOnChange).toHaveBeenCalledWith(3)
  })

  it('applies disabled state', () => {
    const { container } = render(<RatingInput disabled />)
    expect(
      container.querySelector('.oda-rating-input--disabled')
    ).toBeInTheDocument()
  })

  it('allows half stars', () => {
    render(<RatingInput allowHalf value={3.5} />)
    const { container } = render(<RatingInput allowHalf />)
    expect(container.querySelector('.ant-rate')).toBeInTheDocument()
  })

  it('shows tooltips when provided', () => {
    const tooltips = ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent']
    render(<RatingInput tooltips={tooltips} />)

    const stars = screen.getAllByRole('radio')
    fireEvent.mouseEnter(stars[0])
    expect(screen.getByText('Poor')).toBeInTheDocument()
  })

  it('applies custom character', () => {
    const { container } = render(<RatingInput character='♥' />)
    expect(container.textContent).toContain('♥')
  })
})
