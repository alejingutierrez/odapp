import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import { CurrencyInput } from './CurrencyInput'

describe('CurrencyInput', () => {
  it('renders with default props', () => {
    render(<CurrencyInput />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('displays currency symbol correctly', () => {
    const { container } = render(<CurrencyInput currency='USD' />)
    expect(container.textContent).toContain('$')
  })

  it('handles value changes', () => {
    const handleChange = vi.fn()
    render(<CurrencyInput onChange={handleChange} />)

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: '123.45' } })
    expect(handleChange).toHaveBeenCalled()
  })

  it('applies precision correctly', () => {
    const handleChange = vi.fn()
    render(<CurrencyInput precision={0} onChange={handleChange} />)

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: '123.45' } })
    fireEvent.blur(input)

    expect(input).toHaveValue('123.45')
  })

  it('applies size variants correctly', () => {
    const { container } = render(<CurrencyInput size='large' />)
    expect(container.querySelector('.ant-input-lg')).toBeInTheDocument()
  })

  it('applies disabled state', () => {
    render(<CurrencyInput disabled />)
    expect(screen.getByRole('textbox')).toBeDisabled()
  })

  it('shows error state', () => {
    render(<CurrencyInput status='error' />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('formats currency on blur', () => {
    render(<CurrencyInput currency='USD' />)

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: '1234.5' } })
    fireEvent.blur(input)

    expect(input).toHaveValue('1234.5')
  })
})
