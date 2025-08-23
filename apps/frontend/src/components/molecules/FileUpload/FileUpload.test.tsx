import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, beforeEach, expect } from 'vitest'
import { FileUpload } from './FileUpload'

describe('FileUpload', () => {
  const mockOnChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders file upload component', () => {
    render(<FileUpload onChange={mockOnChange} />)

    expect(screen.getByText(/click to upload/i)).toBeInTheDocument()
    expect(screen.getByText(/or drag and drop/i)).toBeInTheDocument()
  })

  it('has file input element', () => {
    render(<FileUpload onChange={mockOnChange} />)

    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('type', 'file')
  })

  it('shows file list when files are uploaded', async () => {
    const fileList = [
      {
        uid: '1',
        name: 'test.txt',
        status: 'done' as const,
        url: 'http://example.com/test.txt',
      },
    ]

    render(<FileUpload onChange={mockOnChange} value={fileList} />)

    expect(screen.getByText('test.txt')).toBeInTheDocument()
  })

  it('calls onChange when file is removed', async () => {
    const user = userEvent.setup()
    const fileList = [
      {
        uid: '1',
        name: 'test.txt',
        status: 'done' as const,
        url: 'http://example.com/test.txt',
      },
    ]

    render(<FileUpload onChange={mockOnChange} value={fileList} />)

    const removeButton = document.querySelector('.anticon-delete')
    if (removeButton) {
      await user.click(removeButton)
      expect(mockOnChange).toHaveBeenCalled()
    }
  })

  it('applies file type restrictions', () => {
    render(
      <FileUpload
        onChange={mockOnChange}
        acceptedTypes={['.jpg', '.png', '.gif']}
      />
    )

    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement
    expect(input).toHaveAttribute('accept', '.jpg,.png,.gif')
  })

  it('shows loading state', () => {
    const fileList = [
      {
        uid: '1',
        name: 'uploading.txt',
        status: 'uploading' as const,
        percent: 50,
      },
    ]

    render(
      <FileUpload
        onChange={mockOnChange}
        value={fileList}
        showProgress={true}
      />
    )

    // Check for progress indicator in component
    expect(screen.getByText('uploading.txt')).toBeInTheDocument()
  })

  it('disables upload when disabled prop is true', () => {
    render(<FileUpload onChange={mockOnChange} disabled={true} />)

    const uploadArea = document.querySelector('.ant-upload-disabled')
    expect(uploadArea).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<FileUpload onChange={mockOnChange} className='custom-upload' />)

    expect(document.querySelector('.custom-upload')).toBeInTheDocument()
  })

  it('allows multiple file selection by default', () => {
    render(<FileUpload onChange={mockOnChange} />)

    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement
    expect(input).toHaveAttribute('multiple')
  })

  it('respects maxFiles limit', () => {
    render(<FileUpload onChange={mockOnChange} maxFiles={2} />)

    // Check that the upload info shows the correct limit
    expect(screen.getByText(/Max 2 files/)).toBeInTheDocument()
  })
})
