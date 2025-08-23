
import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import { QuantityCounter } from '../QuantityCounter'

describe('QuantityCounter', () => {
  it('renders with default value', () => {
    render(<QuantityCounter value={5} />)
    expect(screen.getByDisplayValue('5')).toBeInTheDocument()
  })

  it('handles increment', () => {
    const handleChange = vi.fn()
    render(<QuantityCounter value={5} onChange={handleChange} />)

    const incrementButton = screen.getByRole('button', { name: /plus/i })
    fireEvent.click(incrementButton)

    expect(handleChange).toHaveBeenCalledWith(6)
  })

  it('handles decrement', () => {
    const handleChange = vi.fn()
    render(<QuantityCounter value={5} onChange={handleChange} />)

    const decrementButton = screen.getByRole('button', { name: /minus/i })
    fireEvent.click(decrementButton)

    expect(handleChange).toHaveBeenCalledWith(4)
  })

  it('respects minimum value', () => {
    const handleChange = vi.fn()
    render(<QuantityCounter value={1} min={1} onChange={handleChange} />)

    const decrementButton = screen.getByRole('button', { name: /minus/i })
    expect(decrementButton).toBeDisabled()
  })

  it('respects maximum value', () => {
    const handleChange = vi.fn()
    render(<QuantityCounter value={10} max={10} onChange={handleChange} />)

    const incrementButton = screen.getByRole('button', { name: /plus/i })
    expect(incrementButton).toBeDisabled()
  })

  it('shows stock information', () => {
    render(<QuantityCounter value={5} showStock stock={20} />)
    expect(screen.getByText('20 available')).toBeInTheDocument()
  })

  it('validates against stock', () => {
    const handleChange = vi.fn()
    const { container } = render(
      <QuantityCounter
        value={15}
        stock={10}
        validateOnChange
        onChange={handleChange}
      />
    )

    // Check that input shows out-of-range class
    expect(
      container.querySelector('.ant-input-number-out-of-range')
    ).toBeInTheDocument()
  })

  it('renders compact variant', () => {
    const { container } = render(<QuantityCounter variant='compact' />)
    expect(
      container.querySelector('.oda-quantity-counter--compact')
    ).toBeInTheDocument()
  })

  it('renders inline variant', () => {
    const { container } = render(<QuantityCounter variant='inline' />)
    expect(
      container.querySelector('.oda-quantity-counter--inline')
    ).toBeInTheDocument()
    expect(screen.getByText('Qty:')).toBeInTheDocument()
  })

  it('renders stepper variant', () => {
    const { container } = render(<QuantityCounter variant='stepper' />)
    expect(
      container.querySelector('.oda-quantity-counter--stepper')
    ).toBeInTheDocument()
  })

  it('shows unit label', () => {
    render(<QuantityCounter value={5} unit='kg' />)
    expect(screen.getByText('kg')).toBeInTheDocument()
  })

  it('handles bulk entry mode', () => {
    render(<QuantityCounter value={150} allowBulkEntry bulkThreshold={100} />)
    expect(
      screen.getByRole('button', { name: /bulk entry/i })
    ).toBeInTheDocument()
  })

  it('applies size classes correctly', () => {
    const { container } = render(<QuantityCounter size='large' />)
    expect(
      container.querySelector('.oda-quantity-counter--large')
    ).toBeInTheDocument()
  })

  it('handles direct input changes', () => {
    const handleChange = vi.fn()
    render(<QuantityCounter onChange={handleChange} />)

    const input = screen.getByRole('spinbutton')
    fireEvent.change(input, { target: { value: '25' } })

    expect(handleChange).toHaveBeenCalledWith(25)
  })
})
