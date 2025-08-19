import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import { Chip } from '../Chip'

describe('Chip', () => {
  it('renders label correctly', () => {
    render(<Chip label="Test Chip" />)
    expect(screen.getByText('Test Chip')).toBeInTheDocument()
  })

  it('handles click events', () => {
    const handleClick = vi.fn()
    render(<Chip label="Clickable Chip" onClick={handleClick} />)
    
    fireEvent.click(screen.getByText('Clickable Chip'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('handles remove events', () => {
    const handleRemove = vi.fn()
    render(<Chip label="Removable Chip" removable onRemove={handleRemove} />)
    
    const removeButton = screen.getByRole('img', { name: /close/i })
    fireEvent.click(removeButton)
    expect(handleRemove).toHaveBeenCalledTimes(1)
  })

  it('applies variant classes correctly', () => {
    const { container } = render(<Chip label="Primary Chip" variant="primary" />)
    expect(container.querySelector('.oda-chip--primary')).toBeInTheDocument()
  })

  it('shows selected state', () => {
    const { container } = render(<Chip label="Selected Chip" selected />)
    expect(container.querySelector('.oda-chip--selected')).toBeInTheDocument()
  })

  it('disables interaction when disabled', () => {
    const handleClick = vi.fn()
    const { container } = render(
      <Chip label="Disabled Chip" disabled onClick={handleClick} />
    )
    
    fireEvent.click(screen.getByText('Disabled Chip'))
    expect(handleClick).not.toHaveBeenCalled()
    expect(container.querySelector('.oda-chip--disabled')).toBeInTheDocument()
  })

  it('renders with icon', () => {
    const TestIcon = () => <span data-testid="test-icon">🔥</span>
    render(<Chip label="Icon Chip" icon={<TestIcon />} />)
    
    expect(screen.getByTestId('test-icon')).toBeInTheDocument()
    expect(screen.getByText('Icon Chip')).toBeInTheDocument()
  })

  it('applies size classes correctly', () => {
    const { container } = render(<Chip label="Large Chip" size="large" />)
    expect(container.querySelector('.oda-chip--large')).toBeInTheDocument()
  })

  it('applies context classes correctly', () => {
    const { container } = render(<Chip label="Filter Chip" context="filter" />)
    expect(container.querySelector('.oda-chip--filter')).toBeInTheDocument()
  })
})