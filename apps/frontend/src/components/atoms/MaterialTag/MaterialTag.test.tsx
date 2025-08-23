import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import { MaterialTag } from './MaterialTag'

describe('MaterialTag', () => {
  it('renders with material name', () => {
    render(<MaterialTag material='Cotton' />)
    expect(screen.getByText('Cotton')).toBeInTheDocument()
  })

  it('applies variant classes correctly', () => {
    const { container } = render(
      <MaterialTag material='Cotton' variant='detailed' />
    )
    expect(container.firstChild).toHaveClass('oda-material-tag--detailed')
  })

  it('applies size classes correctly', () => {
    const { container } = render(<MaterialTag material='Cotton' size='large' />)
    expect(container.firstChild).toHaveClass('oda-material-tag--large')
  })

  it('handles click events', () => {
    const handleClick = vi.fn()
    render(<MaterialTag material='Cotton' onClick={handleClick} />)

    fireEvent.click(screen.getByText('Cotton'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('shows close button when removable', () => {
    const handleRemove = vi.fn()
    const { container } = render(
      <MaterialTag material='Cotton' removable onRemove={handleRemove} />
    )

    const closeButton = container.querySelector('.anticon-close')
    expect(closeButton).toBeInTheDocument()
  })

  it('renders with certification', () => {
    render(<MaterialTag material='Cotton' certification='organic' />)
    expect(screen.getByText('Cotton')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <MaterialTag material='Cotton' className='custom-class' />
    )
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('shows percentage when provided', () => {
    render(<MaterialTag material='Cotton' percentage={80} />)
    expect(screen.getByText('Cotton 80%')).toBeInTheDocument()
  })
})
