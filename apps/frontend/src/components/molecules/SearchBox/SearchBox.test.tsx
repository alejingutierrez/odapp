import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SearchBox } from './SearchBox'

// Mock the useDebounce hook
vi.mock('../../../hooks/useDebounce', () => ({
  useDebounce: vi.fn((value: string) => value),
}))

const mockUseDebounce = vi.mocked(
  await import('../../../hooks/useDebounce')
).useDebounce

describe('SearchBox', () => {
  const mockOnSearch = vi.fn()
  const mockOnFilter = vi.fn()
  const mockOnClear = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseDebounce.mockImplementation((value: unknown) => value as string)
  })

  it('renders with default props', () => {
    render(<SearchBox onSearch={mockOnSearch} />)

    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('renders with custom placeholder', () => {
    render(
      <SearchBox onSearch={mockOnSearch} placeholder='Search products...' />
    )

    expect(
      screen.getByPlaceholderText('Search products...')
    ).toBeInTheDocument()
  })

  it('calls onSearch when typing', async () => {
    const user = userEvent.setup()
    render(<SearchBox onSearch={mockOnSearch} />)

    const input = screen.getByRole('textbox')
    await user.type(input, 'test query')

    expect(mockOnSearch).toHaveBeenCalledWith('test query')
  })

  it('shows filter button when showFilterButton is true', () => {
    render(
      <SearchBox
        onSearch={mockOnSearch}
        onFilter={mockOnFilter}
        showFilterButton={true}
      />
    )

    expect(screen.getByText('Filters')).toBeInTheDocument()
  })

  it('calls onFilter when filter button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <SearchBox
        onSearch={mockOnSearch}
        onFilter={mockOnFilter}
        showFilterButton={true}
      />
    )

    const filterButton = screen.getByText('Filters')
    await user.click(filterButton)

    expect(mockOnFilter).toHaveBeenCalled()
  })

  it('shows clear button when allowClear is true and has value', async () => {
    const user = userEvent.setup()
    render(<SearchBox onSearch={mockOnSearch} allowClear={true} />)

    const input = screen.getByRole('textbox')
    await user.type(input, 'test')

    // Clear button should appear
    const clearButton = screen.getByRole('button')
    expect(clearButton).toBeInTheDocument()
  })

  it('calls onClear when clear button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <SearchBox
        onSearch={mockOnSearch}
        onClear={mockOnClear}
        allowClear={true}
      />
    )

    const input = screen.getByRole('textbox')
    await user.type(input, 'test')

    const clearButton = screen.getByRole('button')
    await user.click(clearButton)

    expect(mockOnClear).toHaveBeenCalled()
    expect(mockOnSearch).toHaveBeenCalledWith('')
  })

  it('shows loading spinner when loading is true', () => {
    render(<SearchBox onSearch={mockOnSearch} loading={true} />)

    // Check for spinner component
    expect(document.querySelector('.oda-spinner')).toBeInTheDocument()
  })

  it('disables input when disabled is true', () => {
    render(<SearchBox onSearch={mockOnSearch} disabled={true} />)

    const input = screen.getByRole('textbox')
    expect(input).toBeDisabled()
  })

  it('calls onSearch when Enter is pressed', async () => {
    const user = userEvent.setup()
    render(<SearchBox onSearch={mockOnSearch} />)

    const input = screen.getByRole('textbox')
    await user.type(input, 'test query')
    await user.keyboard('{Enter}')

    expect(mockOnSearch).toHaveBeenCalledWith('test query')
  })

  it('applies custom className', () => {
    render(<SearchBox onSearch={mockOnSearch} className='custom-search' />)

    expect(document.querySelector('.custom-search')).toBeInTheDocument()
  })

  it('shows filter count badge when filterCount > 0', () => {
    render(
      <SearchBox
        onSearch={mockOnSearch}
        onFilter={mockOnFilter}
        showFilterButton={true}
        filterCount={5}
      />
    )

    expect(screen.getByText('5')).toBeInTheDocument()
  })
})
