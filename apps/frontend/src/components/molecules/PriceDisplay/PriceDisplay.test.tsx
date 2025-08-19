import React from 'react'
import { render, screen } from '@testing-library/react'
import { PriceDisplay } from './PriceDisplay'

describe('PriceDisplay', () => {
  it('renders basic price', () => {
    render(<PriceDisplay price={29.99} />)
    
    expect(screen.getByText('$29.99')).toBeInTheDocument()
  })

  it('renders price with compare at price', () => {
    render(<PriceDisplay price={29.99} compareAtPrice={39.99} />)
    
    expect(screen.getByText('$29.99')).toBeInTheDocument()
    expect(screen.getByText('$39.99')).toBeInTheDocument()
  })

  it('calculates and displays discount percentage', () => {
    render(<PriceDisplay price={30} compareAtPrice={40} showDiscount={true} />)
    
    expect(screen.getByText('-25%')).toBeInTheDocument()
    expect(screen.getByText('Save $10.00')).toBeInTheDocument()
  })

  it('hides discount when showDiscount is false', () => {
    render(<PriceDisplay price={30} compareAtPrice={40} showDiscount={false} />)
    
    expect(screen.queryByText('-25%')).not.toBeInTheDocument()
    expect(screen.queryByText('Save $10.00')).not.toBeInTheDocument()
  })

  it('displays tax information when showTax is true', () => {
    render(
      <PriceDisplay 
        price={100} 
        showTax={true} 
        taxRate={10} 
        taxIncluded={true} 
      />
    )
    
    expect(screen.getByText(/Incl\. tax \(10%\)/)).toBeInTheDocument()
  })

  it('formats price without currency when showCurrency is false', () => {
    render(<PriceDisplay price={29.99} showCurrency={false} />)
    
    expect(screen.getByText('29.99')).toBeInTheDocument()
    expect(screen.queryByText('$29.99')).not.toBeInTheDocument()
  })

  it('uses custom currency and locale', () => {
    render(
      <PriceDisplay 
        price={29.99} 
        currency="EUR" 
        locale="de-DE" 
      />
    )
    
    expect(screen.getByText('29,99 €')).toBeInTheDocument()
  })

  it('renders in vertical layout', () => {
    render(
      <PriceDisplay 
        price={29.99} 
        compareAtPrice={39.99} 
        layout="vertical" 
      />
    )
    
    expect(document.querySelector('.price-display--vertical')).toBeInTheDocument()
  })

  it('applies size classes correctly', () => {
    const { rerender } = render(<PriceDisplay price={29.99} size="small" />)
    
    expect(document.querySelector('.price-display--small')).toBeInTheDocument()
    
    rerender(<PriceDisplay price={29.99} size="large" />)
    expect(document.querySelector('.price-display--large')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<PriceDisplay price={29.99} className="custom-price" />)
    
    expect(document.querySelector('.custom-price')).toBeInTheDocument()
  })

  it('handles zero price correctly', () => {
    render(<PriceDisplay price={0} />)
    
    expect(screen.getByText('$0.00')).toBeInTheDocument()
  })

  it('handles large numbers correctly', () => {
    render(<PriceDisplay price={1234567.89} />)
    
    expect(screen.getByText('$1,234,567.89')).toBeInTheDocument()
  })
})