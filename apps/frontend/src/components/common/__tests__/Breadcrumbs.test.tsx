import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Breadcrumbs } from '../Breadcrumbs'

const renderWithRouter = (initialEntries: string[] = ['/']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Breadcrumbs />
    </MemoryRouter>
  )
}

describe('Breadcrumbs', () => {
  it('should not render on home page', () => {
    const { container } = renderWithRouter(['/'])
    expect(container.firstChild).toBeNull()
  })

  it('should render breadcrumbs for products page', () => {
    renderWithRouter(['/products'])

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Products')).toBeInTheDocument()
  })

  it('should render breadcrumbs for nested product pages', () => {
    renderWithRouter(['/products/create'])

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Products')).toBeInTheDocument()
    expect(screen.getByText('Create Product')).toBeInTheDocument()
  })

  it('should render breadcrumbs for inventory pages', () => {
    renderWithRouter(['/inventory/adjustments'])

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Inventory')).toBeInTheDocument()
    expect(screen.getByText('Adjustments')).toBeInTheDocument()
  })

  it('should render breadcrumbs for analytics pages', () => {
    renderWithRouter(['/analytics/sales'])

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Analytics')).toBeInTheDocument()
    expect(screen.getByText('Sales Analytics')).toBeInTheDocument()
  })

  it('should handle dynamic routes with proper capitalization', () => {
    renderWithRouter(['/products/123'])

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Products')).toBeInTheDocument()
    expect(screen.getByText('123')).toBeInTheDocument()
  })

  it('should render breadcrumbs for settings pages', () => {
    renderWithRouter(['/settings/users'])

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
    expect(screen.getByText('Users')).toBeInTheDocument()
  })

  it('should render breadcrumbs for shopify pages', () => {
    renderWithRouter(['/shopify/products'])

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Shopify')).toBeInTheDocument()
    expect(screen.getByText('Products')).toBeInTheDocument()
  })
})
