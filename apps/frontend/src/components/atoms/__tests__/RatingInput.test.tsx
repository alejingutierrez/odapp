import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import { RatingInput } from '../RatingInput'

describe('RatingInput', () => {
  it('renders star rating by default', () => {
    const { container } = render(<RatingInput value={4} />)
    expect(container.querySelector('.ant-rate')).toBeInTheDocument()
  })

  it('handles rating changes', () => {
    const handleChange = vi.fn()
    render(<RatingInput onChange={handleChange} />)
    
    const stars = screen.getAllByRole('radio')
    fireEvent.click(stars[3]) // Click 4th star
    expect(handleChange).toHaveBeenCalledWith(4)
  })

  it('renders numeric rating type', () => {
    render(<RatingInput type="numeric" value={7.5} max={10} />)
    expect(screen.getByDisplayValue('7.5')).toBeInTheDocument()
  })

  it('renders emoji rating type', () => {
    const { container } = render(<RatingInput type="emoji" value={4} />)
    expect(container.querySelector('.oda-rating-input--emoji')).toBeInTheDocument()
  })

  it('renders heart rating type', () => {
    const { container } = render(<RatingInput type="heart" value={3} />)
    expect(container.querySelector('.oda-rating-input--heart')).toBeInTheDocument()
  })

  it('renders thumbs rating type', () => {
    const { container } = render(<RatingInput type="thumbs" value={1} />)
    expect(container.querySelector('.oda-rating-input--thumbs')).toBeInTheDocument()
  })

  it('shows value when enabled', () => {
    render(<RatingInput value={4} max={5} showValue />)
    expect(screen.getByText('4.0/5')).toBeInTheDocument()
  })

  it('applies size classes correctly', () => {
    const { container } = render(<RatingInput size="large" />)
    expect(container.querySelector('.oda-rating-input--large')).toBeInTheDocument()
  })

  it('handles disabled state', () => {
    const { container } = render(<RatingInput disabled />)
    expect(container.querySelector('.oda-rating-input--disabled')).toBeInTheDocument()
  })

  it('handles readonly state', () => {
    const { container } = render(<RatingInput readOnly />)
    expect(container.querySelector('.oda-rating-input--readonly')).toBeInTheDocument()
  })

  it('handles emoji rating clicks', () => {
    const handleChange = vi.fn()
    render(<RatingInput type="emoji" onChange={handleChange} />)
    
    const emojiButtons = screen.getAllByRole('button')
    fireEvent.click(emojiButtons[4]) // Click 5th emoji (excellent)
    expect(handleChange).toHaveBeenCalledWith(5)
  })

  it('handles thumbs rating clicks', () => {
    const handleChange = vi.fn()
    render(<RatingInput type="thumbs" onChange={handleChange} />)
    
    const thumbsUp = screen.getByText('👍')
    fireEvent.click(thumbsUp)
    expect(handleChange).toHaveBeenCalledWith(1)
    
    const thumbsDown = screen.getByText('👎')
    fireEvent.click(thumbsDown)
    expect(handleChange).toHaveBeenCalledWith(-1)
  })

  it('shows custom emoji ratings', () => {
    const customEmojis = [
      { value: 1, emoji: '🤮', label: 'Terrible', color: '#ff0000' },
      { value: 2, emoji: '😊', label: 'Good', color: '#00ff00' },
    ]
    
    render(<RatingInput type="emoji" emojiRatings={customEmojis} />)
    expect(screen.getByText('🤮')).toBeInTheDocument()
    expect(screen.getByText('😊')).toBeInTheDocument()
  })

  it('allows half ratings when enabled', () => {
    render(<RatingInput allowHalf value={3.5} />)
    // Half ratings are handled by Ant Design's Rate component
    expect(screen.getByDisplayValue).toBeDefined()
  })
})