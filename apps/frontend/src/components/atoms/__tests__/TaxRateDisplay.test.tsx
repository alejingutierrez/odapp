
import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import { TaxRateDisplay } from '../TaxRateDisplay'

describe('TaxRateDisplay', () => {
  it('renders tax rate correctly', () => {
    render(<TaxRateDisplay rate={8.25} />)
    expect(screen.getByText('8.25%')).toBeInTheDocument()
  })

  it('renders tax amount when provided', () => {
    render(<TaxRateDisplay rate={8.25} amount={16.5} currency='$' />)
    expect(screen.getByText('8.25%')).toBeInTheDocument()
    expect(screen.getByText('$16.50')).toBeInTheDocument()
  })

  it('shows tax exempt state', () => {
    render(<TaxRateDisplay rate={0} exempt exemptReason='Non-profit' />)
    expect(screen.getByText('EXEMPT')).toBeInTheDocument()
  })

  it('handles click events', () => {
    const handleClick = vi.fn()
    render(<TaxRateDisplay rate={8.25} onClick={handleClick} />)

    fireEvent.click(screen.getByText('8.25%'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('renders compact variant', () => {
    const { container } = render(
      <TaxRateDisplay rate={8.25} amount={16.5} variant='compact' label='Tax' />
    )
    expect(
      container.querySelector('.oda-tax-rate-display--compact')
    ).toBeInTheDocument()
    expect(screen.getByText('Tax:')).toBeInTheDocument()
  })

  it('renders detailed variant with region', () => {
    const { container } = render(
      <TaxRateDisplay
        rate={8.25}
        variant='detailed'
        region='CA, USA'
        inclusive
      />
    )
    expect(
      container.querySelector('.oda-tax-rate-display--detailed')
    ).toBeInTheDocument()
    expect(screen.getByText('CA, USA')).toBeInTheDocument()
    expect(screen.getByText('Tax included in price')).toBeInTheDocument()
  })

  it('renders badge variant', () => {
    const { container } = render(<TaxRateDisplay rate={8.25} variant='badge' />)
    expect(
      container.querySelector('.oda-tax-rate-display--badge')
    ).toBeInTheDocument()
  })

  it('applies size classes correctly', () => {
    const { container } = render(<TaxRateDisplay rate={8.25} size='large' />)
    expect(
      container.querySelector('.oda-tax-rate-display--large')
    ).toBeInTheDocument()
  })

  it('shows breakdown tooltip when provided', () => {
    const breakdown = [
      { name: 'State Tax', rate: 5.0, amount: 10.0, type: 'state' as const },
      { name: 'Local Tax', rate: 3.25, amount: 6.5, type: 'local' as const },
    ]

    render(
      <TaxRateDisplay
        rate={8.25}
        amount={16.5}
        breakdown={breakdown}
        showBreakdown
      />
    )

    expect(screen.getByText('8.25%')).toBeInTheDocument()
  })
})
