import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { TrendIndicator } from './TrendIndicator'

describe('TrendIndicator', () => {
  it('renders with trend score', () => {
    render(<TrendIndicator title='Fashion Trend' score={85} direction='up' />)
    expect(screen.getByText('85')).toBeInTheDocument()
  })

  it('shows positive trend correctly', () => {
    const { container } = render(
      <TrendIndicator title='Test' score={75} direction='up' />
    )
    expect(
      container.querySelector('.oda-trend-indicator--up')
    ).toBeInTheDocument()
    expect(
      container.querySelector('[data-testid*="arrow"]')
    ).toBeInTheDocument()
  })

  it('shows negative trend correctly', () => {
    const { container } = render(
      <TrendIndicator title='Test' score={25} direction='down' />
    )
    expect(
      container.querySelector('.oda-trend-indicator--down')
    ).toBeInTheDocument()
    expect(
      container.querySelector('[data-testid*="arrow"]')
    ).toBeInTheDocument()
  })

  it('shows stable trend correctly', () => {
    const { container } = render(
      <TrendIndicator title='Test' score={50} direction='stable' />
    )
    expect(
      container.querySelector('.oda-trend-indicator--stable')
    ).toBeInTheDocument()
  })

  it('applies size variants correctly', () => {
    const { container } = render(
      <TrendIndicator title='Test' score={60} direction='up' size='large' />
    )
    expect(
      container.querySelector('.oda-trend-indicator--large')
    ).toBeInTheDocument()
  })

  it('shows velocity correctly', () => {
    render(
      <TrendIndicator title='Test' score={70} direction='up' velocity={12.5} />
    )
    expect(screen.getByText('+12.5%')).toBeInTheDocument()
  })

  it('shows custom title when provided', () => {
    render(<TrendIndicator title='Growth Trend' score={80} direction='up' />)
    expect(screen.getByText('Growth Trend')).toBeInTheDocument()
  })

  it('applies category classes correctly', () => {
    const { container } = render(
      <TrendIndicator
        title='Test'
        score={60}
        direction='up'
        category='fashion'
      />
    )
    expect(
      container.querySelector('.oda-trend-indicator--fashion')
    ).toBeInTheDocument()
  })
})
