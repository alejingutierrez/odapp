import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { vi, expect, describe, it, beforeEach } from 'vitest'
import { SizeSelector } from './SizeSelector'

// Mock Ant Design icons
vi.mock('@ant-design/icons', () => ({
  InfoCircleOutlined: () => <span data-testid='info-icon' />,
  RuleOutlined: () => <span data-testid='rule-icon' />,
  BulbOutlined: () => <span data-testid='bulb-icon' />,
}))

describe('SizeSelector', () => {
  const mockSizes = [
    { id: 'xs', label: 'XS', value: 'xs', available: true },
    { id: 's', label: 'S', value: 's', available: true },
    { id: 'm', label: 'M', value: 'm', available: true },
    { id: 'l', label: 'L', value: 'l', available: false },
    { id: 'xl', label: 'XL', value: 'xl', available: true },
  ]

  const mockOnChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders size selector with all sizes', () => {
    render(<SizeSelector sizes={mockSizes} onChange={mockOnChange} />)

    expect(screen.getByText('XS')).toBeInTheDocument()
    expect(screen.getByText('S')).toBeInTheDocument()
    expect(screen.getByText('M')).toBeInTheDocument()
    expect(screen.getByText('L')).toBeInTheDocument()
    expect(screen.getByText('XL')).toBeInTheDocument()
  })

  it('calls onSizeChange when size is selected', async () => {
    const user = userEvent.setup()
    render(<SizeSelector sizes={mockSizes} onChange={mockOnChange} />)

    const mediumSize = screen.getByText('M')
    await user.click(mediumSize)

    expect(mockOnChange).toHaveBeenCalledWith('m')
  })

  it('shows selected size', () => {
    render(
      <SizeSelector
        sizes={mockSizes}
        selectedSize={mockSizes[1].value}
        onChange={mockOnChange}
      />
    )

    const selectedButton = screen.getByDisplayValue('s')
    expect(selectedButton).toBeInTheDocument()
  })

  it('disables unavailable sizes', () => {
    render(<SizeSelector sizes={mockSizes} onChange={mockOnChange} />)

    const largeSize = screen.getByRole('radio', { name: 'L' })
    expect(largeSize).toBeDisabled()
  })

  it('applies custom className', () => {
    render(
      <SizeSelector
        sizes={mockSizes}
        onChange={mockOnChange}
        className='custom-size-selector'
      />
    )

    expect(document.querySelector('.custom-size-selector')).toBeInTheDocument()
  })
})
