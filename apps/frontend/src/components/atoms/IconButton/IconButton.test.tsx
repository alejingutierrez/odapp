import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import { IconButton } from './IconButton'
import { EditOutlined } from '@ant-design/icons'

describe('IconButton', () => {
  it('renders with icon', () => {
    render(<IconButton icon={<EditOutlined />} />)
    expect(document.querySelector('.anticon-edit')).toBeInTheDocument()
  })

  it('renders with tooltip', () => {
    render(<IconButton icon={<EditOutlined />} tooltip='Edit item' />)
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
  })

  it('applies different sizes', () => {
    const { rerender } = render(
      <IconButton icon={<EditOutlined />} size='small' />
    )
    expect(document.querySelector('.ant-btn-sm')).toBeInTheDocument()

    rerender(<IconButton icon={<EditOutlined />} size='large' />)
    expect(document.querySelector('.ant-btn-lg')).toBeInTheDocument()
  })

  it('applies different variants', () => {
    const { rerender } = render(
      <IconButton icon={<EditOutlined />} variant='primary' />
    )
    expect(document.querySelector('.ant-btn-primary')).toBeInTheDocument()

    rerender(<IconButton icon={<EditOutlined />} variant='text' />)
    expect(document.querySelector('.ant-btn-text')).toBeInTheDocument()
  })

  it('applies circular style when circular prop is true', () => {
    render(<IconButton icon={<EditOutlined />} circular />)
    const button = screen.getByRole('button')
    expect(button).toHaveStyle('border-radius: 50%')
  })

  it('handles click events', () => {
    const handleClick = vi.fn()
    render(<IconButton icon={<EditOutlined />} onClick={handleClick} />)

    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('can be disabled', () => {
    render(<IconButton icon={<EditOutlined />} disabled />)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
