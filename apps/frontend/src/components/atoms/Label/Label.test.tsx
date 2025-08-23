import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Label } from './Label'

describe('Label', () => {
  it('renders with text', () => {
    render(<Label>Test Label</Label>)
    expect(screen.getByText('Test Label')).toBeInTheDocument()
  })

  it('applies required indicator', () => {
    const { container } = render(<Label required>Required Field</Label>)
    expect(container.querySelector('.oda-label__required')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(<Label className='custom-label'>Test</Label>)
    expect(container.firstChild).toHaveClass('custom-label')
  })

  it('renders with htmlFor attribute', () => {
    const { container } = render(<Label htmlFor='input-id'>Label Text</Label>)
    const label = container.querySelector('label')
    expect(label).toHaveAttribute('for', 'input-id')
  })

  it('renders label text correctly', () => {
    render(<Label>Label with Help</Label>)
    expect(screen.getByText('Label with Help')).toBeInTheDocument()
  })
})
