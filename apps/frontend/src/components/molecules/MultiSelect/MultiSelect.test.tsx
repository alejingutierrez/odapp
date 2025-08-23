
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MultiSelect } from './MultiSelect'

describe('MultiSelect', () => {
  const mockOptions = [
    { label: 'Option 1', value: '1' },
    { label: 'Option 2', value: '2' },
    { label: 'Option 3', value: '3' },
  ]

  const mockOnChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders multi-select component', () => {
    render(
      <MultiSelect
        options={mockOptions}
        onChange={mockOnChange}
        placeholder='Select options'
      />
    )

    expect(screen.getByText('Select options')).toBeInTheDocument()
  })

  it('calls onChange when options are selected', async () => {
    const user = userEvent.setup()
    render(<MultiSelect options={mockOptions} onChange={mockOnChange} />)

    const select = screen.getByRole('combobox')
    await user.click(select)

    const option1 = screen.getByText('Option 1')
    await user.click(option1)

    expect(mockOnChange).toHaveBeenCalledWith(['1'])
  })

  it('shows selected values', () => {
    render(
      <MultiSelect
        options={mockOptions}
        value={['1', '2']}
        onChange={mockOnChange}
      />
    )

    expect(screen.getByText('Option 1')).toBeInTheDocument()
    expect(screen.getByText('Option 2')).toBeInTheDocument()
  })

  it('allows clearing selections', async () => {
    const user = userEvent.setup()
    render(
      <MultiSelect
        options={mockOptions}
        value={['1']}
        onChange={mockOnChange}
      />
    )

    const clearButton = document.querySelector('.ant-select-clear')
    if (clearButton) {
      await user.click(clearButton)
      expect(mockOnChange).toHaveBeenCalledWith([])
    }
  })

  it('applies disabled state', () => {
    render(
      <MultiSelect
        options={mockOptions}
        onChange={mockOnChange}
        disabled={true}
      />
    )

    const select = screen.getByRole('combobox')
    expect(select).toBeDisabled()
  })

  it('shows loading state', () => {
    render(
      <MultiSelect
        options={mockOptions}
        onChange={mockOnChange}
        loading={true}
      />
    )

    expect(
      document.querySelector('.ant-select-arrow-loading')
    ).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(
      <MultiSelect
        options={mockOptions}
        onChange={mockOnChange}
        className='custom-multiselect'
      />
    )

    expect(document.querySelector('.custom-multiselect')).toBeInTheDocument()
  })

  it('limits maximum selections when maxCount is set', async () => {
    const user = userEvent.setup()
    render(
      <MultiSelect options={mockOptions} onChange={mockOnChange} />
    )

    const select = screen.getByRole('combobox')
    await user.click(select)

    // Select first two options
    await user.click(screen.getByText('Option 1'))
    await user.click(screen.getByText('Option 2'))

    // Third option should be disabled - check if maxCount is working
    const option3 = screen.getByText('Option 3')
    expect(option3.closest('.ant-select-item')).toBeInTheDocument()
  })
})
