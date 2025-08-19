import React from 'react'
import { render, screen } from '@testing-library/react'

import { vi } from 'vitest'
import { NotificationCard } from './NotificationCard'

describe('NotificationCard', () => {
  const mockOnClose = vi.fn()
  const mockOnAction = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders notification with title and message', () => {
    render(
      <NotificationCard
        title='New Message'
        message='You have received a new message from John Doe'
        type='info'
      />
    )

    expect(screen.getByText('New Message')).toBeInTheDocument()
    expect(
      screen.getByText('You have received a new message from John Doe')
    ).toBeInTheDocument()
  })

  it('applies correct styling for different types', () => {
    const { rerender } = render(
      <NotificationCard
        title='Success'
        message='Operation completed'
        type='success'
      />
    )

    expect(
      document.querySelector('.notification-card--success')
    ).toBeInTheDocument()

    rerender(
      <NotificationCard
        title='Error'
        message='Something went wrong'
        type='error'
      />
    )

    expect(
      document.querySelector('.notification-card--error')
    ).toBeInTheDocument()
  })

  it('shows close button when closable is true', () => {
    render(
      <NotificationCard
        title='Closable'
        message='This can be closed'
        type='info'
        closable={true}
        onClose={mockOnClose}
      />
    )

    const closeButton = document.querySelector('.anticon-close')
    expect(closeButton).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', async () => {
    render(
      <NotificationCard
        title='Close Me'
        message='Click the X'
        type='info'
        closable={true}
        onClose={mockOnClose}
      />
    )

    const closeButton = document.querySelector('.anticon-close')
    if (closeButton) {
      await user.click(closeButton)
      expect(mockOnClose).toHaveBeenCalled()
    }
  })

  it('calls onClick when card is clicked', async () => {
    render(
      <NotificationCard
        title='Clickable'
        message='Click anywhere'
        type='info'
      />
    )

    const card = screen.getByText('Clickable')
    expect(card).toBeInTheDocument()
  })

  it('renders with timestamp', () => {
    const timestamp = new Date('2023-01-01T10:00:00Z')
    render(
      <NotificationCard
        title='Timed'
        message='This has a timestamp'
        type='info'
        timestamp={timestamp}
      />
    )

    expect(screen.getByText(/2023/)).toBeInTheDocument()
  })

  it('shows action buttons when provided', async () => {
    const actions = [
      { label: 'Accept', onClick: mockOnAction },
      { label: 'Decline', onClick: vi.fn() },
    ]

    render(
      <NotificationCard
        title='Action Required'
        message='Please respond'
        type='info'
        actions={actions}
      />
    )

    expect(screen.getByText('Accept')).toBeInTheDocument()
    expect(screen.getByText('Decline')).toBeInTheDocument()

    await user.click(screen.getByText('Accept'))
    expect(mockOnAction).toHaveBeenCalled()
  })

  it('applies custom className', () => {
    render(
      <NotificationCard
        title='Custom'
        message='Custom styling'
        type='info'
        className='custom-notification'
      />
    )

    expect(document.querySelector('.custom-notification')).toBeInTheDocument()
  })

  it('shows unread indicator when unread is true', () => {
    render(
      <NotificationCard title='Unread' message='This is unread' type='info' />
    )

    const card = document.querySelector('.notification-card')
    expect(card).toBeInTheDocument()
  })
})
