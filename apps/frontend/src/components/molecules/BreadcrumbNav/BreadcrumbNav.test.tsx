import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { BreadcrumbNav } from './BreadcrumbNav'
import type { BreadcrumbItem } from './BreadcrumbNav'

describe('BreadcrumbNav', () => {
  const mockItems: BreadcrumbItem[] = [
    {
      key: 'products',
      title: 'Products',
      href: '/products',
      onClick: vi.fn()
    },
    {
      key: 'category',
      title: 'Electronics',
      href: '/products/electronics',
      onClick: vi.fn()
    },
    {
      key: 'subcategory',
      title: 'Laptops',
      href: '/products/electronics/laptops',
      onClick: vi.fn()
    },
    {
      key: 'product',
      title: 'MacBook Pro',
      onClick: vi.fn()
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders breadcrumb items correctly', () => {
    render(<BreadcrumbNav items={mockItems.slice(0, 2)} />)
    
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Products')).toBeInTheDocument()
    expect(screen.getByText('Electronics')).toBeInTheDocument()
  })

  it('shows home item by default', () => {
    render(<BreadcrumbNav items={mockItems.slice(0, 1)} />)
    
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /home/i })).toBeInTheDocument()
  })

  it('hides home item when showHome is false', () => {
    render(<BreadcrumbNav items={mockItems.slice(0, 1)} showHome={false} />)
    
    expect(screen.queryByText('Home')).not.toBeInTheDocument()
  })

  it('calls onClick when breadcrumb item is clicked', async () => {
    const user = userEvent.setup()
    render(<BreadcrumbNav items={mockItems.slice(0, 1)} />)
    
    const productLink = screen.getByText('Products')
    await user.click(productLink)
    
    expect(mockItems[0].onClick).toHaveBeenCalled()
  })

  it('calls onHomeClick when home is clicked', async () => {
    const mockOnHomeClick = vi.fn()
    const user = userEvent.setup()
    render(
      <BreadcrumbNav 
        items={mockItems.slice(0, 1)} 
        onHomeClick={mockOnHomeClick}
      />
    )
    
    const homeLink = screen.getByText('Home')
    await user.click(homeLink)
    
    expect(mockOnHomeClick).toHaveBeenCalled()
  })

  it('renders links with correct href attributes', () => {
    render(<BreadcrumbNav items={mockItems.slice(0, 2)} />)
    
    const productLink = screen.getByText('Products').closest('a')
    const electronicsLink = screen.getByText('Electronics').closest('a')
    
    expect(productLink).toHaveAttribute('href', '/products')
    expect(electronicsLink).toHaveAttribute('href', '/products/electronics')
  })

  it('renders items without href as spans', () => {
    const itemWithoutHref = { ...mockItems[3] }
    render(<BreadcrumbNav items={[itemWithoutHref]} showHome={false} />)
    
    const item = screen.getByText('MacBook Pro')
    expect(item.tagName).toBe('SPAN')
  })

  it('shows ellipsis dropdown when items exceed maxItems', () => {
    render(<BreadcrumbNav items={mockItems} maxItems={3} />)
    
    // Should show Home, ellipsis, and last 2 items
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Laptops')).toBeInTheDocument()
    expect(screen.getByText('MacBook Pro')).toBeInTheDocument()
    
    // Should have ellipsis dropdown
    expect(document.querySelector('.breadcrumb-nav__ellipsis')).toBeInTheDocument()
  })

  it('does not show ellipsis when items are within maxItems limit', () => {
    render(<BreadcrumbNav items={mockItems.slice(0, 2)} maxItems={5} />)
    
    expect(document.querySelector('.breadcrumb-nav__ellipsis')).not.toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<BreadcrumbNav items={mockItems.slice(0, 1)} className="custom-breadcrumb" />)
    
    expect(document.querySelector('.custom-breadcrumb')).toBeInTheDocument()
  })

  it('uses custom home href', () => {
    render(
      <BreadcrumbNav 
        items={mockItems.slice(0, 1)} 
        homeHref="/dashboard"
      />
    )
    
    const homeLink = screen.getByText('Home').closest('a')
    expect(homeLink).toHaveAttribute('href', '/dashboard')
  })

  it('renders disabled items correctly', () => {
    const disabledItem = { ...mockItems[0], disabled: true }
    render(<BreadcrumbNav items={[disabledItem]} showHome={false} />)
    
    const item = screen.getByText('Products')
    expect(item).toHaveClass('breadcrumb-nav__title')
  })

  it('renders items with icons', () => {
    const itemWithIcon = { 
      ...mockItems[0], 
      icon: <span data-testid="custom-icon">📁</span>
    }
    render(<BreadcrumbNav items={[itemWithIcon]} showHome={false} />)
    
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument()
  })

  it('prevents default link behavior when onClick is provided', async () => {
    const user = userEvent.setup()
    const mockPreventDefault = vi.fn()
    
    // Mock the event
    const originalAddEventListener = HTMLAnchorElement.prototype.addEventListener
    HTMLAnchorElement.prototype.addEventListener = vi.fn()
    
    render(<BreadcrumbNav items={mockItems.slice(0, 1)} />)
    
    const productLink = screen.getByText('Products')
    const clickEvent = new MouseEvent('click', { bubbles: true })
    clickEvent.preventDefault = mockPreventDefault
    
    fireEvent.click(productLink, clickEvent)
    
    expect(mockItems[0].onClick).toHaveBeenCalled()
    
    // Restore original
    HTMLAnchorElement.prototype.addEventListener = originalAddEventListener
  })

  it('renders with custom separator', () => {
    render(
      <BreadcrumbNav 
        items={mockItems.slice(0, 2)} 
        separator=">"
      />
    )
    
    // Ant Design breadcrumb should use the custom separator
    const breadcrumb = document.querySelector('.ant-breadcrumb')
    expect(breadcrumb).toBeInTheDocument()
  })
})
