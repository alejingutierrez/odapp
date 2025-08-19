import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { Input, Select } from 'antd'
import { FormField } from './FormField'

describe('FormField', () => {
  const mockOnChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders form field with label', () => {
    render(
      <FormField label='Email Address'>
        <Input type='email' onChange={mockOnChange} />
      </FormField>
    )

    expect(screen.getByText('Email Address')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('shows required indicator when required is true', () => {
    render(
      <FormField label='Name' required={true}>
        <Input onChange={mockOnChange} />
      </FormField>
    )

    expect(
      document.querySelector('.ant-form-item-required')
    ).toBeInTheDocument()
  })

  it('displays error message when error is provided', () => {
    render(
      <FormField label='Email' error='Invalid email format'>
        <Input onChange={mockOnChange} />
      </FormField>
    )

    expect(screen.getByText('Invalid email format')).toBeInTheDocument()
  })

  it('calls onChange when input value changes', async () => {
    const user = userEvent.setup()
    render(
      <FormField label='Name'>
        <Input onChange={(e) => mockOnChange(e.target.value)} />
      </FormField>
    )

    const input = screen.getByRole('textbox')
    await user.type(input, 'John Doe')

    expect(mockOnChange).toHaveBeenCalledWith('John Doe')
  })

  it('renders different input types correctly', () => {
    const { rerender } = render(
      <FormField label='Password'>
        <Input.Password onChange={mockOnChange} />
      </FormField>
    )

    expect(
      document.querySelector('.ant-input-password-icon')
    ).toBeInTheDocument()

    rerender(
      <FormField label='Age'>
        <Input type='number' onChange={mockOnChange} />
      </FormField>
    )

    expect(screen.getByRole('spinbutton')).toHaveAttribute('type', 'number')
  })

  it('shows help text when provided', () => {
    render(
      <FormField label='Username' help='Must be at least 3 characters'>
        <Input onChange={mockOnChange} />
      </FormField>
    )

    expect(
      screen.getByText('Must be at least 3 characters')
    ).toBeInTheDocument()
  })

  it('applies disabled state', () => {
    render(
      <FormField label='Disabled Field'>
        <Input disabled={true} onChange={mockOnChange} />
      </FormField>
    )

    const input = screen.getByRole('textbox')
    expect(input).toBeDisabled()
  })

  it('renders textarea when type is textarea', () => {
    render(
      <FormField label='Description'>
        <Input.TextArea rows={4} onChange={mockOnChange} />
      </FormField>
    )

    expect(screen.getByRole('textbox')).toHaveAttribute('rows')
  })

  it('renders select when type is select', () => {
    const options = [
      { label: 'Option 1', value: '1' },
      { label: 'Option 2', value: '2' },
    ]

    render(
      <FormField label='Select Option'>
        <Select options={options} onChange={mockOnChange} />
      </FormField>
    )

    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(
      <FormField label='Custom Field' className='custom-form-field'>
        <Input onChange={mockOnChange} />
      </FormField>
    )

    expect(document.querySelector('.custom-form-field')).toBeInTheDocument()
  })

  it('shows tooltip when provided', () => {
    render(
      <FormField label='Field with Tooltip' tooltip='This is a tooltip'>
        <Input onChange={mockOnChange} />
      </FormField>
    )

    expect(
      document.querySelector('.form-field__tooltip-icon')
    ).toBeInTheDocument()
  })
})
