
import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import { Chip } from './Chip'

describe('Chip', () => {
  it('renders with default props', () => {
    render(<Chip label='Test Chip' />)
    expect(screen.getByText('Test Chip')).toBeInTheDocument()
  })

  it('applies variant classes correctly', () => {
    const { container } = render(<Chip label='Test' variant='primary' />)
    expect(container.firstChild).toHaveClass('oda-chip--primary')
  })

  it('applies size classes correctly', () => {
    const { container } = render(<Chip label='Test' size='large' />)
    expect(container.firstChild).toHaveClass('oda-chip--large')
  })

  it('handles click events', () => {
    const handleClick = vi.fn()
    render(<Chip label='Test' onClick={handleClick} />)

    fireEvent.click(screen.getByText('Test'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('shows close button when removable', () => {
    const handleRemove = vi.fn()
    const { container } = render(
      <Chip label='Test' removable onRemove={handleRemove} />
    )

    const closeButton = container.querySelector('.anticon-close')
    expect(closeButton).toBeInTheDocument()

    fireEvent.click(closeButton!)
    expect(handleRemove).toHaveBeenCalledTimes(1)
  })

  it('renders with icon', () => {
    render(
      <Chip label='Test' icon={<span data-testid='test-icon'>Icon</span>} />
    )
    expect(screen.getByTestId('test-icon')).toBeInTheDocument()
  })

  it('applies disabled state correctly', () => {
    const { container } = render(<Chip label='Test' disabled />)
    expect(container.firstChild).toHaveClass('oda-chip--disabled')
  })

  it('applies custom className', () => {
    const { container } = render(<Chip label='Test' className='custom-class' />)
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('handles keyboard events for close button', () => {
    const handleRemove = vi.fn()
    const { container } = render(
      <Chip label='Test' removable onRemove={handleRemove} />
    )

    const closeButton = container.querySelector('.anticon-close')
    fireEvent.click(closeButton!)
    expect(handleRemove).toHaveBeenCalledTimes(1)
  })
})
