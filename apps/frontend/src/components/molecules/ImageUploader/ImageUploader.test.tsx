import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ImageUploader } from './ImageUploader'

describe('ImageUploader', () => {
  it('renders upload button with default placeholder', () => {
    render(<ImageUploader />)
    
    expect(screen.getByText('Upload Image')).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('renders with custom placeholder', () => {
    render(<ImageUploader placeholder="Choose File" />)
    
    expect(screen.getByText('Choose File')).toBeInTheDocument()
  })

  it('renders upload icon', () => {
    render(<ImageUploader />)
    
    const uploadIcon = document.querySelector('.anticon-upload')
    expect(uploadIcon).toBeInTheDocument()
  })

  it('renders file input', () => {
    render(<ImageUploader />)
    
    const input = document.querySelector('input[type="file"]')
    expect(input).toBeInTheDocument()
  })
})
