import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { SearchInput } from './SearchInput'

describe('SearchInput', () => {
  it('renders with default props', () => {
    render(<SearchInput />)
    expect(screen.getByRole('searchbox')).toBeInTheDocument()
  })

  it('renders with custom placeholder', () => {
    render(<SearchInput placeholder='Custom placeholder' />)
    expect(
      screen.getByPlaceholderText('Custom placeholder')
    ).toBeInTheDocument()
  })

  it('renders with custom value', () => {
    render(<SearchInput value='test value' />)
    expect(screen.getByDisplayValue('test value')).toBeInTheDocument()
  })

  it('handles value changes', () => {
    const handleChange = vi.fn()
    render(<SearchInput onChange={handleChange} />)

    const input = screen.getByRole('searchbox')
    fireEvent.change(input, { target: { value: 'search term' } })
    expect(handleChange).toHaveBeenCalledWith('search term')
  })

  it('handles search on enter', () => {
    const handleSearch = vi.fn()
    render(<SearchInput onSearch={handleSearch} value='search term' />)

    const input = screen.getByRole('searchbox')
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(handleSearch).toHaveBeenCalledWith('search term')
  })

  it('handles search button click', () => {
    const handleSearch = vi.fn()
    render(<SearchInput onSearch={handleSearch} value='test' />)

    const searchButton = screen.getByRole('button', { name: /search/i })
    fireEvent.click(searchButton)
    expect(handleSearch).toHaveBeenCalledWith('test')
  })

  it('applies disabled state', () => {
    render(<SearchInput disabled />)
    expect(screen.getByRole('searchbox')).toBeDisabled()
  })

  it('shows loading state', () => {
    render(<SearchInput loading />)
    expect(screen.getByRole('searchbox')).toBeInTheDocument()
  })

  it('renders without enter button when disabled', () => {
    render(<SearchInput enterButton={false} />)
    expect(screen.getByRole('searchbox')).toBeInTheDocument()
  })
})
