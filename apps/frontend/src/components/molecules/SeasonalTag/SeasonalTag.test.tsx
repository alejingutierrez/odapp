import { render, screen } from '@testing-library/react'
import { vi, expect } from 'vitest'
import { SeasonalTag } from './SeasonalTag'

// Mock Ant Design icons
vi.mock('@ant-design/icons', () => ({
  SunOutlined: () => <span data-testid='sun-icon' />,
  CloudOutlined: () => <span data-testid='cloud-icon' />,
  SnowflakeOutlined: () => <span data-testid='snowflake-icon' />,
  LeafOutlined: () => <span data-testid='leaf-icon' />,
  FireOutlined: () => <span data-testid='fire-icon' />,
  TrendingUpOutlined: () => <span data-testid='trending-icon' />,
}))

describe('SeasonalTag', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders seasonal tag with season', () => {
    render(<SeasonalTag season='spring' />)

    expect(screen.getByText('Spring')).toBeInTheDocument()
  })

  it('applies correct styling for different seasons', () => {
    const { rerender } = render(<SeasonalTag season='summer' />)

    expect(document.querySelector('.seasonal-tag--summer')).toBeInTheDocument()

    rerender(<SeasonalTag season='winter' />)
    expect(document.querySelector('.seasonal-tag--winter')).toBeInTheDocument()
  })

  it('renders tag with trend indicator', () => {
    render(
      <SeasonalTag
        season='autumn'
        trendLevel='trending'
        showTrendIndicator={true}
      />
    )

    expect(screen.getByText('Autumn')).toBeInTheDocument()
    expect(screen.getByTestId('fire-icon')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<SeasonalTag season='spring' className='custom-seasonal-tag' />)

    expect(document.querySelector('.custom-seasonal-tag')).toBeInTheDocument()
  })

  it('shows year when provided', () => {
    render(<SeasonalTag season='spring' year={2024} />)

    expect(screen.getByText('Spring 2024')).toBeInTheDocument()
  })
})
