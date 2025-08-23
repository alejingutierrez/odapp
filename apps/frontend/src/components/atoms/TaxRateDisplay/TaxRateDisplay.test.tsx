import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { TaxRateDisplay } from './TaxRateDisplay'

describe('TaxRateDisplay', () => {
  it('renders with tax rate value', () => {
    render(<TaxRateDisplay rate={8.25} />)
    expect(screen.getByText('8.25%')).toBeInTheDocument()
  })

  it('applies variant styles correctly', () => {
    const { container } = render(<TaxRateDisplay rate={8.25} variant='badge' />)
    expect(
      container.querySelector('.oda-tax-rate-display--badge')
    ).toBeInTheDocument()
  })

  it('shows tax amount when provided', () => {
    render(<TaxRateDisplay rate={8.25} amount={8.25} />)
    expect(screen.getByText('$8.25')).toBeInTheDocument()
  })

  it('formats rate with two decimal places', () => {
    render(<TaxRateDisplay rate={8.2567} />)
    expect(screen.getByText('8.26%')).toBeInTheDocument()
  })

  it('shows region when provided in detailed variant', () => {
    render(
      <TaxRateDisplay rate={8.25} region='California' variant='detailed' />
    )
    expect(screen.getByText('California')).toBeInTheDocument()
  })

  it('applies size classes correctly', () => {
    const { container } = render(<TaxRateDisplay rate={8.25} size='large' />)
    expect(
      container.querySelector('.oda-tax-rate-display--large')
    ).toBeInTheDocument()
  })

  it('shows exempt status when tax is exempt', () => {
    render(
      <TaxRateDisplay
        rate={0}
        exempt={true}
        exemptReason='Non-profit organization'
      />
    )
    expect(screen.getByText('EXEMPT')).toBeInTheDocument()
  })
})
