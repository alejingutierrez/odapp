import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, beforeEach, expect } from 'vitest'
import { FilterPanel } from './FilterPanel'

describe('FilterPanel', () => {
  const mockSections = [
    {
      key: 'status',
      title: 'Status',
      content: <div>Status filters</div>,
      defaultExpanded: true
    },
    {
      key: 'category', 
      title: 'Category',
      content: <div>Category filters</div>,
      defaultExpanded: true
    }
  ]

  const mockOnClearAll = vi.fn()
  const mockOnApply = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders filter panel with sections', () => {
    render(
      <FilterPanel 
        sections={mockSections}
      />
    )
    
    expect(screen.getByText('Status')).toBeInTheDocument()
    expect(screen.getByText('Category')).toBeInTheDocument()
  })

  it('renders filter panel title', () => {
    render(
      <FilterPanel 
        sections={mockSections}
        title="Custom Filters"
      />
    )
    
    expect(screen.getByText('Custom Filters')).toBeInTheDocument()
  })

  it('calls onApply when apply button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <FilterPanel 
        sections={mockSections}
        showApplyButton={true}
        activeFiltersCount={2}
        onApply={mockOnApply}
      />
    )
    
    const applyButton = screen.getByText('Apply Filters (2)')
    await user.click(applyButton)
    
    expect(mockOnApply).toHaveBeenCalled()
  })

  it('shows clear all button when showClearAll is true and has active filters', () => {
    render(
      <FilterPanel 
        sections={mockSections}
        showClearAll={true}
        activeFiltersCount={3}
        onClearAll={mockOnClearAll}
      />
    )
    
    expect(screen.getByText('Clear All')).toBeInTheDocument()
  })

  it('calls onClearAll when clear all button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <FilterPanel 
        sections={mockSections}
        showClearAll={true}
        activeFiltersCount={3}
        onClearAll={mockOnClearAll}
      />
    )
    
    const clearButton = screen.getByText('Clear All')
    await user.click(clearButton)
    
    expect(mockOnClearAll).toHaveBeenCalled()
  })

  it('renders collapsible panel when collapsible is true', () => {
    render(
      <FilterPanel 
        sections={mockSections}
        collapsible={true}
        title="Filters"
      />
    )
    
    expect(screen.getByText('Filters')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(
      <FilterPanel 
        sections={mockSections}
        className="custom-filter-panel"
      />
    )
    
    expect(document.querySelector('.custom-filter-panel')).toBeInTheDocument()
  })

  it('renders section content correctly', () => {
    render(
      <FilterPanel 
        sections={mockSections}
      />
    )
    
    expect(screen.getByText('Status filters')).toBeInTheDocument()
    expect(screen.getByText('Category filters')).toBeInTheDocument()
  })

  it('shows apply button when showApplyButton is true', () => {
    render(
      <FilterPanel 
        sections={mockSections}
        showApplyButton={true}
        activeFiltersCount={1}
        onApply={mockOnApply}
      />
    )
    
    expect(screen.getByText('Apply Filters (1)')).toBeInTheDocument()
  })
})
