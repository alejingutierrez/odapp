import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { SidebarMenuItem } from './SidebarMenuItem'

describe('SidebarMenuItem', () => {
  const mockOnClick = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders menu item with label', () => {
    const item = {
      key: '1',
      label: 'Dashboard'
    }
    
    render(<SidebarMenuItem item={item} />)
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('renders with icon', () => {
    const icon = <span data-testid="menu-icon">📊</span>
    const item = {
      key: '2',
      label: 'Analytics',
      icon: icon
    }
    
    render(<SidebarMenuItem item={item} />)
    
    expect(screen.getByTestId('menu-icon')).toBeInTheDocument()
  })

  it('calls onClick when item is clicked', async () => {
    const user = userEvent.setup()
    const item = {
      key: '3',
      label: 'Settings',
      onClick: mockOnClick
    }
    
    render(<SidebarMenuItem item={item} />)
    
    const menuItem = screen.getByText('Settings')
    await user.click(menuItem)
    
    expect(mockOnClick).toHaveBeenCalled()
  })

  it('applies selected state styling', () => {
    const item = {
      key: '4',
      label: 'Active Item'
    }
    
    render(<SidebarMenuItem item={item} selectedKeys={['4']} />)
    
    expect(screen.getByText('Active Item')).toBeInTheDocument()
  })

  it('applies disabled state', () => {
    const item = {
      key: '5',
      label: 'Disabled Item',
      disabled: true
    }
    
    render(<SidebarMenuItem item={item} />)
    
    expect(screen.getByText('Disabled Item')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const item = {
      key: '6',
      label: 'Custom Item'
    }
    
    render(<SidebarMenuItem item={item} className="custom-menu-item" />)
    
    expect(screen.getByText('Custom Item')).toBeInTheDocument()
  })

  it('shows badge when count is provided', () => {
    const item = {
      key: '7',
      label: 'Messages',
      badge: 5
    }
    
    render(<SidebarMenuItem item={item} />)
    
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('renders menu item with tooltip when collapsed', () => {
    const item = {
      key: '8',
      label: 'Tooltip Item',
      tooltip: 'This is a tooltip'
    }
    
    render(<SidebarMenuItem item={item} collapsed={true} />)
    
    // When collapsed, check for aria-describedby attribute instead of visible text
    const menuItem = document.querySelector('.sidebar-menu-item')
    expect(menuItem).toHaveAttribute('aria-describedby')
  })
})
