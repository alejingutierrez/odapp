import { vi, describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { EmptyState } from './EmptyState'
import { PlusOutlined } from '@ant-design/icons'

describe('EmptyState', () => {
  it('renders with default message', () => {
    const { container } = render(<EmptyState />)
    expect(container.querySelector('.ant-empty')).toBeInTheDocument()
  })

  it('renders with custom title and description', () => {
    render(
      <EmptyState
        title='No products found'
        description='Try adjusting your search criteria'
      />
    )
    expect(screen.getByText('No products found')).toBeInTheDocument()
    expect(
      screen.getByText('Try adjusting your search criteria')
    ).toBeInTheDocument()
  })

  it('renders action button when provided', () => {
    const handleAction = vi.fn()
    render(
      <EmptyState
        title='No items'
        actionText='Add Item'
        onAction={handleAction}
      />
    )

    const button = screen.getByText('Add Item')
    expect(button).toBeInTheDocument()

    fireEvent.click(button)
    expect(handleAction).toHaveBeenCalledTimes(1)
  })

  it('renders with custom icon', () => {
    render(<EmptyState title='No data' icon={<PlusOutlined />} />)
    expect(document.querySelector('.anticon-plus')).toBeInTheDocument()
  })

  it('renders different sizes correctly', () => {
    const { container, rerender } = render(<EmptyState size='small' />)
    expect(container.querySelector('.ant-empty')).toBeInTheDocument()

    rerender(<EmptyState size='default' />)
    expect(container.querySelector('.ant-empty')).toBeInTheDocument()
  })

  it('renders without image when showImage is false', () => {
    const { container } = render(<EmptyState showImage={false} />)
    const imageElement = container.querySelector('.ant-empty-image')
    expect(imageElement).toHaveStyle('height: 0px')
  })

  it('renders with custom children', () => {
    render(
      <EmptyState title='Custom Content'>
        <div>Custom child content</div>
      </EmptyState>
    )
    expect(screen.getByText('Custom child content')).toBeInTheDocument()
  })
})
