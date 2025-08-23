import { render, screen } from '@testing-library/react'
import { vi, describe, it, beforeEach, expect } from 'vitest'
import dayjs from 'dayjs'
import { DateRangePicker } from './DateRangePicker'

describe('DateRangePicker', () => {
  const mockOnChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders date range picker correctly', () => {
    render(<DateRangePicker onChange={mockOnChange} />)

    expect(screen.getByPlaceholderText('Start date')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('End date')).toBeInTheDocument()
  })

  it('renders preset buttons correctly', () => {
    render(<DateRangePicker onChange={mockOnChange} showPresets={true} />)

    // Check that preset buttons are rendered
    expect(screen.getByText('Today')).toBeInTheDocument()
    expect(screen.getByText('Yesterday')).toBeInTheDocument()
    expect(screen.getByText('This Week')).toBeInTheDocument()
    expect(screen.getByText('Last Week')).toBeInTheDocument()
  })

  it('has correct input placeholders', () => {
    render(<DateRangePicker onChange={mockOnChange} />)

    const startInput = screen.getByPlaceholderText('Start date')
    const endInput = screen.getByPlaceholderText('End date')

    expect(startInput).toBeInTheDocument()
    expect(endInput).toBeInTheDocument()
  })

  it('renders with preset ranges', () => {
    render(<DateRangePicker onChange={mockOnChange} showPresets={true} />)

    const picker = document.querySelector('.ant-picker')
    expect(picker).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(
      <DateRangePicker onChange={mockOnChange} className='custom-date-picker' />
    )

    expect(document.querySelector('.custom-date-picker')).toBeInTheDocument()
  })

  it('shows disabled state', () => {
    render(<DateRangePicker onChange={mockOnChange} disabled={true} />)

    const inputs = screen.getAllByRole('textbox')
    inputs.forEach((input) => {
      expect(input).toBeDisabled()
    })
  })

  it('renders with custom format', () => {
    const dateRange = {
      start: dayjs('2023-01-01'),
      end: dayjs('2023-01-31'),
    }

    render(
      <DateRangePicker
        onChange={mockOnChange}
        value={dateRange}
        format='MM/DD/YYYY'
      />
    )

    // Check that the component renders with date inputs
    const inputs = screen.getAllByRole('textbox')
    expect(inputs).toHaveLength(2)
    expect(inputs[0]).toHaveAttribute('placeholder', 'Start date')
    expect(inputs[1]).toHaveAttribute('placeholder', 'End date')
  })
})
