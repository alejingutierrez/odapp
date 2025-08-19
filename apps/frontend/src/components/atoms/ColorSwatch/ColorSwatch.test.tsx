import { describe, it, expect, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { ColorSwatch, ColorPalette } from './ColorSwatch'
import { render, checkAccessibility } from '../../../test/test-utils'

describe('ColorSwatch Component', () => {
  it('renders with color', () => {
    const { container } = render(<ColorSwatch color="#ff0000" name="Red" />)
    const swatch = container.querySelector('.oda-color-swatch')
    expect(swatch).toHaveStyle('background-color: rgb(255, 0, 0)')
  })

  it('shows selected state', () => {
    const { container } = render(<ColorSwatch color="#ff0000" selected />)
    const swatch = container.querySelector('.oda-color-swatch')
    expect(swatch).toHaveClass('oda-color-swatch--selected')
    expect(swatch).toHaveAttribute('aria-pressed', 'true')
  })

  it('handles click events', () => {
    const handleClick = vi.fn()
    const { container } = render(<ColorSwatch color="#ff0000" onClick={handleClick} />)
    
    const swatch = container.querySelector('.oda-color-swatch')
    fireEvent.click(swatch!)
    
    expect(handleClick).toHaveBeenCalledWith('#ff0000')
  })

  it('does not call onClick when disabled', () => {
    const handleClick = vi.fn()
    const { container } = render(<ColorSwatch color="#ff0000" onClick={handleClick} disabled />)
    
    const swatch = container.querySelector('.oda-color-swatch')
    fireEvent.click(swatch!)
    
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('renders different sizes', () => {
    const { rerender, container } = render(<ColorSwatch color="#ff0000" size="xs" />)
    let swatch = container.querySelector('.oda-color-swatch')
    expect(swatch).toHaveClass('oda-color-swatch--xs')

    rerender(<ColorSwatch color="#ff0000" size="xl" />)
    swatch = container.querySelector('.oda-color-swatch')
    expect(swatch).toHaveClass('oda-color-swatch--xl')
  })

  it('shows tooltip when name is provided', () => {
    const { container } = render(<ColorSwatch color="#ff0000" name="Red" showTooltip />)
    const swatch = container.querySelector('.oda-color-swatch')
    expect(swatch).toHaveAttribute('aria-label', 'Color: Red')
  })

  it('handles keyboard navigation', () => {
    const handleClick = vi.fn()
    const { container } = render(<ColorSwatch color="#ff0000" onClick={handleClick} />)
    
    const swatch = container.querySelector('.oda-color-swatch')
    fireEvent.keyDown(swatch!, { key: 'Enter' })
    
    expect(handleClick).toHaveBeenCalledWith('#ff0000')
  })

  it('meets accessibility standards', async () => {
    const { container } = render(<ColorSwatch color="#ff0000" name="Red" />)
    await checkAccessibility(container)
  })
})

describe('ColorPalette Component', () => {
  const colors = [
    { color: '#ff0000', name: 'Red' },
    { color: '#00ff00', name: 'Green' },
    { color: '#0000ff', name: 'Blue' },
  ]

  it('renders multiple color swatches', () => {
    render(<ColorPalette colors={colors} />)
    
    colors.forEach(({ name }) => {
      expect(screen.getByLabelText(`Color: ${name}`)).toBeInTheDocument()
    })
  })

  it('handles color selection', () => {
    const handleSelect = vi.fn()
    render(<ColorPalette colors={colors} onColorSelect={handleSelect} />)
    
    const redSwatch = screen.getByLabelText('Color: Red')
    fireEvent.click(redSwatch)
    
    expect(handleSelect).toHaveBeenCalledWith('#ff0000')
  })

  it('shows selected color', () => {
    render(<ColorPalette colors={colors} selectedColor="#ff0000" />)
    
    const redSwatch = screen.getByLabelText('Color: Red')
    expect(redSwatch).toHaveClass('oda-color-swatch--selected')
  })

  it('applies size to all swatches', () => {
    render(<ColorPalette colors={colors} size="lg" />)
    
    colors.forEach(({ name }) => {
      const swatch = screen.getByLabelText(`Color: ${name}`)
      expect(swatch).toHaveClass('oda-color-swatch--lg')
    })
  })

  it('meets accessibility standards', async () => {
    const { container } = render(<ColorPalette colors={colors} />)
    await checkAccessibility(container)
  })
})