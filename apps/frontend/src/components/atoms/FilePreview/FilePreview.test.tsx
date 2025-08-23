import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { FilePreview } from './FilePreview'

describe('FilePreview', () => {
  const mockFile = {
    name: 'document.pdf',
    type: 'application/pdf',
    size: 1024000,
  }

  it('renders with file information', () => {
    render(<FilePreview file={mockFile} />)
    expect(screen.getByText('document.pdf')).toBeInTheDocument()
  })

  it('displays file size correctly', () => {
    render(<FilePreview file={mockFile} />)
    expect(screen.getByText('1000 KB')).toBeInTheDocument()
  })

  it('shows file type icon', () => {
    const { container } = render(<FilePreview file={mockFile} />)
    expect(container.querySelector('.anticon')).toBeInTheDocument()
  })

  it('handles click events', () => {
    const handleClick = vi.fn()
    render(<FilePreview file={mockFile} onClick={handleClick} />)

    fireEvent.click(screen.getByText('document.pdf'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('shows download button when enabled', () => {
    const { container } = render(<FilePreview file={mockFile} />)
    expect(container.querySelector('.oda-file-preview')).toBeInTheDocument()
  })

  it('shows delete button when enabled', () => {
    const { container } = render(<FilePreview file={mockFile} />)
    expect(container.querySelector('.oda-file-preview')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(<FilePreview file={mockFile} />)
    expect(container.querySelector('.oda-file-preview')).toBeInTheDocument()
  })

  it('handles different file types', () => {
    const imageFile = { ...mockFile, name: 'image.jpg', type: 'image/jpeg' }
    render(<FilePreview file={imageFile} />)
    expect(screen.getByText('image.jpg')).toBeInTheDocument()
  })
})
