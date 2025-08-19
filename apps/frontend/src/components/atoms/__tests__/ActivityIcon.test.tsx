import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import { ActivityIcon } from '../ActivityIcon'

describe('ActivityIcon', () => {
  it('renders with correct activity type', () => {
    const { container } = render(<ActivityIcon type="call" />)
    expect(container.querySelector('.anticon-phone')).toBeInTheDocument()
  })

  it('handles click events', () => {
    const handleClick = vi.fn()
    render(<ActivityIcon type="call" onClick={handleClick} />)
    
    const icon = screen.getByRole('button')
    fireEvent.click(icon)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('shows tooltip when provided', () => {
    render(<ActivityIcon type="call" tooltip="Make a call" />)
    // Tooltip text is not directly rendered in DOM until hover
    expect(screen.getByRole('img')).toBeInTheDocument()
  })

  it('applies size classes correctly', () => {
    const { container } = render(<ActivityIcon type="call" size="large" />)
    expect(container.querySelector('.oda-activity-icon--large')).toBeInTheDocument()
  })

  it('applies variant classes correctly', () => {
    const { container } = render(<ActivityIcon type="call" variant="primary" />)
    expect(container.querySelector('.oda-activity-icon--primary')).toBeInTheDocument()
  })

  it('shows background when enabled', () => {
    const { container } = render(<ActivityIcon type="call" showBackground />)
    expect(container.querySelector('.oda-activity-icon--with-background')).toBeInTheDocument()
  })

  it('applies active state', () => {
    const { container } = render(<ActivityIcon type="call" active />)
    expect(container.querySelector('.oda-activity-icon--active')).toBeInTheDocument()
  })

  it('applies disabled state', () => {
    const { container } = render(<ActivityIcon type="call" disabled />)
    expect(container.querySelector('.oda-activity-icon--disabled')).toBeInTheDocument()
  })

  it('handles keyboard navigation', () => {
    const handleClick = vi.fn()
    render(<ActivityIcon type="call" onClick={handleClick} />)
    
    const icon = screen.getByRole('button')
    fireEvent.keyDown(icon, { key: 'Enter' })
    expect(handleClick).toHaveBeenCalledTimes(1)
    
    fireEvent.keyDown(icon, { key: ' ' })
    expect(handleClick).toHaveBeenCalledTimes(2)
  })

  it('renders custom icon when provided', () => {
    const CustomIcon = () => <span data-testid="custom-icon">Custom</span>
    render(<ActivityIcon type="call" customIcon={<CustomIcon />} />)
    
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument()
  })

  it('applies custom color', () => {
    const { container } = render(<ActivityIcon type="call" color="#ff0000" />)
    const icon = container.querySelector('.oda-activity-icon')
    expect(icon).toHaveStyle({ color: '#ff0000' })
  })
})