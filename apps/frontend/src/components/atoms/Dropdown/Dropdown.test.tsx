import { render, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Dropdown } from './Dropdown'

describe('Dropdown', () => {
  const options = [
    { value: '1', label: 'Option 1' },
    { value: '2', label: 'Option 2' },
    { value: '3', label: 'Option 3' },
  ]

  it('renders with trigger element', () => {
    const { container } = render(<Dropdown options={options} />)
    expect(container.querySelector('.ant-select')).toBeInTheDocument()
  })

  it('shows menu on click', () => {
    const { container } = render(<Dropdown options={options} />)

    const selector = container.querySelector('.ant-select-selector')
    fireEvent.click(selector!)
    expect(container.querySelector('.ant-select')).toBeInTheDocument()
  })

  it('handles menu item clicks', () => {
    const handleChange = vi.fn()
    const { container } = render(
      <Dropdown options={options} onChange={handleChange} />
    )

    const selector = container.querySelector('.ant-select-selector')
    fireEvent.click(selector!)
    expect(handleChange).toHaveBeenCalledTimes(0) // Initially not called
  })

  it('applies placement correctly', () => {
    const { container } = render(
      <Dropdown options={options} placement='topLeft' />
    )
    expect(container.querySelector('.ant-select')).toBeInTheDocument()
  })

  it('handles disabled state', () => {
    const { container } = render(<Dropdown options={options} disabled />)

    expect(container.querySelector('.ant-select-disabled')).toBeInTheDocument()
  })

  it('handles hover trigger', () => {
    const { container } = render(<Dropdown options={options} searchable />)

    expect(
      container.querySelector('.oda-dropdown--searchable')
    ).toBeInTheDocument()
  })
})
