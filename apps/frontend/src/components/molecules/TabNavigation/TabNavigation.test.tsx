import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { TabNavigation } from './TabNavigation'

describe('TabNavigation', () => {
  const mockTabs = [
    { key: 'tab1', label: 'Tab 1', content: <div>Content 1</div> },
    { key: 'tab2', label: 'Tab 2', content: <div>Content 2</div> },
    {
      key: 'tab3',
      label: 'Tab 3',
      content: <div>Content 3</div>,
      disabled: true,
    },
  ]

  const mockOnTabChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders tab navigation with all tabs', () => {
    render(<TabNavigation items={mockTabs} onChange={mockOnTabChange} />)

    expect(screen.getByText('Tab 1')).toBeInTheDocument()
    expect(screen.getByText('Tab 2')).toBeInTheDocument()
    expect(screen.getByText('Tab 3')).toBeInTheDocument()
  })

  it('shows content for active tab', () => {
    render(
      <TabNavigation
        items={mockTabs}
        activeKey='tab1'
        onChange={mockOnTabChange}
      />
    )

    expect(screen.getByText('Content 1')).toBeInTheDocument()
  })

  it('calls onChange when tab is clicked', async () => {
    const user = userEvent.setup()
    render(<TabNavigation items={mockTabs} onChange={mockOnTabChange} />)

    const tab2 = screen.getByText('Tab 2')
    await user.click(tab2)

    expect(mockOnTabChange).toHaveBeenCalledWith('tab2')
  })

  it('disables disabled tabs', () => {
    render(<TabNavigation items={mockTabs} onChange={mockOnTabChange} />)

    const tab3 = screen.getByText('Tab 3')
    expect(tab3.closest('.ant-tabs-tab')).toHaveClass('ant-tabs-tab-disabled')
  })

  it('applies custom className', () => {
    render(
      <TabNavigation
        items={mockTabs}
        onChange={mockOnTabChange}
        className='custom-tab-navigation'
      />
    )

    expect(document.querySelector('.custom-tab-navigation')).toBeInTheDocument()
  })

  it('renders with different tab positions', () => {
    const { rerender } = render(
      <TabNavigation
        items={mockTabs}
        onChange={mockOnTabChange}
        position='top'
      />
    )

    expect(document.querySelector('.ant-tabs-top')).toBeInTheDocument()

    rerender(
      <TabNavigation
        items={mockTabs}
        onChange={mockOnTabChange}
        position='left'
      />
    )

    expect(document.querySelector('.ant-tabs-left')).toBeInTheDocument()
  })
})
