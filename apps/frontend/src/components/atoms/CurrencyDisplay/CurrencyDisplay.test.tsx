import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CurrencyDisplay } from './CurrencyDisplay'

describe('CurrencyDisplay', () => {
  it('renders currency with default USD format', () => {
    render(<CurrencyDisplay amount={1234.56} />)
    expect(screen.getByText('$1,234.56')).toBeInTheDocument()
  })

  it('renders different currencies correctly', () => {
    const { rerender } = render(
      <CurrencyDisplay amount={1000} currency='EUR' />
    )
    expect(screen.getByText('€1,000.00')).toBeInTheDocument()

    rerender(<CurrencyDisplay amount={1000} currency='GBP' />)
    expect(screen.getByText('£1,000.00')).toBeInTheDocument()
  })

  it('renders without currency symbol when showSymbol is false', () => {
    render(<CurrencyDisplay amount={1234.56} showSymbol={false} />)
    expect(screen.getByText('1,234.56')).toBeInTheDocument()
  })

  it('applies custom precision', () => {
    render(<CurrencyDisplay amount={1234.5678} precision={0} />)
    expect(screen.getByText('$1,235')).toBeInTheDocument()
  })

  it('applies colorization for positive amounts', () => {
    render(<CurrencyDisplay amount={100} colorize />)
    const element = screen.getByText('$100.00')
    expect(element).toHaveClass('ant-typography-success')
  })

  it('applies colorization for negative amounts', () => {
    render(<CurrencyDisplay amount={-100} colorize />)
    const element = screen.getByText('-$100.00')
    expect(element).toHaveClass('ant-typography-danger')
  })

  it('does not apply colorization when colorize is false', () => {
    render(<CurrencyDisplay amount={100} colorize={false} />)
    const element = screen.getByText('$100.00')
    expect(element).not.toHaveClass('ant-typography-success')
  })

  describe('variants', () => {
    it('renders default variant correctly', () => {
      render(<CurrencyDisplay amount={1000} variant='default' />)
      expect(screen.getByText('$1,000.00')).toBeInTheDocument()
    })

    it('renders compact variant correctly', () => {
      render(<CurrencyDisplay amount={1000} variant='compact' />)
      expect(screen.getByText('$1,000.00')).toBeInTheDocument()
    })

    it('renders large variant correctly', () => {
      render(<CurrencyDisplay amount={1000} variant='large' />)
      expect(screen.getByText('$1,000.00')).toBeInTheDocument()
    })
  })

  describe('themes', () => {
    it('applies success theme correctly', () => {
      render(<CurrencyDisplay amount={1000} theme='success' />)
      expect(screen.getByText('$1,000.00')).toBeInTheDocument()
    })

    it('applies danger theme correctly', () => {
      render(<CurrencyDisplay amount={1000} theme='danger' />)
      expect(screen.getByText('$1,000.00')).toBeInTheDocument()
    })

    it('applies warning theme correctly', () => {
      render(<CurrencyDisplay amount={1000} theme='warning' />)
      expect(screen.getByText('$1,000.00')).toBeInTheDocument()
    })
  })

  describe('currency icons', () => {
    it('shows currency icon when showIcon is true', () => {
      const { container } = render(<CurrencyDisplay amount={1000} showIcon />)
      expect(container.querySelector('.anticon')).toBeInTheDocument()
    })

    it('hides currency icon when showIcon is false', () => {
      const { container } = render(
        <CurrencyDisplay amount={1000} showIcon={false} />
      )
      expect(container.querySelector('.anticon')).not.toBeInTheDocument()
    })

    it('shows different icons for different currencies', () => {
      const { container: usdContainer } = render(
        <CurrencyDisplay amount={1000} currency='USD' showIcon />
      )
      const { container: eurContainer } = render(
        <CurrencyDisplay amount={1000} currency='EUR' showIcon />
      )

      expect(usdContainer.querySelector('.anticon')).toBeInTheDocument()
      expect(eurContainer.querySelector('.anticon')).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('handles zero amount correctly', () => {
      render(<CurrencyDisplay amount={0} />)
      expect(screen.getByText('$0.00')).toBeInTheDocument()
    })

    it('handles very large numbers', () => {
      render(<CurrencyDisplay amount={1234567890.99} />)
      expect(screen.getByText('$1,234,567,890.99')).toBeInTheDocument()
    })

    it('handles very small numbers', () => {
      render(<CurrencyDisplay amount={0.01} />)
      expect(screen.getByText('$0.01')).toBeInTheDocument()
    })

    it('handles string amounts', () => {
      render(<CurrencyDisplay amount='1234.56' />)
      expect(screen.getByText('$1,234.56')).toBeInTheDocument()
    })
  })
})
