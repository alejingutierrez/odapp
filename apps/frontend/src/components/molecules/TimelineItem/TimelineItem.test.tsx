import React from 'react'
import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { TimelineItem } from './TimelineItem'

describe('TimelineItem', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders timeline item with title and description', () => {
    const item = {
      id: '1',
      type: 'order-created' as const,
      title: 'Order Placed',
      description: 'Your order has been successfully placed',
      timestamp: new Date('2023-01-01T10:00:00Z'),
    }

    render(<TimelineItem item={item} />)

    expect(screen.getByText('Order Placed')).toBeInTheDocument()
    expect(
      screen.getByText('Your order has been successfully placed')
    ).toBeInTheDocument()
  })

  it('displays timestamp correctly', () => {
    const item = {
      id: '2',
      type: 'custom' as const,
      title: 'Event',
      timestamp: new Date('2023-01-01T10:00:00Z'),
    }

    render(<TimelineItem item={item} />)

    expect(screen.getByText(/2023/)).toBeInTheDocument()
  })

  it('renders with icon', () => {
    const item = {
      id: '3',
      type: 'order-shipped' as const,
      title: 'Shipped',
      timestamp: new Date(),
    }

    render(<TimelineItem item={item} />)

    expect(screen.getByText('Shipped')).toBeInTheDocument()
  })

  it('applies different status colors', () => {
    const successItem = {
      id: '4',
      type: 'custom' as const,
      title: 'Success Event',
      status: 'success' as const,
      timestamp: new Date(),
    }

    const { rerender } = render(<TimelineItem item={successItem} />)

    expect(screen.getByText('Success Event')).toBeInTheDocument()

    const errorItem = {
      id: '5',
      type: 'custom' as const,
      title: 'Error Event',
      status: 'error' as const,
      timestamp: new Date(),
    }

    rerender(<TimelineItem item={errorItem} />)

    expect(screen.getByText('Error Event')).toBeInTheDocument()
  })

  it('renders clickable timeline item', async () => {
    const item = {
      id: '6',
      type: 'custom' as const,
      title: 'Clickable Event',
      timestamp: new Date(),
    }

    render(<TimelineItem item={item} />)

    expect(screen.getByText('Clickable Event')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const item = {
      id: '7',
      type: 'custom' as const,
      title: 'Custom Event',
      timestamp: new Date(),
    }

    render(<TimelineItem item={item} className='custom-timeline-item' />)

    expect(screen.getByText('Custom Event')).toBeInTheDocument()
  })
})
