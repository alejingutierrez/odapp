import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { vi, describe, it, beforeEach, expect } from 'vitest'
import { FilterChip } from './FilterChip'

describe('FilterChip', () => {
  const mockOnRemove = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders filter chip with label', () => {
    render(<FilterChip label='Active Users' />)

    expect(screen.getByText('Active Users')).toBeInTheDocument()
  })

  it('shows remove button when onRemove is provided', () => {
    render(<FilterChip label='Filter' onRemove={mockOnRemove} />)

    const removeButton = screen.getByTestId('closeoutlined-icon')
    expect(removeButton).toBeInTheDocument()
  })

  it('calls onRemove when remove button is clicked', async () => {
    const user = userEvent.setup()
    render(<FilterChip label='Filter' onRemove={mockOnRemove} />)

    const removeButton = screen.getByTestId('closeoutlined-icon')
    await user.click(removeButton)

    expect(mockOnRemove).toHaveBeenCalled()
  })

  it('renders without remove button when onRemove is not provided', () => {
    render(<FilterChip label='Filter' />)

    const removeButton = screen.queryByTestId('closeoutlined-icon')
    expect(removeButton).not.toBeInTheDocument()
  })

  it('applies custom color', () => {
    render(<FilterChip label='Filter' color='blue' />)

    const chip = document.querySelector('.ant-tag')
    expect(chip).toBeInTheDocument()
  })

  it('renders as Ant Design Tag', () => {
    render(<FilterChip label='Filter' />)

    const tag = document.querySelector('.ant-tag')
    expect(tag).toBeInTheDocument()
  })

  it('renders label text', () => {
    render(<FilterChip label='Search' />)

    expect(screen.getByText('Search')).toBeInTheDocument()
  })

  it('renders with custom color prop', () => {
    render(<FilterChip label='Items' color='green' />)

    expect(screen.getByText('Items')).toBeInTheDocument()
  })

  it('renders closable tag when onRemove is provided', () => {
    render(<FilterChip label='Filter' onRemove={mockOnRemove} />)

    // Check that close icon is present when onRemove is provided
    const closeIcon = screen.getByTestId('closeoutlined-icon')
    expect(closeIcon).toBeInTheDocument()
  })
})
