import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PlusOutlined } from '@ant-design/icons'
import { Button } from './Button'

describe('Button Component', () => {
  it('renders with default props', () => {
    render(<Button>Click me</Button>)
    const button = screen.getByRole('button', { name: /click me/i })
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass(
      'oda-button',
      'oda-button--primary',
      'oda-button--medium'
    )
  })

  it('renders different variants correctly', () => {
    const { rerender } = render(<Button variant='secondary'>Secondary</Button>)
    let button = screen.getByRole('button')
    expect(button).toHaveClass('oda-button--secondary')

    rerender(<Button variant='danger'>Danger</Button>)
    button = screen.getByRole('button')
    expect(button).toHaveClass('oda-button--danger')

    rerender(<Button variant='ghost'>Ghost</Button>)
    button = screen.getByRole('button')
    expect(button).toHaveClass('oda-button--ghost')
  })

  it('renders different sizes correctly', () => {
    const { rerender } = render(<Button size='small'>Small</Button>)
    let button = screen.getByRole('button')
    expect(button).toHaveClass('oda-button--small')

    rerender(<Button size='large'>Large</Button>)
    button = screen.getByRole('button')
    expect(button).toHaveClass('oda-button--large')
  })

  it('handles click events', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)

    const button = screen.getByRole('button')
    fireEvent.click(button)

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('renders with icon', () => {
    render(
      <Button icon={<PlusOutlined data-testid='plus-icon' />}>Add Item</Button>
    )

    expect(screen.getByTestId('plus-icon')).toBeInTheDocument()
    expect(screen.getByText('Add Item')).toBeInTheDocument()
  })

  it('renders icon at end position', () => {
    render(
      <Button
        icon={<PlusOutlined data-testid='plus-icon' />}
        iconPosition='end'
      >
        Add Item
      </Button>
    )

    const button = screen.getByRole('button')
    expect(button).toHaveTextContent('Add Item')
    expect(screen.getByTestId('plus-icon')).toBeInTheDocument()
  })

  it('shows loading state', () => {
    render(<Button loading>Loading</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('ant-btn-loading')
  })

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('renders full width', () => {
    render(<Button fullWidth>Full Width</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('oda-button--full-width')
  })

  it('does not call onClick when disabled', () => {
    const handleClick = vi.fn()
    render(
      <Button onClick={handleClick} disabled>
        Disabled
      </Button>
    )

    const button = screen.getByRole('button')
    fireEvent.click(button)

    expect(handleClick).not.toHaveBeenCalled()
  })

  it('meets accessibility standards', async () => {
    render(<Button>Accessible Button</Button>)
    // Basic accessibility check - button has role and is focusable
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('type', 'button')
  })

  it('supports custom className', () => {
    render(<Button className='custom-class'>Custom</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('custom-class')
  })

  it('applies custom props correctly', () => {
    render(<Button data-testid='custom-button'>Custom Button</Button>)
    const button = screen.getByTestId('custom-button')
    expect(button).toBeInTheDocument()
  })
})
