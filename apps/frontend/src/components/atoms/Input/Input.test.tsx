import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import { Input } from './Input'

describe('Input', () => {
  it('renders with default props', () => {
    render(<Input />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('renders with placeholder', () => {
    render(<Input placeholder='Enter text' />)
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
  })

  it('handles value changes', () => {
    const handleChange = vi.fn()
    render(<Input value='test' onChange={handleChange} />)

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'new value' } })
    expect(handleChange).toHaveBeenCalled()
  })

  it('applies size variants correctly', () => {
    const { container } = render(<Input size='large' />)
    expect(container.querySelector('.ant-input-lg')).toBeInTheDocument()
  })

  it('applies disabled state', () => {
    render(<Input disabled />)
    expect(screen.getByRole('textbox')).toBeDisabled()
  })

  it('shows error state', () => {
    const { container } = render(<Input status='error' />)
    expect(
      container.querySelector('.ant-input-status-error')
    ).toBeInTheDocument()
  })

  it('renders with prefix and suffix', () => {
    render(
      <Input
        prefix={<span data-testid='prefix'>@</span>}
        suffix={<span data-testid='suffix'>.com</span>}
      />
    )
    expect(screen.getByTestId('prefix')).toBeInTheDocument()
    expect(screen.getByTestId('suffix')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(<Input className='custom-input' />)
    expect(container.querySelector('.custom-input')).toBeInTheDocument()
  })
})
