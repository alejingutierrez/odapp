import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { PasswordInput } from './PasswordInput'

describe('PasswordInput', () => {
  const mockOnChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders password input field', () => {
    render(
      <PasswordInput 
        placeholder="Enter password"
        onChange={mockOnChange}
      />
    )
    
    expect(screen.getByPlaceholderText('Enter password')).toBeInTheDocument()
    const input = document.querySelector('input[type="password"]')
    expect(input).toBeInTheDocument()
  })

  it('toggles password visibility when eye icon is clicked', async () => {
    const user = userEvent.setup()
    render(<PasswordInput onChange={mockOnChange} />)
    
    const input = document.querySelector('input')
    const toggleButton = document.querySelector('.ant-input-password-icon')
    
    expect(input).toHaveAttribute('type', 'password')
    
    if (toggleButton) {
      await user.click(toggleButton)
      expect(input).toHaveAttribute('type', 'text')
    }
  })

  it('calls onChange when password is typed', async () => {
    const user = userEvent.setup()
    render(<PasswordInput onChange={mockOnChange} />)
    
    const input = document.querySelector('input')
    if (input) {
      await user.type(input, 'test')
      expect(mockOnChange).toHaveBeenCalled()
    }
  })

  it('shows strength indicator when showStrengthIndicator is true', () => {
    render(
      <PasswordInput 
        onChange={mockOnChange}
        showStrengthIndicator={true}
        value="weak123"
      />
    )
    
    expect(document.querySelector('.password-input__strength')).toBeInTheDocument()
  })

  it('validates password strength correctly', () => {
    const { rerender } = render(
      <PasswordInput 
        onChange={mockOnChange}
        showStrengthIndicator={true}
        value="123"
      />
    )
    
    expect(screen.getByText(/weak/i)).toBeInTheDocument()
    
    rerender(
      <PasswordInput 
        onChange={mockOnChange}
        showStrengthIndicator={true}
        value="StrongPassword123!"
      />
    )
    
    expect(screen.getByText(/strong/i)).toBeInTheDocument()
  })

  it('applies disabled state', () => {
    render(
      <PasswordInput 
        onChange={mockOnChange}
        disabled={true}
      />
    )
    
    const input = document.querySelector('input')
    expect(input).toBeDisabled()
  })

  it('applies custom className', () => {
    render(
      <PasswordInput 
        onChange={mockOnChange}
        className="custom-password"
      />
    )
    
    expect(document.querySelector('.custom-password')).toBeInTheDocument()
  })

  it('shows requirements when showRequirements is true', () => {
    render(
      <PasswordInput 
        onChange={mockOnChange}
        showRequirements={true}
        value="test"
      />
    )
    
    expect(screen.getByText('Password requirements:')).toBeInTheDocument()
  })
})
