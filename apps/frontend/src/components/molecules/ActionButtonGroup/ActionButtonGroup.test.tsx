import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { vi, expect, describe, it, beforeEach } from 'vitest'
import { ActionButtonGroup } from './ActionButtonGroup'
import type { ActionButton } from './ActionButtonGroup'

describe('ActionButtonGroup', () => {
  const mockActions: ActionButton[] = [
    {
      key: 'edit',
      label: 'Edit',
      onClick: vi.fn(),
      type: 'primary',
    },
    {
      key: 'delete',
      label: 'Delete',
      onClick: vi.fn(),
      danger: true,
    },
    {
      key: 'archive',
      label: 'Archive',
      onClick: vi.fn(),
      disabled: true,
    },
    {
      key: 'share',
      label: 'Share',
      onClick: vi.fn(),
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing when actions array is empty', () => {
    const { container } = render(<ActionButtonGroup actions={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders all visible actions when count is less than maxVisible', () => {
    const actions = mockActions.slice(0, 2)
    render(<ActionButtonGroup actions={actions} maxVisible={3} />)

    expect(screen.getByText('Edit')).toBeInTheDocument()
    expect(screen.getByText('Delete')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /more/i })
    ).not.toBeInTheDocument()
  })

  it('shows more menu when actions exceed maxVisible', () => {
    render(<ActionButtonGroup actions={mockActions} maxVisible={2} />)

    expect(screen.getByText('Edit')).toBeInTheDocument()
    expect(screen.getByText('Delete')).toBeInTheDocument()
    expect(screen.queryByText('Archive')).not.toBeInTheDocument()
    expect(screen.queryByText('Share')).not.toBeInTheDocument()

    // More button should be present
    const moreButton = document.querySelector('.action-button-group__more')
    expect(moreButton).toBeInTheDocument()
  })

  it('calls action onClick when button is clicked', async () => {
    const user = userEvent.setup()
    render(<ActionButtonGroup actions={mockActions.slice(0, 1)} />)

    const editButton = screen.getByText('Edit')
    await user.click(editButton)

    expect(mockActions[0].onClick).toHaveBeenCalled()
  })

  it('disables button when action is disabled', () => {
    const disabledAction = mockActions.find((a) => a.disabled)
    render(<ActionButtonGroup actions={[disabledAction!]} />)

    const button = screen.getByText('Archive').closest('button')
    expect(button).toBeDisabled()
  })

  it('applies danger styling to danger buttons', () => {
    const dangerAction = mockActions.find((a) => a.danger)
    render(<ActionButtonGroup actions={[dangerAction!]} />)

    const button = screen.getByText('Delete').closest('button')
    expect(button).toHaveClass('ant-btn-dangerous')
  })

  it('renders with different sizes', () => {
    const { rerender } = render(
      <ActionButtonGroup actions={mockActions.slice(0, 1)} size='small' />
    )

    expect(screen.getByText('Edit').closest('button')).toHaveClass('ant-btn-sm')

    rerender(
      <ActionButtonGroup actions={mockActions.slice(0, 1)} size='large' />
    )
    expect(screen.getByText('Edit').closest('button')).toHaveClass('ant-btn-lg')
  })

  it('renders in vertical direction', () => {
    render(
      <ActionButtonGroup
        actions={mockActions.slice(0, 2)}
        direction='vertical'
      />
    )

    const container = document.querySelector('.ant-space-vertical')
    expect(container).toBeInTheDocument()
  })

  it('shows dividers when split is true', () => {
    render(<ActionButtonGroup actions={mockActions.slice(0, 2)} split={true} />)

    const divider = document.querySelector('.ant-divider')
    expect(divider).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(
      <ActionButtonGroup
        actions={mockActions.slice(0, 1)}
        className='custom-group'
      />
    )

    expect(document.querySelector('.custom-group')).toBeInTheDocument()
  })

  it('shows loading state on buttons', () => {
    const loadingAction = { ...mockActions[0], loading: true }
    render(<ActionButtonGroup actions={[loadingAction]} />)

    const button = screen.getByText('Edit').closest('button')
    expect(button).toHaveClass('ant-btn-loading')
  })
})
