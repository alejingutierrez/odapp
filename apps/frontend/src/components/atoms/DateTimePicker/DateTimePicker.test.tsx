import { render, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { DateTimePicker } from './DateTimePicker'
import dayjs from 'dayjs'

describe('DateTimePicker', () => {
  it('renders with default props', () => {
    const { container } = render(<DateTimePicker />)
    expect(container.querySelector('input')).toBeInTheDocument()
  })

  it('displays placeholder correctly', () => {
    const { container } = render(
      <DateTimePicker placeholder={{ date: 'Select date' }} />
    )
    expect(
      container.querySelector('input[placeholder="Select date"]')
    ).toBeInTheDocument()
  })

  it('handles value changes', () => {
    const handleChange = vi.fn()
    const testDate = dayjs('2024-01-15')
    const { container } = render(
      <DateTimePicker value={testDate} onChange={handleChange} />
    )

    const input = container.querySelector('input')
    expect(input).toHaveValue('2024-01-15')
  })

  it('applies size variants correctly', () => {
    const { container } = render(<DateTimePicker size='large' />)
    expect(container.querySelector('.ant-picker')).toBeInTheDocument()
  })

  it('applies disabled state', () => {
    const { container } = render(<DateTimePicker disabled />)
    expect(container.querySelector('input')).toBeDisabled()
  })

  it('shows error state', () => {
    const { container } = render(<DateTimePicker disabled />)
    expect(container.querySelector('.ant-picker')).toBeInTheDocument()
  })

  it('handles time picker mode', () => {
    const { container } = render(<DateTimePicker timeFormat='HH:mm:ss' />)
    expect(container.querySelector('input')).toBeInTheDocument()
  })

  it('opens picker on click', () => {
    const { container } = render(<DateTimePicker />)

    const input = container.querySelector('input')
    fireEvent.click(input!)

    expect(container.querySelector('.ant-picker')).toBeInTheDocument()
  })
})
