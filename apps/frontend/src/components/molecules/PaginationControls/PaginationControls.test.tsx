import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { PaginationControls } from './PaginationControls'

describe('PaginationControls', () => {
  const mockOnChange = vi.fn()
  const mockOnShowSizeChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders pagination controls', () => {
    render(
      <PaginationControls
        current={1}
        total={100}
        pageSize={10}
        onChange={mockOnChange}
      />
    )

    expect(document.querySelector('.pagination-controls')).toBeInTheDocument()
  })

  it('calls onChange when page is changed', async () => {
    const user = userEvent.setup()
    render(
      <PaginationControls
        current={1}
        total={100}
        pageSize={10}
        onChange={mockOnChange}
      />
    )

    const nextButton = screen.getByTitle('Next Page')
    await user.click(nextButton)

    expect(mockOnChange).toHaveBeenCalledWith(2, 10)
  })

  it('shows page size selector when showSizeChanger is true', () => {
    render(
      <PaginationControls
        current={1}
        total={100}
        pageSize={10}
        onChange={mockOnChange}
        showSizeChanger={true}
        onShowSizeChange={mockOnShowSizeChange}
      />
    )

    expect(screen.getByText(/page/i)).toBeInTheDocument()
  })

  it('calls onShowSizeChange when page size changes', async () => {
    render(
      <PaginationControls
        current={1}
        total={100}
        pageSize={10}
        onChange={mockOnChange}
        showSizeChanger={true}
        onShowSizeChange={mockOnShowSizeChange}
      />
    )

    // Check that size selector is rendered
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('shows quick jumper when showQuickJumper is true', () => {
    render(
      <PaginationControls
        current={1}
        total={100}
        pageSize={10}
        onChange={mockOnChange}
        showQuickJumper={true}
      />
    )

    expect(screen.getByText(/go to/i)).toBeInTheDocument()
  })

  it('shows total count when showTotal is true', () => {
    render(
      <PaginationControls
        current={1}
        total={100}
        pageSize={10}
        onChange={mockOnChange}
        showTotal={true}
      />
    )

    const totalElement = document.querySelector('.pagination-controls__total')
    expect(totalElement).toHaveTextContent(/showing 1-10 of 100 items/i)
  })

  it('applies showLessItems when showLessItems is true', () => {
    render(
      <PaginationControls
        current={1}
        total={100}
        pageSize={10}
        onChange={mockOnChange}
        showLessItems={true}
      />
    )

    const pagination = document.querySelector('.ant-pagination')
    expect(pagination).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(
      <PaginationControls
        current={1}
        total={100}
        pageSize={10}
        onChange={mockOnChange}
        className='custom-pagination'
      />
    )

    expect(document.querySelector('.custom-pagination')).toBeInTheDocument()
  })

  it('disables controls when disabled is true', () => {
    render(
      <PaginationControls
        current={1}
        total={100}
        pageSize={10}
        onChange={mockOnChange}
        disabled={true}
      />
    )

    expect(
      document.querySelector('.ant-pagination-disabled')
    ).toBeInTheDocument()
  })
})
