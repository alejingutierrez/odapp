import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PriorityTag } from './PriorityTag'

describe('PriorityTag', () => {
  it('renders with correct priority text', () => {
    render(<PriorityTag priority='high' />)
    expect(screen.getByText('High')).toBeInTheDocument()
  })

  it('renders with custom text', () => {
    render(<PriorityTag priority='urgent' text='Critical Issue' />)
    expect(screen.getByText('Critical Issue')).toBeInTheDocument()
  })

  it('applies correct color for each priority', () => {
    const { rerender } = render(<PriorityTag priority='low' />)
    expect(document.querySelector('.ant-tag-green')).toBeInTheDocument()

    rerender(<PriorityTag priority='high' />)
    expect(document.querySelector('.ant-tag-orange')).toBeInTheDocument()

    rerender(<PriorityTag priority='urgent' />)
    expect(document.querySelector('.ant-tag-red')).toBeInTheDocument()
  })

  it('renders without icon when showIcon is false', () => {
    render(<PriorityTag priority='medium' showIcon={false} />)
    const tag = screen.getByText('Medium')
    expect(tag.querySelector('svg')).not.toBeInTheDocument()
  })

  it('renders with icon by default', () => {
    render(<PriorityTag priority='high' />)
    const tag = screen.getByText('High')
    expect(tag.querySelector('svg')).toBeInTheDocument()
  })
})
