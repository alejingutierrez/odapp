import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { SizeIndicator } from './SizeIndicator'

describe('SizeIndicator', () => {
  it('renders with size value', () => {
    render(<SizeIndicator size='M' />)
    expect(screen.getByText('M')).toBeInTheDocument()
  })

  it('applies variant classes correctly', () => {
    const { container } = render(<SizeIndicator size='L' variant='compact' />)
    expect(
      container.querySelector('.oda-size-indicator--compact')
    ).toBeInTheDocument()
  })

  it('applies shape classes correctly', () => {
    const { container } = render(<SizeIndicator size='XL' shape='circle' />)
    expect(container.firstChild).toHaveClass('oda-size-indicator--circle')
  })

  it('shows availability status', () => {
    const { container } = render(<SizeIndicator size='S' available={false} />)
    expect(container.firstChild).toHaveClass('oda-size-indicator--unavailable')
  })

  it('handles click events', () => {
    const handleClick = vi.fn()
    render(<SizeIndicator size='M' onClick={handleClick} />)

    fireEvent.click(screen.getByText('M'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('applies selected state', () => {
    const { container } = render(<SizeIndicator size='L' selected />)
    expect(container.firstChild).toHaveClass('oda-size-indicator--selected')
  })

  it('applies custom className', () => {
    const { container } = render(
      <SizeIndicator size='XS' className='custom-class' />
    )
    expect(container.firstChild).toHaveClass('custom-class')
  })
})
