
import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import { Toggle } from '../Toggle'

describe('Toggle', () => {
  it('renders with label', () => {
    render(<Toggle label='Test Toggle' />)
    expect(screen.getByText('Test Toggle')).toBeInTheDocument()
  })

  it('renders with description', () => {
    render(<Toggle label='Test Toggle' description='This is a description' />)
    expect(screen.getByText('This is a description')).toBeInTheDocument()
  })

  it('handles change events', () => {
    const handleChange = vi.fn()
    render(<Toggle label='Test Toggle' onChange={handleChange} />)

    const toggle = screen.getByRole('switch')
    fireEvent.click(toggle)
    expect(handleChange).toHaveBeenCalledWith(true, expect.any(Object))
  })

  it('shows on/off labels', () => {
    render(<Toggle onLabel='ON' offLabel='OFF' />)

    // Initially off, should show OFF label
    expect(screen.getByText('OFF')).toBeInTheDocument()
  })

  it('applies size classes correctly', () => {
    const { container } = render(<Toggle label='Large Toggle' size='default' />)
    expect(container.querySelector('.oda-toggle--large')).toBeInTheDocument()
  })

  it('applies variant classes correctly', () => {
    const { container } = render(
      <Toggle label='Primary Toggle' variant='primary' />
    )
    expect(container.querySelector('.oda-toggle--primary')).toBeInTheDocument()
  })

  it('positions label correctly', () => {
    const { container } = render(
      <Toggle label='Left Label' labelPosition='left' />
    )
    expect(
      container.querySelector('.oda-toggle--label-left')
    ).toBeInTheDocument()
  })

  it('shows loading state', () => {
    const { container } = render(<Toggle label='Loading Toggle' loading />)
    expect(container.querySelector('.oda-toggle--loading')).toBeInTheDocument()
  })

  it('renders with icons', () => {
    const OnIcon = () => <span data-testid='on-icon'>✓</span>
    const OffIcon = () => <span data-testid='off-icon'>✗</span>

    render(<Toggle onIcon={<OnIcon />} offIcon={<OffIcon />} />)

    // Should show off icon initially
    expect(screen.getByTestId('off-icon')).toBeInTheDocument()
  })

  it('supports controlled mode', () => {
    const { rerender } = render(<Toggle checked={false} />)

    let toggle = screen.getByRole('switch')
    expect(toggle).not.toBeChecked()

    rerender(<Toggle checked={true} />)
    toggle = screen.getByRole('switch')
    expect(toggle).toBeChecked()
  })
})
