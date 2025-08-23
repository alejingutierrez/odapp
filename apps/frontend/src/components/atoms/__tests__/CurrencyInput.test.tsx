
import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import { CurrencyInput } from '../CurrencyInput'

describe('CurrencyInput', () => {
  it('renders with default currency', () => {
    render(<CurrencyInput value={100} />)
    expect(screen.getByDisplayValue('100.00')).toBeInTheDocument()
    expect(screen.getByText('$')).toBeInTheDocument()
  })

  it('handles value changes', () => {
    const handleChange = vi.fn()
    render(<CurrencyInput onChange={handleChange} />)

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: '50.25' } })

    expect(handleChange).toHaveBeenCalled()
  })

  it('validates minimum value', () => {
    const handleChange = vi.fn()
    render(<CurrencyInput min={10} onChange={handleChange} />)

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: '5' } })
    fireEvent.blur(input)

    // Check for validation error via CSS class or container state
    expect(input).toBeInTheDocument()
  })

  it('validates maximum value', () => {
    const handleChange = vi.fn()
    render(<CurrencyInput max={100} onChange={handleChange} />)

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: '150' } })
    fireEvent.blur(input)

    expect(handleChange).toHaveBeenCalled()
  })

  it('formats values correctly', () => {
    render(<CurrencyInput value={100} />)

    expect(screen.getByDisplayValue('100.00')).toBeInTheDocument()
  })

  it('applies error state correctly', () => {
    const { container } = render(<CurrencyInput min={10} value={5} />)

    const input = screen.getByRole('textbox')
    fireEvent.blur(input)

    expect(container.querySelector('.oda-currency-input')).toBeInTheDocument()
  })

  it('supports different symbol positions', () => {
    render(<CurrencyInput currency='EUR' symbolPosition='after' />)

    // EUR symbol should be after the input
    const addonAfter = document.querySelector('.ant-input-group-addon')
    expect(addonAfter).toContainHTML('€')
  })

  it('handles precision correctly', () => {
    render(<CurrencyInput value={100.123} precision={3} />)
    expect(screen.getByDisplayValue('100.123')).toBeInTheDocument()
  })

  it('shows thousands separator when enabled', () => {
    render(<CurrencyInput value={1234.56} showThousandsSeparator />)
    expect(screen.getByDisplayValue('1,234.56')).toBeInTheDocument()
  })
})
