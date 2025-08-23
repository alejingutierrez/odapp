
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, expect } from 'vitest'
import { QuantitySelector } from './QuantitySelector'

describe('QuantitySelector', () => {
  const mockOnChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders quantity selector with default value', () => {
    render(<QuantitySelector value={1} onChange={mockOnChange} />)

    expect(screen.getByDisplayValue('1')).toBeInTheDocument()
  })

  it('calls onChange when increment button is clicked', async () => {
    const user = userEvent.setup()
    render(<QuantitySelector value={1} onChange={mockOnChange} />)

    const incrementButton = screen.getByRole('button', { name: /plus/i })
    await user.click(incrementButton)

    expect(mockOnChange).toHaveBeenCalledWith(2)
  })

  it('calls onChange when decrement button is clicked', async () => {
    const user = userEvent.setup()
    render(<QuantitySelector value={2} onChange={mockOnChange} />)

    const decrementButton = screen.getByRole('button', { name: /minus/i })
    await user.click(decrementButton)

    expect(mockOnChange).toHaveBeenCalledWith(1)
  })

  it('respects minimum value', async () => {
    render(<QuantitySelector value={1} min={1} onChange={mockOnChange} />)

    const decrementButton = screen.getByRole('button', { name: /minus/i })
    expect(decrementButton).toBeDisabled()
  })

  it('respects maximum value', async () => {
    render(<QuantitySelector value={10} max={10} onChange={mockOnChange} />)

    const incrementButton = screen.getByRole('button', { name: /plus/i })
    expect(incrementButton).toBeDisabled()
  })

  it('allows direct input editing', async () => {
    const user = userEvent.setup()
    render(<QuantitySelector value={1} onChange={mockOnChange} />)

    const input = screen.getByDisplayValue('1')
    await user.clear(input)
    await user.type(input, '5')

    expect(mockOnChange).toHaveBeenCalledWith(5)
  })

  it('applies custom className', () => {
    render(
      <QuantitySelector
        value={1}
        onChange={mockOnChange}
        className='custom-quantity-selector'
      />
    )

    expect(
      document.querySelector('.custom-quantity-selector')
    ).toBeInTheDocument()
  })

  it('applies disabled state', () => {
    render(
      <QuantitySelector value={1} onChange={mockOnChange} disabled={true} />
    )

    const input = screen.getByDisplayValue('1')
    const incrementButton = screen.getByRole('button', { name: /plus/i })
    const decrementButton = screen.getByRole('button', { name: /minus/i })

    expect(input).toBeDisabled()
    expect(incrementButton).toBeDisabled()
    expect(decrementButton).toBeDisabled()
  })
})
