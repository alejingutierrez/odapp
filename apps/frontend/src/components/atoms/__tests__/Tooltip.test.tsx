import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Tooltip } from '../Tooltip'

describe('Tooltip', () => {
  it('renders children correctly', () => {
    render(
      <Tooltip content='Test tooltip'>
        <button>Hover me</button>
      </Tooltip>
    )

    expect(screen.getByRole('button', { name: 'Hover me' })).toBeInTheDocument()
  })

  it('shows tooltip on hover', async () => {
    render(
      <Tooltip content='Test tooltip content'>
        <button>Hover me</button>
      </Tooltip>
    )

    const button = screen.getByRole('button', { name: 'Hover me' })
    fireEvent.mouseEnter(button)

    await waitFor(() => {
      expect(screen.getByText('Test tooltip content')).toBeInTheDocument()
    })
  })

  it('applies variant classes correctly', async () => {
    render(
      <Tooltip content='Error tooltip' variant='error'>
        <button>Hover me</button>
      </Tooltip>
    )

    const button = screen.getByRole('button')
    fireEvent.mouseEnter(button)

    await waitFor(() => {
      const errorTooltip = document.querySelector('.oda-tooltip--error')
      expect(errorTooltip).toBeInTheDocument()
    })
  })

  it('supports rich content', async () => {
    const richContent = (
      <div>
        <h4>Title</h4>
        <p>Description</p>
      </div>
    )

    render(
      <Tooltip content={richContent} richContent>
        <button>Hover me</button>
      </Tooltip>
    )

    const button = screen.getByRole('button')
    fireEvent.mouseEnter(button)

    await waitFor(() => {
      expect(screen.getByText('Title')).toBeInTheDocument()
      expect(screen.getByText('Description')).toBeInTheDocument()
    })
  })

  it('respects delay props', async () => {
    render(
      <Tooltip content='Delayed tooltip' showDelay={500}>
        <button>Hover me</button>
      </Tooltip>
    )

    const button = screen.getByRole('button')
    fireEvent.mouseEnter(button)

    // Should not appear immediately
    expect(screen.queryByText('Delayed tooltip')).not.toBeInTheDocument()

    // Should appear after delay
    await waitFor(
      () => {
        expect(screen.getByText('Delayed tooltip')).toBeInTheDocument()
      },
      { timeout: 600 }
    )
  })
})
