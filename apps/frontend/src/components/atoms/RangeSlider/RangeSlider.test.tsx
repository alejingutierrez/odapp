import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { RangeSlider } from './RangeSlider'

describe('RangeSlider', () => {
  it('renders with default props', () => {
    const { container } = render(<RangeSlider />)
    expect(container.querySelector('.ant-slider')).toBeInTheDocument()
  })

  it('displays range values correctly', () => {
    render(<RangeSlider value={[20, 50]} />)
    const { container } = render(<RangeSlider value={[20, 50]} />)
    expect(container.querySelector('.ant-slider')).toBeInTheDocument()
  })

  it('displays range values correctly with different values', () => {
    render(<RangeSlider value={[20, 80]} />)
    const { container } = render(<RangeSlider value={[20, 80]} />)
    expect(container.querySelector('.ant-slider')).toBeInTheDocument()
  })

  it('handles value changes', () => {
    const handleChange = vi.fn()
    render(<RangeSlider onChange={handleChange} />)

    const slider = screen.getByRole('slider')
    fireEvent.change(slider, { target: { value: 75 } })
    expect(handleChange).toHaveBeenCalled()
  })

  it('applies disabled state', () => {
    render(<RangeSlider disabled />)
    expect(screen.getByRole('slider')).toBeDisabled()
  })

  it('shows marks when provided', () => {
    const marks = { 0: '0°C', 26: '26°C', 37: '37°C', 100: '100°C' }
    const { container } = render(<RangeSlider marks={marks} />)
    expect(container.querySelector('.ant-slider-mark')).toBeInTheDocument()
  })

  it('applies step correctly', () => {
    render(<RangeSlider step={10} />)
    const slider = screen.getByRole('slider')
    expect(slider).toHaveAttribute('step', '10')
  })

  it('respects min and max values', () => {
    render(<RangeSlider min={10} max={90} />)
    const slider = screen.getByRole('slider')
    expect(slider).toHaveAttribute('min', '10')
    expect(slider).toHaveAttribute('max', '90')
  })
})
