import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import { QuantityCounter } from './QuantityCounter'

describe('QuantityCounter', () => {
  it('renders with default value', () => {
    render(<QuantityCounter />)
    expect(screen.getByDisplayValue('0')).toBeInTheDocument()
  })

  it('displays custom value', () => {
    render(<QuantityCounter value={5} />)
    expect(screen.getByDisplayValue('5')).toBeInTheDocument()
  })

  it('handles increment button click', () => {
    const handleChange = vi.fn()
    const { container } = render(
      <QuantityCounter value={5} onChange={handleChange} />
    )

    const incrementButton = container.querySelector(
      '.oda-quantity-counter__button--increment'
    )
    fireEvent.click(incrementButton!)
    expect(handleChange).toHaveBeenCalledWith(6)
  })

  it('handles decrement button click', () => {
    const handleChange = vi.fn()
    const { container } = render(
      <QuantityCounter value={5} onChange={handleChange} />
    )

    const decrementButton = container.querySelector(
      '.oda-quantity-counter__button--decrement'
    )
    fireEvent.click(decrementButton!)
    expect(handleChange).toHaveBeenCalledWith(4)
  })

  it('respects minimum value', () => {
    const handleChange = vi.fn()
    const { container } = render(
      <QuantityCounter value={1} min={1} onChange={handleChange} />
    )

    const decrementButton = container.querySelector(
      '.oda-quantity-counter__button--decrement'
    )
    fireEvent.click(decrementButton!)
    expect(handleChange).not.toHaveBeenCalled()
  })

  it('respects maximum value', () => {
    const handleChange = vi.fn()
    const { container } = render(
      <QuantityCounter value={10} max={10} onChange={handleChange} />
    )

    const incrementButton = container.querySelector(
      '.oda-quantity-counter__button--increment'
    )
    fireEvent.click(incrementButton!)
    expect(handleChange).not.toHaveBeenCalled()
  })

  it('applies size classes correctly', () => {
    const { container } = render(<QuantityCounter size='large' />)
    expect(container.firstChild).toHaveClass('oda-quantity-counter--large')
  })

  it('applies disabled state', () => {
    const { container } = render(<QuantityCounter disabled />)
    expect(
      container.querySelector('.oda-quantity-counter__button--increment')
    ).toBeDisabled()
    expect(
      container.querySelector('.oda-quantity-counter__button--decrement')
    ).toBeDisabled()
  })
})
