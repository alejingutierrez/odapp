
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Title, Text, Paragraph } from './Typography'

describe('Typography', () => {
  describe('Title', () => {
    it('renders with default level', () => {
      render(<Title>Test Title</Title>)
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    })

    it('renders with different levels', () => {
      render(<Title level={2}>Level 2 Title</Title>)
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
    })

    it('applies color variants correctly', () => {
      const { container } = render(<Title color='primary'>Primary Title</Title>)
      expect(container.firstChild).toHaveClass('oda-title--primary')
    })
  })

  describe('Text', () => {
    it('renders text content', () => {
      render(<Text>Test Text</Text>)
      expect(screen.getByText('Test Text')).toBeInTheDocument()
    })

    it('applies color variants correctly', () => {
      const { container } = render(<Text color='success'>Success Text</Text>)
      expect(container.firstChild).toHaveClass('oda-text--success')
    })

    it('applies weight styling', () => {
      const { container } = render(<Text weight='bold'>Bold Text</Text>)
      expect(container.firstChild).toHaveClass('oda-text--bold')
    })
  })

  describe('Paragraph', () => {
    it('renders paragraph content', () => {
      render(<Paragraph>Test Paragraph</Paragraph>)
      expect(screen.getByText('Test Paragraph')).toBeInTheDocument()
    })

    it('applies spacing correctly', () => {
      const { container } = render(
        <Paragraph spacing='loose'>Paragraph with loose spacing</Paragraph>
      )
      expect(container.firstChild).toHaveClass('oda-paragraph--loose')
    })
  })
})
