import React from 'react'
import { render, screen } from '@testing-library/react'
import { StatusIndicator } from './StatusIndicator'

describe('StatusIndicator', () => {
  it('renders with success status', () => {
    render(<StatusIndicator status='success' />)

    expect(screen.getByText('Success')).toBeInTheDocument()
  })

  it('renders with custom text', () => {
    render(<StatusIndicator status='processing' text='In Progress' />)

    expect(screen.getByText('In Progress')).toBeInTheDocument()
  })

  it('shows tooltip when provided', () => {
    render(
      <StatusIndicator
        status='warning'
        text='Warning'
        tooltip='This is a warning message'
      />
    )

    const indicator = screen.getByText('Warning')
    // Check that the tooltip prop is passed correctly by verifying the element has aria-describedby
    expect(indicator.closest('[aria-describedby]')).toBeInTheDocument()
  })

  it('renders with dot style when showDot is true', () => {
    render(<StatusIndicator status='success' showDot={true} />)

    expect(document.querySelector('.ant-badge-status-dot')).toBeInTheDocument()
  })

  it('hides icon when showIcon is false', () => {
    render(<StatusIndicator status='success' showIcon={false} />)

    expect(
      document.querySelector('.status-indicator__icon')
    ).not.toBeInTheDocument()
  })

  it('applies animation when animated is true and status is processing', () => {
    render(<StatusIndicator status='processing' animated={true} />)

    const icon = document.querySelector('.status-indicator__icon--spinning')
    expect(icon).toBeInTheDocument()
  })

  it('renders different status types correctly', () => {
    const statuses = [
      'success',
      'error',
      'warning',
      'pending',
      'cancelled',
    ] as const

    statuses.forEach((status) => {
      const { unmount } = render(<StatusIndicator status={status} />)

      const icon = document.querySelector(`.status-indicator__icon--${status}`)
      expect(icon).toBeInTheDocument()

      unmount()
    })
  })

  it('applies size classes correctly', () => {
    const { rerender } = render(
      <StatusIndicator status='success' size='small' />
    )

    expect(
      document.querySelector('.status-indicator__text--small')
    ).toBeInTheDocument()

    rerender(<StatusIndicator status='success' size='large' />)
    expect(
      document.querySelector('.status-indicator__text--large')
    ).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<StatusIndicator status='success' className='custom-status' />)

    expect(document.querySelector('.custom-status')).toBeInTheDocument()
  })
})
