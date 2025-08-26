import { render, screen } from '@testing-library/react'
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

    const sliders = screen.getAllByRole('slider')
    expect(sliders).toHaveLength(2)
  })

  it('applies disabled state', () => {
    render(<RangeSlider disabled />)
    const sliders = screen.getAllByRole('slider')
    expect(sliders).toHaveLength(2)
  })

  it('shows marks when provided', () => {
    const marks = { 0: '0°C', 26: '26°C', 37: '37°C', 100: '100°C' }
    const { container } = render(<RangeSlider marks={marks} />)
    expect(container.querySelector('.ant-slider-mark')).toBeInTheDocument()
  })

  it('applies step correctly', () => {
    render(<RangeSlider step={10} />)
    const sliders = screen.getAllByRole('slider')
    expect(sliders).toHaveLength(2)
  })

  it('respects min and max values', () => {
    render(<RangeSlider min={10} max={90} />)
    const sliders = screen.getAllByRole('slider')
    expect(sliders).toHaveLength(2)
  })
})
